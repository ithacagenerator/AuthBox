/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');
const pbkdf2 = require('pbkdf2');
const request = require('request-promise-native');
const api_base = 'https://ithacagenerator.org/authbox/v1';
const path = require('path');
const homedir = require('homedir')();
const identity = require(path.join(homedir, 'identity.json'));
const auth_hash = pbkdf2.pbkdf2Sync(identity.id, identity.access_code, 1, 32, 'sha512').toString('hex');

module.exports = (function(){
  console.log('Initialized API');

  let currently_authrorized_access_code = 'not-authorized';

  function fetchConfiguration() {    
    return request.get(`${api_base}/authmap/${auth_hash}`)
    .then(function(response){
      return JSON.parse(response);
    })
    .catch(function(err){
      console.error(err.message, err.stack);
      return null;
    });
  }

  function authorize(access_code) {
    const user_auth_hash = pbkdf2.pbkdf2Sync(identity.id, access_code, 1, 32, 'sha512').toString('hex');
    currently_authrorized_access_code = access_code;
    return request.post(`${api_base}/authorize/${auth_hash}/${user_access_code}`)
    .then(function(response){
      return JSON.parse(response);
    })
    .catch(function(err){
      console.error(err.message, err.stack);
      return null;
    });        
  }

  function deauthorize() {
    const access_code = currently_authrorized_access_code;
    const user_auth_hash = pbkdf2.pbkdf2Sync(identity.id, access_code, 1, 32, 'sha512').toString('hex');
    currently_authrorized_access_code = 'not-authorized';
    return request.post(`${api_base}/deauthorize/${user_auth_hash}/${access_code}`)
    .then(function(response){
      return JSON.parse(response);
    })
    .catch(function(err){
      console.error(err.message, err.stack);
      return null;
    });        
  }

  return {
    fetchConfiguration,
    authorize,
    deauthorize
  };
})();