//
// Tests Resource.init behavior
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

test("define a new creature resource", function (t) {
  var creature = resource.define('creature');
  t.ok(true, "defined create resource");
  t.end();
});

test("add init method to creature resource", function (t) {
  var init = function (cb) {
    cb(null, true);
  };
  resource.creature.method('init', init);
  t.ok(true, 'added init method');
  t.end();
});

test("now use that resource", function (t) {
  resource.on('creature::init', function(){
    t.ok(true, 'init fired for creature')
    t.end();
  })
  resource.use('creature');
});