var uuid = require('node-uuid');

module['exports'] = function (r) {
  //
  // CREATE method
  //
  function create (data, callback) {
    //
    // If no id is specified, create one using node-uuid
    //
    if(typeof data.id === 'undefined' || data.id.length === 0) {
      data.id = uuid();
    }

    //
    // JugglingDB's "create" method can act like a "create or update"
    // depending on the adapter, even though JugglingDB has a separate code
    // path for "createOrUpdate" (for example, the cradle adapter has this
    // behavior). So, we use our internal "get" function to ensure that it does
    // not already exist.
    //
    
    r.model.find(data.id, function(err, result){
      if (result.length === 0) {
        return r.model.create(data, callback);
      }
      //
      // If the ID is not available, continue with error and existing result
      //
      console.log(result)
      return callback(new Error(result.id + ' already exists'), result);

    });
    return;
  }
  // console.log(r.schema.properties)
  r.method('create', create, r.schema.properties);
};
