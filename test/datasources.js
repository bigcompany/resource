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

  t.type(creature.methods, 'object');
  t.type(creature.methods.create, 'function');
  t.type(creature.methods.get, 'function');
  t.type(creature.methods.find, 'function');
  t.type(creature.methods.destroy, 'function');
  t.ok(creature, "methods defined");

  t.type(creature.create, 'function');
  t.type(creature.get, 'function');
  t.type(creature.find, 'function');
  t.type(creature.destroy, 'function');
  t.ok(creature, "methods hoisted");

  t.end()
});

test("executing creature.all", function (t) {
  creature.all(function(err, result){
    t.equal(result.length, 0);
    t.end();
  });
});

test("executing creature.create", function (t) {
  creature.create({ id: 'bobby' }, function(err, result){
    t.type(err, 'null');
    t.type(result, 'object');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get('bobby', function(err, result){
    t.type(err, 'null');
    t.type(result, 'object');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function(err, result){
    t.equal(result.length, 1);
    t.end();
  });
});

test("executing creature.create - with bad input", function (t) {
  creature.create({ id: 'larry', life: "abc" }, function(err, result){
    t.type(err, 'object');
    t.type(err.errors, 'object');
    t.equal(err.errors.length, 1);
    t.equal(err.errors[0].attribute, 'type');
    t.equal(err.errors[0].property, 'life');
    t.equal(err.errors[0].expected, 'number');
    t.equal(err.errors[0].actual, 'string');
    t.ok(true, 'continues correct validation error');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get('larry', function(err, result){
    t.type(err, 'object');
    t.ok(true, 'could not find larry');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function(err, result){
    t.equal(result.length, 1);
    t.end();
  });
});

test("executing creature.update", function (t) {
  creature.update({ id: 'bobby', life: 9999 }, function(err, result){
    t.type(err, 'null');
    t.type(result, 'object');
    t.equal(result.life, 9999);
    t.ok(true, 'updated bobby');
    t.end();
  });
});

test("executing creature.destroy", function (t) {
  creature.destroy('bobby', function(err, result){
    t.type(result, 'null');
    t.ok(true, 'destroyed bobby');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get('bobby', function(err, result){
    t.type(err, 'object');
    t.ok(true, 'could not find bobby');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function(err, result){
    t.equal(result.length, 0);
    t.end();
  });
});
