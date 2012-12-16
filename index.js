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
var validator = require('./vendor/validator');

var helper = resource.helper = require('./lib/helper');
var logger = resource.logger = require('./lib/logger');
var persistence = resource.persistence = require('./lib/persistence');

resource.load = require('./lib/load');
resource.use = require('./lib/use');

// map uuid creator onto resource as a convience
resource.uuid = persistence.uuid;

resource.installing = {};
resource._queue = [];

//
// On the resource, create a "resources" object that will store a reference to every defined resource
//
resource.resources = {};

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
      throw new Error('a function is required as the second argument to `resource.method()`');
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
    persistence.enable(r, r.config.datasource);
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
      logger.warn(r.name.magenta + ' resource is missing a required dependency: ' + dep.yellow)
      // TODO: check to see if dep is already in the process of being installed,
      // if so, don't attempt to install it twice
      if (typeof resource.installing[dep] === 'undefined') {
        resource.installing[dep] = {};
        _command.push(dep + '@' + r.dependencies[dep]);
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
  logger.warn('spawning ' + 'npm'.grey + ' to install missing dependencies')
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
        var dep = c.split('@'); // split the dep name based on packagename@semver syntax
        dep = dep[0]; // take the package name
        delete resource.installing[dep]; // remove it from the list of installing packages
      }
    });
    if(Object.keys(resource.installing).length === 0) {
      logger.info('npm installation complete');
      logger.warn('now executing ' + resource._queue.length + ' defferred call(s)');
      for(var m in resource._queue) {
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
// Attachs a method onto a resources as a named function with optional schema and tap
//
function addMethod (r, name, method, schema, tap) {

  //
  // Create a new method that will act as a wrap for the passed in "method"
  //
  var fn = function () {
    var args  = Array.prototype.slice.call(arguments),
        _args = [],
        validationError;

    var payload = [],
        callback = args[args.length -1];

    if(Object.keys(resource.installing).length > 0) {
      resource._queue.unshift(function(){
        fn.apply(this, args);
      });
      logger.warn('deffering execution of `' + (r.name + '.' + name).yellow + '` since dependencies are missing');
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
        //
        // Create an error of type Error
        //
        validationError = new Error(
          'Invalid arguments for method `' + r.name + '.' + name + '`. Try logging `err.errors`'
        );
        validationError.errors = validate.errors;

        resource.emit(r.name + '::' + name + '::error', validationError);
        if (typeof callback === 'function') {
          //
          // If a valid callback was provided, continue with the error
          //

          return callback(validationError);
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
    persistence.enable(r, r.config.datasource);
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

//
// Create logger resource
//

  var _logger = resource.define('logger');
  _logger.schema.description = "a simple STDOUT based logger";
  //
  // TODO: improve log method schema
  _logger.method("log", logger.put, {
    "description": "logs data to STDOUT",
    "properties": {
      "data": {
        "type": "any"
      }
    }
  });

  //
  // Override original logger with new logger resource
  // TODO: cleanup override logic
  resource.logger = _logger;

  //
  // Preserve old logging levels
  //
  for(var level in logger.levels) {
    resource.logger[level] = logger[level];
  }

//
// end logger resource
//

resource.methods = [];
resource.name = "resource";

module['exports'] = resource;
