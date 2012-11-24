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

var uuid   = resource.uuid   = require('node-uuid');
var helper = resource.helper = require('./lib/helper');
var logger = resource.logger = require('./lib/logger');

resource.installing = {};
resource._queue = [];

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

  _r.name = r;

  //
  // Determine if a exports.dependencies hash has been specified,
  // if so, determine if there are any missing deps that will need to be installed
  //
  if (typeof _r.dependencies === 'object') {
    resource.installDeps(_r);
  }

  //
  // Attach a copy of the resource to "this" scope ( which may or may not be the resource module scope )
  //
  this[r] = _r[r];
  this[r].dependencies = _r.dependencies || {};

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
resource.load = function (r) {

  //
  // TODO: Check DIRNAME before checking process.cwd()
  //

  //
  // Check to see if the resource exists in the $CWD/resources/ path
  //
  try {
    require.resolve(process.cwd() + '/resources/' + r)
    //
    // If so, require it
    //
    result = require(process.cwd() + '/resources/' + r);
  } catch (err) {
    //
    // If not, check to see if the resource exists in "resources" package on npm
    //

    //
    // Attempt to resolve "resources"
    //
    var p = require.resolve('resources');
    p = p.replace('/index.js', '/');
    p += r;
    try {
      require.resolve(p);
    } catch (err) {
      //
      // Resource was not found in $CWD/resources/ or in the "resources" npm package
      //
      throw new Error('invalid resource' + p);
    }

    //
    // Since the resource was found in the "resources" package, copy it to $CWD/resources
    //
    try {
      require('fs').mkdirSync('./resources/');
      // TODO: add more content to this README file
      require('fs').writeFileSync('./resources/README.md', '# Resources Readme');
    } catch (err) {
      // do nothing
    }

    try {
      require('fs').mkdirSync('./resources/'+ r);
    } catch (err) {
      // do nothing
    }
    logger.info('installing ' + r.magenta + ' to ' + process.cwd() + '/' + r)

    //
    // Perform a sync directory copy from node_modules folder to CWD
    //
    helper.copyDir(p, process.cwd() + '/resources/' + r);

    //
    // Copy the contents of  /resources/theresource/ to $CWD/resources/theresource
    //
    result = require(p);
  }

  return result;
};

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
      r.methods[method].after = [];
      r.methods[method]._after = [];
    }
    //
    // method exists on resource, push this new hook callback
    //
    r.methods[method].before.unshift(callback);
    r.methods[method]._before.unshift(callback);
  };

  r.after = function (method, callback) {
    //
    // If no method exists on the resource yet create a place holder,
    // in order to be able to lazily define hooks on methods that dont exist yet
    //
    if(typeof r.methods[method] !== 'function') {
      r.methods[method] = function () {};
      r.methods[method].before = [];
      r.methods[method]._before = [];
      r.methods[method].after = [];
      r.methods[method]._after = [];
    }
    //
    // method exists on resource, push this new hook callback
    //
    r.methods[method].after.push(callback);
    r.methods[method]._after.push(callback);
  };

  if (typeof r.config.datasource !== 'undefined') {
    r.schema.properties.id = {
      "type": "any"
    };
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

resource._before = [];
resource.before = [];

//
// For attaching module-scoped Resource.before hooks onto all resources.
// This differs from calling .before on a resource instance such as creature.before('create'),
// in that resource.beforeAll(fn) hooks will execute before all resource methods
//
resource.beforeAll = function (callback) {
  //
  // Method exists on resource, push this new hook callback
  //
  resource.before.unshift(callback);
  resource._before.unshift(callback);
};

//
// Installs missing deps
//
resource.installDeps = function (r) {

  //
  // TODO: make this work with remote files as well as local
  //
  var _command = ["install"];

  Object.keys(r.dependencies).forEach(function(dep){
    var resourcePath;

    //
    // Check to see if the dep is available
    //
    resourcePath = process.cwd() + '/node_modules/';
    resourcePath += dep;
    try {
      require.resolve(resourcePath);
      //console.log('using dependency:', dep);
    } catch (err) {
      logger.warn(r.name + ' resource is missing a required dependency: ' + dep)
      // TODO: check to see if dep is already in the process of being installed,
      // if so, don't attempt to install it twice
      if (typeof resource.installing[dep] === 'undefined') {
        resource.installing[dep] = {};
        _command.push(dep);
      }
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
  logger.warn('spawning npm to install missing dependencies')
  logger.exec('npm ' + _command.join(' '));

  var spawn = require('child_process').spawn,
      npm    = spawn('npm', _command, { cwd: process.cwd() });

  npm.stdout.on('data', function (data) {
    process.stdout.write(data);
  });

  npm.stderr.on('data', function (data) {
    process.stderr.write(data);
  });

  npm.on('error', function(){
    logger.error('npm installation error!');
    process.exit();
  });

  npm.on('exit', function (code) {
    _command.forEach(function(c, i){
      if(i !== 0) { // the first command is "install"
        delete resource.installing[c];
      }
    });
    if(Object.keys(resource.installing).length === 0) {
      logger.info('npm installation complete');
      logger.warn('now executing ' + resource._queue.length + ' defferred call(s)');
      for(var m in resource._queue){
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

  //
  // Create a new method that will act as a wrap for the passed in "method"
  //
  var fn = function () {
    var args  = Array.prototype.slice.call(arguments),
        _args = [];

    var payload = [],
        callback = args[args.length -1];

    if(Object.keys(resource.installing).length > 0) {
      resource._queue.unshift(function(){
        fn.apply(this, args);
      });
      logger.warn('deffering execution of "' + r.name + '.' + name + '" since dependencies are currently installing');
      return;
    }

    //
    // Check for any beforeAll hooks,
    // if they exist, execute them in LIFO order
    //
    if(Array.isArray(resource._before) && resource._before.length > 0) {
      var before = resource._before.pop();
      return before(args[0], function(err, data) {
        return fn.apply(this, [data, callback]);
      });
    }

    //
    // Check for any before hooks,
    // if they exist, execute them in LIFO order
    //
    if(Array.isArray(fn._before) && fn._before.length > 0) {
      var before = fn._before.pop();
      return before(args[0], function(err, data) {
        return fn.apply(this, [data, callback]);
      });
    }

    //
    // After all the hooks complete, repopulate the internal fn._before array
    //
    fn.before.forEach(function(b){
      fn._before.push(b);
    })

    //
    // After all the hooks complete, repopulate the internal fn._before array
    //
    resource.before.forEach(function(b){
      resource._before.push(b);
    });

    //
    // Inside this method, we must take into account any schema,
    // which has been defined with the method signature and validate against it
    //
    if (typeof schema === 'object') {

      var _instance = {},
          _data = {};

      if (typeof schema.description === 'undefined') {
        schema.description = "";
      }

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

      if (typeof schema.properties === "object" && typeof schema.properties.options === "object" && typeof args[0] === "object") {
        _data.options = args[0];
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
        resource.emit(r.name + '::' + name + '::error', { errors: validate.errors });
        if (typeof callback === 'function') {
          //
          // If a valid callback was provided, continue with the error
          //
          return callback({ errors: validate.errors });
        } else {
          //
          // If there is no valid callback, return an error ( for now )
          //
          return validate.errors;
        }
      }

      //
      // The schema validation passed, prepare method for execution
      //

      //
      // Convert schema data back into arguments array
      //
      if(Object.keys(_instance).length === 0) {
        _args = args;
      }

      //
      // In the case that a schema was provided but additional arguments,
      // were passed into the resource method call outside of the schema,
      // make sure to add back those additional arguments
      //

        /*
        //
        // If the amount of args passed in, exceeds the amount of expected args, but not overwrite default optional args
        //
        if (args.length > _args.length) {
          for (var i = _args.length; i < args.length; i++) {
            _args.push(args[i]);
          }
        }
        */

      Object.keys(_instance).forEach(function(item){
        if(item !== 'callback') {
          _args.push(_instance[item]);
        }
      });

      //
      // Check to see if a callback was expected, but not provided.
      //
      if(typeof schema.properties === 'object' && typeof schema.properties.callback === 'object' && typeof callback !== 'function') {
        //
        // If so, create a "dummy" callback so _method() won't crash
        //
        callback = function (err, result) {
          //
          // In the "dummy" callback, add a throw handler for errors,
          // so that any possible async error won't die silently
          //
          if (err) {
            logger.warn('about to throw an error from ' + r.name + '.' + name + ' since no callback was provided and an async error occurred!');
            logger.help('adding a callback argument to ' + r.name + '.' + name + ' will prevent this throw from happening');
            throw err;
          }
          //
          // Since a method that expected a callback was called without a callback,
          // nothing is done with the result. Consider this a "fire and forget"
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
        //
        // If a callback already exists as the last argument,
        // remove it
        //
        if(typeof _args[_args.length - 1] === "function") {
          _args.pop();
        }
        //
        // Add the wrapped callback as the last argument
        //
        _args.push(function(err, result){
          return callbackWrap(err, result);
        });
      }
    } else {
      _args = args;
      if(typeof callback === "function") {
        //
        // Replace the original callback with the new wrapped callback
        //
        _args[_args.length -1] = function(err, result){
          return callbackWrap(err, result);
        };
      }
    }

    function callbackWrap (err, result) {
      //
      // Only consider the method complete, if it has not errored
      //
      if (err === null) {
        //
        // Since the method has completed, emit it as an event
        //
        resource.emit(r.name + '::' + name, result);
        //
        // Check for after hooks, execute FIFO
        // Resource.after() hooks will NOT be executed if an error has occured on the event the hook is attached to
        if(Array.isArray(fn._after) && fn._after.length > 0) {
          fn._after.reverse();
          fn._after.forEach(function(after){
            after.call(this, result);
          });
        }
      }
      return callback.apply(this, arguments);
    }

    //
    // Everything seems okay, execute the method with the modified arguments
    //
    var result = method.apply(this, _args);

    if(typeof callback !== 'function') {
      resource.emit(r.name + '::' + name, result);
    }

    //
    // Could still return undefined, and that is OK
    //
    return result;
  };

  // store the schema on the fn for later reference
  fn.schema = schema || {
    "description": ""
  };

  // store the original method on the fn for later reference ( useful for documentation purposes )
  fn.unwrapped = method;

  // store the name of the method, on the method ( for later reference )
  fn.name = name;

  // placeholders for before and after hooks
  fn.before = [];
  fn._before = [];
  fn.after = [];
  fn._after = [];

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

  if (typeof schema === 'undefined') {
    schema = {
      "type": "string"
    }
  }

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

module['exports'] = resource;