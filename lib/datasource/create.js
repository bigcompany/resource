module['exports'] = function (r) {
  function create (data, callback) {
    if (r.schema.properties.ctime) {
      data.ctime = Date.now();
    }
    if (r.schema.properties.mtime) {
      data.mtime = Date.now();
    }
    r.db.insert(data, function (err, result) {
      if (err) {
        return callback(err);
      }

      data.id = result.id;
      callback(null, data);
    });
  }
  r.method('create', create, { input: r.schema.properties });
};
