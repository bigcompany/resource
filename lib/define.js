//
// Defines a new resource
//

module['exports'] = function (name, options) {

  var resource = require('../'),
      EventEmitter = require('EventEmitter2').EventEmitter2;

  //
  // Resources are event emitters
  //
  var r = new EventEmitter({
    wildcard: true, // event emitter should use wildcards ( * )
    delimiter: '::', // the delimiter used to segment namespaces
    maxListeners: 20, // the max number of listeners that can be assigned to an event
  });

  options = options || {};

  //
  // Initalize the resource with default values
  //
  r.name = name;

  //
  // Resource starts with no methods
  //
  r.methods = {};

  //
  // Resource starts with no schema
  //
  r.schema = options.schema || {
    "description": "",
    "properties": {
      "id": {
        "type": "any"
      }
    }
  };

  //
  // If any additional configuration data has been passed in assign it to the resource
  //
  r.config = options.config || {};

  //
  // Any local resource events should be re-emitted to the resource module scope
  //
  r._emit = r.emit;
  r.emit = function () {
    var args = [].slice.call(arguments),
        event = args.shift();

    resource._emit.apply(resource, [ r.name + '::' + event ].concat(args));
    return r._emit.apply(r, [ event ].concat(args));
  };

  //
  // Give the resource a property() method for creating new resource properties
  //
  r.property = function (name, schema) {
    resource._addProperty(r, name, schema);
  };

  //
  // Give the resource a method() method for creating new resource methods
  //
  r.method = function (name, method, schema) {
    if (typeof method !== 'function') {
      throw new Error('a function is required as the second argument to `resource.method()`');
    }
    return resource._addMethod(r, name, method, schema);
  };

  //
  // Give the resource a .before() method for defining before hooks on resource methods
  //
  r.before = function (method, callback) {
    //
    // If no method exists on the resource yet create a place holder,
    // in order to be able to lazily define hooks on methods that dont exist yet
    //
    if (typeof r.methods[method] === 'undefined') {
      r.methods[method] = {};
      r.methods[method].before = [];
      r.methods[method].after = [];
    }
    //
    // method exists on resource, push this new hook callback
    //
    r.methods[method].before.unshift(callback);
  };

  //
  // Give the resource a .after() method for defining after hooks on resource methods
  //
  r.after = function (method, callback) {
    //
    // If no method exists on the resource yet create a place holder,
    // in order to be able to lazily define hooks on methods that dont exist yet
    //
    if (typeof r.methods[method] === 'undefined') {
      r.methods[method] = {};
      r.methods[method].before = [];
      r.methods[method].after = [];
    }
    //
    // method exists on resource, push this new hook callback
    //
    r.methods[method].after.push(callback);
  };

  if (typeof r.config.datasource !== 'undefined') {
    r.schema.properties.id = {
      "type": "any"
    };
    resource.use('persistence');
    resource.persistence.enable(r, r.config.datasource);
  }

  //
  // TODO: add resource level beforeAll() hooks
  //
  // r.beforeAll = function (callback) {};

  //
  // Give the resource a persist() method as a short-cut to resource.persistence.enable
  //
  r.persist = function (datasource) {
    datasource = datasource || 'memory';
    r.config.datasource = datasource;
    resource.use('persistence');
    resource.persistence.enable(r, datasource);
  };


  //
  // Attach a copy of the resource to the resources scope ( for later reference )
  //
  resource[name] = r;
  resource.resources[name] = r;

  //
  // Return the new resource
  //
  return r;

};