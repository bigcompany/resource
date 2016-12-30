var checkUniqueKey = require('./checkUniqueKey');

module['exports'] = function (r) {
  function create (data, callback) {
    if (r.schema.properties.ctime) {
      data.ctime = Date.now();
    }
    if (r.schema.properties.mtime) {
      data.mtime = Date.now();
    }
    checkUniqueKey(r, data, function (err, _data){
      if (err) {
        return callback(err);
      }
      return r.model.create(data, callback);
    });
  }
  r.method('create', create, { input: r.schema.properties });
};
