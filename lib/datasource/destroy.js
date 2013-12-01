module['exports'] = function (r) {
  function destroy (id, callback){
    if(typeof id === 'object' && typeof id.id !== 'undefined') {
      id = id.id
    }
    r.model.find(id, function(err, result){
      if (err) {
        return callback(err);
      }
      if (result === null) {
        return callback(new Error(id + ' not found'));
      }
      result.destroy(function(err, res){
        console.log('aa',err, res)
        callback(null, null);
      });
    });
  }
  r.method('destroy', destroy);
}