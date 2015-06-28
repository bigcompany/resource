/*
  checkUniqueKey.js
  Checks if any properties of a resource require a uniqueness check against the datasource
*/

module['exports'] = function checkUniqueKey (r, data, cb) {
    var callbacks = 0, 
        checkUnique = false, 
        errors = [];
    var properties = r.schema.properties;
    for (var p in properties) {
      if (properties[p].unique === true) {
        checkUnique = true;
        callbacks++;
        var query = {};
        query[p] = data[p];
        (function (p) {
          r.find(query, function (err, res){
            callbacks--;
            if (err) { 
              // should not error here
              return cb(err); 
            }
            if (res === null || res.length === 0) {
              // no records found that violate uniqueness, do nothing
            } else {
              if (res[0].id !== data.id) {
                errors.push({ property: p, value: data[p]});
              }
            }
            if (callbacks === 0) {
              if (errors.length > 0) {
                return cb(new Error("unique key constraint has failed. " + JSON.stringify(errors)));
              } else {
                return cb(null, data);
              }
            } 
          });
        }(p));
      }
    }
    // no properties on the resource are unique, do not perform any datasource hits
    if (checkUnique === false) {
      return cb(null, data);
    }
};