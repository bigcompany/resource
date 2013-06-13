//
// Ensures that resource methods will respect pass-through of method arguments,
// should no method schema be available
//

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

test("define method on creature - with no schema - invoke with no args", function (t) {
  creature.method('poke', function() {
    return 'poked';
  });
  t.equal('poked', creature.poke(), 'poked!');
  t.end()
});

test("define method on creature - with no schema - invoke with callback", function (t) {
  creature.method('poke', function (callback) {
    callback(null, 'poked');
  });
  creature.poke(function (err, result) {
    t.equal('poked', result, 'poked!');
    t.end()
  });
});

test("define method on creature - with no schema - invoke with string argument", function (t) {
  creature.method('talk', function(text){
    return text;
  });
  t.equal('hi', creature.talk('hi'), 'talked!');
  t.end()
});

test("define method on creature - with no schema - invoke with two string arguments", function (t) {
  creature.method('talk', function (text, person) {
    return text + ':' + person;
  }, {});
  t.equal('hi:marak', creature.talk('hi', 'marak'), 'talked!');
  t.end()
});

test("define method on creature - with no schema - invoke with string and callback", function (t) {
  creature.method('talk', function (text, callback) {
    callback(null, text);
  });
  creature.talk('hi', function (err, result) {
    t.equal('hi', result, 'talked!');
    t.end()
  });
});

test("define method on creature - with no schema - invoke with options", function (t) {
  creature.method('talk', function(options, callback){
    return options;
  });
  var result = creature.talk({ "at": "bobby", "when": "now" });
  t.equal(result.at, 'bobby', 'talked! - result.at == "bobby"');
  t.equal(result.when, 'now', 'talked! - result.when == "now"');
  t.end()
});

test("define method on creature - with no schema - invoke with options and callback", function (t) {
  creature.method('talk', function(options, callback){
    callback(null, options);
  });
  creature.talk({ "at": "bobby", "when": "now" }, function (err, result) {
    t.equal(result.at, 'bobby', 'talked! - result.at == "bobby"');
    t.equal(result.when, 'now', 'talked! - result.when == "now"');
    t.end()
  });
});