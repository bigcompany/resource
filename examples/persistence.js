var resource = require('../'),
    creature = resource.define('creature');

creature.persist('memory'); // could also try, creature.persist('fs')
creature.property('type');

creature.create({ id: 'bobby', type: 'dragon' }, function (err, result) {
  console.log(err);
  console.log(result.id);
  console.log(result.type);
});

//
// PROTIP: Try console.log(creature.methods)
//
// console.log(creature.methods);