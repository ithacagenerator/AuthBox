/* jshint esversion:6 */
/* jshint node: true */

const util = require('./util');
const MongoClient = require('mongodb').MongoClient;

module.exports = (function(){
  console.log('Initialized Local Database');

  let in_memory_configuration = {};
  // for initial testing without database
  // const initial_load = new Promise(function(resolve, reject){
  //   in_memory_configuration = {
  //     idle_timeout_ms: 600000,
  //     codes: ['1234']
  //   };
  //   resolve(in_memory_configuration);
  // })
  // .then((config) => in_memory_configuration = config);

  // production implementation with database
  const initial_load = findDocuments('Configurations', {})
    .then(function(configs){
      if(configs && configs.length){
        in_memory_configuration = configs[0];
      } else {
        in_memory_configuration = {
          idle_timeout_ms: 600000,
          codes: []
        };
      }
    })
    .catch(function(err){
      console.error(err.message, err.stack);
    });

  function isAuthorized(code) {    
    const validCodes = in_memory_configuration.codes || [];
    return util.resolvedPromise(validCodes.indexOf(code) >= 0);
  }

  function saveConfiguration(config) {        
    return initial_load
    .then(function(){
      if(config){
        in_memory_configuration = config;
        return updateDocument("Configurations", {}, config);
      } else {
        console.log(`Warn: local database not updated, because !config`);
      }
    });   
  }

  function getConfiguration(){       
    return initial_load
    .then(function() {
      return in_memory_configuration;
    });
  }

  function findDocuments(colxn, condition, options = {}) {
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
        if(err){
          reject(err);
        } else {
          const db = client.db('authbox');
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
              } else{
                count = cnt;
                cursor.toArray(function(err, docs) {
                  if(err){
                    reject(err);
                  } else {
                    if(includeCount){
                      console.log(`Count: ${count}`);
                      resolve({items: docs, total_count: count});
                    } else {
                      resolve(docs);
                    }
                  }
                  client.close();
                });
              }
            });
          } catch(error) {
            reject(error);
            client.close();
          }
        }
      });
    });
  }
     
  function updateDocument(colxn, condition, update, options = {}){
  
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
        if(err){
          reject(err);
        } else {
          const db = client.db('authbox');
          // console.log("Connected correctly to server");
          var collection = db.collection(colxn);
          if(opts.updateMany){
            collection.updateMany(condition, updateOperation, opts, function(err, result) {
              if(err){
                reject(err);
              } else {
                resolve(result);
              }
              client.close();
            });
          } else {
            collection.updateOne(condition, updateOperation, opts, function(err, result) {
              if(err){
                reject(err);
              } else {
                resolve(result);
              }
              client.close();
            });
          }
        }
      });
    });
  }
  
  function deleteDocument(colxn, condition, options = {}){
  
    let opts = Object.assign({}, {}, options);
  
    // delete ONE document in the collection
    return new Promise((resolve, reject) => {
      if(!errorMessage){
        var url = 'mongodb://localhost:27017';
        MongoClient.connect(url, function(err, client) {          
          if(err){
            reject(err);
          } else {
            const db = client.db('authbox');
            // console.log("Connected correctly to server");
            var collection = db.collection(colxn);
            collection.deleteOne(condition, opts, function(err, result) {
              if(err){
                reject(err);
              } else {
                resolve(result);
              }
              client.close();
            });
          }
        });
      } else {
        reject(new Error(errorMessage));
      }
    });
  }

  return {
    isAuthorized,
    saveConfiguration,
    getConfiguration
  };
})();