module['exports'] = function (r) {

  //
  // Find method
  //
  function find (query, callback) {
    //
    // Remove any empty values from the query
    //
    for(var k in query) {
      if(query[k].length === 0) {
        delete query[k];
      }
    }

    r.model.all({ where: query }, function(err, results){
      if (!Array.isArray(results)) {
        results = [results];
      }
      callback(err, results);
    });
  }

  var querySchema = {
    properties: {}
  }
  
  Object.keys(r.schema.properties).forEach(function(prop){
    if(typeof r.schema.properties[prop] === 'object') {
      querySchema.properties[prop] = {};
      for (var p in r.schema.properties[prop]) {
        querySchema.properties[prop][p] = r.schema.properties[prop][p];
      }
    } else {
      querySchema.properties[prop] = r.schema.properties[prop] || {};
    }
    querySchema.properties[prop].default = "";
    querySchema.properties[prop].required = false;
    //
    // TODO: remove the following two lines and make enum search work correctly
    //
    querySchema.properties[prop].type = "any";
    delete querySchema.properties[prop].enum;
    delete querySchema.properties[prop].format;
  });

  r.method('find', find);

};