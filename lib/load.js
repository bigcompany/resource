//
// For loading resources as CommonJS modules
//

module['exports'] = function (r) {

  var path = require('path'),
      fs = require('fs'),
      mkdirp = require('mkdirp'),
      resource = require('../index'),
      helper = resource.helper;

  var appDir = helper.appDir,
      resourcePath = path.join(appDir, 'resources', r);

  if(typeof r === "undefined" || r.length === 0) {
    throw new Error('resource name is required for `resource.use()`');
  }

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
    // Make sure this is a "module not found" error
    //
    if (!err.code || !(err.code == 'MODULE_NOT_FOUND')) {
      throw err;
    }
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
      // A valid resource was not found in $CWD/resources/ or in the "resources" npm package
      //
      throw err;
    }

    //
    // Since the resource was found in the "resources" package, copy it to $CWD/resources
    //
    mkdirp.sync(resourcePath);
    
    console.log('installing ' + r.magenta + ' to ' + resourcePath.grey);

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
