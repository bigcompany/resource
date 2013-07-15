var helper = require('./helper');

module['exports'] = function (r, resource) {

  //
  // TODO: make this work with remote files as well as local
  //
  var _command = ["install"];

  Object.keys(r.dependencies).forEach(function (dep) {
    var resourcePath;

    //
    // Check to see if the dep is available
    //
    resourcePath = helper.appDir + '/node_modules/';
    resourcePath += dep;
    resourcePath = require('path').normalize(resourcePath);
    try {
      require.resolve(resourcePath);
    } catch (err) {
      // console.log(r.name.magenta + ' resource is missing a required dependency: ' + dep.yellow);
      if (typeof resource.installing[dep] === 'undefined') {
        resource.installing[dep] = {};
        _command.push(dep + '@' + r.dependencies[dep]);
      }
    }

  });

  if (_command.length === 1) {
    return;
  }

  // _command.push('--color', "false");

  var home = require.resolve('resources');
  home = home.replace('/index.js', '/');

  //
  // Spawn npm as child process to perform installation
  //
  // console.log('npm ' + _command.join(' '));

  //
  // Cross-platform npm binary detection using `which` module
  // ( this is required for Windows )
  //
  var which = require('which'),
      npmBinary = which.sync('npm');

  // Set install path to resources directory
  var p = require.resolve('resources').replace('index.js', '');

  var spawn = require('child_process').spawn,
      npm   = spawn(npmBinary, _command, { cwd: helper.appDir });

  console.log('contacting npm servers to install dependencies...');

  npm.stdout.on('data', function (data) {
    process.stdout.write(data);
  });

  npm.stderr.on('data', function (data) {
    process.stderr.write(data);
  });

  npm.on('error', function () {
    console.log('npm installation error!');
    process.exit();
  });

  npm.on('exit', function (code) {
    // console.log('npm just exited with code ' + code.toString().red);
    if (code === 3) {
      console.log('cannot install as current user');
      console.log('try running this command again with sudo');
      process.exit(3);
    }
    _command.forEach(function (c, i) {
      if (i !== 0) { // the first command is "install"
        var dep = c.split('@'); // split the dep name based on packagename@semver syntax
        dep = dep[0]; // take the package name
        delete resource.installing[dep]; // remove it from the list of installing packages
      }
    });
    if (Object.keys(resource.installing).length === 0) {
      // console.log('npm installation complete');
      // console.log('now executing ' + resource._queue.length + ' defferred call(s)');

      //
      // Calling an element in the queue can add new elements to the queue on
      // the same tick. So we only do the ones that were ready *this* time,
      // and the new elements are properly deferred.
      //
      var length = resource._queue.length,
          m;

      for (m = 0; m < length; m++) {
        resource._queue.pop()();
      }
    }
  });

}