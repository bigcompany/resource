var comfy = require('../vendor/Comfy');
var checkUniqueKey = require('./datasource/checkUniqueKey');

module.exports = function (opts) {
  var couch = {};
  var dbname = opts.db || "resource";
  var model = opts.model || "defaultModel";
  var resource = opts.resource || {
    schema: {
      properties: {}
    }
  };

  var db = comfy(opts.url, {
      user: opts.username,
      password: opts.password
  });

  couch.create = function (entry, next) {
    entry.model = model;
    db.insert(dbname, entry, next);
  };

  couch.all = function (query, next) {
    if (typeof query.where === "undefined") {
      query.where = {
        model: 'creature'
      };
    }
    query.where.model = model;
    // console.log('performing query', dbname, query.where)
    db.find(dbname, { selector: query.where, limit: 10000 }, function(err, body){
      if (err) {
        return next(err);
      }
      // console.log('just found', query, err, body)
      body.docs = body.docs.map(function(doc){
        doc.id = doc._id;
        doc.save = function (cb) {
          checkUniqueKey(resource, doc, function (err, _data){
            if (err) {
              return cb(err);
            }
            db.edit(dbname, doc.id, doc, cb);
          });
        }
        doc.destroy = function (cb) {
          db.remove(dbname, doc.id, doc._rev, cb);
        }
        delete doc._id;
        return doc;
      })
      next(null, body.docs);
    });
  };

  couch.find = function (id, next) {
    db.get(dbname, id, function(err, doc){
      if (err) {
        return next(err)
      }
      doc.save = function (cb) {
        doc.id = doc._id;
        checkUniqueKey(resource, doc, function (err, _data){
          if (err) {
            return cb(err);
          }
          db.edit(dbname, id, doc, cb);
        });
        delete doc._id;
      }
      doc.destroy = function (cb) {
        db.remove(dbname, id, doc._rev, cb);
      }
      next(null, doc);
    });
  };

  /*
  couch.destroy = function (id, next) {
    db.remove(dbname, id, undefined, cb);
  };
  */
  couch.updateOrCreate = function (doc, next) {
    db.edit(dbname, doc.id, doc, next);
  }
  couch.update = function (opts, next) {
    db.update(dbname, opts.id, opts, next);
  };
  couch.createIndex = function (opts, next) {
    db.create_index(dbname, opts, next);
  }
  return couch;
};