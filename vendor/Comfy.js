/*
  Author: stefan.liden@gmail.com
  NPM Package: https://www.npmjs.com/package/Comfy 
  License: MIT

  Modifications by Marak

*/

"use strict";

// Basic HTTP wrapper for CouchDB 2.0
// Nano is probably a better solution but
// does not support 2.0 yet.

const request = require('request');

// This module is initialized with:
// - url STRING Url to the DB server with port
// - config OBJECT Authentication configuration
// -- user STRING username to the DB server
// -- pass STRING password to the DB server
module.exports = function(url, config) {

    // Create a new database
    // If it already exist that is ok, no error returned
    // - db STRING The name of the database to create
    // - next FUNCTION Callback. Format next(err, result)
    function create(db, next) {
        request({
            method: 'PUT',
            url: url + '/' + db,
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            json: true
            // 'headers': {
            //     'content-type': 'application/json'
            // }
        }, function(err, response) {
            var msg = '';
            var statusCode = 0;
            if (err && err.code === 'ECONNREFUSED') {
                msg = "Could not connect to CouchDB. Please check connection";
                statusCode = 502;
            }
            else {
                statusCode = response.statusCode;
                // If database already exist, it's not an error
                if (response.statusCode == 412) {
                    msg = 'Database ' + db + ' already exist';
                    err = null;
                }
                else if (response.statusCode == 201) {
                    msg = 'Database ' + db + ' was created';
                }
            }
            next(err, {msg: msg, statusCode: statusCode});
        });
    }

    // Create a Mango index (CouchDB 2.0)
    // See: https://docs.cloudant.com/cloudant_query.html#creating-an-index
    // - db STRING The database to contact
    // - index OBJECT The CouchDB index object
    // - next FUNCTION Callback. Format: next(err, result);
    function createIndex(db, index, next) {
        request({
            method: 'POST',
            url: url + '/' + db + '/_index',
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            'json': true,
            'body': index
        }, function(err, response) {
            response = response || {};
            var reply = {};
            if (response && response.body) reply = response.body; 
            next(err, reply);
        });
    }

    // Get a single document using the id
    function get(db, id, next) {
        request({
            method: 'GET',
            url: url + '/' + db + '/' + id,
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            'json': true
        }, function(err, response) {
            response = response || {};
            var body = response.body || {};
            next(err, body);
        });
    }

    // Find documents using Mango queries (CouchDB 2.0)
    // see: https://docs.cloudant.com/cloudant_query.html
    // A query need to have a "selector"
    // return: {docs: [...]}
    function find(db, query, next) {
        request({
            method: 'POST',
            url: url + '/' + db + '/_find',
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            'json': true,
            'body': query
        }, function(err, response) {
            response = response || {};
            var body = response.body || {};
            if (body.warning) {
              console.log('WARNING', body.warning, query)
            }
            next(err, body);
        });
    }

    function insert(db, entry, next) {
        request({
            method: 'POST',
            url: url + '/' + db,
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            'json': true,
            'body': entry
        }, function(err, response) {
            response = response || {};
            var body = response.body || {};
            entry.id = body.id;
            entry._rev = body.rev;
            next(err, entry);
        });
    }

    // When updating a CouchDB document the
    // entire document is replaced
    // _rev id need to be part of entry
    // if _rev id is not the latest, conflic error is returned
    function update(db, id, entry, next) {
        request({
            method: 'PUT',
            url: url + '/' + db + '/' + id,
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            'json': true,
            'body': entry
        }, function(err, response) {
            response = response || {};
            var body = response.body || {};
            next(err, body);
        });
    }

    // This is a convenience method allowing
    // part of a document to be updated
    // Only shallow update
    // It will result in two DB requests (GET & PUT)
    function edit(db, id, data, next) {
        get(db, id, function(err, doc) {
            if (err) {
                next(err, doc);
            }
            else {
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        doc[key] = data[key];
                    }
                }
                update(db, id, doc, function(err, response) {
                    doc._rev = response.rev;
                    next(err, doc);
                });
            }
        });
    }

    function remove(db, id, rev, next) {
        request({
            method: 'DELETE',
            url: url + '/' + db + '/' + id + '?rev=' + rev,
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            'json': true
        }, function(err, response) {
            response = response || {};
            var body = response.body || {};
            if (next) next(err, body);
        });
    }

    function destroy(db, next) {
        request({
            method: 'DELETE',
            url: url + '/' + db + '/',
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            'json': true
        }, function(err, response) {
            response = response || {};
            var body = response.body || {};
            if (next) next(err, body);
        });
    }

    function setup(next) {
        var errors = [];
        request({
            method: 'PUT',
            url: url + '/_global_changes',
            'auth': {
                'user': config.user,
                'pass': config.password
            },
            json: true
        }, function(err, res) {
            if (err) errors.push(err);
            if (res && res.error) errors.push(res.error);
            request({
                method: 'PUT',
                url: url + '/_metadata',
                'auth': {
                    'user': config.user,
                    'pass': config.password
                },
                json: true
            }, function(err, res) {
                if (err) errors.push(err);
                if (res && res.error) errors.push(res.error);
                request({
                    method: 'PUT',
                    url: url + '/_replicator',
                    'auth': {
                        'user': config.user,
                        'pass': config.password
                    },
                    json: true
                }, function(err, res) {
                    if (err) errors.push(err);
                    if (res && res.error) errors.push(res.error);
                    request({
                        method: 'PUT',
                        url: url + '/_users',
                        'auth': {
                            'user': config.user,
                            'pass': config.password
                        },
                        json: true
                    }, function(err, res) {
                        if (err) errors.push(err);
                        if (res && res.error) errors.push(res.error);
                        var error = !!errors.length;
                        next(error, errors);
                    });
                });
            });
        });
    }

    return {
        create: create,
        create_index: createIndex,
        get: get,
        find: find,
        insert: insert,
        update: update,
        edit: edit,
        remove: remove,
        destroy: destroy,
        setup: setup
    };
};
