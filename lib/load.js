//
// For loading resources as CommonJS modules
//

module['exports'] = function (r) {

  var path = require('path'),
      fs = require('fs'),
      mkdirp = require('mkdirp'),
      resource = require('../index'),
      helper = resource.helper,
      logger = resource.logger;

  var appDir = helper.appDir,
      resourcePath = path.join(appDir, 'resources', r);

  //
  // TODO: better resource loading logic
  //

  //
  // TODO: Check DIRNAME before checking process.cwd()
  //

  //
  // Check to see if the resource exists in the $CWD/resources/ path
  //
  try {
    require.resolve(resourcePath);
    //
    // If so, require it
    //
    result = require(resourcePath);
  } catch (err) {
    //
    // If not, check to see if the resource exists in "resources" package on npm
    //

    //
    // Attempt to resolve "resources"
    //
    var p = path.dirname(require.resolve('resources'));
    p = path.join(p, r);
    try {
      require.resolve(p);
    } catch (err) {
      //
      // Resource was not found in $CWD/resources/ or in the "resources" npm package
      //
      throw new Error('no resource found at: ' + p.grey);
    }

    //
    // Since the resource was found in the "resources" package, copy it to $CWD/resources
    //
    mkdirp.sync(resourcePath);
    
    logger.info('installing ' + r.magenta + ' to ' + resourcePath.grey);

    //
    // Perform a sync directory copy from node_modules folder to CWD
    //
    helper.copyDir(p, resourcePath);

    //
    // Copy the contents of  /resources/theresource/ to $CWD/resources/theresource
    //
    result = require(resourcePath);

  }

  return result;
};
