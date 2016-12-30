var resource = require('../'),
    creature = resource.define('creature');

creature.persist('couch2');

// add some properties
creature.property('name');
creature.property('type');

// add ctime and mtime timestamps
creature.timestamps();

console.log(creature.model)

creature.create({ name: 'bobby', type: 'dragon' }, function (err, result) {
  console.log('created', err);
  console.log(result);
  console.log(result.id);
  console.log(result.type);
  creature.destroy(result.id, function (err, _deleted) {
    console.log('destroyed', err, _deleted);
    creature.get(result.id, function (err, _result) {
      console.log(err);
      console.log(_result);
      console.log(_result.id);
      console.log(_result.type);
    });
  });
});


//
// PROTIP: Try console.log(creature.methods)
//
// console.log(creature.methods);