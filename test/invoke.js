//
// Tests the resource.helper.invoke method
//

var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , creature
  , resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "resource loaded");
  t.end();
});

test("define creature resource", function (t) {
  creature = resource.define('creature');
  t.ok(creature, "creature resource defined");
  t.end();
});

test("define property on creature", function (t) {
  creature.property('name');
  creature.persist('memory');
  t.end();
});

test("define start method on creature", function (t) {
  var start = function(options, callback) {
    return callback(null, "started");
  };
  creature.method('start', start, {
    properties: {
      // if we change 'options' to 'notOptions', then
      // test of creature.start with empty data fails
      options: {
        type: 'object'
      },
      callback: {
        type: 'function'
      }
    }
  });
  creature.persist('memory');
  t.end();
});

test("create a new creature", function (t) {
  creature.create({ id: 'bob', name: 'bobby d'}, function(err, result){
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.equal(result.name, 'bobby d');
    t.end();
  });
});

test("invoke find with options id ", function (t) {
  resource.helper.invoke(creature.find, { id: 'bob' }, function(err, result){
    t.equal(err, null);
    t.equal(result.length, 1);
    t.equal(result[0].id, 'bob');
    t.equal(result[0].name, 'bobby d');
    t.end();
  });
});

test("invoke get with id", function (t) {
  resource.helper.invoke(creature.get, 'bob', function(err, result){
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.equal(result.name, 'bobby d');
    t.end();
  });
});

test("invoke get with options id", function (t) {
  resource.helper.invoke(creature.get, { id: 'bob' }, function(err, result){
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.equal(result.name, 'bobby d');
    t.end();
  });
});

test("invoke get with extra options", function (t) {
  resource.helper.invoke(creature.get, {id: 'bob', name: 'bobby d'}, function(err, result){
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.equal(result.name, 'bobby d');
    t.end();
  });
});

test("invoke all with undefined data", function (t) {
  resource.helper.invoke(creature.all, undefined, function(err, result) {
    t.equal(err, null, "no error");
    t.equal(result.length, 1, "creature.all returns 1 creature");
    t.equal(result[0].id, 'bob', "creature.all returns bob");
    t.end();
  });
});

test("invoke all with empty data", function (t) {
  resource.helper.invoke(creature.all, {}, function(err, result) {
    t.equal(err, null, "no error");
    t.equal(result.length, 1, "creature.all returns 1 creature");
    t.equal(result[0].id, 'bob', "creature.all returns bob");
    t.end();
  });
});

test("invoke start with empty data", function (t) {
  resource.helper.invoke(creature.start, {}, function(err, result) {
    t.equal(err, null, "no error");
    t.equal(result, "started", "creature.start returns started");
    t.end();
  });
});

test("invoke update with data", function (t) {
  resource.helper.invoke(creature.update, {id: 'bob', name: 'bobby g'}, function(err, result) {
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.equal(result.name, 'bobby g');
    t.end();
  });
});