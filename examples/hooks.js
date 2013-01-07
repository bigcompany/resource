var resource = require('../'),
    creature = resource.define('creature');

creature.persist('memory');

creature.before('create', function (data, next) {
  console.log('before creature.create')
  data.id += '-a';
  next(null, data)
});

creature.after('create', function (data, next) {
  console.log('after creature.create')
  data.foo = "bar";
  next(null, data);
});

creature.create({ id: 'bobby' }, function (err, result) {
  console.log(err, result);
});