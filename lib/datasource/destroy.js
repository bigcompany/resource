module['exports'] = function (r) {
  function destroy (id, callback){
    // TODO: handle conflicts. Perhaps make them a first-class citizen?
    r.get(id, function(err, result){
      if (err) {
        return callback(err);
      }
      if (result === null) {
        return callback(new Error(id + ' not found'));
      }
      r.db.destroy(id, result._rev, function(err, res){
        callback(null, null);
      });
    });
  }
  r.method('destroy', destroy);
}
