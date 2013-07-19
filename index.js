//
// resource.js - resource module for node.js
//

//
// Create a resource singleton
//
var resource = {};

var colors = require('colors'),
    EventEmitter = require('eventemitter2').EventEmitter2;

resource = new EventEmitter({
  wildcard: true, // event emitter should use wildcards ( * )
  delimiter: '::', // the delimiter used to segment namespaces
  maxListeners: 20, // the max number of listeners that can be assigned to an event
});

var helper = resource.helper = require('./lib/helper');

//
// Resource environment, either set to NODE_ENV or "development"
//
resource.env = process.env.NODE_ENV || 'development';

resource.isResource = resource.helper.isResource;
resource.version = "0.4.2";

resource.installing = {};
resource._queue = [];

//
// On the resource, create a "resources" object that will store a reference to every defined resource
//
resource.resources = {};


// event emitter logic for resource methods
resource._emit = resource.emit;
resource.emit = require('./lib/emit');

// defines new resources
resource.define = require('./lib/define');

// installs npm deps
resource.install = require('./lib/install');

// helper method for invoking resource methods from unknown interfaces
resource.invoke = helper.invoke;

// loads a resource from a local or remote source
resource.load = require('./lib/load');

// aggregate start method for starting all loaded resources
resource.start = require('./lib/start');

// use an already defined resource
resource.use = require('./lib/use');

// adds a function to the resource as a resource method
resource._method = require('./lib/method');

// adds a property to the resource as a resource property
resource._property = require('./lib/property');

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

resource._queue = [];

resource.schema = {
  properties: {}
};

resource.methods = [];
resource.name = "resource";

module['exports'] = resource;

//
// Define resource as a meta-resource
//
resource.resource = resource.define('resource', resource);

// hard-code the use of logger into resource core ( fow now )
var logger = resource.use('logger');

// hard-code the use of validator into resource core ( fow now )
var validator = resource.validator = resource.use('validator');

//
// Attempt to load resources from the currrent applications folder + /resources/
//
var resourcesPath = process.cwd() + '/resources/';

//
// Filter out any potential non-resource files / folders
//
var _resources = [], fs = require('fs');

try {
  _resources = fs.readdirSync(resourcesPath);
} catch (err) {
}

_resources = _resources.filter(function (val) {
  var _isResource = false;
  val = resourcesPath + val;
  _isResource = resource.isResource(val);
  return _isResource;
});

//
// For every resource, use it and export it
//
_resources.forEach(function (r) {
  resource.use(r);
});