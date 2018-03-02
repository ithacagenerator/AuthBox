/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');

module.exports = (function(){
  console.log('Initialized Local Database');

  function isAuthorized(code) {
    // TODO: implement
    return util.resolvedPromise();
  }

  function saveAccessCodes(codes) {
    // TODO: implement    
    return util.resolvedPromise();
  }

  return {
    isAuthorized,
    saveAccessCodes
  };
})();