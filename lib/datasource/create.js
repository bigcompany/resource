module['exports'] = function (r) {
  function create (data, callback) {
    return r.model.create(data, callback);
  }
  r.method('create', create, { input: r.schema.properties });
};
