var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    creature,
    resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded");
  t.end();
});

test("define creature resource", function (t) {
  creature = resource.define('creature');
  t.ok(creature, "creature resource defined");
  t.end();
});

test("define method on creature - with no method", function (t) {
  creature.method('poke');
  t.ok(true, 'could add poke');
  t.type(creature.poke, "function")
  t.end();
});

test("define method on creature - with schema - valid input", function (t) {
  creature.method('talk', function (options, callback) {
    callback(null, options.text);
  }, { input: { "text" : "string" }});
  creature.talk({ text: "hi" }, function(err, result){
    t.equal(result, 'hi');
    t.end();
  });
});

test("define method on creature - with schema - invalid input", function (t) {
  creature.method('talk', function (options, callback) {
    callback(null, options.text);
  }, { input: { "text" : "string" }});
  creature.talk({ text: 123 }, function(err, result){
    t.type(err, Object);
    t.type(result, Object);
    t.type(result.errors, Array);
    t.equal(result.errors[0].property, 'text');
    t.equal(result.errors[0].expected, 'string');
    t.equal(result.errors[0].actual, 'number');
    t.end();
  });
});

test("attempt to call resource method with custom bound scope", function (t) {
  creature.talk.call({ foo: "bar" }, { text: 123 }, function(err, result){
    t.equal(this.foo, "bar")
    t.type(err, Object);
    t.type(result.errors, Array);
    t.equal(result.errors[0].property, 'text');
    t.equal(result.errors[0].expected, 'string');
    t.equal(result.errors[0].actual, 'number');
    t.end();
  });
});

// for additional test coverage on resource.method see: mschema and mchema-rpc test suite