var resource = require('../'),
    creature = resource.define('creature');

creature.persist('memory');

creature.property('name');

creature.before('create', function (data, next) {
  console.log('before creature.create')
  data.name += '-a';
  next(null, data)
});

creature.after('create', function (data, next) {
  console.log('after creature.create')
  data.name += "-b";
  next(null, data);
});

creature.create({ name: 'bobby' }, function (err, result) {
  console.log(err, result);
});

creature.on('create', function(data){
  console.log('create has been created!', data)
});

creature.method('eat', function (options, callback){
  callback(null, options);
});

creature.on('eat', function(data){
  console.log('create ate!', data)
});

creature.eat({}, function(){});

creature.emit('eat', "food")


