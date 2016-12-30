var checkUniqueKey = require('./checkUniqueKey');

module['exports'] = function (r) {
  //
  // Get method
  //
  function get (id, callback) {
    if(typeof id === 'object' && typeof id.id !== 'undefined') {
      id = id.id
    }
    if (typeof id === "undefined") {
      return callback(new Error('`id` is a required parameter!'))
    }
    r.model.find(id, function(err, doc){
      if (doc === null) {
        return callback(new Error(id + ' not found'));
      }
      doc.save = function (cb) {
        doc.id = doc._id;
        checkUniqueKey(r, doc, function (err, _data){
          if (err) {
            return cb(err);
          }
          r.model.updateOrCreate(doc, cb);
        });
        delete doc._id;
      }
      callback(err, doc);
    });
  }
  r.method('get', get);
};