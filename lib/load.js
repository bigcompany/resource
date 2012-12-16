//
// For loading resources as CommonJS modules
//

module['exports'] = function (r) {

  var resource = require('../index'),
      helper = resource.helper,
      logger = resource.logger;

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
    require.resolve(process.cwd() + '/resources/' + r)
    //
    // If so, require it
    //
    result = require(process.cwd() + '/resources/' + r);
  } catch (err) {
    //
    // If not, check to see if the resource exists in "resources" package on npm
    //

    //
    // Attempt to resolve "resources"
    //
    var p = require.resolve('resources');
    p = p.replace('/index.js', '/');
    p += r;
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
    try {
      require('fs').mkdirSync('./resources/');
      // TODO: add more content to this README file
      require('fs').writeFileSync('./resources/README.md', '# Resources Readme');
    } catch (err) {
      // do nothing
    }

    try {
      require('fs').mkdirSync('./resources/'+ r);
    } catch (err) {
      // do nothing
    }
    logger.info('installing ' + r.magenta + ' to ' + (process.cwd() + '/' + r).grey);

    //
    // Perform a sync directory copy from node_modules folder to CWD
    //
    helper.copyDir(p, process.cwd() + '/resources/' + r);

    //
    // Copy the contents of  /resources/theresource/ to $CWD/resources/theresource
    //
    result = require(p);

  }

  return result;
};