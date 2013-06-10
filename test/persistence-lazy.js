var tap = require('tap')
  , test = tap.test
  , plan = tap.plan
  , account
  , creature
  , resource;

//
// Testing metadata
//
var testDatasource = "memory";

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded")
  t.end()
});

test("define creature resource lazily", function (t) {
  creature = resource.define('creature');
  creature.persist(testDatasource);

  function start() {
    creature.property('life', {
      type: 'number'
    });
    t.end();
  }
  creature.method('start', start, {
    description: 'starts the creature'
  });
  creature.start();
});

test("create creature", function(t) {
  creature.create({life: 15}, function(err, _creature) {
    t.error(err, 'no error');
    t.type(_creature, 'object', 'creature instance is object');
    t.type(_creature.id, 'string', 'creature id is string');
    t.type(_creature.life, 'number', 'creature number is number');
    t.equal(_creature.life, 15, 'creature number is correct');
    t.end()
  });
});
