//
// resource.js - resource module for node.js
//
var colors = require('colors'),
  EventEmitter = require('eventemitter2').EventEmitter2,
  resource = new EventEmitter({
    wildcard: true, // event emitter should use wildcards ( * )
    delimiter: '::', // the delimiter used to segment namespaces
    maxListeners: 20 // the max number of listeners that can be assigned to an event
  });

// current version of the resource engine
resource.version = "0.4.3";

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

// installs npm deps
resource.install = require('./lib/install');

// loads a resource from a local or remote source
resource.load = require('./lib/load');

// aggregate start method for starting all loaded resources
resource.start = require('./lib/start');

// use a defined resource
resource.use = require('./lib/use');

// adds a function to the resource as a resource method
resource._addMethod = require('./lib/method');

// adds a property to the resource as a resource property
resource._addProperty = require('./lib/property');

resource.installing = {};
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

function afterExport() {
  // define resource as a meta-resource
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
}

afterExport();