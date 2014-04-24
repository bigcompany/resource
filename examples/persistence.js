var resource = require('../'),
    creature = resource.define('creature');

creature.persist('memory'); // could also try, creature.persist('fs')

// add some properties
creature.property('name');
creature.property('type');

// add ctime and mtime timestamps
creature.timestamps();

creature.create({ name: 'bobby', type: 'dragon' }, function (err, result) {
  console.log(err);
  console.log(result);
  console.log(result.id);
  console.log(result.type);
});

//
// PROTIP: Try console.log(creature.methods)
//
// console.log(creature.methods);