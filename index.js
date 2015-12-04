//
// resource.js - resource module for node.js
//
var EventEmitter = require('./vendor/eventemitter2').EventEmitter2,
  resource = new EventEmitter({
    wildcard: true, // event emitter should use wildcards ( * )
    delimiter: '::', // the delimiter used to segment namespaces
    maxListeners: 999, // the max number of listeners that can be assigned to an event,
    newListener: true
  });

if (typeof process === 'undefined') {
  process = {
    env: {
      "BROWSER_ENV": "development"
    }
  }; // process object is not available in browser component
}

var eventTable = resource.eventTable = {};

// Whenever a new listener is added to the resource instance,
// add that new event to the resource eventTable
//
// Remark: Resource events are considered NOT remote by default
// This means that resource events will not be available to remote sources unless,
// unless remote property is set to `true`
//
resource.on('newListener', function(ev){
  eventTable[ev] = {
    remote: resource.remote || false
  };
});

// TODO: make resource.remote a getter / setter. the idea being after setting the remote property, the eventTable will be updated to remote:true 

// resource environment, either set to NODE_ENV or "development"
resource.env = process.env.NODE_ENV || 'development';

// on the resource, create a "resources" object that will store a reference to every defined resource
resource.resources = {};

// custom event emitter logic for resource methods
resource._emit = resource.emit;
resource.emit = require('./lib/emit');

// method for defining new resources
resource.define = require('./lib/define');

// private method for binding new methods to a resource
resource._addMethod = require('./lib/method');

// private method for adding new properties to a resource
resource._addProperty = require('./lib/property');

// TODO: Setup datasource connector for browser
if (typeof process.env.BROWSER_ENV === 'undefined') {
  // adds resource.datasource.persist methods for storing resource instances into datasources
  // in most cases the datasource will be a database ( couchdb / mongodb / file-system )
  resource.datasource = require('./lib/datasource');
}

// resource.beforeAll() event hooks
resource._before = [];
resource.beforeAll = function (callback) {
  resource._before.unshift(callback);
};

module['exports'] = resource;