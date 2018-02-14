var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var pbkdf2 = require('pbkdf2');
var moment = require('moment');
var homedir = require('homedir')();
var secret = require(`${homedir}/authbox-secret.json`).secret;

/* GET home page. */
router.get('/amiloggedin/:secret', function(req, res, next) {
    if(req.params.secret === secret){
      res.json({status: "ok"});
    } else {
      res.status(401).json({error: "not logged in"});
    }    
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

// cURL: curl -X GET https://ithacagenerator.org/authbox/v1/authboxes/PASSWORD
router.get('/authboxes/:secret?', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }
    
  findDocuments('AuthBoxes', {deleted: {$exists: false}}, {
    projection: { _id: 0, id: 0, access_code: 0 }
  })
  .then((authboxes) =>{
    res.json(authboxes);
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
})


// cURL: curl -X POST -H "Content-Type: application/json" -d '{"name": "BOX-NAME", "id": "BOX-ID", "access_code": "12345"}' https://ithacagenerator.org/authbox/v1/authboxes/create/PASSWORD
// 
// :secret is the apriori secret known to administrators
// POST body is a JSON structure representing a new authbox, 
//           which should include an id, name, and access_code field
//           date created and last modified fields will be added automatically
//
router.post('/authboxes/create/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }

  let missingFields = [];
  let obj = req.body;
  ['name', 'id', 'access_code'].forEach(key => {
    if(!obj[key]){
      missingFields.push(key);
    }
  })
  if(missingFields.length){
    res.status(422).json({error: 
      `Missing ${missingFields.length} fields: ${JSON.stringify(missingFields)}`});
    return;    
  }

  let now = moment().format();
  obj.created = now;
  obj.updated = now;

  insertDocument('AuthBoxes', obj)
  .then((insertResult) => {
    if(!insertResult.insertedId){          
      throw new Error('no document inserted');
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

// cURL: curl -X PUT -H "Content-Type: application/json" -d '{"name": "BOX-NAME", "id": "BOX-ID", "access_code": "12345"}' https://ithacagenerator.org/authbox/v1/authbox/PASSWORD
// 
// :secret is the apriori secret known to administrators
// PUT body is a JSON structure representing a the udpates to make, 
//           which should include an id (optional), name, and access_code (optional) field
//           date last modified fields will be added automatically
//
router.put('/authbox/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }

  let obj = { };
  ['name', 'id', 'access_code'].forEach(key => {
    if (req.body[key]) {
      obj[key] = req.body[key];
    }
  })

  if(!obj.name){
    res.status(422).json({error: 'Name not provided.'});    
    return;    
  }

  let now = moment().format();  
  obj.updated = now;

  updateDocument('AuthBoxes', { name: obj.name }, obj)
  .then((updateResult) => {
    if(!updateResult.matchedCount){          
      throw new Error('no document updated');
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

// cURL: curl -X DELETE -H "Content-Type: application/json" -d '{"name": "BOX-NAME"}' https://ithacagenerator.org/authbox/v1/authbox/PASSWORD
// 
// :secret is the apriori secret known to administrators
// DELETE body is a JSON structure representing a the udpates to make, 
//           which should include a name
//
router.delete('/authbox/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }

  const obj = req.body;
  if(!obj.name){
    res.status(422).json({error: 'Name not provided.'});    
    return;    
  }

  let now = moment().format();  
  obj.updated = now;
  obj.deleted = true;

  updateDocument('AuthBoxes', { name: obj.name }, obj)
  .then((updateResult) => {
    if(!updateResult.matchedCount){        
      throw new Error('no document deleted');
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


// cURL: curl -X GET https://ithacagenerator.org/authbox/v1/members/PASSWORD
router.get('/members/:secret?', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }
    
  findDocuments('Members', {deleted: {$exists: false}}, {
    projection: { _id: 0, access_code: 0, authorizedBoxes: 0 }
  })
  .then((members) =>{
    res.json(members);
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
})

 
router.put('/bulk/authorize-members/:authboxName/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }

  // message body should contain an array of member names
  if (!Array.isArray(req.body)) {
    res.status(422).json({error: 'body must be an array of member names'});    
    return;
  }

  // get the authbox id for the authbox name first
  let authboxId;
  let authboxName = req.params.authboxName;
  findDocuments("AuthBoxes", {name: authboxName})
  .then((authbox) => {
    authbox = Array.isArray(authbox) ? authbox[0] : {}; 
    if(!authbox || !authbox.id){
      throw new Error(`Could not find authbox named "${authboxName}"`);
    } else {
      authboxId = authbox.id;
    }
  })
  .then(() => {
    //then remove the authbox from all the members authorized lists
    return updateDocument('Members', {}, // applies to all Members documents 
      {
        $pull: { // removes values from arrays
          authorizedBoxNames: {$eq: authboxName}, 
          authorizedBoxes: {$eq: authboxId}
        }
      },
      {updateType: 'complex', updateMany: true}
    );
  })
  .then((updateResult) => {
    // then add the authbox to the authorized member lists
    return updateDocument('Members', {name: {$in: req.body}}, // only authorized members
      { 
        $addToSet: {
          authorizedBoxNames: authboxName, 
          authorizedBoxes: authboxId
        }
      }, 
      {updateType: 'complex', updateMany: true}
    );    
  })
  .then((updateResult) =>{
    res.json({status: 'ok'});
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

// cURL: curl -X POST -H "Content-Type: application/json" -d '{"name": "MEMBER-NAME", "email": "MEMBER-EMAIL", "access_code": "12345"}' https://ithacagenerator.org/authbox/v1/members/create/PASSWORD
// 
// :secret is the apriori secret known to administrators
// POST body is a JSON structure representing a new authbox, 
//           which should include an email, name, and access_code field
//           date created and last modified fields will be added automatically
//
router.post('/members/create/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }

  let missingFields = [];
  let obj = req.body;
  ['name', 'email', 'access_code'].forEach(key => {
    if(!obj[key]){
      missingFields.push(key);
    }
  })
  if(missingFields.length){
    res.status(422).json({error: 
      `Missing ${missingFields.length} fields: ${JSON.stringify(missingFields)}`});
    return;    
  }

  let now = moment().format();
  obj.created = now;
  obj.updated = now;

  obj.authorizedBoxes = [];
  obj.authorizedBoxNames = [];

  insertDocument('Members', obj)
  .then((insertResult) => {
    if(!insertResult.insertedId){          
      throw new Error('no document inserted');
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

// cURL: curl -X PUT -H "Content-Type: application/json" -d '{"name": "MEMBER-NAME", "email": "MEMBER-EMAIL", "access_code": "12345"}' https://ithacagenerator.org/authbox/v1/member/PASSWORD
// 
// :secret is the apriori secret known to administrators
// PUT body is a JSON structure representing a the udpates to make, 
//           which should include an email (optional), name, and access_code (optional) field
//           date last modified fields will be added automatically
//
router.put('/member/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }

  let obj = { };
  ['name', 'email', 'access_code', 'authorizedBoxNames'].forEach(key => {
    if (req.body[key]) {
      obj[key] = req.body[key];
    }
  })

  if(!obj.name){
    res.status(422).json({error: 'Name not provided.'});    
    return;    
  }

  let now = moment().format();  
  obj.updated = now;

  updateDocument('Members', { name: obj.name }, obj)
  .then((updateResult) => {
    if(!updateResult.matchedCount){          
      throw new Error('no document updated');
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

// cURL: curl -X DELETE -H "Content-Type: application/json" -d '{"name": "MEMBER-NAME"}' https://ithacagenerator.org/authbox/v1/member/PASSWORD
// 
// :secret is the apriori secret known to administrators
// DELETE body is a JSON structure representing a the udpates to make, 
//           which should include a name
//
router.delete('/member/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});    
    return;
  }

  const obj = req.body;
  if(!obj.name){
    res.status(422).json({error: 'Name not provided.'});    
    return;    
  }

  let now = moment().format();  
  obj.updated = now;
  obj.deleted = true;

  updateDocument('Members', { name: obj.name }, obj)
  .then((updateResult) => {
    if(!updateResult.matchedCount){        
      throw new Error('no document deleted');
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


// cURL: curl -X POST https://ithacagenerator.org/authbox/v1/authorize/CALCULATED-AUTH-HASH-HERE/ACCESS-CODE-HERE
// 
// :auth_hash    is the result of mixing the user access code with the box id using a pbkdf2 hash
// :access_code  is the access code entered by a user, uniquely identifies a user 
//
//               because access_codes have a unique key in the database
//               together, auth_hash and access_code uniquely identify a box (without revealing the box id)
router.post('/authorize/:auth_hash/:access_code', (req, res, next) => {
  let authorizedMemberName;
  findMemberAndBox(req.params.auth_hash, req.params.access_code)
  .then((result) =>{
    if(result.box_id){
      authorizedMemberName = result.member.name;
      return insertDocument('BoxUsage', {
        member: authorizedMemberName,
        box_id: result.box_id,
        authorized: moment().format()
      })
      .then((insertResult) => {
        if(!insertResult.insertedId){          
          throw new Error('no document inserted');
        }
      })
      .then(() => {
        return result;
      });
    } else {
      throw new Error('failed to decipher box id');
    }
  })
  .then((result) => { // result has result.member.name and result.box_id
    return updateDocument('AuthBoxes', { id: result.box_id }, {
      lastAuthorizedBy: result.member.name,
      lastAuthorizedAt: moment().format()
    });
  })
  .then(() =>{
    res.json({status: 'ok', member: authorizedMemberName});
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

// cURL: curl -X POST https://ithacagenerator.org/authbox/v1/deauthorize/CALCULATED-AUTH-HASH-HERE/ACCESS-CODE-HERE
router.post('/deauthorize/:auth_hash/:access_code', (req, res, next) => {
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
      })
      .then(() => {
        return result;
      });
    } else {
      throw new Error('failed to decipher box id');
    }
  })
  .then((result) => { // result has result.member.name and result.box_id
    return updateDocument('AuthBoxes', { id: result.box_id }, {
      lastLockedBy: result.member.name,
      lastLockedAt: moment().format()
    });
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
          // console.log("Connected correctly to server");
          try{
            var collection = db.collection(colxn);
            // Find some documents
            let cursor = collection.find(condition, {projection});
  
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
  
  
  var updateDocument = function(colxn, condition, update, options = {}){
  
    let opts = Object.assign({}, {upsert: false}, options);
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
  }
  
  var insertDocument = function(colxn, document){
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
          collection.insertOne(document, function(err, result) {
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
  }
  

module.exports = router;
