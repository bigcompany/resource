module['exports'] = function (r) {

  //
  // Find method
  //
  function find (query, callback) {
    //
    // Remove any empty values from the query
    //
    for(var k in query) {
      if(typeof query[k] === "undefined" || query[k].length === 0) {
        delete query[k];
      }
    }

    var params = {};

    if (query.limit) {
      params.limit = query.limit;
      delete query.limit;
    }

    if (query.order) {
      params.order = query.order;
      delete query.order;
    }

    if (Object.keys(query).length > 0) {
      params.where = query;
    }

    r.model.all(params, function(err, results){
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