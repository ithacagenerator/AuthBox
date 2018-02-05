var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var pbkdf2 = require('pbkdf2');
var moment = require('moment');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.json({status: "ok"});
});


// Members is a collection, each Member is an object like:
// { name: 'Alice', access_code: '12345', authorizedBoxes: ['laser-cutter']}
var findMemberAndBox = (auth_hash, access_code) => {
  // first see if there's a user in the database that matches the user_code
  return findDocuments('Members', {access_code})
  .then((members) => {
    if(members.length === 1){      
      return {
        member: members[0],
        box_id: decipherAuthBoxId(members[0], auth_hash)
      }
    } else throw new Error('no such access code');
  })

}

// cURL: curl -X PUT https://ithacagenerator.org/authbox/v1/authorize/CALCULATED-AUTH-HASH-HERE/ACCESS-CODE-HERE
router.put('/authorize/:auth_hash/:access_code', (req, res, next) => {
  let authorizedMemberName;
  findMemberAndBox(req.params.auth_hash, req.params.access_code)
  .then((result) =>{
    if(result.box_id){
      authorizedMemberName = result.member.name;
      return updateDocument('BoxUsage', {}, {        
        member: authorizedMemberName,
        box_id: result.box_id,
        authorized: moment().format()
      })
      .then((updateResult) => {
        if(!updateResult.upsertedId){          
          throw new Error('no document inserted');
        }
      });
    } else {
      throw new Error('failed to decipher box id');
    }
  })
  .then(() =>{
    res.json({status: 'ok', member: authorizedMemberName});
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

// cURL: curl -X PUT https://ithacagenerator.org/authbox/v1/deauthorize/CALCULATED-AUTH-HASH-HERE/ACCESS-CODE-HERE
router.put('/deauthorize/:auth_hash/:access_code', (req, res, next) => {
  findMemberAndBox(req.params.auth_hash, req.params.access_code)
  .then((result) =>{
    if(result.box_id){
      return updateDocument('BoxUsage', {
        $and: [
          { member: result.member.name },
          { box_id: result.box_id },
          { deauthorized: { $exists: false } }
        ]
      }, {                        
        deauthorized: moment().format()
      })
      .then((updateResult) => {
        if(updateResult.upsertedId){          
          console.error('document created, when, rather, one should have been modified');
        }
        if(updateResult.modifiedCount !== 1){
          console.error(`one document should have been modified, but actually ${updateResult.modifiedCount} were modified`);
        }
      });
    } else {
      throw new Error('failed to decipher box id');
    }
  })
  .then(() =>{
    res.json({status: 'ok'});
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

// Boxes is a collection, each Box is required to have fields like::
// { id: 'laser-cutter', access_code: 'secret-passphrase' }
// cURL: curl -X GET https://ithacagenerator.org/authbox/v1/authmap/CALCULATED-AUTH-HASH-HERE
router.get('/authmap/:auth_hash', (req, res, next) => {
  findDocuments('AuthBoxes', {})
  .then((boxes) => {    
    return boxes.find(box => {
      const box_auth_hash = pbkdf2.pbkdf2Sync(box.id, box.access_code, 1, 32, 'sha512').toString('hex');
      return box_auth_hash === req.params.auth_hash;      
    })
  })
  .then((box) => {
    if(!box) {
      throw new Error('box not authorized to get authmap');
    }
    return box;
  })  
  .then((box) => {
    return findDocuments('Members', { authorizedBoxes: { $elemMatch: { $eq: box.id } } });
  })
  .then((members) => {    
    // send back an array of valid authorization codes for the requested box
    res.json(members.map(m => m.access_code));
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

var decipherAuthBoxId = (member, auth_hash) => {
  if(!member || !auth_hash){
    return null;
  }
  let access_code = member.access_code;
  let authorizedBoxes = member.authorizedBoxes;
  if(!Array.isArray(authorizedBoxes)){
    authorizedBoxes = [];
  }

  return authorizedBoxes.find(box_id => {
    const box_auth_hash = pbkdf2.pbkdf2Sync(box_id, access_code, 1, 32, 'sha512').toString('hex');
    return box_auth_hash === auth_hash;
  })
};

var findDocuments = function(colxn, condition, options = {}) {
    let projection = options.projection || {};
    let sort = options.sort;
    let limit = options.limit;
  
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
          console.log("Connected correctly to server");
          try{
            var collection = db.collection(colxn);
            // Find some documents
            let cursor = collection.find(condition, projection);
  
            if(sort){
              console.log("Applying sort", sort);
              cursor = cursor.sort(sort);
            }
  
            if(limit){
              console.log("Applying limit", limit);
              cursor = cursor.limit(limit);
            }
  
            cursor.toArray(function(err, docs) {
              if(err){
                reject(err);
              }
              else{
                resolve(docs);
              }
              client.close();
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
  
  
  //// BE CAREFUL, upsert: true is default behavior, use options if that is not desired
  var updateDocument = function(colxn, condition, update, options = {}){
  
    let opts = Object.assign({}, {upsert: true}, options);
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
          console.log("Connected correctly to server");
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
  }
  
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
            console.log("Connected correctly to server");
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
  }
  

module.exports = router;
