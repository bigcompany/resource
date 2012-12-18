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
      var file = fs.readFileSync(source + '/' + item, 'utf8');
      fs.writeFileSync(target + '/' + item, file);
    }
  });
};

//
// Ascertain the root folder of the user's application.
//
var appDir = helper.appDir = (function () {
	var path = require('path'),
      fs = require('fs'),
      p;

  //
  // This is a list of the paths node looks through when resolving modules.
  // They should be in order of precedence.
  //
  process.mainModule.paths.some(function (q) {
    //
    // Look to see if big is installed in this node_modules folder, or
    // alternately if the folder actually belongs to big itself.
    //
    var bigIsInstalled = fs.existsSync(path.resolve(q, 'big')),
        thisIsBig = fs.existsSync(path.resolve(q, '..', 'big.js'));

    if (bigIsInstalled || thisIsBig) {
      p = q;
      // short circuit
      return true;
    }
  });

  // p is the node_modules folder, so we should return the folder *above* it.
	return path.resolve(p, '..');
	 
})();
