var helper = exports;
var copyDir = helper.copyDir = function (source, target) {
  var fs = require('fs');
  var dir = fs.readdirSync(source);
  dir.forEach(function(item){
    var s = fs.statSync(source + '/' + item);
    if(s.isDirectory()) {
      try {
        fs.mkdirSync(target + '/' + item);
      } catch (err) { // do nothing
      }
      copyDir(source + '/' + item, target + '/' + item);
    } else {
      var file = fs.readFileSync(source + '/' + item);
      fs.writeFileSync(target + '/' + item, file);
    }
  });
};

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
