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
  }
};
