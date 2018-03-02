/* jshint esversion:6 */
/* jshint node: true */
"use strict";

const api = require('./api');
const lcd = require('./lcd');
const serial = require('./serial');
const db = require('./localdb');
const moment = require('moment');
const promiseDoWhilst = require('promise-do-whilst');

let access_code_buffer = '';
let last_access_code_change = moment();
let is_currently_authorized = false;

// register input handler to accept a single
// character of input from the user interface
// which provides the user's access code
// e.g. keypad, rfid reader, etc
serial.setInputHandler(function(chr) {
  // if the access code ends with '#' reject further
  // input until it has been processed
  // if the chr is '*' it is the 'backspace' key
  // otherwise append it to the buffered access code
  if(!access_code_buffer.endsWith('#')){
    if(chr === '*') { // backspace key
      access_code_buffer = access_code_buffer.slice(0, -1);
      last_access_code_change = moment();
    } else {          // anything else
      access_code_buffer = `${access_code_buffer}${chr}`;
      last_access_code_change = moment();
    }
  }
  else { // otherwise the only two inputs we'll pay attention to are # and *
         // if we get # in this state it should just extend your authorization
         // if we get * in this state it should coerce and deauthorization
    if(chr === '#'){
      last_access_code_change = moment(); // extend authorization timeout
    }
    else if(chr === '*'){
      // TODO: deauthorize
    }
  }
});

const checkForIdleKeypadEntry = function() {
  // clear the data entered if it's been idle for too long
  return new Promise(function(resolve, reject) {
    if(access_code_buffer.length > 0){
      const automatically_clear_duration_ms = 10 * 1000;
      const idle_time_ms = moment().diff(last_access_code_change, 'ms');
      if(idle_time_ms >= automatically_clear_duration_ms){
        access_code_buffer = '';
      }
    }

    resolve({
      code: access_code_buffer,
      authorized: is_currently_authorized
    });
  });
};

const updateLcd = function(user) {
  if(!user.authorized){
    if(user.code){
      const maskedCode = `${user.code.slice(0,-1).replace(/./g,'*')}${user.code.slice(-1)}`;
      return lcd.centerText(maskedCode, 1)
      .then(() => user);
    } else {
      return lcd.centerText(`ENTER CODE`, 1)
      .then(() => user);
    }
  } else {
    return user;
  }
};

const validateCode = function(user) {
  checkAuthorizedIfReady(user)
  .then(handleAuthorizationResult);
};

const checkAuthorizedIfReady = function(user) {
  return new Promise(function(resolve, rejetc) { resolve(user); }) // just to make it a promise result
  .then(function(user) {
    if(user.code.endsWith('#')){
      if(user.authorized){
        // if you hit 'enter' and you are authorized
        // it will trigger a de-authorization event
        is_currently_authorized = false;
        return Object.assign({}, user, { event: 'deauthorize' });
      } else {
        // not currently authorized so check if we should authorize
        return db.isAuthorized(access_code_buffer)
        .then(function(isAuthorized) {
          is_currently_authorized = isAuthorized;
          return isAuthorized ?
            Object.assign({}, user, { event: 'authorize' }) :
            Object.assign({}, user, { event: 'unauthorized' });
        });
      }
    } else {
      return {}; // no event generated
    }
  });
};

const handleAuthorizationResult = function(auth) {
  return new Promise(function(resolve, reject) {
    switch(auth.event){
    case 'authorize':    // was not authorized, now power up
      return serial.authorize()                  // power up the authbox
      .then(api.authorize.bind(null, auth.code)) // register it with the server
      .then(lcd.authorize);                      // turn the lcd green
    case 'deauthorize':  // was authorized, now shutting down
      return serial.deauthorize()                // power down the authbox
      .then(api.deauthorize)                     // register it with the server
      .then(lcd.deauthorize);                    // turn the lcd red
    case 'unauthorized': // user tried to authorize but code not found
      return lcd.unauthorized();
    }
  })
  .then(function() {
    if(auth.event){
      access_code_buffer = '';
    }
    return auth;
  });
};

// interval task to synchronize the local database access codes with the
// no need for this to be in the same thread of control as anything else
setInterval(function() {
  api.fetchAccessCodes()
  .then(function(codes) {
    return db.saveAccessCodes(codes);
  })
  .then(function() {
    console.log(`Database Synchronized @ ${moment().format()}`);
  })
  .catch(function(err) {
    console.err(err);
  });
}, 10 * 60 * 1000 ); // every 10 minutes

serial.begin(); // kick off the serial connection(s)

// an asynchronous non-blocking 'forever' loop
promiseDoWhilst( function () {
  return checkForIdleKeypadEntry()
  .then(updateLcd)
  .then(validateCode);
}, function() {
  return true; // while true
});
