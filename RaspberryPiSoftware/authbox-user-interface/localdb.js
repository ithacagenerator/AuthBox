/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');

module.exports = (function(){
  console.log('Initialized Local Database');

  let in_memory_configuration = {};
  const initial_load = new Promise(function(resolve, reject){
    // TODO: implement database fetch
    in_memory_configuration = {
      idle_timeout_ms: 600000,
      codes: ['1234']
    };

    resolve(in_memory_configuration);
  })
  .then((config) => in_memory_configuration = config);

  function isAuthorized(code) {    
    const validCodes = in_memory_configuration.codes || [];
    return util.resolvedPromise(validCodes.indexOf(code) >= 0);
  }

  function saveConfiguration(config) {
    // TODO: implement database save
    in_memory_configuration = config;
    return util.resolvedPromise();
  }

  function getConfiguration(){       
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