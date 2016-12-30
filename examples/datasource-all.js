var resource = require('../'),
    creature = resource.define('creature');

creature.persist('couchdb');

// add some properties
creature.property('name');
creature.property('type');

// add ctime and mtime timestamps
creature.timestamps();

creature.all(function (err, results) {
  console.log(err);
  console.log(results);
});

//
// PROTIP: Try console.log(creature.methods)
//
// console.log(creature.methods);