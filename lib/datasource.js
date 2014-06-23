var datasource = exports;

var juggler = require('jugglingdb');

var all = require('./datasource/all'),
create = require('./datasource/create'),
destroy = require('./datasource/destroy'),
find = require('./datasource/find'),
get = require('./datasource/get'),
update = require('./datasource/update'),
updateOrCreate = require('./datasource/updateOrCreate');

//
// Persists resource to datasource using JugglingDB
//
datasource.persist = function persist (r, options) {

  options = options || { "type": "memory" };

  if (typeof options === "string") {
    options = {
      type: options
    };
  }

  var Schema = juggler.Schema,
      path = require('path');

  //
  // Create new juggler schema, based on incoming datasource type
  //
  var _type = mappings[options.type] || options.type || 'memory';

  // add datasource persistence methods to resource
  all(r);
  create(r);
  destroy(r);
  find(r);
  get(r);
  update(r);
  updateOrCreate(r);

  // TODO: better support for configuration of additional JugglingDB adapters besides CouchDB / Nano
  options.database = options.database || "resource";
  options.host = options.host || "localhost";
  options.port = options.port || 5984;

  var login = "";
  if (typeof options.username !== "undefined" && typeof options.password !== "undefined") {
    login = options.username + ':' + options.password + '@';
  }
  options.url =  login + options.host  +':' + options.port + '/' + options.database;
  options.path = "resource";

  if (options.ssl) {
    options.url = 'https://' + options.url;
  } else {
    options.url = 'http://' + options.url;
  }

  var schema = new Schema(_type, options);

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
  "couchdb": "nano",
  "couch": "nano"
};

