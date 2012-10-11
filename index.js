//
// resource.js - resource module for node.js
//

//
// Create a resource singleton
//
var resource = {};

var EventEmitter = require('eventemitter2').EventEmitter2;

resource = new EventEmitter({
  wildcard: true, // event emitter should use wildcards ( * )
  delimiter: '::', // the delimiter used to segment namespaces
  maxListeners: 20, // the max number of listeners that can be assigned to an event
});

//
// Require a simple JSON-Schema validator
//
var validator = require('./validator');

var uuid = require('node-uuid');

//
// On the resource, create a "resources" object that will store a reference to every defined resource
//
resource.resources = {};

//
// Use a resource by string name
//
resource.use = function (r, options) {

  var self = this;

  //
  // Load the resource as a node.js module
  //
  var _r = resource.load(r);

  //
  // If the required resource doesn't have the expected exported scope,
  // throw a friendly error message
  //
  if (typeof _r[r] === 'undefined') {
    throw new Error("exports." + r + " is not defined in the " + r + ' resource!')
  }

  //
  // Determine if a exports.dependencies hash has been specified,
  // if so, determine if there are any missing deps that will need to be installed
  //
  if (typeof _r.dependencies === 'object') {
    resource.installDeps( _r.dependencies);
  }

  //
  // Attach a copy of the resource to "this" scope ( which may or may not be the resource module scope )
  //
  this[r] = _r[r];
  this[r].name = r;
  this[r].dependencies = _r.dependencies || {};

  //
  // Certain method names are considered "special" and will automatically be,
  // hoisted and aggregated into common event handler
  //
  // ex: "start", "listen", "connect"
  //
  hoistMethods(this[r], self);

  //
  // Any options passed into resource.use('foo', options),
  // will be considered configuration options, and bound to resource.config
  //
  this[r].config = options || {};

  //
  // Attach a copy of the resource to the resource module scope for later reference
  //
  resource[r] = _r[r];
  resource.resources[r] = this[r];

  //
  // If a database configuration has been specified, attach CRUD methods to resource.
  // This adds methods such as Resource.create / Resource.get.
  // With a datasource specification, resources can persist.
  // Persisting resources requires an additional dependency of "jugglingdb"
  // see: github.com/1602/jugglingdb
  //
  if (typeof this[r].config.datasource !== 'undefined') {
    crud(this[r], this[r].config.datasource);
  }

  return this[r];

};

//
// Load a resource module by string name
//
resource.load = function (r, callback) {
  var result;
  try {
    var p = require.resolve('resources');
    p = p.replace('/index.js', '/');
    p += r;
    result = require(p);
  } catch (err) {
    throw err;
    try {
      result = require(r);
    } catch (err) {
      throw err;
    }
  }
  return result;
};

//
// Will eventually be renamed and replace resource.define
//
resource.define = function (name, options) {

  //
  // Create an empty resource object
  //
  var r = {};

  options = options || {};

  //
  // Initalize the resource with default values
  //
  r.name = name;
  r.methods = {};
  r.schema = options.schema || {
    "description": "",
    "properties": {
      "id": {
        "type": "any"
      }
    }
  };

  //
  // If any additional configuration data has been passed in, assign it to the resource
  //
  r.config = options.config || {};

  //
  // Give the resource a property() method for defining properties
  //
  r.property = function (name, schema) {
    addProperty(r, name, schema);
  };

  //
  // Give the resource a method() method for defining methods
  //
  r.method = function (name, method, schema) {
    if (typeof method !== 'function') {
      throw new Error('a function is required as the second argument');
    }
    addMethod(r, name, method, schema);
  };

  //
  // Give the resource a .before() method for defining before hooks on resource methods
  //
  r.before = function (method, callback) {
    //
    // If no method exists on the resource yet create a place holder,
    // in order to be able to lazily define hooks on methods that dont exist yet
    //
    if(typeof r.methods[method] !== 'function') {
      r.methods[method] = function () {};
      r.methods[method].before = [];
      r.methods[method]._before = [];
    }
    //
    // method exists on resource, push this new hook callback
    //
    r.methods[method].before.unshift(callback);
    r.methods[method]._before.unshift(callback);
  };

  // TODO: create after hooks
  r.after = function (method, callback) {};

  if (typeof r.config.datasource !== 'undefined') {
    crud(r, r.config.datasource);
  }


  //
  // Attach a copy of the resource to the resources scope ( for later reference )
  //
  resource.resources[name] = r;

  //
  // Return the new resource
  //
  return r;

};

//
// Provider API mapping for JugglingDB to datasource API for convenience
//
var mappings = {
  "couch": "cradle",
  "couchdb": "cradle"
};

//
// Set "currently installing module count" to 0
//
resource.installing = 0;

//
// Installs missing deps
//
resource.installDeps = function (deps) {

  //
  // TODO: make this work with remote files as well as local
  //
  var _command = ["install"];

  Object.keys(deps).forEach(function(dep){
    var resourcePath;
    resource.installing++;

    //
    // Check to see if the dep is available
    //
    resourcePath = require.resolve('resources');
    resourcePath = resourcePath.replace('/index.js', '/node_modules/');
    resourcePath += dep;
    try {
      require.resolve(resourcePath);
      resource.installing--;
      //console.log('using dependency:', dep);
    } catch (err) {
      console.log('missing dependency:', dep);
      _command.push(dep);
    }
  });

  if(_command.length === 1) {
    return;
  }

  // _command.push('--color', "false");


  var home = require.resolve('resources');
  home = home.replace('/index.js', '/');

  //
  // Spawn npm as child process to perform installation
  //
  console.log('about to run npm ' + _command, 'at', home);
  var spawn = require('child_process').spawn,
      npm    = spawn('npm', _command, { cwd: home });

  npm.stdout.on('data', function (data) {
    //process.stdout.write(data);
  });

  npm.stderr.on('data', function (data) {
    process.stderr.write(data);
  });

  npm.on('exit', function (code) {
    //console.log('child process exited with code ' + code);
    resource.installing--;
    if(resource.installing === 0) {
      for(var m in resource._queue){
        //console.log('done installing, running commands')
        resource._queue[m]();
      }
    }
  });
};

//
// Creates a new instance of a schema based on default data as arguments array
//
var instantiate = resource.instantiate = function (schema, levelData) {
  var obj = {};

  levelData = levelData || {};

  if(typeof schema.properties === 'undefined') {
    return obj;
  }

  Object.keys(schema.properties).forEach(function(prop, i){

    if (typeof schema.properties[prop].default !== 'undefined') {
      obj[prop] = schema.properties[prop].default;
    }

    if (typeof levelData[prop] !== 'undefined') {
      obj[prop] = levelData[prop];
    }

    if (typeof schema.properties[prop].properties === 'object') {
      obj[prop] = instantiate(schema.properties[prop], levelData[prop]);
    }

  });

  return obj;
}

//
// Extends a resource with CRUD methods by,
// creating a JugglingDB model to back the resource,
// allowing the resource to be instantiable and backed by a datasource
//
function crud (r, options) {

  if(typeof options === "string") {
    options = {
      type: options
    };
  }

  //
  // Require JugglingDB.Schema
  //
  var Schema = require('jugglingdb').Schema;

  //
  // Create new JugglingDB schema, based on incoming datasource type
  //
  var _type = mappings[options.type] || options.type || 'fs';
  var schema = new Schema(_type, {
    database: "big",
    host: options.host,
    port: options.port,
    path: options.path,
    username: options.username,
    password: options.password,
    https: true // TODO: check that HTTPS actually does something
  });

  //
  // Create empty schema object for mapping between resource and JugglingDB
  //
  var _schema = {};

  //
  // For every property in the resource schema, map the property to JugglingDB
  //
  Object.keys(r.schema.properties).forEach(function(p){
    var prop = resource.schema.properties[p];
    //
    // TODO: Better type detection
    //
    _schema[p] = { type: String }; // TODO: not everything is a string
  });

  //
  // Create a new JugglingDB schema based on temp schema
  //
  var Model = schema.define(r.name, _schema);
  // TODO: map all JugglingDB crud methods
  // TODO: create before / after hook methods
  // TOOD: map resource methods back onto returned JugglingDB models scoped with primary key ( for convience )

  //
  // Attach the CRUD methods to the resource
  //

  //
  // CREATE method
  //
  function create (data, callback) {
    //
    // If no id is specified, create one using node-uuid
    //
    if(typeof data.id === 'undefined' || data.id.length === 0) {
      data.id = uuid();
    }
    Model.create(data, callback);
  }
  r.method('create', create, {
    "description": "create a new " + r.name,
    "properties": {
      "options": {
        "type": "object",
        "properties": r.schema.properties
      },
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // Get method
  //
  function get (id, callback){
    // TODO: .all is now broken in fs adapter
    // NOTE: JugglingDB.find is really resource.get
    // NOTE: resource.get is JugglingDB.all with a filter
    Model.find(id, function(err, result){
      if(result === null) {
        return callback(new Error(id + ' not found'));
      }
      // TODO: check if any of the fields are keys, if so, fetch them
      callback(err, result);
    });
  }
  r.method('get', get, {
    "description": "get " + r.name +  " by id",
    "properties": {
      "id": {
        "type": "any",
        "description": "the id of the object",
        "required": true
      },
      "callback": {
        "type": "function"
      }
    }
  });

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
    Model.all(query, function(err, results){
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
      querySchema.properties[prop] = r.schema.properties[prop];
    }
    querySchema.properties[prop].default = "";
    querySchema.properties[prop].required = false;
    //
    // TODO: remove the following two lines and make enum search work correctly
    //
    querySchema.properties[prop].type = "any";
    delete querySchema.properties[prop].enum;
  });

  r.method('find', find, {
    "description": "search for instances of " + r.name,
    "properties": {
      "options": {
        "type": "object",
        "properties": querySchema.properties
      },
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // All method
  //
  function all (callback) {
    Model.all({}, callback);
  }

  r.method('all', all, {
    "description": "gets all instances of " + r.name,
    "properties": {
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // Update method
  //
  function update (options, callback){
    Model.updateOrCreate(options, callback);
  }
  r.method('update', update, {
    "description": "updates a " + r.name + " by id",
    "properties": {
      "options": {
        "type": "object",
        "properties": r.schema.properties
      },
      "callback": {
        "type": "function"
      }
    }
  });

  //
  // Destroy method
  //
  function destroy (id, callback){
    Model.find(id, function(err, result){
      if (err) {
        return callback(err);
      }
      result.destroy(function(){
        callback(null, null);
      });
    });
  }
  r.method('destroy', destroy, {
    "description": "destroys a " + r.name + " by id",
    "properties": {
      "id": {
        "type": "any",
        "description": "the id of the object",
        "required": true
      },
      "callback": {
        "type": "function"
      }
    }
  });

  // assign model to resource
  r.model = Model;
}


//
// Attachs a method onto a resources as a named function with optional schema and tap
//
function addMethod (r, name, method, schema, tap) {

  schema = schema || {};

  if (typeof schema.description === 'undefined') {
    schema.description = "";
  }

  //
  // Create a new method that will act as a wrap for the passed in "method"
  //
  var fn = function () {

    var args  = Array.prototype.slice.call(arguments),
        _args = [];

    var payload = [],
        callback = args[args.length -1];

    //
    // Check for any before hooks,
    // if they exist, execute them in LIFO order
    //
    if(Array.isArray(fn._before) && fn._before.length > 0) {
      var before = fn._before.pop();
      before(args[0], function(err, data){
        fn.apply(this, [data, callback]);
      });
      return;
    }

    //
    // After all the hooks complete, repopulate the internal fn._before array
    //
    fn.before.forEach(function(b){
      fn._before.push(b);
    })

    //
    // Inside this method, we must take into account any schema,
    // which has been defined with the method signature and validate against it
    //
    if (typeof schema === 'object') {

      var _instance = {},
          _data = {};

      //
      //  Merge in arguments data based on supplied schema
      //
      //
      //  If the the schema has a "properties" property, assume the convention of,
      //  schema property order to function arguments array order
      //
      // Ex:
      //
      //    The following schema:
      //
      //       { properties : { "options" : { "type": "object" }, "callback" : { "type": "function" } } }
      //
      //    Maps to the following method signature:
      //
      //       function(options, callback)
      //
      //    With this association:
      //
      //       properties.options  = arguments['0']
      //       properties.callback = arguments['1']
      //
      //

      if (typeof schema.properties === "object" && typeof schema.properties.options === "object") {
        _data.options = args[0]
      }

      if (typeof schema.properties === "object" && typeof schema.properties.options === "undefined") {
        Object.keys(schema.properties).forEach(function(prop,i){
          _data[prop] = args[i];
        });
      }

      //
      // Create a new schema instance with default values, mixed in with supplied arguments data
      //
      _instance = resource.instantiate(schema, _data);

      //
      // Perform a schema validation on the new instance to ensure validity
      //
      var validate = validator.validate(_instance, schema);

      //
      // If the schema validation fails, do not fire the wrapped method
      //
      if (!validate.valid) {
        if (typeof callback === 'function') {
          //
          // If a valid callback was provided, continue with the error
          //
          return callback({ errors: validate.errors });
        } else {
          //
          // If there is no valid callback, throw an error ( for now )
          //
          var err = new Error('invalid');
          err.errors = validate.errors;
          throw err;
        }
      }

      //
      // The schema validation passed, prepare method for execution
      //

      //
      // Convert schema data back into arguments array
      //
      Object.keys(_instance).forEach(function(item){
        _args.push(_instance[item]);
      });

      //
      // Check to see if a callback was expected, but not provided.
      //

      if(typeof schema.properties === 'object' && typeof schema.properties.callback === 'object' && typeof callback === 'undefined') {
        //
        // If so, create a "dummy" callback so _method() won't crash
        //
        callback = function (err, result) {

          //
          // In the "dummy" callback, add a throw handler for errors,
          // so that any possible async error won't die silently
          //
          if (err) {
            throw err;
          }
          //
          // Since a method that expected a callback, was called without a callback,
          // nothing is done with the result.
          //
          // console.log(result);
          //
        };

      }

      //
      // Check to see if the last supplied argument was a function.
      // If so, it is assumed the method signature follows the node.js,
      // convention of the last argument being a callback andd will be added to the end of the array
      //
      if(typeof callback === 'function') {
        _args.push(callback);
      }

    } else {
      _args = args;
    }

    //
    // Everything seems okay, execute the method with the modified arguments
    //
    return method.apply(this, _args);
  };

  // store the schema on the fn for later reference
  fn.schema = schema;

  // store the original method on the fn for later reference ( useful for documentation purposes )
  fn.unwrapped = method;

  // store the name of the method, on the method ( for later reference )
  fn.name = name;

  // placeholders for before and after hooks
  fn.before = [];
  fn._before = [];

  //
  // If the method about to be defined, already has a stub containing hooks,
  // copy those hooks to the newly defined fn that is about to be created
  // These previous stubs will then be overwritten.
  // This is used to allow the ability to define hooks on,
  // lazily defined resource methods
  //
  if(typeof r.methods[name] !== 'undefined') {
    if (Array.isArray(r.methods[name].before)){
      r.methods[name].before.forEach(function(b){
        fn.before.push(b);
        fn._before.push(b);
      });
    }
  }

  //
  // The method is bound onto the "methods" property of the resource
  //
  r.methods[name] = fn;

  //
  // The method is also bound directly onto the resource
  //
  // TODO: add warning / check for override of existing method if r[name] already exists as a function
  r[name] = fn;

}

function addProperty (r, name, schema) {
  r.schema.properties[name] = schema;
  //
  // When adding new properties to a resource,
  // create an updated JugglingDB Model
  //
  if (typeof r.config.datasource !== 'undefined') {
    crud(r, r.config.datasource);
  }
}

resource._queue = [];

//
// Aggregates and hoists any "special" defined methods, such as "start", "listen", "connect", etc...
//
function hoistMethods (r, self) {
  //
  // Check for special methods to get hoisted onto big
  //
  var hoist = ['start', 'connect', 'listen']; // TODO: un-hardcode configurable hoist methods
  for (var m in r.methods) {
    if (typeof r.methods[m] === 'function' && hoist.indexOf(m) !== -1) {
      function queue (m) {
        if(typeof self['_' + m] === "undefined") {
          self['_' + m] = [];
          self[m] = function (options, callback) {
            // TODO: async iterator
            // TODO: un-hardcode options/callback signature
            self['_' + m].forEach(function(fn){
              if(typeof options === "function") { // no options sent, just callback
                callback = options;
                options = r.config || {};
              }
              if(resource.installing > 0) {
                resource._queue.push(function(){
                  fn(options, callback);
                });
              } else {
                fn(options, callback);
              }
            });
          };
        }
        self['_' + m].push(r.methods[m]);
      }
      queue(m);
    }
  }
}

//
// Creates a "safe" non-circular JSON object for easy stringification purposes
//
resource.toJSON = function (r) {

  if (typeof r === 'undefined') {
    throw new Error('resource is a required argument');
  }

  var obj = {
    name: r.name,
    schema: r.schema,
    methods: methods(r)
  }

  function methods (r) {
    var obj = {};
    for(var m in r.methods) {
      obj[m] = r.methods[m].schema
    }
    return obj;
  }

  return obj;
};

resource.schema = {
  properties: {}
};

resource.methods = [];
resource.name = "resource";


// TODO: add check for exports.dependencies requirements
module['exports'] = resource;