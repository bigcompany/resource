module['exports'] = function (options, callback) {

  var resource = require('../'),
  async = require('async');

  if (typeof options === "function") {
    callback = options;
  }

  if (typeof callback === "undefined") {
    callback = function () {
      console.log('default start callback used');
    };
  }

  var callbacks = [];
  //
  // For every resource, determine if there is a start method,
  // if so, add the method to an array to be executed as a sequence
  //
  Object.keys(resource.resources).forEach(function (r) {
    if (typeof resource.resources[r].start === 'function') {
      callbacks.push(resource.resources[r].start);
    }
  });

  series(callbacks, callback);

};

//
// Simple async series helper
//
function series(callbacks, finish) {
  var results = [];
  function next() {
    var callback = callbacks.shift();
    if (callback) {
      callback(function () {
        results.push(Array.prototype.slice.call(arguments));
        next();
      });
    } else {
      finish(results);
    }
  }
  next();
}