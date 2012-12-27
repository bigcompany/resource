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
  t.type(creature.config, 'object', 'configuration defined - creature.config is object');
  t.equal('memory', creature.config.datasource, 'configuration defined - creature.config.datasource == "memory"');
  t.type(creature.before, 'function', 'hook methods defined - creature.before is function');
  t.type(creature.after, 'function', 'hook methods defined - creature.after is function');
  t.end()
});

test("adding a module-scoped Resource.beforeAll(fn)", function (t) {
  resource.beforeAll(function (data, callback) {
    data.id = "not-bobby";
    callback(null, data);
  });
  creature.create({ id: 'bobby' }, function(err, result){
    t.type(err, "null", 'beforeAll applies - no error');
    t.equal('not-bobby', result.id, 'beforeAll applied - result.id == "not-bobby"');
    t.end();
  });
});

test("adding creature.before('create')", function (t) {
  t.equal(creature.create.before.length, 0, 'no before hooks yet on creature');
  creature.before('create', function (data, next) {
    data.id = "larry";
    next(null, data);
  });
  t.equal(creature.create.before.length, 1);
  creature.create({ id: 'bobby' }, function(err, result){
    t.type(err, "null", 'creature.before("create") applied - no error');
    t.equal(result.id, 'larry', 'creature.before("create") applied - result.id == "larry"');
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
    t.type(err, "null", 'second creature.before("create") applied - no error');
    t.equal(result.id, 'larry-a', 'second creature.before("create") applied - result.id == "larry-a"');
    t.end();
  });
});

test("run it again", function (t) {
  creature.create({ id: 'bobby' }, function(err, result){
    t.type(err, "null", 'second creature.before("create") still applied - no error');
    t.equal(result.id, 'larry-a', 'second creature.before("create") still applied - result.id == "larry-a"');
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
    t.type(err, "null", 'third creature.before("create") applied - no error');
    t.equal(result.id, 'larry-a-b', 'third creature.before("create") applied - result.id == "larry-a-b"');
    t.end();
  });
});

test("run it again", function (t) {
  creature.create({ id: 'bobby' }, function(err, result){
    t.type(err, "null", 'third creature.before("create") still applied - no error');
    t.equal(result.id, 'larry-a-b', 'third creature.before("create") still applied - result.id == "larry-a-b"');
    t.end();
  });
});

test("remove before hooks on creature.create - run creature.create", function (t) {
  for(var i=0; i <= creature.methods.create.before.length + 1; i++) {
    creature.methods.create.before.pop();
  }
  t.equal(creature.methods.create.before.length, 0, 'removed create hooks - before.length == 0');
  creature.create({ id: 'bobby' }, function(err, result){
    t.type(err, "null", 'removed create hooks - no error');
    t.equal(result.id, 'not-bobby', 'removed create hooks - only beforeAll applied');
    t.end();
  });
});

test("remove beforeAll hooks on resource - run creature.create", function (t) {
  for(var i=0; i <= resource.before.length + 1; i++) {
    resource.before.pop();
  }
  t.equal(resource.before.length, 0, 'removed beforeAll hooks - before.length == 0');
  creature.create({ id: 'bobby' }, function(err, result){
    t.type(err, "null", 'removed beforeAll hooks - no error');
    t.equal(result.id, 'bobby', 'removed beforeAll hooks - result.id == "bobby"');
    t.end();
  });
});

test("adding creature.before('poke') - before creature.poke is defined", function (t) {
  creature.before('poke', function (data, next) {
    data = "poked!";
    return next(null, data);
  });
  t.equal(creature.methods.poke.before.length, 1, 'before hook for "poke" still defined');
  t.end();
});

test("defining and running creature.poke", function (t) {
  creature.method('poke', function(data, callback){
    callback(null, data);
  });
  creature.poke('poked!', function (err, data) {
    t.ok(!err, 'poked! - no error');
    t.equal('poked!', data, 'poked! - result is "poked!"');
    t.end();
  });
});

test("adding creature.after('create')", function (t) {
  t.equal(creature.create.after.length, 0);
  creature.after('create', function (data, next) {
    t.equal('jimmy', data.id, 'added after hook - data.id == "jimmy"');
    next(null, data);
  });
  t.equal(creature.create.after.length, 1, 'added after hook - after.length == 1');
  creature.create({ id: 'jimmy' }, function(err, result){
    t.type(err, "null", 'callback fired - no error');
    t.end();
  });
});

test("adding another creature.after('create')", function (t) {
  t.plan(4);
  t.equal(creature.create.after.length, 1);
  creature.after('create', function (data, next) {
    t.equal('jimmy', data.id, 'added second after hook - data.id == "jimmy"');
    next(null, data);
  });
  t.equal(creature.create.after.length, 2, 'added second after hook - after.length == 2');
  creature.create({ id: 'jimmy' }, function(err, result){
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
    data.id = "#99";
    next(null, data);
  });
  vehicle.after('create', function (data, next) {
    data.fuel = 100;
    next(null, data);
  });
  t.equal(vehicle.create.before.length, 1);
  vehicle.create({ id: '#88' }, function(err, result){
    t.type(err, "null", 'vehicle create hooks applied - no error');
    t.equal(result.id, '#99', 'vehicle.before("create") applied - result.id == "#99"');
    t.equal(result.fuel, 100, 'vehicle.after("create") applied - result.fuel == 100');
    t.end();
  });
});

test("define vehicle resource - with datasource config - and before and after hooks added on same tick", function (t) {
  var vehicle = resource.define('vehicle', { config: { datasource: 'memory' }});
  vehicle.property('fuel', {
    "type": "number",
    "default": 0
  });
  vehicle.before('create', function (data, next) {
    data.id = "#99";
    next(null, data);
  });
  vehicle.after('create', function (data, next) {
    data.fuel = 100;
    next(null, data);
  });
  t.equal(vehicle.create.before.length, 1);
  vehicle.create({ id: '#88' }, function(err, result){
    t.type(err, "null", 'vehicle create hooks applied - no error');
    t.equal(result.id, '#99', 'vehicle.before("create") applied - result.id == "#99"');
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
      clicks[data.id] = clicks[data.id] || [];
      clicks[data.id].push("tick");
      next(null, data);
    }, 500);
  });

  clock.before('create', function (data, next) {
    setTimeout(function () {
      clicks[data.id] = clicks[data.id] || [];
      clicks[data.id].push("tock");
      next(null, data);
    }, 500);
  });

  t.equal(clock.create.before.length, 2);
  clock.create({ id: 'foo' }, function(err, result){
    t.type(err, "null", 'clock create hooks applied - no error');
    t.similar(clicks.foo, ['tick', 'tock' ], 'clock.before("create") hooks applied - clicks.foo is ["tick", "tock"]');
  });

  setTimeout(function () {
    clock.create({ id: 'bar' }, function(err, result){
      t.type(err, "null", 'clock create hooks applied - no error');
      t.similar(clicks.bar, ['tick', 'tock' ], 'clock.before("create") hooks applied - clicks.bar is ["tick", "tock"]');
    });
  }, 250);
});

test("adding another creature.after('create')", function (t) {
  t.equal(creature.create.after.length, 2);

  creature.after('create', function (data, next) {
    data.life = 999;
    next(null, data);
  });

  t.equal(creature.create.after.length, 3);

  creature.after('create', function (data, next) {
    //
    // Remark: To modify .id requires creating a new object
    // TODO: look into JugglingDB adapter to determine why
    //
    var obj = {};
    Object.keys(data).forEach(function (prop) {
      obj[prop] = data[prop];
    });
    obj.id = "bobby";
    next(null, obj);
  });

  creature.create({ id: 'jimmy', life: 1 }, function (err, data){
    t.equal(data.id, 'bobby', 'added second after hook - data.id == "bobby"');
    t.equal(data.life, 999, 'data.life == 999');

    t.type(err, "null", 'callback fired - no error');
    t.end();
  });
});