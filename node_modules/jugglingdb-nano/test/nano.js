var jdb = require('jugglingdb'),
    Schema = jdb.Schema,
    test = jdb.test,
    schema = new Schema(__dirname + '/..', {
        url: 'http://localhost:5984/nano-test'
    });

schema.name = 'nano';

test(module.exports, schema);

