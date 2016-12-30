module['exports'] = function (r) {
  
  //
  // Update or create
  //
  function updateOrCreate (options, callback) {

    r.get(options.id, function(err, record){
      if (err) {
        r.create(options, callback);
      } else {
        for (var p in options) {
          record[p] = options[p];
        }
        record.save(callback);
      }
    });

  }
  r.method('updateOrCreate', updateOrCreate);
  
}