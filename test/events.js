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

test("define method on creature - with no schema - invoke with string argument", function (t) {
  creature.method('talk', function(text){
    return text;
  });
  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
    t.end()
  });
  t.equal('hi', creature.talk('hi'), 'creature.talk returned - result == "hi"');
});


test("define method on creature - with schema - single text argument", function (t) {
  creature.method('talk', function(text){
    return text;
  }, {
    "properties": {
      "text" : {
        "type": "string"
      }
    }
  });
  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
    t.end()
  });
  t.equal('hi', creature.talk('hi'), 'creature.talk returned - result == "hi"');
});

test("define method on creature - with no schema - invoke with string argument and callback", function (t) {
  creature.method('talk', function(text, callback){
    callback(null, text);
  });
  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
    t.end()
  });
  creature.talk('hi', function(err, result){
    t.type(err, "null", 'callback fired - no error');
    t.equal(result, 'hi', 'callback fired - result == "hi"');
  });
});

test("define method on creature - with schema - invoke with text argument and callback", function (t) {
  creature.method('talk', function(text){
    return text;
  }, {
    "properties": {
      "text" : {
        "type": "string"
      }
    }
  });
  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired');
    t.end()
  });
  t.equal('hi', creature.talk('hi'), 'creature.talk returned - result == "hi"');
});