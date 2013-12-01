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
  creature.method('talk', function(options, callback){
    console.log(options.text.red)
    callback(null, options.text);
  }, { input: { text: 'string' }});

  t.plan(4);

  resource.once('creature::talk', function(data){
    t.equal('hi', data, 'creature::talk fired - data == "hi"');
  });
  creature.once('talk', function (data) {
    t.equal('hi', data, 'talk fired - data == "hi"');
  });

  creature.talk({ text: 'hi' }, function(err, result){
    t.equal(err, null);
    t.equal('hi', result, 'creature.talk returned - result == "hi"');
  });
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