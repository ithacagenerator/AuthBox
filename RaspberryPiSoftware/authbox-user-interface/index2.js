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

let loggedin = false;
let loginExpires = moment("2425-01-01T00:00:00Z");
let current_blinking_color = 'green';
let passcode = '';
let configuration = {};

serial.setInputHandler(function(chr) {
  // remove leadwhite space
  chr = chr ? chr.toString().trim() : '';
  // expect non-empty content
  if(!chr) { return; }
  // expect to be fed characters one by one
  if(chr.length !== 1) { return; }
  // only accept numeric input and * or #
  if(!/[0-9*#]/.test(chr)) { return; }

  if(chr === '#') {
    // process input
  } else if(chr === '*') {
    // treat it as a back-space
    passcode = passcode.slice(0, -1);
  } else {
    // treat it as passcode entry
    if(passcode.length === 16) {
      passcode = passcode.slice(1);
    }
    passcode = passcode + chr;
  }

  console.log(passcode);

  const inputWasNumeric = /[0-9]/.test(chr);
  let maskedCode = inputWasNumeric ? passcode.slice(0,-1) + chr : passcode.replace(/./g,'*');
  maskedCode = `${maskedCode.slice(0,-1).replace(/./g,'*')}${maskedCode.slice(-1)}`;
  const fullyMaskedCode = maskedCode.replace(/./g,'*');
  if(!loggedin) {
    return lcd.centerText(`ENTER CODE:`, 0)
    .then(() => lcd.centerText(maskedCode, 1)) // show the masked code
    .then(() => {
      // then fully mask after half a second
      if(inputWasNumeric) {
        setTimeout(() => lcd.centerText(fullyMaskedCode, 1), 500);
      }
    })
    .then(() => {
      // handle enter key pressed
      if(chr === '#') {
        handleLogin();
      } 
    }); 
  } else { // if(loggedin) ...
    if(chr === '*') {
      handleLogout({reason: 'logout'});
    } else {
      serial.buzzeroff();
      loginExpires = moment();
      loginExpires.add(configuration.idle_timeout_ms, 'ms');
    }
  }
});

function synchronizeConfigWithServer() {
  return api.fetchConfiguration()
  .then(function(config) {
    configuration = config || {};
    return db.saveConfiguration(config);
  })
  .then(function() {
    console.log(`Database Synchronized @ ${moment().format()}`);
  })
  .catch(function(err) {
    console.error(err.message, err.stack);
  });
}

function handleLogout(opts) {
  console.log(`Logout because ${opts.reason}`);
  loginExpires = moment("2425-01-01T00:00:00Z");
  loggedin = false;
  passcode = '';
  return Promise.all([
    api.deauthorize(),
    serial.buzzeroff()
    .then(() => serial.deauthorize()),
    lcd.deauthorize()
  ]);
}

function handleLogin() {
  // check the database and see if the passcode is valid
  return db.isAuthorized(passcode)
  .then(function(isAuthorized) {
    passcode = '';
    if(isAuthorized) {
      console.log(`Login Attempt Succeeded`);
      loginExpires = moment();
      loginExpires.add(configuration.idle_timeout_ms, 'ms');
      loggedin = true;
      return Promise.all([
        api.authorize(passcode),
        lcd.setBacklightColor('green'),
        serial.authorize() 
      ]);
    } else {
      console.log(`Login Attempt Failed`);
      return lcd.deauthorize();
    }
  });
}

// handle configuration synchronization
db.getConfiguration()
.then(function(config){
  configuration = config;

  // interval task to synchronize the local database access codes with the
  // no need for this to be in the same thread of control as anything else  
  synchronizeConfigWithServer();                             // synchronize immediately
  setInterval(synchronizeConfigWithServer, 10 * 60 * 1000 ); // then every 10 minutes after that
});

// initialize the LCD
lcd.deauthorize();
serial.begin();
synchronizeConfigWithServer();

// keep checking for timeout and/or logout when logged in
promiseDoWhilst(() => {
  return util.delayPromise(500)() // every half second
  .then(() => {
    if(loggedin) {
      // three cases... 
      // (1) now is after is after login expiry
      if(moment().isAfter(loginExpires)) {
        return handleLogout({ reason: 'timeout' });
      // (2) now is within a minute of expiry
      } else if(loginExpires.diff(moment(), 'ms') < 60000) {
        if(current_blinking_color === 'green'){
          current_blinking_color = 'yellow';
          return Promise.all([ 
            lcd.setBacklightColor(current_blinking_color),
            serial.buzzeron() 
          ]);
        } else {
          current_blinking_color = 'green';
          return lcd.setBacklightColor(current_blinking_color);                
        }
      // (3) now is more than a minute from expiry
      }
    }
  })
  .then(() => {
    if(loggedin) {
      // unconditionally reflect the time until expiry
      let expiryTime = loginExpires.diff(moment(), 'seconds');
      expiryTime = Math.max(0, expiryTime);
      const message = `FOR ${expiryTime} SECONDS`;
      return lcd.centerText(message, 1);
    }
  })
  .catch((err) => {
    console.error(err.message, err.stack);
  });
}, () => {
  return true;
});