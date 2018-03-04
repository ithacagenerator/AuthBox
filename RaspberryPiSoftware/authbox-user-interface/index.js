/* jshint esversion:6 */
/* jshint node: true */
"use strict";

const util = require('./util');
const api = require('./api');
const lcd = require('./lcd');
const serial = require('./serial');
const db = require('./localdb');
const moment = require('moment');
const promiseDoWhilst = require('promise-do-whilst');
const path = require('path');
const homedir = require('homedir')();
const identity = require(path.join(homedir, 'identity.json'));

let configuration = {};
let access_code_buffer = '';
let last_access_code_change = moment();
let is_currently_authorized = false;
let should_dauthorize = false;

// register input handler to accept a single
// character of input from the user interface
// which provides the user's access code
// e.g. keypad, rfid reader, etc
serial.setInputHandler(function(chr) {
  chr = chr ? chr.toString().trim() : '';
  // console.log(`Got ${chr}`);
  // if the access code ends with '#' reject further
  // input until it has been processed
  // if the chr is '*' it is the 'backspace' key
  // otherwise append it to the buffered access code  
  if(!access_code_buffer.endsWith('#')){
    if(chr === '*') { // backspace key
      access_code_buffer = access_code_buffer.slice(0, -1);
      last_access_code_change = moment();
    } else {          // anything else
      access_code_buffer = `${access_code_buffer}${chr.trim()}`;
      last_access_code_change = moment();
    }
  } else { // otherwise the only two input we'll pay special attention to is '*'
           // if we get * in this state it should coerce and deauthorization
           // any keypress will reset the last_access_code_change to now
    last_access_code_change = moment(); // extend authorization timeout    
    if(chr === '*'){      
      should_dauthorize = true;    // this will trigger a deauthorize event
    }
  }
  // console.log(access_code_buffer);
});

const checkForIdleKeypadEntry = function() {
  // clear the data entered if it's been idle for too long
  return new Promise(function(resolve, reject) {
    if(access_code_buffer.length > 0){
      const automatically_clear_duration_ms = configuration.idle_timeout_ms;
      if(util.isNumeric(automatically_clear_duration_ms) && (automatically_clear_duration_ms > 0)){
        const idle_time_ms = moment().diff(last_access_code_change, 'ms');
        if(idle_time_ms >= automatically_clear_duration_ms){
          console.log("Automatic clear duration expired");
          should_dauthorize = true;
          access_code_buffer = '';
        }
      }
    }

    resolve({
      code: access_code_buffer,
      authorized: is_currently_authorized,
      deauthorize: should_dauthorize
    });
  });
};

// if the user is authorized, their '*'-masked passcode should be displayed on line 1
// otherwise the phrase ENTER CODE should be displaed on line 1
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
  return checkAuthorizedIfReady(user)
  .then(handleAuthorizationResult);
};

const checkAuthorizedIfReady = function(user) {
  return new Promise(function(resolve, reject) { resolve(user); }) // just to make it a promise result
  .then(function(user) {
    if(user.code.endsWith('#')){ // this will be the case for a deauthorizing user
      if(user.authorized && user.deauthorize){
        should_dauthorize = false; // this should be a 'once' event, so clear the flag
        // if you hit 'enter' and you are authorized
        // it will trigger a de-authorization event         
        return Object.assign({}, user, { event: 'deauthorize' }); // i.e. log off
      } else if(!user.authorized) {
        // not currently authorized so check if we should authorize
        return db.isAuthorized(user.code.slice(0, -1)) // remove the trailing '#' for checking
        .then(function(isAuthorized) {
          is_currently_authorized = isAuthorized;
          return isAuthorized ?
            Object.assign({}, user, { event: 'authorize' }) :   // i.e. right password
            Object.assign({}, user, { event: 'unauthorized' }); // i.e. wrong password
        });
      } else { // the user is already authorized and is not being deauthorized
        return util.resolvedPromise(user); 
      }
    } else {
      return util.resolvedPromise(user); // code is not ready
    }
  });
};

const handleAuthorizationResult = function(auth) {
  return new Promise(function(resolve, reject) {
    switch(auth.event){
    case 'authorize':    // was not authorized, now power up
      return serial.authorize()                  // power up the authbox
      .then(api.authorize.bind(null, auth.code.slice(0,-1))) // register it with the server
      .then(lcd.authorize)                       // turn the lcd green
      .then(resolve(false));                     // don't clear access code
    case 'deauthorize':  // was authorized, now shutting down
      is_currently_authorized = false;
      access_code_buffer = '';
      return serial.deauthorize()                // power down the authbox
      .then(api.deauthorize)                     // register it with the server
      .then(lcd.deauthorize)                     // turn the lcd red
      .then(resolve(true));                      // do clear access code
    case 'unauthorized': // user tried to authorize but code not found      
      return lcd.unauthorized()                  // turn to incorrect login color
      .then(util.delayPromise(2000))             // then wait 2 seconds
      .then(lcd.deauthorize)                     // then turn the backlight red
      .then(resolve(true));                      // do clear access code      
    default:             // no event
      return resolve(false);                     // do not clear access code
    }
  })
  .then(function(should_clear_access_code) {    
    if(should_clear_access_code){ 
      access_code_buffer = '';
    }
    return auth;
  });
};

function synchronizeConfigWithServer() {
  return api.fetchConfiguration()
  .then(function(config) {
    configuration = config;
    return db.saveConfiguration(config);
  })
  .then(function() {
    console.log(`Database Synchronized @ ${moment().format()}`);
  })
  .catch(function(err) {
    console.error(err.message, err.stack);
  });
}

// fetch the configuration from the database
// then synchronize with the server immediately and periodically
db.getConfiguration()
.then(function(config){
  configuration = config;

  // interval task to synchronize the local database access codes with the
  // no need for this to be in the same thread of control as anything else  
  synchronizeConfigWithServer();                             // synchronize immediately
  setInterval(synchronizeConfigWithServer, 10 * 60 * 1000 ); // then every 10 minutes after that
  
  serial.begin(); // kick off the serial connection(s)  
});

// an asynchronous non-blocking 'forever' loop
promiseDoWhilst( function () {
  return checkForIdleKeypadEntry()
  .then(updateLcd)
  .then(validateCode)
  .then(util.delayPromise(100))
  .catch((error) => {
    console.error(error.message, error.stack);
  });
}, function() {
  return true; // while true
});
