//
// Defines a new resource
//

module['exports'] = function (name, options) {

  var resource = require('../'),
      EventEmitter = require('../vendor/eventemitter2').EventEmitter2;

  options = options || {};

  //
  // Resources are event emitters
  //
  var r = new EventEmitter({
    wildcard: true, // event emitter should use wildcards ( * )
    delimiter: '::', // the delimiter used to segment namespaces
    maxListeners: 999, // the max number of listeners that can be assigned to an event,
    newListener: true
  });

  // Whenever a new listener is added to the resource instance,
  // add that new event to the instance eventTable and the resource eventTable
  //
  // Remark: Resource events are considered NOT remote by default
  // This means that resource events will not be available to remote sources unless,
  // resource.remote property is set to `true`
  //
  r.on('newListener', function(ev){
    // resource eventTable
    resource.eventTable[name + "::" + ev] = {
      remote: r.remote || false
    };
    // resource instance eventTable
    r.eventTable[ev] = {
      remote: r.remote || false
    };
  });

  //
  // Initalize the resource with default values
  //
  r.name = name;

  //
  // Resource starts with no methods
  //
  r.methods = {};
  r.eventTable = {};
  r.controller = options.controller || {};
  r.schema = options.schema || {"properties": {}, "methods": {}};
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

  r.properties = function (schemas) {
    for (var schema in schemas) {
      r.property(schema, schemas[schema]);
    }
  };


  //
  // Give the resource a method() method for creating new resource methods
  //
  r.method = function (name, method, schema) {
    if (typeof method !== 'function') {
      console.warn('could not find method ' + r.name + '.' + name, 'using default method');
      method = function (options, cb) { cb(null, 'default method returned'); };
      //throw new Error('a function is required as the second argument to `resource.method()`');
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
    resource.datasource.persist(r, datasource);
  };

  //
  // Give the resource a timestamps() method to enable ctime ( creation time ) and mtime ( modification time ) fields
  //
  r.timestamps = function () {
    r.property("ctime", { "type": "number" });
    r.property("mtime", { "type": "number" });
  }

  for (var method in r.controller) {
    if (typeof r.schema.methods[method] !== 'undefined') {
      r.method(method, r.controller[method], r.schema.methods[method]);
    }
  }

  if (typeof r.config.datasource !== 'undefined') {
    resource.datasource.persist(r, r.config.datasource);
  }

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