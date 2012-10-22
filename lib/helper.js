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


