module['exports'] = function (r) {

  //
  // All method
  //

  function all (callback) {
    r.model.all({}, callback);
  }

  r.method('all', all);
  
};


return;
var resource = require('resource'),
    uuid = resource.resources.persistence.uuid;

module['exports'] = function (r) {
  //
  // Attach the CRUD methods to the resource
  //




  return r;
};
