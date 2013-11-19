module['exports'] = function (r) {
  
  //
  // Update or create
  //
  function updateOrCreate (options, callback) {
    if(typeof options.id === 'undefined' || options.id.length === 0) {
      options.id = uuid();
    }

    get(options.id, function(err, record){
      if (err) {
        r.model.create(options, callback);
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