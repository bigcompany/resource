var resource = require('../'),
    creature = resource.define('hook');

creature.persist({
  type: 'couch2'
});

creature.model.createIndex({ name: 'generic', index: { fields: ['model', 'owner', 'name'] }}, function (err, result) {
  console.log(err);
  console.log(result);
});

//
// PROTIP: Try console.log(creature.methods)
//
// console.log(creature.methods);