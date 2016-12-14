module['exports'] = function (r) {

  //
  // Get method
  //
  function get (id, callback){
    if(typeof id === 'object' && typeof id.id !== 'undefined') {
      id = id.id
    }
    if (typeof id === "undefined") {
      return callback(new Error('`id` is a required parameter!'))
    }
    r.model.find(id, function(err, result){
      if(result === null) {
        return callback(new Error(id + ' not found'));
      }
      // TODO: check if any of the fields are keys, if so, fetch them
      callback(err, result);
    });
  }
  r.method('get', get);
};

// {revs_info: true}