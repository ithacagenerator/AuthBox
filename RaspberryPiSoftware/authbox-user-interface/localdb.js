/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');
const path = require('path');
const identity = require(path.join(require('homedir')(), 'identity.json'));

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

  var findDocuments = function(colxn, condition, options = {}) {
    let projection = options.projection || {};
    let sort = options.sort;
    let limit = options.limit;
    let skip = options.skip;
    let includeCount = options.includeCount;
    let count = 0;
    projection = Object.assign({}, projection, {_id: 0}); // never return id
  
    // Get the documents collection
    return new Promise((resolve, reject) => {
      var url = 'mongodb://localhost:27017';
      MongoClient.connect(url, function(err, client) {
        const db = client.db('authbox');
        if(err){
          reject(err);
        }
        else {
          // console.log("Connected correctly to server");
          try{
            var collection = db.collection(colxn);
            // Find some documents
            let cursor = collection.find(condition, {projection});
  
            if(sort){
              console.log("Applying sort", sort);
              cursor = cursor.sort(sort);
            }
  
            if(skip){
              console.log("Applying skip", skip);
              cursor = cursor.skip(skip);
            }
  
            if(limit){
              console.log("Applying limit", limit);
              cursor = cursor.limit(limit);
            }
            
            cursor.count(false, {}, (err, cnt) => {          
              if(err) {
                reject(err);
                client.close();
              }
              else{
                count = cnt;
                cursor.toArray(function(err, docs) {
                  if(err){
                    reject(err);
                  }
                  else{
                    if(includeCount){
                      console.log(`Count: ${count}`);
                      resolve({items: docs, total_count: count});
                    }
                    else{
                      resolve(docs);
                    }
                  }
                  client.close();
                });
              }
            });
          }
          catch(error){
            reject(error);
            client.close();
          }
        }
      });
    });
  };
     
  var updateDocument = function(colxn, condition, update, options = {}){
  
    let opts = Object.assign({}, {upsert: true}, options); // NOTE: upsert: true
    let updateOperation = { $set: update }; // simple default use case
    if(opts.updateType === "complex"){ // this represents intentionality
      delete opts.updateType;
      // if updateType is marked complex defer to caller for a complete
      // update operator specification, rather than a simple $set operation
      updateOperation = update;
    }
  
    // update ONE document in the collection
    return new Promise((resolve, reject) => {
      var url = 'mongodb://localhost:27017';
      MongoClient.connect(url, function(err, client) {
        const db = client.db('authbox');
        if(err){
          reject(err);
        }
        else {
          // console.log("Connected correctly to server");
          var collection = db.collection(colxn);
          if(opts.updateMany){
            collection.updateMany(condition, updateOperation, opts, function(err, result) {
              if(err){
                reject(err);
              }
              else{
                resolve(result);
              }
              client.close();
            });
          }
          else{
            collection.updateOne(condition, updateOperation, opts, function(err, result) {
              if(err){
                reject(err);
              }
              else{
                resolve(result);
              }
              client.close();
            });
          }
        }
      });
    });
  };
  
  var deleteDocument = function(colxn, condition, options = {}){
  
    let opts = Object.assign({}, {}, options);
  
    // delete ONE document in the collection
    return new Promise((resolve, reject) => {
      if(!errorMessage){
        var url = 'mongodb://localhost:27017';
        MongoClient.connect(url, function(err, client) {
          const db = client.db('authbox');
          if(err){
            reject(err);
          }
          else {
            // console.log("Connected correctly to server");
            var collection = db.collection(colxn);
            collection.deleteOne(condition, opts, function(err, result) {
              if(err){
                reject(err);
              }
              else{
                resolve(result);
              }
              client.close();
            });
          }
        });
      }
      else {
        reject(new Error(errorMessage));
      }
    });
  };

  return {
    isAuthorized,
    saveConfiguration,
    getConfiguration
  };
})();