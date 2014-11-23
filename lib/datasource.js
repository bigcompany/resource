var datasource = exports;

var nano = require('nano');

var all = require('./datasource/all'),
create = require('./datasource/create'),
destroy = require('./datasource/destroy'),
find = require('./datasource/find'),
get = require('./datasource/get'),
update = require('./datasource/update'),
updateOrCreate = require('./datasource/updateOrCreate');

//
// Persists resource to CouchDB using nano
//
datasource.persist = function persist (r, options) {

  var db = nano(options || 'http://127.0.0.1:5984/resource');
  r.db = db;

  // add datasource persistence methods to resource
  all(r);
  create(r);
  destroy(r);
  find(r);
  get(r);
  update(r);
  updateOrCreate(r);

};
