var checkUniqueKey = require('./checkUniqueKey');

module['exports'] = function (r) {
  function create (data, callback) {
    if (r.schema.properties.ctime) {
      data.ctime = Date.now();
    }
    if (r.schema.properties.mtime) {
      data.mtime = Date.now();
    }
    var filtered = {};
    if (r.strictProperties === true) {
      for (var key in r.schema.properties) {
        filtered[key] = data[key];
      }
    } else {
      filtered = data;
    }
    checkUniqueKey(r, filtered, function (err, _data){
      if (err) {
        return callback(err);
      }
      return r.model.create(filtered, callback);
    });
  }
  r.method('create', create, { input: r.schema.properties });
};
