module['exports'] = function addProperty(r, name, schema) {

  var resource = require('../');

  if (typeof schema === 'undefined') {
    schema = {
      "type": "string"
    };
  }

  r.schema.properties[name] = schema;
  //
  // When adding new properties to a resource,
  // create an updated JugglingDB Model
  //
  resource.datasource.persist(r, r.config.datasource);
}