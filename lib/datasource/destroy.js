module['exports'] = function (r) {
  function destroy (id, callback){
    console.log('find', id)
    r.model.find({ id: id }, function(err, result){
      if (err) {
        return callback(err);
      }
      result[0].destroy(function(err, res){
        console.log('aa',err, res)
        callback(null, null);
      });
    });
  }
  r.method('destroy', destroy);
}