var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , account
  , creature
  , resource;

//
// Utility testing functions
//
function isEmpty(o){
  for(var i in o){
      if(o.hasOwnProperty(i)){
          return false;
      }
  }
  return true;
}

//
// Testing metadata
//
var testDatasource = "memory";

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded");
  t.end();
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

test("define creature resource - with datasource config", function (t) {
  creature = resource.define('creature', { config: { datasource: testDatasource }});

  creature.property('life', {
    "type": "number"
  });

  creature.property('metadata', {
    "type": "object"
  });

  creature.property('items', {
    "type": "array",
    "default": []
  });

  creature.property('itemsNoDefault', {
    "type": "array"
  });


  creature.property('moreItems', {
    "type": "array",
    "default": ['a', 'b', 'c']
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

  t.end();
});

test("define account resource - with datasource config", function (t) {
  account = resource.define('account', { config: { datasource: testDatasource }});

  account.property('name', {
    "type": "string"
  });

  account.property('email', {
    "type": "string"
  });

  t.type(account.config, 'object', 'configuration defined - account.config is object');
  t.equal(testDatasource, account.config.datasource, ('configuration defined - account.config.datasource == "' + testDatasource + '"'));

  t.end();
});

test("define space resource - with datasource config", function(t) {
  space = resource.define('space', { config: { datasource: testDatasource }});

  space.property('id', {
    description: 'the name of the space',
    type: 'string',
    required: true
  });

  space.property('resources', {
    description: 'the resources present in this space',
    type: 'object',
    default: {}
  });

  space.property('metadata', {
    description: 'additional metadata',
    type: 'object',
    default: data
  });

  t.type(space.config, 'object', 'configuration defined - space.config is object');
  t.equal(testDatasource, space.config.datasource, ('configuration defined - space.config.datasource == "' + testDatasource + '"'));

  t.type(space.methods, 'object', 'methods defined - space.methods is object');
  t.type(space.methods.create, 'function', 'methods defined - methods.create is function');
  t.type(space.methods.get, 'function', 'methods defined - methods.get is function');
  t.type(space.methods.find, 'function', 'methods defined - methods.find is function');
  t.type(space.methods.destroy, 'function', 'methods defined - methods.destroy is function');

  t.type(space.create, 'function', 'methods hoisted - space.create is function');
  t.type(space.get, 'function', 'methods hoisted - space.get is function');
  t.type(space.find, 'function', 'methods hoisted - space.find is function');
  t.type(space.destroy, 'function', 'methods hoisted - space.destroy is function');

  t.end();
});

test("executing creature.all", function (t) {
  creature.all(function (err, result) {
    t.equal(result.length, 0, 'no creatures');
    t.end();
  });
});

test("executing creature.create", function (t) {
  creature.create({
    id: 'bobby',
    metadata: data,
    items: items // array property currently has serialization issue
  }, function (err, result) {
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'result is object');
    t.equal(result.id, 'bobby', 'id is correct');
    t.type(result.metadata, 'object', 'metadata is object');
    t.equal(result.moreItems[0], 'a', 'default array item set');
    t.equal(result.metadata.foo, 'bar');
    t.equal(result.metadata.abc, 123);
    t.equal(result.metadata.data.prop1, 'foo');
    t.equal(result.metadata.data.prop2, 'bar');
    t.type(result.items, Array, 'items is array');
    t.type(result.itemsNoDefault, Array, 'items is array');
    t.end();
  });
});

test("executing creature.create - when already created", function (t) {
  creature.create({
    id: 'bobby',
    metadata: data,
    items: items // array property current has serialization issue
  }, function (err, result) {
    t.type(err, 'object', 'an error');
    t.equal(result.id, 'bobby', 'bobby already exists');
    t.equal(err.message, 'bobby already exists', 'bobby already exists');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get('bobby', function (err, result) {
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'result is object');
    t.type(result.metadata, 'object', 'metadata is object');
    t.equal(result.metadata.foo, 'bar');
    t.equal(result.metadata.abc, 123);
    t.equal(result.metadata.data.prop1, 'foo');
    t.equal(result.metadata.data.prop2, 'bar');
    t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function (err, result) {
    t.equal(result.length, 1, 'one creature');
    t.end();
  });
});

test("executing creature.create - with bad input", function (t) {
  creature.create({ id: 'larry', life: "abc" }, function (err, result) {
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
  creature.get('larry', function (err, result) {
    t.type(err, 'object', 'could not find larry');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function (err, result) {
    t.equal(result.length, 1);
    t.end();
  });
});


test("executing creature.update", function (t) {
  creature.update({ id: 'bobby', life: 9999 , items: items }, function (err, result) {
    t.type(err, 'null', 'updated bobby - no error');
    t.type(result, 'object', 'updated bobby - result is object');
    t.equal(result.life, 9999, 'updated bobby - result.life == 9999');
    t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing create.update - when creature does not exist", function (t) {
  creature.update({ id: 'larry' }, function (err, result) {
    t.type(err, 'object', 'an error');
    t.equal(!result, true, 'no result');
    t.equal(err.message, 'larry not found', 'could not find larry');
    t.end();
  });
});

test("executing creature.updateOrCreate - with a new id", function (t) {
  creature.updateOrCreate({ id: 'larry', items: items  }, function (err, result) {
    t.type(err, 'null', 'created larry - no error');
    t.type(result, 'object', 'created larry - result is object');
    t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing create.updateOrCreate = with existing id", function (t) {
  creature.updateOrCreate({ id: 'bobby', life: 5, items: items  }, function (err, result) {
    t.type(err, 'null', 'updated bobby - no error');
    t.type(result, 'object', 'updated bobby - result is object');
    t.equal(result.life, 5, 'updated bobby - result.life == 5');
    t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing account.create with same id as a creature", function (t) {
  account.create({
    id: 'bobby'
  }, function (err, result) {
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'result is object');
    t.equal(result.id, 'bobby', 'id is correct');
    t.end();
  });
});

test("creating a space", function(t) {
  space.create({id: "big"}, function (err, result) {
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'space instance is object');
    t.type(result.id, 'string', 'space instance id is string');
    t.equal(result.id, 'big', 'space instance id is correct');
    t.type(result.resources, 'object', 'space instance resources is object');
    t.equal(isEmpty(result.resources), true, 'space instance resources is empty');
    t.end();
  });
});

test("add creature to space", function(t) {
  space.get('big', function(err, _space) {
    t.type(err, 'null', 'no error');
    _space.resources['creature'] = ['bobby'];
    _space.metadata.foo = "tar";
    _space.save(function (err, result) {
      t.type(err, 'null', 'no error');
      t.type(result, 'object', 'space instance is object');
      t.type(result.id, 'string', 'space instance id is string');
      t.equal(result.id, 'big', 'space instance id is correct');
      t.type(result.resources, 'object', 'space instance resources is object');
      t.equal(result.metadata.foo, 'tar', 'metadata property saved');
      t.equal(result.resources.creature.length, 1, 'space instance resources is correct');
      t.equal(result.resources.creature[0], 'bobby', 'space instance resources is correct');
      t.end();
    });
  });
});

test("create another new space", function(t) {
  space.create({id: "big2"}, function (err, result) {
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'space instance is object');
    t.type(result.id, 'string', 'space instance id is string');
    t.equal(result.id, 'big2', 'space instance id is correct');
    t.type(result.resources, 'object', 'space instance resources is object');
    t.equal(result.metadata.foo, 'bar', 'default metadata preserved');
    t.equal(isEmpty(result.resources), true, 'space instance resources is empty');
    t.end();
  });
});

test("executing space.destroy", function (t) {
  t.plan(2);
  space.destroy('big', function (err, result) {
    t.type(result, 'null', 'destroyed space big');
  });
  space.destroy('big2', function (err, result) {
    t.type(result, 'null', 'destroyed space big2');
  });
});

test("executing space.all", function (t) {
  space.all(function (err, result) {
    t.equal(result.length, 0, 'no spaces');
    t.end();
  });
});

test("executing creature.destroy", function (t) {
  t.plan(2);
  creature.destroy('bobby', function (err, result) {
    t.type(result, 'null', 'destroyed bobby');
  });
  creature.destroy('larry', function (err, result) {
    t.type(result, 'null', 'destroyed larry');
  });
});

test("executing account.destroy", function (t) {
  t.plan(1);
  account.destroy('bobby', function (err, result) {
    t.type(result, 'null', 'destroyed bobby');
  });
});

test("executing creature.get", function (t) {
  creature.get('bobby', function (err, result) {
    t.type(err, 'object', 'could not find bobby');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function (err, result) {
    t.equal(result.length, 0, 'no creatures');
    t.end();
  });
});


/*
test("persist creature to couchdb", function (t) {
  creature.persist({ name: "big-test", type: "couchdb", options: { cache: false }});
  t.end();
});
*/