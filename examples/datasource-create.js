var resource = require('../'),
    hook = resource.define('hook');

hook.persist({
  type: 'couch2'
});

// add some properties
hook.property('name', {
  unique: true
});
hook.property('type');

// add ctime and mtime timestamps
hook.timestamps();


hook.create({ name: 'foo2', owner: 'marak' }, function (err, result) {
  if (err) {
    throw err;
  }
  //console.log(err);
  console.log(result);
  console.log(result.id);
  console.log(result.type);
});

//
// PROTIP: Try console.log(hook.methods)
//
// console.log(hook.methods);