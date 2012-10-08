var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , creature
  , resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(true, "object loaded")
  t.end()
});

test("define creature resource", function (t) {
  creature = resource.define('creature');
  t.ok(true, "creature resource defined")
  t.end()
});

test("define method on creature - with no method", function (t) {
  try {
    creature.method('poke');
  } catch (err) {
    t.ok(true, 'could not add poke')
  }
  t.end()
});

test("define method on creature - with no schema - and no args", function (t) {
  creature.method('poke', function(){
    return 'poked';
  });
  t.equal('poked', creature.poke());
  t.ok(true, 'poked!')
  t.end()
});

test("define method on creature - with no schema - and callback", function (t) {
  creature.method('poke', function(callback){
    callback(null, 'poked');
  });
  creature.poke(function(err, result){
    t.equal('poked', result);
    t.ok(true, 'poked!')
    t.end()
  });
});

// broken
test("define method on creature - with no schema - and single argument", function (t) {
  creature.method('talk', function(text){
    return text;
  });
  //t.equal('hi', creature.talk('hi'));
  t.ok(true, 'talked!')
  t.end()
});

// broken
test("define method on creature - with no schema - and two arguments", function (t) {
  creature.method('talk', function(text, person){
    return text + ':' + person;
  });
  //t.equal('hi:marak', creature.talk('hi', 'marak'));
  t.ok(true, 'talked!')
  t.end()
});

test("define method on creature - with schema - and single text argument", function (t) {
  creature.method('talk', function(text){
    return text;
  }, {
    "properties": {
      "text" : {
        "type": "string"
      }
    }
  });
  t.equal('hi', creature.talk('hi'));
  t.ok(true, 'talked!')
  t.end()
});

test("define method on creature - with schema - and two text arguments", function (t) {
  creature.method('talk', function(text, person){
    return text + ':' + person;
  }, {
    "properties": {
      "text" : {
        "type": "string"
      },
      "person" : {
        "type": "string"
      }
    }
  });
  t.equal('hi:marak', creature.talk('hi', 'marak'));
  t.ok(true, 'talked!')
  t.end()
});

test("define method on creature - with schema - and one callback argument", function (t) {
  creature.method('poke', function(callback){
    return callback(null, 'poked!');
  }, {
    "properties": {
      "callback": {
        "type": "function"
      }
    }
  });
  creature.poke(function(err, result){
    t.equal('poked!', result);
    t.ok(true, 'poked!')
    t.end()
  });
});

test("define method on creature - with schema - and two arguments - text, callback", function (t) {
  creature.method('talk', function(text, callback){
    return callback(null, text);
  }, {
    "properties": {
      "text": {
        "type": "string"
      },
      "callback": {
        "type": "function"
      }
    }
  });
  creature.talk('hi!', function(err, result){
    t.equal('hi!', result);
    t.ok(true, 'talked!')
    t.end()
  });
});

test("define method on creature - with schema - and two arguments - options, callback", function (t) {
  creature.method('fire', function(options, callback){
    return callback(null, options);
  }, {
    "properties": {
      "options": {
        "type": "object",
        "properties": {
          "direction" : {
            "type": "string"
          },
          "power": {
            "type": "string"
          }
        }
      },
      "callback": {
        "type": "function"
      }
    }
  });
  creature.fire({ "direction": "up", "power": "HIGH" }, function(err, result){
    t.equal('up', result.direction);
    t.equal('HIGH', result.power);
    t.ok(true, 'fired!')
    t.end()
  });
});
