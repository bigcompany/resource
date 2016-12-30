module['exports'] = function (r) {
  //
  // Find method
  //
  function findOne (query, callback) {
    r.find(query, function (err, items) {
      if (err) {
        return callback(err);
      }
      if (items.length === 0) {
        return callback(new Error('not found'))
      }
      if (items.length > 1) {
        console.log('WARNING: found too many items for findOne association ' + JSON.stringify(query, true, 2))
        //return callback(null, items[0])
      }
      return callback(null, items[0])
    });
  }

  r.method('findOne', findOne);

};