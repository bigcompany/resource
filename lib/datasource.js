var datasource = exports;

var all = require('./datasource/all'),
create = require('./datasource/create'),
destroy = require('./datasource/destroy'),
find = require('./datasource/find'),
get = require('./datasource/get'),
update = require('./datasource/update'),
updateOrCreate = require('./datasource/updateOrCreate');


var juggler = require('loopback-datasource-juggler');

//
// Enables a resource to persistence by
// creating a JugglingDB model to back the resource,
// allowing the resource to be instantiable and backed by a datasource
//
datasource.persist = function persist (r, options) {

  options = options || { "type": "memory" };

  if(typeof options === "string") {
    options = {
      type: options
    };
  }

  //
  // Require JugglingDB.Schema
  //
  var Schema = juggler.Schema,
      path = require('path');

  //
  // Create new juggler schema, based on incoming datasource type
  //
  var _type = mappings[options.type] || options.type || 'fs';

  // add datasource persistence methods to resource

  all(r);
  create(r);
  destroy(r);
  find(r);
  get(r);
  update(r);
  updateOrCreate(r);

  var schema = new Schema(_type, {
    database: options.name || "big",
    host: options.host,
    port: options.port,
    path: options.path || 'db',
    username: options.username,
    password: options.password,
    options: options.options,
    https: true // TODO: check that HTTPS actually does something
  });

  //
  // Create empty schema object for mapping between resource and JugglingDB
  //
  var _schema = {};

  //
  // For every property in the resource schema, map the property to JugglingDB
  //
  Object.keys(r.schema.properties).forEach(function(p){
    var prop = r.schema.properties[p];
    _schema[p] = { type: jugglingType(prop) };
  });
  
  function jugglingType(prop) {
    var typeMap = {
      'string': String,
      'number': Number,
      'integer': Number,
      'array': Array,
      'boolean': Boolean,
      'object': Object,
      'null': null,
      'any': String
    };
    var type = typeMap[prop.type] || String;
    if(Array.isArray(prop)) {
      type = Array;
    }
    return type;
  }

  //
  // Create a new JugglingDB schema based on temp schema
  //
  
  var Model = schema.define(r.name, _schema);
  // assign model to resource
  r.model = Model;
}

var mappings = {
  "couchdb": "cradle",
  "couch": "cradle"
};
