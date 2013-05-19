var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , creature
  , resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded")
  t.end()
});

test("load creature resource - with memory datasource", function (t) {
  creature = resource.use('creature');

  t.type(creature.config, 'object', 'configuration defined - creature.config is object');

  t.type(creature.methods, 'object', 'methods defined - creature.methods is object');
  t.type(creature.methods.create, 'function', 'methods defined - methods.create is function');
  t.type(creature.methods.get, 'function', 'methods defined - methods.get is function');
  t.type(creature.methods.find, 'function', 'methods defined - methods.find is function');
  t.type(creature.methods.destroy, 'function', 'methods defined - methods.destroy is function');

  t.type(creature.create, 'function', 'methods hoisted - creature.create is function');
  t.type(creature.get, 'function', 'methods hoisted - creature.get is function');
  t.type(creature.find, 'function', 'methods hoisted - creature.find is function');
  t.type(creature.destroy, 'function', 'methods hoisted - creature.destroy is function');

  t.end()
});

testDatasource({ type: 'memory' });
testDatasource({ type: 'fs' });
testDatasource({ type: 'couch', database: 'big-test' });

function testDatasource(config) {

  var creatures = [
    { id: 'korben', life: 10, type: 'dragon' },
    { id: 'hazel', life: 15, type: 'dragon' },
    { id: 'booboo', life: 10, type: 'unicorn' }
  ];

  test("persist creature to " + config.type + " datasource", function (t) {
    creature.persist(config);
    t.end();
  });

  test("create creatures - with " + config.type + " datasource", function (t) {
    t.plan(3);

    creatures.forEach(function (c) {
      creature.create(c, function (err) {
        t.error(err, 'created creature ' + c.id);
      });
    });  
  });

  test("find creatures with id korben - with " + config.type + " datasource", function (t) {
    creature.find({ where: { id: 'korben' }}, function (err, creatures) {
      t.error(err, 'found creatures');

      t.equal(creatures.length, 1, 'found one creature');
      t.end();
    });
  });

  test("find creatures with life 10 - with " + config.type + " datasource", function (t) {
    creature.find({ where: { life: 10 }}, function (err, creatures) {
      t.error(err, 'found creatures');

      t.equal(creatures.length, 2, 'found two creatures');
      t.end();
    });
  });

  test("find creatures with type dragon - with " + config.type + " datasource", function (t) {
    creature.find({ where: { type: 'dragon' }}, function (err, creatures) {
      t.error(err, 'found creatures');

      t.equal(creatures.length, 2, 'found two creatures');
      t.end();
    });
  });

  test("find creatures with life 10 and type dragon - with " + config.type + " datasource", function (t) {
    creature.find({ where: { life: 10, type: 'dragon' }}, function (err, creatures) {
      t.error(err, 'found creatures');

      t.equal(creatures.length, 1, 'found one creature');
      t.end();
    });
  });

  test("destroy all creatures - with " + config.type + " datasource", function (t) {
    t.plan(creatures.length);
    creatures.forEach(function (c) {
      creature.destroy(c.id, function (err) {
        t.error(err, 'destroyed creature ' + c.id);
      });
    });
  });
}
