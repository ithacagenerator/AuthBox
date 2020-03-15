/* jshint esversion: 8 */

var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var pbkdf2 = require('pbkdf2');
var moment = require('moment');
var homedir = require('homedir')();
var secret = require(`${homedir}/authbox-secret.json`).secret;
var waitUntil = require('wait-until');
var stringify = require('csv-stringify/');

var members_modification_in_progress = false;

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
  return findDocuments('Members', {'access_codes.code': access_code})
  .then((members) => {
    if(members.length === 1){
      members[0].access_code = access_code; // collapse to the code that was used
      return {
        member: members[0],
        box_id: decipherAuthBoxId(members[0], auth_hash)
      };
    } else throw new Error('no such access code');
  });
};

// cURL: curl -X GET https://ithacagenerator.org/authbox/v1/authboxes/PASSWORD
router.get('/authboxes/:secret?', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }

  findDocuments('AuthBoxes', {deleted: {$exists: false}}, {
    projection: { _id: 0, id: 0, access_codes: 0 }
  })
  .then((authboxes) =>{
    res.json(authboxes);
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});


// cURL: curl -X POST -H "Content-Type: application/json" -d '{"name": "BOX-NAME", "id": "BOX-ID", "access_code": "12345"}' https://ithacagenerator.org/authbox/v1/authboxes/create/PASSWORD
//
// :secret is the apriori secret known to administrators
// POST body is a JSON structure representing a new authbox,
//           which should include an id, name, access_code, and (optional) idle_timeout_ms field
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
  });
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
//           which should include an id (optional), name, access_code (optional), and idle_timeout_ms (optional) field
//           date last modified fields will be added automatically
//
router.put('/authbox/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }

  let obj = { };
  ['name', 'id', 'access_code', 'idle_timeout_ms'].forEach(key => {
    if (req.body[key]) {
      obj[key] = req.body[key];
    }
  });

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
    projection: { _id: 0, access_codes: 0, authorizedBoxes: 0 }
  })
  .then((members) =>{
    res.json(members.map(v => {
      v.registration_complete = v.registration && v.registration.registrationComplete;
      const namified = namifyMember(moment(), v);
      v.namified = { name: namified.name, status: namified.status };
      delete v.paypal;
      delete v.registration;
      return v;
    }));
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

// cURL: curl -X GET https://ithacagenerator.org/authbox/v1/member/NAME/PASSWORD
router.get('/member/:name/:secret?', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }
  const name = req.params.name;
  findDocuments('Members', {deleted: {$exists: false}, name}, {
    projection: { _id: 0, access_codes: 0, authorizedBoxes: 0, paypal: 0 }
  })
  .then((members) => {
    if (!Array.isArray(members) || (members.length !== 1)) {
      return findDocuments('Members', {deleted: {$exists: false}, email: name}, {
        projection: { _id: 0, access_codes: 0, authorizedBoxes: 0, paypal: 0 }
      });
    }
    return members;
  })
  .then((members) => {
    if (!Array.isArray(members) || (members.length !== 1)) {
      throw new Error(`Could not find member name '${name}'`);
    } else {
      // return findDocuments('AuthBoxes', {})
      // .then((allAuthBoxes) => {
      //   const authboxMap = allAuthBoxes.reduce((o, v) => {
      //     o[v.id] = v.name;
      //     return o;
      //   }, {});
      //   const member = members[0];
      //   member.authorizedBoxes = member.authorizedBoxes.map(b => authboxMap[b]);
      //   return member;
      // });
      members[0].registration_complete = members[0].registration && members[0].registration.registrationComplete;
      delete members[0].registration;
      return members[0];
    }
  })
  .then((member) =>{
    res.json(member);
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

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
    authbox = Array.isArray(authbox) && (authbox.length === 1) ? authbox[0] : {};
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
          authorizedBoxNames: authboxName,
          authorizedBoxes: authboxId
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
  waitUntil(100, Infinity, function condition(){
    return !members_modification_in_progress;
  }, function done(){
    members_modification_in_progress = true;

    if(req.params.secret !== secret){
      res.status(401).json({error: 'secret is incorrect'});
      members_modification_in_progress = false;
      return;
    }

    let missingFields = [];
    let obj = req.body;
    ['name', 'email', 'access_code', 'access_method'].forEach(key => {
      if(!obj[key]){
        missingFields.push(key);
      }
    });
    if(missingFields.length){
      res.status(422).json({error:
        `Missing ${missingFields.length} fields: ${JSON.stringify(missingFields)}`});
      members_modification_in_progress = false;
      return;
    }

    let now = moment().format();
    obj.created = now;
    obj.updated = now;

    obj.authorizedBoxes = [];
    obj.authorizedBoxNames = [];

    obj.access_codes = [{
      method: obj.access_method,
      code: obj.access_code
    }];

    delete obj.access_method;
    delete obj.access_code;

    // make sure the proposed access code is unique across members
    return findDocuments('Members', { 'access_codes.code':  obj.access_codes[0].code})
    .then((members) => {
      if(members.length > 0){
        throw new Error('proposed access code is not unique');
      }
    })
    .then(() => {
      return insertDocument('Members', obj);
    })
    .then((insertResult) => {
      if(!insertResult.insertedId){
        throw new Error('no document inserted');
      }
    })
    .then(() =>{
      members_modification_in_progress = false;
      res.json({status: 'ok'});
    })
    .catch((err) => {
      console.error(err);
      members_modification_in_progress = false;
      res.status(422).json({error: err.message});
    });
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
  waitUntil(100, Infinity, function condition(){
    return !members_modification_in_progress;
  }, function done(){
    members_modification_in_progress = true;
    if(req.params.secret !== secret){
      res.status(401).json({error: 'secret is incorrect'});
      members_modification_in_progress = false;
      return;
    }

    let obj = { };
    ['name', 'email', 'authorizedBoxNames'].forEach(key => {
      if (req.body[key]) {
        obj[key] = req.body[key];
      }
    });

    if(!obj.name && !obj.email){
      res.status(422).json({error: 'Neither name nor email provided.'});
      members_modification_in_progress = false;
      return;
    }

    let now = moment().format();
    obj.updated = now;

    let query = { name: obj.name };
    findDocuments('Members', query)
    .then((members) => {
      if(!Array.isArray(members) || (members.length !== 1)) {
        query = { email: obj.email };
        return findDocuments('Members', query);
      }
      return members;
    })
    .then((members) => {
      if(!Array.isArray(members) || (members.length !== 1)) {
        return { };
      }
      return updateDocument('Members', query, obj);
    })
    .then((updateResult) => {
      if(!updateResult.matchedCount){
        throw new Error('no document updated');
      }
    })
    .then(() => {
      // if an access code and access method was provided
      // need to read the member object and update their
      // access codes array to include this object
      let access_code = req.body.access_code;
      let access_method = req.body.access_method;
      if(access_code && access_method){
        // make sure the proposed access code is unique across members
        return findDocuments('Members', { 'access_codes.code': access_code})
        .then((members) => {
          if(members.length > 0){
            throw new Error('proposed access code is not unique');
          }
        })
        .then(() => {
          // fetch the existing member object by name
          return findDocuments('Members', {name: obj.name});
        })
        .then((members) => {
          if(members && members.length){
            return members[0].access_codes;
          } else {
            throw new Error(`Could not find member name '${obj.name}'`);
          }
        })
        .then((access_codes) => {
          if(!access_codes) { access_codes = []; }
          const existing_code = access_codes.find(c => c.method === access_method);
          if(existing_code){
            existing_code.code = access_code;
          } else {
            access_codes.push({
              method: access_method,
              code: access_code
            });
          }
          return updateDocument('Members', {name: obj.name}, {access_codes});
        })
        .then((updateResult) => {
          if(!updateResult.matchedCount){
            throw new Error('no document updated [access codes update]');
          }
        });
      }
    })
    .then(() =>{
      members_modification_in_progress = false;
      res.json({status: 'ok'});
    })
    .catch((err) => {
      members_modification_in_progress = false;
      console.error(err);
      res.status(422).json({error: err.message});
    });
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
  if(!obj.name && !obj.email){
    res.status(422).json({error: 'Neither name nor email provided.'});
    return;
  }

  let now = moment().format();
  obj.updated = now;
  obj.deleted = true;
  obj.welcomeEmailSent = false;
  obj.access_codes = []; // wipe out the user's access codes

  let query = { name: obj.name };
  findDocuments('Members', query)
  .then((members) => {
    if(!Array.isArray(members) || (members.length !== 1)) {
      query = { email: obj.email };
      return findDocuments('Members', query);
    }
    return members;
  })
  .then((members) => {
    if(!Array.isArray(members) || (members.length !== 1)) {
      return { };
    }
    return updateDocument('Members', query, obj);
  })
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
    authbox = Array.isArray(authbox) && (authbox.length === 1) ? authbox[0] : {};
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
          authorizedBoxNames: authboxName,
          authorizedBoxes: authboxId
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

router.put('/bulk/authorize-boxes/:memberName/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }

  // message body should contain an array of authbox names
  if (!Array.isArray(req.body)) {
    res.status(422).json({error: 'body must be an array of authbox names'});
    return;
  }

  // get the authbox ids that go with the requested names
  let memberName = req.params.memberName;
  const authorizedBoxNames = req.body;
  findDocuments("AuthBoxes", {
    name: {$in: authorizedBoxNames}
  })
  .then((allAuthBoxes) => {
    const authboxMap = allAuthBoxes.reduce((o, v) => { // create a reverse lookup
      o[v.name] = v.id;
      return o;
    }, {});
    const authorizedBoxes = authorizedBoxNames.map(b => authboxMap[b]);
    return updateDocument('Members', {name: memberName}, // applies to one member
      { authorizedBoxes, authorizedBoxNames }
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
      return result;
    } else {
      throw new Error('failed to decipher box id');
    }
  })
  .then((result) => {
    // determine the boxName that goes with the box id
    // so we can augment the box usage record
    return findDocuments('AuthBoxes', {id: result.box_id})
    .then((boxes) => {
      const box = boxes ? boxes[0] : {};
      result.box_name = box.name;
      return result;
    });
  })
  .then((result) => {
    authorizedMemberName = result.member.name;
    return insertDocument('BoxUsage', {
      member: authorizedMemberName,
      box_id: result.box_id,
      box_name: result.box_name,
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
    });
  })
  .then((box) => {
    if(!box) {
      throw new Error('box not authorized to get authmap');
    }
    return box;
  })
  .then((box) => {
    return findDocuments('Members', { authorizedBoxes: { $elemMatch: { $eq: box.id } } })
    .then((members) => {
      return { members, box };
    });
  })
  .then((members_and_box) => {
    // send back an array of valid authorization codes for the requested box
    res.json({
      codes: members_and_box.members
        .map(m => m.access_codes)                                   // an array of arrays of objects {code: '', method: ''}
        .reduce((t, v) =>                                           // reduce it to a flat array
           t.concat(Array.isArray(v) ? v.map(c => c.code) : []),    // of just the codes, methods don't matter
        []),
      idle_timeout_ms: members_and_box.box.idle_timeout_ms || 0
    });
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});


// cURL: curl -X GET https://ithacagenerator.org/authbox/v1/authboxes/history/AUTHBOX_NAME/PASSWORD?sort=SORT&order=ORDER&page=PAGE
router.get('/authboxes/history/:authboxName/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }

  const csv = req.query.csv === 'true';
  const all = req.query.all === 'true';

  if(req.query.sort === 'undefined') { delete req.query.sort; }
  if(req.query.order === 'undefined') { delete req.query.order; }
  if(req.query.page === 'undefined') { delete req.query.page; }
  const sort = req.query.sort || "authorized";
  const order = req.query.order || "asc";
  const page = req.query.page || 0;
  const filter = req.query.filter || "";
  const nPerPage = 30;

  const authboxName = req.params.authboxName;
  // first determine the box id that goes with the box name
  findDocuments('AuthBoxes', {name: authboxName})
  .then((authboxes) => {
    if (!authboxes || (authboxes.length !== 1)) {
      throw new Error(`Couldn't find AuthBox named ${authboxName}`);
    }
    else{
      return authboxes[0];
    }
  })
  .then((authbox) => {
    const _sort = { };
    _sort[sort] = order === 'asc' ? 1 : -1;
    const _condition = {$and: [{box_id: authbox.id}]};
    if(filter){
      const or = {$or: []};
      or.$or.push({member: new RegExp(filter,'i')});
      or.$or.push({authorized: new RegExp(filter,'i')});
      or.$or.push({deauthorized: new RegExp(filter,'i')});
      _condition.$and.push(or);
    }

    const options = {
      projection: { _id: 0, box_id: 0 },
      sort: _sort,
      includeCount: true
    };
    if(!all){
      options.skip = page * nPerPage;
      options.limit = nPerPage;
    }

    return findDocuments('BoxUsage', _condition, options);
  })
  .then((boxUsages) => {
    if(csv){
      return new Promise((resolve, reject) => {
        stringify(boxUsages.items, {header: true}, function(err, output){
          if(err){
            reject(err);
          } else {
            res.type('text/csv').send(output);
            resolve();
          }
        });
      });
    } else {
      res.json(boxUsages);
    }
  })
  .catch((err) => {
    console.error(err);
    res.status(422).json({error: err.message});
  });
});

function namifyMember(period, member) {
  const _period = moment(period);

  if (!member) {
    return {};
  }

  const periodRegex = new RegExp(period.format('MMM') + '.*' + period.format('YYYY'));
  period = moment(period);
  const periodIsCurrent = period.format('MM-YYYY') === moment().format('MM-YYYY');

  period.subtract(1, 'month');
  const previousPeriodRegex = new RegExp(period.format('MMM') + '.*' + period.format('YYYY'));

  let name = member.name || 'Unknown Name';
  const lastIPN = ((member.paypal || [{}]).slice(-1)[0]) || {};
  const registration = member.registration || {};
  let firstname = registration.firstname || lastIPN.first_name || 'Unknown Firstname';
  let lastname = registration.lastname || lastIPN.last_name || 'Unknown Lastname';
  if ((firstname.length < 2) && lastIPN.first_name && (lastIPN.first_name.length > 2)) {
    firstname = lastIPN.first_name;
  }

  if ((lastname.length < 2) && lastIPN.last_name && (lastIPN.last_name.length > 2)) {
    lastname = lastIPN.last_name;
  }

  if (name.length < 5) {
    name = 'Unknown Name';
  }
  if ((name === 'Unknown Name') && (firstname.indexOf('Unknown') < 0)) {
    name = firstname;
  }
  if (lastname.indexOf('Unknown') < 0) {
    if (name === 'Unknown Name') {
      name = lastname;
    } else if (name === firstname) {
      name += ' ' + lastname;
    }
  }

  if (name === 'Unknown Name') {
    console.warn('Indeterminate Name for ', member);
  }

  let gender = 'other';
  if (member.registration && member.registration.optional && member.registration.optional.gender) {
    gender = member.registration.optional.gender;
  }

  if (!member.paypal) {
    console.warn(`Member "${member.email}" has no PayPal record`);
    return { name, firstname, lastname, gender };
  }

  // for the given period, determine if there was a payment, an eot, both, or neither
  // in the case of neither, determine if there was a payment within the previous month
  //   if their was a payment consider the membership 'terminal',
  //   otherwise consider the membership 'dormant'
  // if there was a payment only, consider the membership 'active'
  // if there was an eot only, consider the membership 'terminal'
  // if there was both an eot and a payment,
  //   if the last thing in the period was a payment, consider the membership 'new'
  //   otherwise consider the membership 'terminal'
  const periodTransactions = member.paypal.filter(v => periodRegex.test(v.payment_date) || periodRegex.test(v.subscr_date) || periodRegex.test(v.eot_date));
  const periodHasPayments = !!periodTransactions.find(v => v.txn_type === 'subscr_payment');
  const reversePayments = member.paypal.filter(v => v.txn_type === 'subscr_payment').reverse();
  const periodHasEots = !!member.paypal.find(v => {
    if (['subscr_eot', 'subscr_failed', 'recurring_payment_suspended'].indexOf(v.txn_type) < 0) {
      return false;
    }

    // now that we know it's a subscr_eot, we can deduce the date that it happened
    // by looking at the subscription id, then find the last payment with the same id
    // and add one month to it
    let eot_date = null;
    const lastPayment = reversePayments.find(vv => vv.subscr_id === (v.subscr_id || v.recurring_payment_id));
    if (lastPayment) {
      eot_date = moment(lastPayment.payment_date,
        'HH:mm:ss MMM DD, YYYY zz');
      eot_date.add(1, 'month');
      eot_date = eot_date.format('MMM YYYY');
    }

    if (eot_date && periodRegex.test(eot_date)) {
      return true;
    }

    return false;
  });

  const periodHasSignup = !!periodTransactions.find(v => v.txn_type === 'subscr_signup');
  let status = '';
  if (periodHasSignup && periodHasPayments) {
    status = 'new';
  } else if (!periodHasPayments && !periodHasEots) {
    const previousPeriodTransactions = member.paypal.filter(v => previousPeriodRegex.test(v.payment_date));
    if (previousPeriodTransactions.length > 0) {
      lastTransactionInPreviousPeriod = previousPeriodTransactions.slice(-1)[0];
      if (lastTransactionInPreviousPeriod.txn_type === 'payment') {
        // terminal unless period is representative of the current calendar month / year
        // in which case a bit more math is needed
        status = 'terminal';
        if (periodIsCurrent) {
          // it's active if the payment is less than a month old
          const lastPaymentMoment = moment(lastTransactionInPreviousPeriod.payment_date,
            'HH:mm:ss MMM DD, YYYY zz');
          const oneMonthAgo = moment();
          oneMonthAgo.subtract(1, 'month');
          if (oneMonthAgo.isSameOrBefore(lastPaymentMoment)) {
            status = 'active';
          }
        }
      }
    } else {
      status = 'dormant';
    }
  } else if (periodHasPayments && !periodHasEots) {
    status = 'active';
  } else if (periodHasEots && !periodHasPayments) {
    status = 'terminal';
  } else if (periodHasPayments && periodHasEots) {
    status = periodTransactions.slice(-1)[0].txn_type === 'subscr_payment' ?
      'new' : 'terminal';
  }

  if (name === '') {
    console.log(JSON.stringify(member.paypal.map(v => {
      return {
        txn_type: v.txn_type,
        date: v.payment_date || v.subscr_date || v.eot_date
      };
    }), null, 2));
    console.log(JSON.stringify({name, periodHasPayments, periodHasEots, periodHasSignup}, null, 2));
  }

  // Also decorate the member with their likely membership tier based on payment amount
  // do so by looking at the last payment record that is in or before this month
  _period.date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
  const allPayments = member.paypal.filter(v => {
    if (!v._m && v.payment_date && v.payment_gross && (+v.payment_gross > 0)) {
      v._m = moment(v.payment_date, 'HH:mm:ss MMM DD, YYYY Z');
      v._m.date(1).hours(0).minutes(0).seconds(0).milliseconds(0);
    }
    if (v._m) {
      // console.warn(name, v._m.format(), period.format(), _period.format());
      if (v._m.isSameOrBefore(_period)) {
        return true;
      }
    }

    return false;
  });

  let tier;
  let membershipLevelBasis;
  if (allPayments.length > 0) {
    membershipLevelBasis = allPayments.slice(-1)[0].payment_gross;
    const knownTiers = {
      '35.00': 'standard',
      '20.00': 'basic',
      '75.00': 'extra',
      '37.50': 'extra', // technically, this is a family membership discount applied
      '56.25': 'extra-student',
      '10.00': 'basic', // technically, this is a family membership discount applied
      '26.25': 'standard-student',
      '15.00': 'basic-student'
    };
    tier = knownTiers[membershipLevelBasis];

  }

  if (!tier) {
    console.warn(`did not determine tier for "${name}"`);
  }

  return { name, firstname, lastname, status, tier, gender };
}

router.get('/members/active/:secret', async (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }

  // interrogate the Members collection for members whose last
  // PayPal subscription entry is of txn_type === 'payment'
  // and whose last IPN doesn't indicate subscr_eot
  // or who has the benefactor flag
  try {
    let activeMembers = await findDocuments('Members', {
      $or: [
        {'paypal.txn_type': 'subscr_payment'},
        {lifetimeMember: true}
      ]
    });
    activeMembers = activeMembers || [];
    activeMembers = activeMembers
    .filter(member => {
      if (member.lifetimeMember) {
        return true;
      }

      if(!Array.isArray(member.paypal)) {
        return false;
      }

      const lastIPN = member.paypal.slice(-1)[0];
      if(!lastIPN) {
        return false;
      }

      return (lastIPN.txn_type !== 'subscr_eot');
    });

    let result = activeMembers.map(v => {
      const namified = namifyMember(moment(), v);

      return {
        name: v.name,
        namified,
        authorizedBoxNames: v.authorizedBoxNames
      };
    })
    .sort((a, b) => {
      const sortA = a.namified.name.split(' ').slice(-1)[0];
      const sortB = b.namified.name.split(' ').slice(-1)[0];

      if (sortA === sortB) return 0;
      if (sortA < sortB) return -1;
      return +1;
    });

    res.json(result);
  } catch (e) {
    console.error(e.message || e, e.stack);
    res.status(500).json({error: e.message || 'Unknown error'});
  }
});

// TODO: this currently doesn't account for lifetime members
// TODO: this currently doesn't account for scholarship members
//
// How do you know if a member is active in a given month/year?
// -- trivially if there is a subscr_payment for a member in a given month/year YES
// -- but in order to determine which subscriptions truly ended in a given month
router.get('/members/historic/:from/:to/:secret', async (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }

  const from = moment(req.params.from, 'YYYY-MM');
  const to = moment(req.params.to, 'YYYY-MM');
  if (!from.isValid()) {
    res.status(422).json({error: `Failed to parse From date (${req.params.from}) using YYYY-MM`});
    return;
  }

  if (!to.isValid()) {
    res.status(422).json({error: `Failed to parse To date (${req.params.to}) using YYYY-MM`});
    return;
  }

  if (from.isAfter(to)) {
    res.status(422).json({error: `From date (${req.params.from}) is not after To date (${req.params.to})`});
    return;
  }

  from.subtract(1, 'month'); // you have to consider the month before to get a complete list of members to evaluate

  const payment_results = {
    data: [],
    members: new Set(),
    periods: []
  };
  let previousMembers = [];
  try {
    while (from.isSameOrBefore(to)) {
      const paymentDateRegex = new RegExp(from.format('MMM') + '.*' + from.format('YYYY'));
      const query = {
        $or: [
          {
            paypal: {
              $elemMatch: {
                txn_type: 'subscr_payment',
                payment_date: { $regex: paymentDateRegex }
              }
            }
          },
          {
            paypal: {
              $elemMatch: {
                txn_type: 'subscr_signup',
                subscr_date: { $regex: paymentDateRegex }
              }
            }
          },
          {
            paypal: {
              $elemMatch: {
                txn_type: 'subscr_failed',
                retry_at: { $regex: paymentDateRegex }
              }
            }
          },
          {
            paypal: {
              $elemMatch: {
                txn_type: 'recurring_payment_suspended',
                time_created: { $regex: paymentDateRegex }
              }
            }
          }
          // {
          //   paypal: {
          //     $elemMatch: {
          //       txn_type: 'subscr_eot',
          //     }
          //   }
          // }
        ]
      };

      // if (from.format('MM-YYYY') === moment().format('MM-YYYY')) {
      query.$or.push(          {
        name: {$in: previousMembers.map(v => v.name)}
      });
      // }

      const members = await findDocuments('Members', query);
      previousMembers = members;

      const period = from.format('YYYY-MM');
      const namifiedMembers = members.map(namifyMember.bind(null, from));
      payment_results.data.push({
        period,
        members: namifiedMembers.filter(v => v.status !== 'dormant')
      });
      payment_results.members = new Set([...payment_results.members, ...namifiedMembers.map(v => v.name)]);
      payment_results.periods.push(period);

      from.add(1, 'month');
    }

    // the first data set was just to collect members from the previous month
    payment_results.members = Array.from(payment_results.members).sort((a, b) => {
      const aSort = a.split(' ').slice(-1)[0].toLowerCase();
      const bSort = b.split(' ').slice(-1)[0].toLowerCase();
      if (aSort < bSort) return -1;
      if (aSort > bSort) return +1;
      return 0;
    });
    payment_results.periods = payment_results.periods.slice(1);
    payment_results.data = payment_results.data.slice(1);

    res.json(payment_results);
  } catch (e) {
    console.error(e.message || e, e.stack);
    res.status(500).json({error: e.message || 'Unknown error'});
  }
});

// cURL: curl -X GET https://ithacagenerator.org/authbox/v1/authboxes/history/AUTHBOX_NAME/PASSWORD?sort=SORT&order=ORDER&page=PAGE
router.get('/members/history/:memberName/:secret', (req, res, next) => {
  if(req.params.secret !== secret){
    res.status(401).json({error: 'secret is incorrect'});
    return;
  }

  const csv = req.query.csv === 'true';
  const all = req.query.all === 'true';

  if(req.query.sort === 'undefined') { delete req.query.sort; }
  if(req.query.order === 'undefined') { delete req.query.order; }
  if(req.query.page === 'undefined') { delete req.query.page; }
  const sort = req.query.sort || "authorized";
  const order = req.query.order || "asc";
  const page = req.query.page || 0;
  const filter = req.query.filter || "";
  const nPerPage = 30;

  const memberName = req.params.memberName;
  findDocuments('Members', {name: memberName})
  .then((members) => {
    if (!Array.isArray(members) || (members.length !== 1)){
      return findDocuments('Members', {email: memberName});
    }
    return members;
  })
  .then((members) => {
    if (!members || (members.length !== 1)) {
      throw new Error(`Couldn't find Member named ${memberName}`);
    }
    else{
      return members[0];
    }
  })
  .then((member) => {
    const _sort = { };
    _sort[sort] = order === 'asc' ? 1 : -1;
    const _condition = {$and: [{member: member.name}]};
    if(filter){
      const or = {$or: []};
      or.$or.push({box_name: new RegExp(filter,'i')});
      or.$or.push({authorized: new RegExp(filter,'i')});
      or.$or.push({deauthorized: new RegExp(filter,'i')});
      _condition.$and.push(or);
    }

    const options = {
      projection: { _id: 0, member: 0, box_id: 0 },
      sort: _sort,
      includeCount: true
    };
    if(!all){
      options.skip = page * nPerPage;
      options.limit = nPerPage;
    }

    return findDocuments('BoxUsage', _condition, options);
  })
  .then((boxUsages) => {
    if(csv){
      return new Promise((resolve, reject) => {
        stringify(boxUsages.items, {header: true}, function(err, output){
          if(err){
            reject(err);
          } else {
            res.type('text/csv').send(output);
            resolve();
          }
        });
      });
    } else {
      res.json(boxUsages);
    }
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
  });
};

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
};

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


module.exports = router;
