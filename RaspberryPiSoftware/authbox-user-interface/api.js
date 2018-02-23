module.exports = (function(){
  console.log('Initialized API');

  let access_code = ''; 

  const fetchAccessCodes = () => {
    // TODO: implement API call
    // Mock for now
    return new Promise((resolve, reject) => {
      resolve(['open sesame']);
    });
  }

  const authorize = (access) => {
    // TODO: implement API call
    access_code = access;
  }

  const deauthorize = () => {
    // TODO: implement API call
  }

  return {
    fetchAccessCodes,
    authorize,
    deauthorize
  };
})();