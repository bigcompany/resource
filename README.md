# Resource engine

## Define a new resource
```js
var resource = require('resource'),
    creature = resource.define('creature');
```

## Add resource properties

```js
creature.property('title');
```

## Add resource properties with JSON-Schema

```js
creature.property('type', { type: "string", enum: ['dragon', 'unicorn', 'pony'], default: "dragon"});
creature.property('life', { type: "number", default: 10 });
```

## Persisting resources to a datasource

```js
var resource = require('resource'),
    creature = resource.define('creature');

//
// Can also persist to 'fs', 'mongo', 'couch', etc...
//
creature.persist('memory');

creature.property('type');

creature.create({ id: 'bobby', type: 'dragon' }, function (err, result) {
  console.log(err);
  console.log(result.id);
  console.log(result.type);
});
```
Enabling persistence will also add: `creature.get`, `creature.destroy`, `creature.update`, `creature.find`, `creature.all`.

## Adding resource methods

```js
creature.method('poke', function () {
  return 'poked';
});
```

## Adding resource methods with JSON-Schema for arguments

```js
var talk = function (text) {
  var result = {
    text: text
  }
  return result;
}
creature.method('talk', talk, {
  "description": "echos back a string",
  "properties": {
    "text": {
      "type": "string",
      "default": "hello!",
      "required": true
    }
  }
});
```

## Adding resource methods with complex JSON-Schema arguments

```js
var fire = function (options, callback) {
  var result = {
    status: "fired",
    direction: options.direction,
    power: options.power
  };
  return callback(null, result);
}
creature.method('fire', fire, { 
  "description": "fires a lazer at a certain power and direction",
  "properties": {
    "options": {
      "type": "object",
      "properties": {
        "power": {
          "type": "number",
          "default": 1,
          "required": true
        },
        "direction": {
          "type": "string",
          "enum": ["up", "down", "left", "right"],
          "required": true,
          "default": "up"
        }
      },
      "callback": {
        "type": "function",
        "required": true
      }
    }
}});
```

## Using resource.before() and resource.after() hooks

```js
var resource = require('resource'),
    creature = resource.define('creature');

creature.persist('memory');

creature.before('create', function (data, next) {
  console.log('before creature.create')
  data.id += '-a';
  next(null, data)
});

creature.after('create', function (data, next) {
  console.log('after creature.create')
  data.foo = "bar";
  next(null, data);
});

creature.create({ id: 'bobby' }, function (err, result) {
  console.log(err, result);
  // OUTPUTS: null { id: 'bobby-a', foo: 'bar' }
});
```

## Exporting a resource in a module

```js
var resource = require('../'),
    creature = resource.define('creature');

exports.creature = creature;
```

## Setting NPM Dependencies in a resource

Uses same syntax as npm package.json

```js
exports.dependencies = {
  "colors": "*"
};
```

## Use resources in an application

`resource.use` intelligently loads resources and can lazily install required dependencies while deferring resource method invocation.

```js
//
// resource.use() is the preferred way to load resources
//
var resource = require('resource'),
creature = resource.use('creature');
```

```js
//
// node's built-in require() will also work,
// but is not preferred over resource.use()
//
var creature = require('./creature');
```

## Additional Resources

Additional resources are available at https://github.com/bigcompany/resources

## Tests

```bash
tap test
```