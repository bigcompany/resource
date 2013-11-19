module['exports'] = function (r) {

  //
  // Get method
  //
  function get (id, callback){
    // TODO: .all is now broken in fs adapter
    // NOTE: JugglingDB.find is really resource.get
    // NOTE: resource.get is JugglingDB.all with a filter
    r.model.find({ id: id }, function(err, result){
      if(result === null) {
        return callback(new Error(id + ' not found'));
      }
      // TODO: check if any of the fields are keys, if so, fetch them
      callback(err, result[0]);
    });
  }

  r.method('get', get);

};