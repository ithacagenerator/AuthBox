/* jshint esversion:6 */
/* jshint node: true */

function crc16_update(crc, a){  
  crc ^= a.charCodeAt(0);
  for (i = 0; i < 8; ++i){
    if (crc & 1) {
      crc = (crc >> 1) ^ 0xA001;
    } else {
      crc = (crc >> 1);
    }
  }  
  return crc;
}

module.exports = {
  delayPromise: function(millis) {
    return function(){ // return a function 
      return new Promise(function(resolve, reject){ // that returns a promise
        setTimeout(function() { 
          resolve(); 
        }, millis); // that resolves after millis time
      });
    };
  },
  resolvedPromise: function(resolveValue){
    return new Promise(function(resolve, reject){
      resolve(resolveValue);
    });
  },
  crc16: function(str){
    const len = str.length;    
    let crc = 0;
    for(ii = 0; ii < len; ii++){
      crc = crc16_update(crc, str[ii]);      
    }
    return crc.toString(16).toUpperCase();
  },
  isNumeric: function(n){
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
};
