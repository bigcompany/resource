module['exports'] = function (r) {
  //
  // Update method
  //
  function update (options, callback){
    //
    // JugglingDB does not have a strict update and instead has
    // updateOrCreate, so do a get first and act accordingly
    //
    r.get(options.id, function (err, result) {
      if (err) {
        //
        // Unlike the case with strict create, "not found" errors mean we are
        // unable to do an update
        //
        return callback(err);
      }
      r.model.updateOrCreate(options, function(err, updated){
        if(err) {
          return callback(err);
        }
        r.get(options.id, callback);
      });
    });
  }
  r.method('update', update);
}