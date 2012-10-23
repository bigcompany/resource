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

test("define method on creature - with no schema - and single argument", function (t) {
  creature.method('talk', function(text){
    return text;
  });
  t.equal('hi', creature.talk('hi'));
  t.ok(true, 'talked!')
  t.end()
});

test("define method on creature - with no schema - and two arguments", function (t) {
  creature.method('talk', function(text, person){
    return text + ':' + person;
  });
  t.equal('hi:marak', creature.talk('hi', 'marak'));
  t.ok(true, 'talked!')
  t.end()
});

test("define method on creature - with no schema - and callback", function (t) {
  creature.method('talk', function(callback){
    callback(null, 'hi')
  });
  creature.talk(function(err, result){
    t.equal('hi', result);
    t.end()
  });
});

test("define method on creature - with no schema - single argument, and callback", function (t) {
  creature.method('talk', function(text, callback){
    callback(null, text);
  });
  creature.talk('hi', function(err, result){
    t.equal('hi', result);
    t.end()
  });
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

test("define method on creature - with schema - and single text argument - with bad input", function (t) {
  creature.method('talk', function(text){
    return text;
  }, {
    "properties": {
      "text" : {
        "type": "string"
      }
    }
  });
  var result;
  result = creature.talk(123);
  t.equal('type', result[0].attribute);
  t.equal('text', result[0].property);
  t.equal('number', result[0].actual);
  t.ok(true, 'did not talk!');
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

test("define method on creature - with empty schema - and two arguments", function (t) {
  creature.method('talk', function(text, person){
    return text + ':' + person;
  }, {});
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

test("define method on creature - with schema - and two arguments - text, callback - with bad input", function (t) {
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
  creature.talk(123, function(err, result){
    t.equal('type', err.errors[0].attribute);
    t.equal('text', err.errors[0].property);
    t.equal('number', err.errors[0].actual);
    t.ok(true, 'did not talk!');
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

test("define method on creature - with number schema - and good input", function (t) {
  creature.method('hit', function(damage, callback){
    damage++;
    return callback(null, damage);
  }, {
    "properties": {
      "damage": {
        "type": "number"
      },
      "callback": {
        "type": "function"
      }
    }
  });
  creature.hit(8999, function(err, result){
    t.equal(result, 9000);
    t.ok(true, 'hit for 9000!');
    t.end()
  });
});

test("define method on creature - with number schema - and bad input", function (t) {
  creature.method('hit', function(damage, callback){
    damage++;
    return callback(null, damage);
  }, {
    "properties": {
      "damage": {
        "type": "number"
      },
      "callback": {
        "type": "function"
      }
    }
  });
  creature.hit("abc", function(err, result){
    t.equal('type', err.errors[0].attribute);
    t.equal('damage', err.errors[0].property);
    t.equal('string', err.errors[0].actual);
    t.end()
  });
});