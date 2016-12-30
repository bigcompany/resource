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
  creature.property('name', { type: "string", required: true });
  creature.property('type');
  creature.property('life', { type: 'number'});
  t.end()
});

testDatasource({ type: 'memory', username: 'admin', password: 'password' });
//testDatasource({ type: 'couch2' });

function testDatasource (config) {

  var creatures = [
    { name: 'korben', life: 10, type: 'dragon' },
    { name: 'hazel', life: 15, type: 'dragon' },
    { name: 'booboo', life: 10, type: 'unicorn' }
  ];

  test("persist creature to " + config.type + " datasource", function (t) {
    t.doesNotThrow(function () {
      creature.persist(config);
    }, 'persisted creature to ' + config.type);
    t.end();
  });

  test("create creatures - with " + config.type + " datasource", function (t) {
    t.plan(3);
    creatures.forEach(function (c) {
      creature.create(c, function (err, res) {
        t.ok('created creature')
      });
    });  
  });

  test("find creatures with id korben - with " + config.type + " datasource", function (t) {
    creature.find({ name: 'korben' }, function (err, creatures) {
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
    creature.all(function(err, results){
      results.forEach(function (c) {
        creature.destroy(c.id, function (err) {
          t.error(err, 'destroyed creature ' + c.id);
        });
      });
    });
  });
}