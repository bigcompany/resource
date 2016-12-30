var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , account
  , creature
  , id
  , secondId
  , resource;

var testDatasource = {
  type: 'memory',
  username: 'admin',
  password: 'password'
};

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

  creature = resource.define('creature');
  creature.persist(testDatasource);

  creature.property('name', { type: "string", unique: true });
  creature.property('life', "number");
  creature.property('type', "string");

  creature.property('metadata', {"type": "object"});
  creature.property('items', []);
  creature.property('moreItems', []);

  t.type(creature.methods, 'object', 'methods defined - creaturess is object');
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

test("executing creature.all with bound scope", function (t) {
  creature.all.call({ foo: "bar" }, function (err, result) {
    t.equal(result.length, 0, 'no creatures');
    t.equal(this.foo, "bar")
    t.end();
  });
});

test("executing creature.create", function (t) {
  creature.create({
    name: 'bobby',
    life: 10,
    type: 'dragon',
    metadata: data,
    items: items,
    moreItems: ["a"]
  }, function (err, result) {
    t.type(err, 'null', 'no error');
    id = result.id;
    t.type(result, 'object', 'result is object');
    t.equal(result.name, 'bobby', 'name is correct');
    t.type(result.metadata, 'object', 'metadata is object');
    t.equal(result.metadata.foo, 'bar');
    t.equal(result.metadata.abc, 123);
    t.equal(result.metadata.data.prop1, 'foo');
    t.equal(result.metadata.data.prop2, 'bar');
    //t.type(result.items, Array, 'items is array');
    //t.type(result.moreItems, Array, 'items is array');
    t.end();
  });
});

test("executing creature.updateOrCreate with unique creature name on same creature", function (t) {
  creature.updateOrCreate({ id: id, name: 'bobby'}, function (err, res){
    t.type(err, 'null', 'no error');
    t.end();
  })
});

test("executing creature.create with conflicting unique creature name", function (t) {
  creature.create({
    name: 'bobby',
    life: 10,
    type: 'dragon',
    metadata: data,
    items: items,
    moreItems: ["a"]
  }, function (err, result) {
    t.type(err, 'object');
    t.end();
  });
});

test("executing creature.updateOrCreate with conflicting unique creature name", function (t) {
  creature.updateOrCreate({
    name: 'bobby',
    life: 10,
    type: 'dragon',
    metadata: data,
    items: items,
    moreItems: ["a"]
  }, function (err, result) {
    t.type(err, 'object');
    t.end();
  });
});

test("executing creature.create with a new creature", function (t) {
  creature.create({
    name: 'larry',
    life: 20,
    type: 'unicorn',
    metadata: data,
    items: items,
    moreItems: ["b"]
  }, function (err, result) {
    t.type(err, 'null', 'no error');
    secondId = result.id;
    t.type(result, 'object', 'result is object');
    t.equal(result.name, 'larry', 'name is correct');
    t.type(result.metadata, 'object', 'metadata is object');
    t.equal(result.metadata.foo, 'bar');
    t.equal(result.metadata.abc, 123);
    t.equal(result.metadata.data.prop1, 'foo');
    t.equal(result.metadata.data.prop2, 'bar');
    //t.type(result.items, Array, 'items is array');
    //t.type(result.moreItems, Array, 'items is array');
    t.end();
  });
});

test("executing creature.updateOrCreate with id and conflicting unique creature name", function (t) {
  creature.updateOrCreate({ id: secondId, name: 'bobby'}, function (err, res){
    t.type(err, 'object');
    t.end();
  })
});

test("executing creature.update with id and conflicting unique creature name", function (t) {
  creature.update({ id: secondId, name: 'bobby'}, function (err, res){
    t.type(err, 'object');
    t.end();
  })
});

test("executing creature.get", function (t) {
  creature.get(id, function (err, result) {
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'result is object');
    t.type(result.metadata, 'object', 'metadata is object');
    t.equal(result.metadata.foo, 'bar');
    t.equal(result.metadata.abc, 123);
    t.equal(result.metadata.data.prop1, 'foo');
    t.equal(result.metadata.data.prop2, 'bar');
    //t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing creature.all", function (t) {
  creature.all(function (err, result) {
    t.equal(result.length, 2, 'two creatures');
    t.end();
  });
});

test("executing creature.create - with bad input", function (t) {
  creature.create({ life: "abc" }, function (err, result) {
    t.type(err, 'object', 'continues correct validation error - err is object');
    t.type(result, 'object', 'continues correct validation error - err.errors is object');
    t.equal(result.errors.length, 1, 'continues correct validation error - one validation error');
    t.equal(result.errors[0].constraint, 'type', 'continues correct validation error - attribute == "type"');
    t.equal(result.errors[0].property, 'life', 'continues correct validation error - property == "life"');
    t.equal(result.errors[0].expected, 'number', 'continues correct validation error - expected == "number"');
    t.equal(result.errors[0].actual, 'string', 'continues correct validation error - actual == "string"');
    t.end();
  });
});

test("executing creature.update", function (t) {
  creature.update({ id: id, name: 'dave' }, function (err, result) {
    t.type(err, 'null', 'updated dave - no error');
    t.type(result, 'object', 'updated dave - result is object');
    t.equal(result.name, "dave", 'updated dave - result.name == dave');
    t.equal(result.life, 10, 'updated dave - result.life == 10');
    t.equal(result.type, "dragon", 'updated dave - result.type == dragon');
    //t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing creature.update", function (t) {
  creature.update({ id: id, name: 'bobby', life: 9999, items: items }, function (err, result) {
    console.log('bbbb', err, result)
    t.type(err, 'null', 'updated bobby - no error');
    t.type(result, 'object', 'updated bobby - result is object');
    t.equal(result.life, 9999, 'updated bobby - result.life == 9999');
    t.equal(result.type, "dragon", 'updated bobby - result.type == dragon');
    //t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing creature.get to check updated data", function (t) {
  creature.get(id, function (err, result) {
    t.type(err, 'null', 'updated bobby - no error');
    t.type(result, 'object', 'updated bobby - result is object');
    t.equal(result.life, 9999, 'updated bobby - result.life == 9999');
    //t.type(result.items, Array, 'items is array');
    t.end();
  });
});

test("executing create.update - when creature does not exist", function (t) {
  creature.update({ id: 'foo', name: 'larry' }, function (err, result) {
    t.type(err, 'object', 'an error');
    t.equal(!result, true, 'no result');
    //t.equal(err.message, 'foo not found', 'could not find larry');
    t.end();
  });
});

test("executing creature.destroy", function (t) {
  creature.destroy(id, function (err, result) {
    t.type(result, 'object', 'destroyed bobby');
    t.end();
  });
});

test("executing creature.destroy", function (t) {
  creature.destroy(secondId, function (err, result) {
    t.type(result, 'object', 'destroyed bobby');
    t.end();
  });
});
