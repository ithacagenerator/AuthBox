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
    // TODO: implement
    return util.resolvedPromise();
  }

  function deauthorize() {
    // TODO: implement
    return util.resolvedPromise();
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

  }

  // port is a single element from the listPorts results    
  function establishConnection(port){
    // must return a promise
    port.handle = new SerialPort(port.comName); 
    let parser = port.handle.pipe(new SerialPort.parsers.Regex({ regex: /[\r\n]+/ }));
    parser.on('data', function(data){
      // console.log(data);
      if(inputHandler){
        inputHandler(data);        
      } else {
        console.log('Data received before inputHandler registered', [data.toString()]);
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
    // TODO: implement list ports, connect, attach input handlers, etc    
    return listPorts(/arduino/i)
    .then(connectToPorts);
  }

  return {
    setInputHandler,
    authorize,
    deauthorize,
    begin
  };
})();