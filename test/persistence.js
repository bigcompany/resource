var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , creature
  , resource;

//
// Testing metadata
//
var testDatasource = "memory";

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded")
  t.end()
});

test("define creature resource - with datasource config", function (t) {
  creature = resource.define('creature', { config: { datasource: testDatasource }});

  creature.property('life', {
    "type": "number"
  });

  creature.property('metadata', {
    "type": "object"
  });

  creature.property('items', {
    "type": "array"
  });

  t.type(creature.config, 'object', 'configuration defined - creature.config is object');
  t.equal(testDatasource, creature.config.datasource, ('configuration defined - creature.config.datasource == "' + testDatasource + '"'));

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

//
// A simple data object to use for testing resource properties of type "object"
//
var data = {
  "foo": "bar",
  "abc": 123,
  "data" : {
    "prop1" : "foo",
    "prop2" : "bar"
  }
},
items = [
  { "foo": "bar" },
  { "abc": 123 }
];

test("executing creature.all", function (t) {
  creature.all(function(err, result){
    t.equal(result.length, 0, 'no creatures');
    t.end();
  });
});

test("executing creature.create", function (t) {
  creature.create({
    id: 'bobby',
    metadata: data,
    items: items // array property current has serialization issue
  }, function(err, result){
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'result is object');
    t.equal(result.id, 'bobby', 'id is correct');
    t.type(result.metadata, 'object', 'metadata is object');
    t.equal(result.metadata.foo, 'bar');
    t.equal(result.metadata.abc, 123);
    t.equal(result.metadata.data.prop1, 'foo');
    t.equal(result.metadata.data.prop2, 'bar');

    //
    // TODO: fix serialization issue with array property type
    //
    // t.equal(Array.isArray(result.data), true, 'items is array');
    t.end();
  });
});

test("executing creature.create - when already created", function (t) {
  creature.create({
    id: 'bobby',
    metadata: data,
    items: items // array property current has serialization issue
  }, function(err, result){
    t.type(err, 'object', 'an error');
    t.equal(!result, true, 'no result');
    t.equal(err.message, 'bobby already exists', 'bobby already exists');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get('bobby', function(err, result){
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'result is object');
    t.type(result.metadata, 'object', 'metadata is object');
    t.equal(result.metadata.foo, 'bar');
    t.equal(result.metadata.abc, 123);
    t.equal(result.metadata.data.prop1, 'foo');
    t.equal(result.metadata.data.prop2, 'bar');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function(err, result) {
    t.equal(result.length, 1, 'one creature');
    t.end();
  });
});

test("executing creature.create - with bad input", function (t) {
  creature.create({ id: 'larry', life: "abc" }, function(err, result){
    t.type(err, 'object', 'continues correct validation error - err is object');
    t.type(err.errors, 'object', 'continues correct validation error - err.errors is object');
    t.equal(err.errors.length, 1, 'continues correct validation error - one validation error');
    t.equal(err.errors[0].attribute, 'type', 'continues correct validation error - attribute == "type"');
    t.equal(err.errors[0].property, 'life', 'continues correct validation error - property == "life"');
    t.equal(err.errors[0].expected, 'number', 'continues correct validation error - expected == "number"');
    t.equal(err.errors[0].actual, 'string', 'continues correct validation error - actual == "string"');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get('larry', function(err, result){
    t.type(err, 'object', 'could not find larry');
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
    t.type(err, 'null', 'updated bobby - no error');
    t.type(result, 'object', 'updated bobby - result is object');
    t.equal(result.life, 9999, 'updated bobby - result.life == 9999');
    t.end();
  });
});

test("executing creature.destroy", function (t) {
  creature.destroy('bobby', function(err, result){
    t.type(result, 'null', 'destroyed bobby');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get('bobby', function(err, result){
    t.type(err, 'object', 'could not find bobby');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function(err, result){
    t.equal(result.length, 0, 'no creatures');
    t.end();
  });
});
