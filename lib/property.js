module['exports'] = function addProperty(r, name, schema) {

  var resource = require('../');

  if (typeof schema === 'undefined') {
    schema = {
      "type": "string"
    };
  }

  if (typeof schema === "string") {
    schema = {
      "type": schema
    };
  }

  r.schema.properties[name] = schema;
  resource.datasource.persist(r, r.config.datasource);

}