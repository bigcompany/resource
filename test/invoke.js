//
// Tests the resource.invoke method
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

test("create a new creature", function (t) {
  creature.create({ id: 'bob', name: 'bobby d'}, function(err, res){
    t.equal(err, null);
    t.ok(true, 'created bob');
    t.end();
  });
});

test("invoke find with options id ", function (t) {
  resource.invoke(creature.find, { id: 'bob' }, function(err, result){
    t.equal(err, null);
    t.equal(result.length, 1);
    t.ok(true, 'invoked with options id');
    t.end();
  });
});

test("invoke get with id", function (t) {
  resource.invoke(creature.get, 'bob', function(err, result){
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.ok(true, 'invoked with id');
    t.end();
  });
});

test("invoke get with options id", function (t) {
  resource.invoke(creature.get, { id: 'bob' }, function(err, result){
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.ok(true, 'invoked with options id');
    t.end();
  });
});

test("invoke get with extra options", function (t) {
  resource.invoke(creature.get, {id: 'bob', name: 'bobby d'}, function(err, result){
    t.equal(err, null);
    t.equal(result.id, 'bob');
    t.ok(true, 'invoked with id');
    t.end();
  });
});