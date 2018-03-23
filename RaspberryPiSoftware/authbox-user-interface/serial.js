/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');
const promiseDoWhilst = require('promise-do-whilst');
const moment = require('moment');
const SerialPort = require('serialport');

module.exports = (function() {
  console.log('Initialized Serial');

  let inputHandler = null;
  let discoveredArduinos = [];

  // handler should be a function that receives a line of data
  function setInputHandler(handler) {
    inputHandler = handler;
  }

  function authorize() {    
    // broadcast to all attached arduinos
    return Promise.all(discoveredArduinos.map(p => sendCommandExpectResponse(p, 'authorize', 'authorize', 100)));    
  }

  function deauthorize() {
    // broadcast to all attached arduinos
    return Promise.all(discoveredArduinos.map(p => sendCommandExpectResponse(p, 'lockout', 'lockout', 100))); 
  }

  function buzzeron(){
    // broadcast to all attached arduinos
    return Promise.all(discoveredArduinos.map(p => sendCommandExpectResponse(p, 'siren', 'siren', 100)));    
  }

  function buzzeroff(){
    // broadcast to all attached arduinos
    return Promise.all(discoveredArduinos.map(p => sendCommandExpectResponse(p, 'quiet', 'quiet', 100))); 
  }

  function listPorts(manufacturerRegex){    
    return SerialPort.list()
    .then((availablePorts) => {    
      discoveredArduinos =  availablePorts.filter(p => !manufacturerRegex || 
        (p.manufacturer && manufacturerRegex.test(p.manufacturer)));
      return discoveredArduinos;
    })
    .catch((error) => {
      console.error(error);
    });
  }

  // arduino is an object result of SerialPort.list
  // commandToSend is any string
  // responseToExpect is a [optional] regular expression that should be seen by the data
  //   handler for this arduino [optionally] within within_ms before an exeception is thrown
  // if you don't expect / care about a response, call it without responseToExpect or within_ms
  // if you want to wait up to _forever_ for a response, call it without within_ms
  function sendCommandExpectResponse(arduino, commandToSend, responseToExpect = null, within_ms = -1){
    // first you have to calculate the crc16 of the commandToSend string
    // and tack it onto the end as a hex-string and a newline
    if (responseToExpect){ arduino.waitingForResponseData = true; }
    return new Promise(function(resolve, reject){
      const extended_command = `${commandToSend}${util.crc16(commandToSend)}\n`;      
      arduino.handle.write(extended_command, function(err){
        if(err){ 
          console.err(err);
          reject(err); 
        } else { 
          resolve(); 
        }
      });
    })
    .then(function(){
      const startExpectingResponse = moment();
      if(responseToExpect){
        return promiseDoWhilst(util.delayPromise(10), 
        function(){
          if(arduino.response === responseToExpect){
            return false; // we're done because got expected response
          } else if(within_ms > 0) {
            const now = moment();
            const diff = now.diff(startExpectingResponse, 'ms');
            if(diff > within_ms){
              return false; // we're done because timeout,              
            }
          } 
          
          return true; // haven't returned false, so we're not done waiting yet
        });
      }
    })
    .then(() => {
      if (responseToExpect){ arduino.waitingForResponseData = false; }
      arduino.response = '';
    })
    .catch(function(error){
      if (responseToExpect){ arduino.waitingForResponseData = false; }
      arduino.response = '';
      console.error(error);
    });
  }

  // port is a single element from the listPorts results    
  function establishConnection(port){
    // must return a promise
    port.handle = new SerialPort(port.comName, { baudRate: 9600 }); 
    port.response = ''; // place holder for buffering protocol response data
    let parser = port.handle.pipe(new SerialPort.parsers.Regex({ regex: /[\r\n]+/ }));    
    parser.on('data', function(data){

      // console.log(data);
         
      if(data.length === 0){
        return;
      }      
      
      if (port.waitingForResponseData && ['0','1','2','3','4','5','6','7','8','9','#'].indexOf(data) < 0){
        port.response = port.response ? `${port.response}${data}` : `${data}`;
      } else {
        if(inputHandler){
          inputHandler(data);        
        } else {
          console.log('Data received before inputHandler registered', [data.toString()]);
        }
      }
    });
    
    return new Promise(function(resolve, reject){
      port.handle.on('open', resolve);
    })
    .then(() => {
      console.log(`opened ${port.comName} successfully`);
    })
    .catch((error) => {
      console.error(`error opening ${port.comName}`, error);
    });
  }

  function connectToPorts(ports){        
    let promises = ports.map(p => establishConnection(p));
    return Promise.all(promises);
  }

  function begin() {
    return listPorts(/arduino/i)
    .then(connectToPorts);
  }

  return {
    setInputHandler,
    authorize,
    deauthorize,
    buzzeron, 
    buzzeroff,
    begin
  };
})();
