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
  if (resource.persistence && typeof r.config.datasource !== 'undefined') {
    resource.persistence.enable(r, r.config.datasource);
  }
}