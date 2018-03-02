/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');

module.exports = (function(){
  console.log('Initialized API');

  let access_code = ''; 

  function fetchAccessCodes() {
    // TODO: implement API call
    // Mock for now
    return util.resolvedPromise(['open sesame']);
  }

  function authorize(access) {
    // TODO: implement API call
    access_code = access;
  }

  function deauthorize() {
    // TODO: implement API call
  }

  return {
    fetchAccessCodes,
    authorize,
    deauthorize
  };
})();