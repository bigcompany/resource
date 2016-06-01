module['exports'] = function (r) {
  //
  // Update method
  //
  function update (options, callback) {
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

      if (r.schema.properties.mtime) {
        options.mtime = Date.now();
      }

      if (r.schema.properties.ctime) {
        options.ctime = result.ctime;
      }

      for (var param in options) {
        if (param !== 'id') {
          result[param] = options[param];
        }
      }

      result.save(function(err, updated){
        if(err) {
          return callback(err);
        }
        callback(null, updated);
      });
    });
  }
  r.method('update', update);
}