//
// For loading and using resources
//


module['exports'] = function (r, options) {

  var resource = require('../index'),
      helper = resource.helper,
      persistence = resource.persistence,
      logger = resource.logger;

  var self = this;

  //
  // TODO: Ensure that we are working within a package
  //

  //
  // Load the resource as a node.js module
  //
  var _r = resource.load(r);

  //
  // If the required resource doesn't have the expected exported scope,
  // throw a friendly error message
  //
  if (typeof _r[r] === 'undefined') {
    throw new Error("exports." + r + " is not defined in the " + r + ' resource!')
  }

  _r.name = r;

  //
  // Attach a copy of the resource to "this" scope ( which may or may not be the resource module scope )
  //
  this[r] = _r[r];

  //
  // Remark: backwards compatibility between exports.dependencies and exports.resourcename.dependencies
  //
  this[r].dependencies = _r.dependencies || this[r].dependencies || {};

  //
  // Any options passed into resource.use('foo', options),
  // will be considered configuration options, and bound to resource.config
  //
  this[r].config = options || {};
  //
  // Attach a copy of the resource to the resource module scope for later reference
  //
  resource[r] = _r[r];
  resource.resources[r] = this[r];

  //
  // If a database configuration has been specified, attach CRUD methods to resource.
  // This adds methods such as Resource.create / Resource.get.
  // With a datasource specification, resources can persist.
  // Persisting resources requires an additional dependency of "jugglingdb"
  // see: github.com/1602/jugglingdb
  //
  if (typeof this[r].config.datasource !== 'undefined') {
    persistence.enable(this[r], this[r].config.datasource);
  }

  return this[r];

};
