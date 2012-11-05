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

test("define creature resource", function (t) {
  creature = resource.define('creature');
  t.ok(creature, "creature resource defined")
  t.end()
});

test("define property on creature - with no schema", function (t) {
  creature.property('name'); // should default to string
  t.type(creature.schema, 'object', 'creature.schema should be an object');
  t.type(creature.schema.properties, 'object', 'creature.schema.properties should be an object');
  t.type(creature.schema.properties.name, 'object', 'creature.schema.properties.name should be an object');
  t.type(creature.schema.properties.name.type, 'string', 'creature.schema.properties.name.type should be of type any');
  t.end()
});

test("define property on creature - with schema", function (t) {
  creature.property('title', {
    "type": "string"
  });
  t.type(creature.schema.properties.title, 'object', 'creature.schema.properties.title should be an object');
  t.equal(creature.schema.properties.title.type, 'string');
  t.end();
});

test("define array property on creature", function (t) {
  creature.property('friends', {
    "type": "array"
  });
  t.equal(creature.schema.properties.friends.type, 'array');
  t.end();
});

