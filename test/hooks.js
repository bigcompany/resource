//
// Tests for before and after hooks on resource methods
//
var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , id
  , creature
  , resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded")
  t.end()
});

test("define creature resource - with datasource config", function (t) {
  creature = resource.define('creature', { config: { datasource: 'memory' }});
  creature.property('name');
  creature.property('life', {
    "type": "number"
  });
  t.type(creature.config, 'object', 'configuration defined - creature.config is object');
  t.equal(creature.config.datasource, 'memory', 'configuration defined - creature.config.datasource == "memory"');
  t.type(creature.before, 'function', 'hook methods defined - creature.before is function');
  t.type(creature.after, 'function', 'hook methods defined - creature.after is function');
  t.end();
});

test("adding creature.before('create')", function (t) {
  t.equal(creature.create.before.length, 0, 'no before hooks yet on creature');
  creature.before('create', function (data, next) {
    data.name = "larry";
    next(null, data);
  });
  t.equal(creature.create.before.length, 1);
  creature.create({ name: 'bobby' }, function (err, result) {
    id = result.id;
    t.type(err, "null", 'creature.before("create") applied - no error');
    t.equal(result.name, 'larry', 'creature.before("create") applied - result.name == "larry"');
    t.end();
  });
});

test("adding another creature.before('create')", function (t) {
  creature.before('create', function (data, next) {
    data.name = data.name + "-a";
    next(null, data);
  });
  t.equal(creature.create.before.length, 2);
  creature.create({ name: 'bobby' }, function (err, result) {
    t.type(err, "null", 'second creature.before("create") applied - no error');
    t.equal(result.name, 'larry-a', 'second creature.before("create") applied - result.name == "larry-a"');
    t.end();
  });
});

test("attempt to call creature.create with custom bound scope", function (t) {
  creature.create.call({ foo: "bar" }, { name: 'jerry' }, function (err, result) {
    t.type(err, "null", 'no errors');
    t.equal(this.foo, "bar");
    t.end();
  });
});

test("adding another creature.before('create')", function (t) {
  creature.before('create', function (data, next) {
    data.name = data.name + "-b";
    next(null, data);
  });
  t.equal(creature.create.before.length, 3);
  creature.create({ name: 'bobby' }, function (err, result) {
    t.type(err, "null", 'third creature.before("create") applied - no error');
    t.equal(result.name, 'larry-a-b', 'third creature.before("create") applied - result.name == "larry-a-b"');
    t.end();
  });
});

test("remove before hooks on creature.create - run creature.create", function (t) {
  for(var i=0; i <= creature.methods.create.before.length + 1; i++) {
    creature.methods.create.before.pop();
  }
  t.plan(2);
  creature.create({ name: 'bobby' }, function (err, result) {
    t.type(err, "null", 'removed create hooks - no error');
    t.equal(result.name, 'bobby', 'removed create hooks - only beforeAll applied');
    t.end();
  });
});

test("adding creature.before('poke') and creature.after('poke') - before creature.poke is defined", function (t) {
  creature.before('poke', function (data, next) {
    data.text = "poked!";
    return next(null, data);
  });
  creature.after('poke', function (data, next) {
    data.text += '!';
    return next(null, data);
  });
  t.equal(creature.methods.poke.before.length, 1, 'before hook for "poke" still defined');
  creature.method('poke',  function (data, callback) {
    callback(null, data);
  }, { input: { "text" : "string" }});
  creature.poke({ text: "poked" }, function (err, data) {
    t.ok(!err, 'poked! - no error');
    t.equal(data.text, 'poked!!', 'poked! - result is "poked!"');
    t.end();
  });
});

test("adding creature.after('create')", function (t) {
  t.equal(creature.create.after.length, 0);
  creature.after('create', function (data, next) {
    t.equal('jimmy', data.name, 'added after hook - data.name == "jimmy"');
    next(null, data);
  });
  t.equal(creature.create.after.length, 1, 'added after hook - after.length == 1');
  creature.create({ name: 'jimmy' }, function (err, result) {
    t.type(err, "null", 'callback fired - no error');
    t.end();
  });
});

test("define vehicle resource - with datasource config - and before and after hooks added on same tick", function (t) {
  vehicle = resource.define('vehicle', { config: { datasource: 'memory' }});
  vehicle.property('fuel', {
    "type": "number",
    "default": 0
  });
  vehicle.before('create', function (data, next) {
    data.name = "#99";
    next(null, data);
  });
  vehicle.after('create', function (data, next) {
    data.fuel = 100;
    next(null, data);
  });
  t.equal(vehicle.create.before.length, 1);
  vehicle.create({ name: '#88' }, function (err, result) {
    t.type(err, "null", 'vehicle create hooks applied - no error');
    t.equal(result.name, '#99', 'vehicle.before("create") applied - result.name == "#99"');
    t.equal(result.fuel, 100, 'vehicle.after("create") applied - result.fuel == 100');
    t.end();
  });
});

test("define clock resource - with datasource config - and asynchronous before hooks - called twice asynchronously", function (t) {
  var clock = resource.define('clock', { config: { datasource: 'memory' }});

  var clicks = {};

  t.plan(5);
  
  clock.before('create', function (data, next) {
    setTimeout(function () {
      clicks[data.name] = clicks[data.name] || [];
      clicks[data.name].push("tick");
      next(null, data);
    }, 500);
  });

  clock.before('create', function (data, next) {
    setTimeout(function () {
      clicks[data.name] = clicks[data.name] || [];
      clicks[data.name].push("tock");
      next(null, data);
    }, 500);
  });

  t.equal(clock.create.before.length, 2);
  clock.create({ name: 'foo' }, function (err, result) {
    t.type(err, "null", 'clock create hooks applied - no error');
    t.similar(clicks.foo, ['tick', 'tock' ], 'clock.before("create") hooks applied - clicks.foo is ["tick", "tock"]');
  });

  setTimeout(function () {
    clock.create({ name: 'bar' }, function (err, result) {
      t.type(err, "null", 'clock create hooks applied - no error');
      t.similar(clicks.bar, ['tick', 'tock' ], 'clock.before("create") hooks applied - clicks.bar is ["tick", "tock"]');
    });
  }, 250);
});
