var resource = require('../'),
    creature = resource.define('creature');

creature.persist('memory');

creature.property('name');

function hello () {
  console.log(this);
}
hello.call({ "foo": "bar" })

creature.before('create', function (data, next) {
  console.log('before creature.create')
  console.log('new bounded scope', this)
  data.name += '-a';
  next(null, data)
});

creature.create.call({ "fudge": "sunday"}, { name: 'bobby' }, function (err, result) {
  console.log('new bounded scope', this)
  console.log(err, result);
});
