//
// Attachs a method onto a resources as a named function with optional schema and tap
//
module['exports'] = function addMethod (r, name, method, schema, tap) {

  var resource = require('../');

  //
  // Create a new method that will act as a wrap for the passed in "method"
  //
  var fn = function () {
    var args  = Array.prototype.slice.call(arguments),
        _args = [],
        validationError;

    var payload = [],
        callback = args[args.length - 1];

    //
    // Determine if a exports.dependencies hash has been specified in the resource,
    // if so, determine if there are any missing deps that will need to be installed
    //
    if (typeof r.dependencies === 'object') {
      resource.install(r, resource);
    }

    if (Object.keys(resource.installing).length > 0) {
      resource._queue.unshift(function () {
        fn.apply(this, args);
      });
      // console.log('deffering execution of `' + (r.name + '.' + name).yellow + '` since dependencies are missing');
      return;
    }

    //
    // Apply beforeAll and before hooks, then execute the method
    // TODO: Pass returns up the stack for sync functions
    return beforeAllHooks(function (err) {
      if (err) {
        if (typeof callback === 'function') {
          return callback(err);
        }
        else {
          throw err;
        }
      }
      return beforeHooks(function (err) {
        if (err) {
          if (typeof callback === 'function') {
            return callback(err);
          }
          else {
            throw err;
          }
        }
        return execute();
      });
    });

    //
    // Check for any beforeAll hooks,
    // if they exist, execute them in LIFO order
    //
    function beforeAllHooks(cb) {
      var hooks;
      if (Array.isArray(resource._before) && resource._before.length > 0) {
        hooks = resource._before.slice();
        function iter() {
          var hook = hooks.pop();
          hook = hook.bind({ resource: r.name, method: name });
          hook(args[0], function (err, data) {
            if (err) {
              return cb(err);
            }
            args[0] = data;
            if (hooks.length > 0) {
              iter();
            }
            else {
              cb(null);
            }
          });
        }
        iter();
      }
      else {
        return cb(null);
      }
    }

    //
    // Check for any before hooks,
    // if they exist, execute them in LIFO order
    //
    function beforeHooks(cb) {
      var hooks;

      if (Array.isArray(fn.before) && fn.before.length > 0) {
        hooks = fn.before.slice();
        function iter() {
          var hook = hooks.pop();
          hook = hook.bind({ resource: r.name, method: name });
          hook(args[0], function (err, data) {
            if (err) {
              return cb(err);
            }
            args[0] = data;
            if (hooks.length > 0) {
              iter();
            }
            else {
              cb(null);
            }
          });
        }
        iter();
      }
      else {
        return cb(null);
      }
    }

    function execute() {
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
        if (typeof schema.properties === "object") {
          Object.keys(schema.properties).forEach(function (prop, i) {
            _data[prop] = args[i];
          });
        }

        //
        // Create a new schema instance with default values, mixed in with supplied arguments data
        //
        _instance = resource.helper.instantiate(schema, _data);
        //
        // Perform a schema validation on the new instance to ensure validity
        //
        if (resource.validator) {
          var validate = resource.validator.validate.unwrapped(_instance, schema);

          //
          // If the schema validation fails, do not fire the wrapped method
          //
          if (!validate.valid) {
            //
            // Create an error of type Error
            //
            validationError = new Error(
              'Invalid arguments for method `' + r.name + '.' + name + '`. '
            );
            validationError.errors = validate.errors;
            validationError.message = validationError.message + JSON.stringify(validationError.errors, true, 2);

            resource.emit(r.name + '::' + name + '::error', validationError);
            if (typeof callback === 'function') {
              //
              // If a valid callback was provided, continue with the error
              //

              return callback(validationError);
            } else {
              throw validationError;
            }
          }
        }

        //
        // The schema validation passed, prepare method for execution
        //

        //
        // Convert schema data back into arguments array
        //
        if (Object.keys(_instance).length === 0) {
          _args = args;
        }

        //
        // In the case that a schema was provided but additional arguments,
        // were passed into the resource method call outside of the schema,
        // make sure to add back those additional arguments
        //

        Object.keys(_instance).forEach(function (item) {
          if (item !== 'callback') {
            _args.push(_instance[item]);
          }
        });

        if (typeof schema.properties === "undefined" || typeof schema.properties.options === "undefined") {
          //
          // If an options object is not defined in the schema and the amount of incoming arguments exceeds,
          // the amount of expected arguments then push the additional arguments
          //
          if (args.length > _args.length) {
            for (var i = _args.length; i < args.length; i++) {
              _args.push(args[i]);
            }
          }
        }
        else if (typeof schema.properties.options === "object" && typeof args[0] === 'object' && typeof _args[0] === 'object') {
          //
          // If an options object is defined in the schema, merge the additional arguments,
          // into the options object

          //
          // `options` corresponds to the first argument in each of these arrays.
          //
          var keys = Object.keys(args[0]),
              _keys = Object.keys(_args[0]);

          //
          // Merge the additional options arguments with the original options arguments
          //
          Object.keys(args[0]).forEach(function (k, i) {
            if (!_args[0][k]) {
              _args[0][k] = args[0][k];
            }
          });
        }

        //
        // Check to see if a callback was expected, but not provided.
        //
        if (typeof schema.properties === 'object' && typeof schema.properties.callback === 'object' && typeof callback !== 'function') {
          //
          // If so, create a "dummy" callback so _method() won't crash
          //
          callback = function (err, result) {
            //
            // In the "dummy" callback, add a throw handler for errors,
            // so that any possible async error won't die silently
            //
            if (err) {
              console.log('about to throw an error from ' + r.name + '.' + name + ' since no callback was provided and an async error occurred!');
              console.log('adding a callback argument to ' + r.name + '.' + name + ' will prevent this throw from happening');
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
        if (typeof callback === 'function') {
          //
          // If a callback already exists as the last argument,
          // remove it
          //
          if (typeof _args[_args.length - 1] === "function") {
            _args.pop();
          }
          _args.push(function () {
            //
            // Add the wrapped callback as the last argument
            //
            return callbackWrap.apply(this, arguments);
          });
        }
      } else {
        _args = args;
        if (typeof callback === "function") {
          _args[_args.length - 1] = function (err, result) {
            //
            // Replace the original callback with the new wrapped callback
            //
            return callbackWrap.apply(this, arguments);
          };
        }
      }

      function callbackWrap(err, result) {
        var argv = [].slice.call(arguments);

        //
        // Only consider the method complete, if it has not errored
        //
        if (err === null) {
          //
          // Since the method has completed, emit it as an event
          //
          resource.emit(r.name + '::' + name, result);

          //
          // Resource.after() hooks will NOT be executed if an error has occured on the event the hook is attached to
          //
          return afterHooks(argv, function (err, data) {
            if (err) {
              throw err;
            }
            return callback.apply(this, data);
          });
        }
        else {
          return callback.apply(this, argv);
        }
      }

      //
      // Everything seems okay, execute the method with the modified arguments
      //
      var result = method.apply(this, _args);
      if (typeof callback !== 'function') {
        resource.emit(r.name + '::' + name, result);
        afterHooks([null, result]);
      }

      //
      // Could still return undefined, and that is OK
      //
      return result;
    }

    //
    // Executes "after" hooks in FIFO (First-In-First-Out) Order
    //
    function afterHooks(args, cb) {
      cb = cb || function noop(){};
      var hooks;
      if (Array.isArray(fn.after) && fn.after.length > 0) {
        hooks = fn.after.slice();
        function iter() {
          var hook = hooks.shift();
          hook(args[1], function (err, data) {
            if (err) {
              return cb(err);
            }
            args[1] = data;
            if (hooks.length > 0) {
              iter();
            }
            else {
              return cb(null, args);
            }
          });
        }
        iter();
      }
      else {
        cb(null, args);
      }
    }
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
  fn.after = [];

  //
  // If the method about to be defined, already has a stub containing hooks,
  // copy those hooks to the newly defined fn that is about to be created
  // These previous stubs will then be overwritten.
  // This is used to allow the ability to define hooks on,
  // lazily defined resource methods
  //
  if (typeof r.methods[name] !== 'undefined') {
    if (Array.isArray(r.methods[name].before)) {
      r.methods[name].before.forEach(function (b) {
        fn.before.push(b);
      });
    }
    if (Array.isArray(r.methods[name].after)) {
      r.methods[name].after.forEach(function (b) {
        fn.after.push(b);
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

  return fn;

}
