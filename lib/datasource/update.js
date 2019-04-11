module['exports'] = function (r) {
  //
  // Update method
  //
  function update (data, callback) {
    //
    // JugglingDB does not have a strict update and instead has
    // updateOrCreate, so do a get first and act accordingly
    //
    r.get(data.id, function (err, result) {
      if (err) {
        //
        // Unlike the case with strict create, "not found" errors mean we are
        // unable to do an update
        //
        return callback(err);
      }

      if (r.schema.properties.mtime) {
        data.mtime = Date.now();
      }

      if (r.schema.properties.ctime) {
        data.ctime = result.ctime;
      }

      if (r.strictProperties === true) {
        for (var key in r.schema.properties) {
          if (key !== 'id') {
            if (data[key]) {
              result[key] = data[key];
            }
          }
        }
      } else {
        for (var param in data) {
          if (param !== 'id') {
            result[param] = data[param];
          }
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