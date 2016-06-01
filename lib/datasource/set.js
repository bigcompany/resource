module['exports'] = function set (r) {
  function set (data, callback) {
    if (r.schema.properties.ctime) {
      data.ctime = Date.now();
    }
    if (r.schema.properties.mtime) {
      data.mtime = Date.now();
    }
    return r.model.updateOrCreate(data, callback);
  }
  r.method('set', set);
};
