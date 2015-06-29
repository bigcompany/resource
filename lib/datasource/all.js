module['exports'] = function (r) {
  function all (options, callback) {
    r.model.all({}, callback);
  }
  r.method('all', all);
};