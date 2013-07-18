//
// Tests the resource.start method
//

var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    creature,
    resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "resource loaded");
  t.end();
});

test("define a few resources", function (t) {
  var one = resource.define('one'),
      two = resource.define('two'),
      three = resource.define('three');
  t.ok(true, "defined three resources");
  t.end();
});

test("add start methods to new resources", function (t) {
  var start = function (cb) {
    console.log('starting');
    cb(null, true);
  };
  resource.one.method('start', start);
  resource.two.method('start', start);
  resource.three.method('start', start);
  t.ok(true, 'added start methods');
  t.end();
});

test("call aggregate start method", function (t) {
  resource.start(function (err, result) {
    t.ok(true, 'called start method');
    t.end();
  });
});