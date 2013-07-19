var helper = exports;

//
// Determine the root folder of the user's application
//
var appDir = helper.appDir = (function () {
  var path = require('path'),
      fs = require('fs'),
      p = process.cwd();

  //
  // If we're in the repl, use process.cwd
  //
  if (!process.mainModule) {
    return p;
  }

  //
  // This is a list of the paths node looks through when resolving modules,
  // they should be in order of precedence.
  //
  process.mainModule.paths.some(function (q) {
    if (fs.existsSync(path.resolve(q, 'resource'))) {
      p = path.resolve(q, '..');
      // short circuit
      return true;
    }
  });

  return p;

})();

//
// Determines if a string path is a valid resource
// Returns either true or false
//
var isResource = helper.isResource = function (val) {
  var fs = require('fs'),
      path = require('path'),
      result = false;

  try {
    var isDir = fs.statSync(path.join(val)).isDirectory(),
        isFile = false;
    if (isDir) {
      isFile = fs.statSync(path.join(val, 'index.js')).isFile;
    }
    result =  isDir && isFile;
  }
  catch (err) {
    if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') {
      throw err;
    }
  }
  return result;
}

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

//
// Creates a new instance of a schema based on default data as arguments array
//
var instantiate = helper.instantiate = function instantiate (schema, levelData) {
  var obj = {};

  levelData = levelData || {};
  if (typeof schema.properties === 'undefined') {
    return obj;
  }

  Object.keys(schema.properties).forEach(function (prop, i) {
    if (schema.properties[prop].type === 'object') {
      if (typeof schema.properties[prop].default === 'object') {
        obj[prop] = {};
        for (var p in schema.properties[prop].default) {
          obj[prop][p] = schema.properties[prop].default[p];
        }
      }
    } else if (schema.properties[prop].type === 'array') {
      obj[prop] = [];
      if (typeof schema.properties[prop].default !== 'undefined') {
        schema.properties[prop].default.forEach(function (item) {
          obj[prop].push(item);
        });
      }
    } else if (schema.properties[prop].type === 'boolean') {
      if (schema.properties[prop].default === true) {
        obj[prop] = true;
      } else {
        obj[prop] = false;
      }
      if (typeof levelData[prop] !== 'undefined') {
        if (levelData[prop] !== 'false' && levelData[prop] !== false) {
          levelData[prop] = true;
        }
      }
    } else if (schema.properties[prop].type === 'number') {
      if (typeof levelData[prop] === 'undefined') {
        levelData[prop] = schema.properties[prop].default;
      }
      var numbery = parseFloat(levelData[prop], 10);
      if (numbery.toString() !== 'NaN') {
        levelData[prop] = numbery;
      }
    }
    else {
      obj[prop] = schema.properties[prop].default || '';
    }

    if (typeof levelData[prop] !== 'undefined') {
      obj[prop] = levelData[prop];
    }

    if (typeof schema.properties[prop].properties === 'object') {
      obj[prop] = instantiate(schema.properties[prop], levelData[prop]);
    }

  });

  return obj;

};


//
// Special helper method for invoking resource methods from various interfaces
// In most cases, you will never call resource.helper.invoke()
//
// resource.helper.invoke() is useful when dealing with situations where you have arguments data for a resource method,
// but are not sure of the resource methods arguments schema.
//
// It's also useful for invoking sync resource methods from async interfaces such as,
// calling a method that returns a value from an HTTP interface ( which expects a continued value to respond with )
//
//

var invoke = helper.invoke = function invoke (method, data, callback) {

  var result;
  //
  // If any data was passed in
  //
  if (typeof data === 'object') {

    //
    // If an options hash is expected as part of the resource method schema
    //
    if (method.schema.properties.options) {
      result = method.call(this, data, callback);
    } else {
      //
      // If no options hash is expected, curry the arguments left to right into an array
      //
      var args = [];
      for (var p in method.schema.properties) {
        if (data[p]) {
          args.push(data[p]);
        }
      }
      args.push(callback);
      result = method.apply(this, args);
    }
  } else if (typeof data !== 'undefined') {
    result = method.call(this, data, callback);
  }
  else {
    //
    // No data was passed in, execute the resource method with no data
    //
    result = method.call(this, callback);
  }

  //
  // Remark: If the resource method returns a value this indicates method is sync,
  // and that the continuation must be manually called with no error condition
  //
  if (typeof result !== 'undefined') {
    return callback(null, result);
  }

};
