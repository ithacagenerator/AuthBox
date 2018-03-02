/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');

module.exports = (function(){
  console.log('Initialized Local Database');

  function isAuthorized(code) {
    // TODO: implement
    const validCodes = ['1234'];
    return util.resolvedPromise(validCodes.indexOf(code) >= 0);
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