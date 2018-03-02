/* jshint esversion:6 */
/* jshint node: true */
module.exports = (function(){
  console.log('Initialized API');

  let access_code = ''; 

  function fetchAccessCodes() {
    // TODO: implement API call
    // Mock for now
    return new Promise((resolve, reject) => {
      resolve(['open sesame']);
    });
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