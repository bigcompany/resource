var tap = require("tap"),
    test = tap.test,
    plan = tap.plan,
    faker,
    resource;

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded");
  t.end();
});

test("define faker resource", function (t) {
  faker = resource.define('faker');
  faker.dependencies = {
    'Faker': '*'
  };
  t.ok(faker, "faker resource defined");
  t.ok(faker.dependencies, "faker dependencies defined");
  t.end();
});

test("define Faker.fullName method", function (t) {
  var fullName = function (callback) {
    var Faker = require('Faker'),
        ret = Faker.Name.findName();
    if (typeof callback === 'function') {
      return callback(null, ret);
    } else {
      return ret;
    }
  };
  faker.method('fullName', fullName);
  t.ok(faker.fullName, "faker.fullName method defined");
  t.end();
});

test("sync call faker.fullName method", function (t) {
  t.ok(faker.fullName(), "faker.fullName returned");
  t.end();
});

test("async call faker.fullName method", function (t) {
  faker.fullName(function(err, str) {
    t.ok(!err, "no error");
    t.ok(str, "faker.fullName returned");
    t.end();
  });
});