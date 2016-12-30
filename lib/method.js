var rpc = require('mschema-rpc');

//
// Attachs a method to a resource with optional input and output schemas
//
module['exports'] = function addMethod (r, name, method, schema, tap) {

  var resource = require('../');

  //
  // Create a new method that will act as a wrap for the passed in "method"
  //
  var fn = function internalResourceMethod (data, callback) {
    var args  = Array.prototype.slice.call(arguments),
        _args = [],
        validationError;

    var payload = [];

    if (typeof data === "function") {
      callback = data;
    }

    var self = this;
    //
    // Apply beforeAll and before hooks, then execute the method
    //
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
          // possible issue related to losing scope with beforeAll() method
          // required if calling API wants to pass in a custom context with resource.foo.call({}, args, cb)
          // hook.call(self, args[0], function (err, data) {
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
          hook.call(self, args[0], function (err, data) {
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

        // allows input schema to be specified by only passing mschema without explicit {input: {}, output: {}}
        if (typeof schema.input === "undefined") {
          schema = {
            input: schema
          }
        }
        rpc.invoke.call(self, args[0], method, schema, function (errors, result) {
          if (errors) {
            resource.emit(r.name + '::' + name + '::error', errors);
            return callback.call(self, errors, result);
          }
          return callbackWrap.call(self, null, result);
        });

      } else {
        return method.call(self, args[0], callbackWrap);
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
          resource.emit(r.name + '::' + name, result, false);
          //
          // Resource.after() hooks will NOT be executed if an error has occured on the event the hook is attached to
          //
          return afterHooks(argv, function (err, data) {
            if (err) {
              throw err;
            }
            return callback.apply(self, data);
          });
        }
        else {
          return callback.apply(self, argv);
        }
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

  // If an event has been emitted to the resource, fire the method
  r.on(name, function(data, rebroadcast){
    if (rebroadcast !== false) {
      fn(data, function (err, res){
        r.emit(name + "::" + "success", res, false)
      });
    }
  });

  return fn;

}
