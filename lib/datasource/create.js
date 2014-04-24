module['exports'] = function (r) {
  function create (data, callback) {
    if (r.schema.properties.ctime) {
      data.ctime = Date.now();
    }
    if (r.schema.properties.mtime) {
      data.mtime = Date.now();
    }
    return r.model.create(data, callback);
  }
  r.method('create', create, { input: r.schema.properties });
};
