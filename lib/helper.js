var helper = exports;

//
// Creates a "safe" non-circular JSON object for easy stringification purposes
//
var toJSON = helper.toJSON = function (r) {

  if (typeof r === 'undefined') {
    throw new Error('resource is a required argument');
  }

  var obj = {
    name: r.name,
    schema: r.schema,
    methods: methods(r)
  };

  function methods(r) {
    var obj = {};
    for (var m in r.methods) {
      obj[m] = r.methods[m].schema;
    }
    return obj;
  }

  return obj;
};
