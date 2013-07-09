var helper = exports;

//
// Determine the root folder of the user's application
//
var appDir = helper.appDir = (function () {
  var path = require('path'),
      fs = require('fs'),
      p = process.cwd();

  //
  // If we're in the repl, use process.cwd
  //
  if (!process.mainModule) {
    return p;
  }

  //
  // This is a list of the paths node looks through when resolving modules,
  // they should be in order of precedence.
  //
  process.mainModule.paths.some(function (q) {
    if (fs.existsSync(path.resolve(q, 'resource'))) {
      p = path.resolve(q, '..');
      // short circuit
      return true;
    }
  });

  return p;

})();

//
// Determines if a string path is a valid resource
// Returns either true or false
//
var isResource = helper.isResource = function (val) {
  var fs = require('fs'),
      path = require('path'),
      result = false;

  try {
    var isDir = fs.statSync(path.join(val)).isDirectory(),
        isFile = false;
    if (isDir) {
      isFile = fs.statSync(path.join(val, 'index.js')).isFile;
    }
    result =  isDir && isFile;
  }
  catch (err) {
    if (err.code !== 'ENOENT' && err.code !== 'ENOTDIR') {
      throw err;
    }
  }
  return result;
}
