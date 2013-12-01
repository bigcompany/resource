var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , creature
  , resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "resource loaded")
  t.end()
});

test("define creature resource", function (t) {
  creature = resource.define('creature');
  t.ok(creature, "creature resource defined")
  t.end()
});

test("define property on creature - with no schema", function (t) {
  creature.property('name'); // should default to string
  t.type(creature.schema, 'object', 'property defined - schema should be an object');
  t.type(creature.schema.properties, 'object', 'property defined - schema.properties is object');
  t.type(creature.schema.properties.name, 'object', 'property defined - schema.properties.name is object');
  t.type(creature.schema.properties.name.type, 'string', 'property defined - schema.properties.name.type is string');
  t.end()
});

test("define property on creature - with schema as string", function (t) {
  creature.property('life', 'number');
  t.type(creature.schema.properties.life, 'object', 'property defined - schema.properties.title is object');
  t.equal(creature.schema.properties.life.type, 'number', 'property defined - schema.properties.title.type is string');
  t.end();
});

test("define property on creature - with schema as object", function (t) {
  creature.property('title', {
    "type": "string"
  });
  t.type(creature.schema.properties.title, 'object', 'property defined - schema.properties.title is object');
  t.equal(creature.schema.properties.title.type, 'string', 'property defined - schema.properties.title.type is string');
  t.end();
});

test("define array property on creature", function (t) {
  creature.property('friends', {
    "type": "array"
  });
  t.equal(creature.schema.properties.friends.type, 'array', 'property defined - schema.properties.friends.type is array');
  t.end();
});
