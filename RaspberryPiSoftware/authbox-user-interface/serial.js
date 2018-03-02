/* jshint esversion:6 */
/* jshint node: true */

const SerialPort = require('serialport');

module.exports = (function() {
  console.log('Initialized Serial');

  let inputHandler = null;

  function setInputHandler(handler) {
    inputHandler = handler;
  }

  function authorize() {
    // TODO: implement
  }

  function deauthorize() {
    // TODO: implement
  }

  function listPorts(manufacturerRegex){    
    return SerialPort.list()
    .then((availablePorts) => {    
      return availablePorts.filter(p => !manufacturerRegex || 
        (p.manufacturer && manufacturerRegex.test(p.manufacturer)));
    })
    .catch((error) => {
      console.error(error);
    });
  }

  function begin() {
    // TODO: implement list ports, connect, attach input handlers, etc
    
    return listPorts(/arduino/i)
    .then(ports => console.dir(ports));
  }

  return {
    setInputHandler,
    authorize,
    deauthorize,
    begin
  };
})();