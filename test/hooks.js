// tests for before and after hooks on resource methods

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

test("define creature resource - with datasource config", function (t) {
  creature = resource.define('creature', { config: { datasource: 'memory' }});
  creature.property('life', {
    "type": "number"
  });
  t.type(creature.config, 'object');
  t.equal('memory', creature.config.datasource);
  t.ok(creature, "configuration defined")
  t.type(creature.before, 'function');
  t.type(creature.after, 'function');
  t.ok(creature, "hook methods defined");
  t.end()
});

test("adding creature.before('create')", function (t) {

  t.equal(creature.create._before.length, 0);

  creature.before('create', function (data, next) {
    data.id = "larry";
    next(null, data);
  });
  
  t.equal(creature.create.before.length, 1);

  creature.create({ id: 'bobby' }, function(err, result){
    t.equal(result.id, 'larry');
    t.end();
  });

});

test("adding another creature.before('create')", function (t) {
  creature.before('create', function (data, next) {
    data.id = data.id + "-a";
    next(null, data);
  });
  t.equal(creature.create.before.length, 2);
  creature.create({ id: 'bobby' }, function(err, result){
    t.equal(result.id, 'larry-a');
    t.end();
  });
});


test("run it again", function (t) {
  creature.create({ id: 'bobby' }, function(err, result){
    t.equal(result.id, 'larry-a');
    t.end();
  });
});

test("adding another creature.before('create')", function (t) {
  creature.before('create', function (data, next) {
    data.id = data.id + "-b";
    next(null, data);
  });
  t.equal(creature.create.before.length, 3);
  creature.create({ id: 'bobby' }, function(err, result){
    t.equal(result.id, 'larry-a-b');
    t.end();
  });
});

test("run it again", function (t) {
  creature.create({ id: 'bobby' }, function(err, result){
    t.equal(result.id, 'larry-a-b');
    t.end();
  });
});

test("adding creature.before('poke') - before creature.poke is defined", function (t) {
  creature.before('poke', function (data, next) {
    next(null, data);
  });
  t.equal(creature.methods.poke.before.length, 1);
  t.end();
});

// broken, fix methods.js tests
/*
test("defining and running creature.poke", function (t) {
  creature.method('poke', function(data){
    console.log('poked', data);
    return 'poked!';
  })
  creature.poke('foo', function(err, result){
  });
});
*/
