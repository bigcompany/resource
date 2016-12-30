module['exports'] = function (r) {
  function destroy (id, callback){
    if(typeof id === 'object' && typeof id.id !== 'undefined') {
      id = id.id
    }
    if (typeof id === "undefined") {
      return callback(new Error('`id` is a required parameter!'))
    }
    r.model.find(id, function(err, result){
      if (err) {
        return callback(err);
      }
      if (result === null) {
        return callback(new Error(id + ' not found'));
      }
      result.destroy(function(err, res){
        callback(null, result);
      });
    });
  }
  r.method('destroy', destroy);
}