// TODO: add resource.beforeAll tests

/* 

  Moved from hook.js test
  modifying arguments data resource.beforeAll is a bad idea, needs a smarter test 

  test("adding a module-scoped Resource.beforeAll(fn)", function (t) {
    resource.beforeAll(function (data, callback) {
      data.id = "not-bobby";
      callback(null, data);
    });
    creature.create({ id: 'bobby' }, function (err, result) {
      t.type(err, "null", 'beforeAll applies - no error');
      t.equal('not-bobby', result.id, 'beforeAll applied - result.id == "not-bobby"');
      t.end();
    });
  });

*/
