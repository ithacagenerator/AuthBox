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

let loggedin = false;
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
    // if logged in, log out
  } else if(chr === '#') {
    // treat it as a login attempt
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
      if(inputWasNumeric) {
        setTimeout(() => lcd.centerText(fullyMaskedCode, 1), 500);
      }
    }); // then fully mask after half a second
  } else { // if(loggedin) ...
    
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
lcd.centerText(`ENTER CODE:`, 0)
.then(() => lcd.centerText('', 1));

serial.begin();