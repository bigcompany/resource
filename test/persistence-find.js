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
  creature = resource.define('creature');
  creature.property('type');
  creature.property('life', { type: 'number'});
  t.end()
});

testDatasource({ type: 'memory' });
testDatasource({ type: 'fs' });

//
// TODO: add feature detection / better test configuration for testing diffirent datasources
// If a user attempts to run the couch tests without a running couch, they will error with a non-descript message
//
// testDatasource({ type: 'couch', name: 'big-test' });

function testDatasource (config) {

  var creatures = [
    { id: 'korben', life: 10, type: 'dragon' },
    { id: 'hazel', life: 15, type: 'dragon' },
    { id: 'booboo', life: 10, type: 'unicorn' }
  ];

  test("persist creature to " + config.type + " datasource", function (t) {
    t.doesNotThrow(function () {
      creature.persist(config);
    }, 'persisted creature to ' + config.type);
    t.end();
  });

  test("create creatures - with " + config.type + " datasource", function (t) {
    t.plan(15);

    creatures.forEach(function (c) {
      creature.create(c, function (err) {
        t.error(err, 'created creature ' + c.id);
        creature.get(c.id, function (err, _c) {
          t.error(err, 'creature ' + c.id + ' exists');
          t.equal(_c.id, c.id, 'id for ' + c.id + ' is correct');
          t.equal(_c.type, c.type, 'type for ' + c.id + ' is correct');
          t.equal(_c.life, c.life, 'life for ' + c.id + ' is correct');
        });
      });
    });  
  });

  test("find creatures with id korben - with " + config.type + " datasource", function (t) {
    creature.find({ id: 'korben' }, function (err, creatures) {
      t.error(err, 'found creatures');

      t.equal(creatures.length, 1, 'found one creature');
      t.end();
    });
  });

  test("find creatures with life 10 - with " + config.type + " datasource", function (t) {
    creature.find({ life: 10 }, function (err, creatures) {
      t.error(err, 'found creatures');

      t.equal(creatures.length, 2, 'found two creatures');
      t.end();
    });
  });

  test("find creatures with type dragon - with " + config.type + " datasource", function (t) {
    creature.find({ type: 'dragon' }, function (err, creatures) {
      t.error(err, 'found creatures');

      t.equal(creatures.length, 2, 'found two creatures');
      t.end();
    });
  });

  test("find creatures with life 10 and type dragon - with " + config.type + " datasource", function (t) {
    creature.find({ life: 10, type: 'dragon' }, function (err, creatures) {
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
