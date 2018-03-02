/* jshint esversion:6 */
/* jshint node: true */
module.exports = (function(){
  console.log('Initialized Local Database');

  function isAuthorized(code) {
    // TODO: implement
  }

  function saveAccessCodes(codes) {
    // TODO: implement    
  }

  return {
    isAuthorized,
    saveAccessCodes
  };
})();