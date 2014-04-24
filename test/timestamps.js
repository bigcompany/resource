var tap = require("tap")
  , test = tap.test
  , plan = tap.plan
  , creature
  , mtime
  , ctime
  , id
  , resource;

var testDatasource = "memory";

test("load resource module", function (t) {
  resource = require('../');
  t.ok(resource, "object loaded");
  t.end();
});

test("define creature resource - persist to datasource - enabled timestamps", function (t) {

  creature = resource.define('creature');
  creature.persist(testDatasource);
  creature.timestamps();
  creature.property('name', "string");
  t.end();

});

test("executing creature.create - with timestamps", function (t) {
  creature.create({
    name: 'bobby'
  }, function (err, result) {
    t.type(err, 'null', 'no error');
    id = result.id;
    t.type(result.mtime, "number");
    t.type(result.ctime, "number");
    mtime = result.mtime;
    ctime = result.ctime;
    t.type(result, 'object', 'result is object');
    t.equal(result.name, 'bobby', 'name is correct');
    t.end();
  });
});

test("executing creature.get", function (t) {
  creature.get(id, function (err, result) {
    t.type(result.mtime, "number");
    t.type(result.ctime, "number");
    t.type(err, 'null', 'no error');
    t.type(result, 'object', 'result is object');
    t.end();
  });
});

test("executing creature.update", function (t) {
  creature.update({ id: id, name: 'bobby' }, function (err, result) {
    t.type(result.ctime, "number");
    t.type(result.mtime, "number");
    t.equal(ctime, result.ctime);
    t.not(mtime, result.mtime);
    t.true(result.mtime > mtime, "updated mtime is not newer than previous mtime")
    t.type(err, 'null', 'updated bobby - no error');
    t.type(result, 'object', 'updated bobby - result is object');
    t.end();
  });
});
