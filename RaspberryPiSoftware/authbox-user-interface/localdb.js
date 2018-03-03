/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');

module.exports = (function(){
  console.log('Initialized Local Database');

  let in_memory_configuration = {};
  const initial_load = new Promise(function(resolve, reject){
    // TODO: implement
    resolve({
      idle_timeout_ms: 600000,
      codes: ['1234']
    });
  })
  .then((config) => in_memory_configuration = config);

  function isAuthorized(code) {
    // TODO: implement
    const validCodes = ['1234'];
    return util.resolvedPromise(validCodes.indexOf(code) >= 0);
  }

  function saveConfiguration(config) {
    // TODO: implement    
    in_memory_configuration = config;
    return util.resolvedPromise();
  }

  function getConfiguration(){
    // TODO: implement    
    return initial_load
    .then(function() {
      return in_memory_configuration;
    });
  }

  return {
    isAuthorized,
    saveConfiguration,
    getConfiguration
  };
})();