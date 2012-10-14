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
    data = "poked!";
    return next(null, data);
  });
  t.equal(creature.methods.poke.before.length, 1);
  t.end();
});

test("remove all before hooks on creature.create", function (t) {
  for(var i=0; i <= creature.methods.create.before.length + 1; i++) {
    creature.methods.create.before.pop();
  }
  for(var i=0; i <= creature.methods.create._before.length + 1; i++) {
    creature.methods.create._before.pop();
  }
  t.equal(creature.methods.create.before.length, 0);
  t.equal(creature.methods.create._before.length, 0);
  t.end();
});

test("run creature.create again - with any before hooks", function (t) {
  creature.create({ id: 'bobby' }, function(err, result){
    t.equal(result.id, 'bobby');
    t.end();
  });
});

test("defining and running creature.poke", function (t) {
  creature.method('poke', function(data){
    return data;
  });
  t.equal('poked!', creature.poke('foo'));
  t.end();
});

test("adding creature.after('create')", function (t) {
  t.equal(creature.create._after.length, 0);
  creature.after('create', function (data) {
    t.equal('jimmy', data.id);
  });
  t.equal(creature.create.after.length, 1);
  creature.create({ id: 'jimmy' }, function(err, result){
    t.type(err, "null");
    t.end();
  });
});

test("adding another creature.after('create')", function (t) {
  t.equal(creature.create._after.length, 1);
  creature.after('create', function (data) {
    console.log('send out an email to ', data.id)
    t.equal('jimmy', data.id);
  });
  t.equal(creature.create.after.length, 2);
  creature.create({ id: 'jimmy' }, function(err, result){
    t.type(err, "null");
    t.end();
  });
});