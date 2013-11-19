//
// resource.js - resource module for node.js
//
var EventEmitter = require('EventEmitter2').EventEmitter2,
  resource = new EventEmitter({
    wildcard: true, // event emitter should use wildcards ( * )
    delimiter: '::', // the delimiter used to segment namespaces
    maxListeners: 20 // the max number of listeners that can be assigned to an event
  });

// current version of the resource engine
resource.version = "0.4.3";

if(typeof process === 'undefined') {
  process = {
    env: {
      "BROWSER_ENV": "development"
    }
  }; // process object is not available in browser component
}

// resource environment, either set to NODE_ENV or "development"
resource.env = process.env.NODE_ENV || 'development';

// on the resource, create a "resources" object that will store a reference to every defined resource
resource.resources = {};

// event emitter logic for resource methods
resource._emit = resource.emit;
resource.emit = require('./lib/emit');

// for defining new resources
resource.define = require('./lib/define');

// helpers for dealing with resources
resource.helper = require('./lib/helper');

// aggregate start method for starting all loaded resources
resource.start = require('./lib/start');

// adds a function to the resource as a resource method
resource._addMethod = require('./lib/method');

// adds a property to the resource as a resource property
resource._addProperty = require('./lib/property');


// TODO: port loopback-datasource-juggler to browser using component
if (typeof process.env.BROWSER_ENV === 'undefined') {
  // adds persist methods for persisting resource instances into datasources
  resource.datasource = require('./lib/datasource');
}

resource._queue = [];
resource._before = [];

//
// For attaching module-scoped Resource._before hooks onto all resources.
// This differs from calling .before on a resource instance such as creature.before('create'),
// in that resource.beforeAll(fn) hooks will execute before all resource methods
//
resource.beforeAll = function (callback) {
  //
  // Method exists on resource, push this new hook callback
  //
  resource._before.unshift(callback);
};

resource.schema = {
  properties: {}
};
resource.methods = [];
resource.name = "resource";

module['exports'] = resource;