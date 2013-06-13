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

  t.plan(3);

  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
  });
  creature.once('talk', function (data) {
    t.equal('hi', data, 'talk fired - data == "hi"');
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

  t.plan(3);

  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
  });
  creature.once('talk', function (data) {
    t.equal('hi', data, 'talk fired - data == "hi"');
  });
  t.equal('hi', creature.talk('hi'), 'creature.talk returned - result == "hi"');
});

test("define method on creature - with no schema - invoke with string argument and callback", function (t) {
  creature.method('talk', function (text, callback) {
    callback(null, text);
  });

  t.plan(4);

  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
  });
  creature.once('talk', function (data) {
    t.equal('hi', data, 'talk fired - data == "hi"');
  });
  creature.talk('hi', function (err, result) {
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

  t.plan(3);

  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired');
  });
  creature.once('talk', function (data) {
    t.equal('hi', data, 'talk fired - data == "hi"');
  });
  t.equal('hi', creature.talk('hi'), 'creature.talk returned - result == "hi"');
});

test("emit events manually on creature scope", function (t) {
  t.plan(2);
  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
  });
  creature.once('talk', function (data) {
    t.equal('hi', data, 'talk fired - data == "hi"');
  });
  creature.emit('talk', 'hi');
});

test("emit events manually on resource scope", function (t) {
  t.plan(2);
  resource.once('creature::talk', function(){
    t.ok(true, 'creature::talk fired');
  });
  creature.once('talk', function (data) {
    t.ok(true, 'talk fired');
  });
  resource.emit('creature::talk');
});
