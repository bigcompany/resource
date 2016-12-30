var resource = require('../'),
    hook = resource.define('hook');

hook.persist({
  type: 'couch2',
  database: 'hook'
}); // could also try, hook.persist('fs')

// add some properties
hook.property('name');
hook.property('owner');

// add ctime and mtime timestamps
hook.timestamps();

console.log(hook.model)

hook.find({ owner: 'marak', name: "echo" }, function (err, result) {
  console.log(err);
  console.log(result);
  console.log(result.id);
  console.log(result.type);
});

//
// PROTIP: Try console.log(hook.methods)
//
// console.log(hook.methods);