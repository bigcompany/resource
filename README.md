# resource

<img src="https://travis-ci.org/bigcompany/resource.svg?branch=master"/>

A resource can be considered a combination of a Model and a Controller. Resource methods can have associated schemas which act as a contract for the input and output of the method. Using resources provides unified invocation and validation of all function arguments and results.

## Features

 - Provides EventEmitters for all resource methods
 - Provides hooks ( before, after ) for all resource methods
 - Methods' input and output arguments are validated with [mschema](http://mschema.org)
 - Built in datasource persistence using [JugglingDB](http://jugglingdb.co/)

### Install with npm

    npm install resource

### Install with [component](https://github.com/component/component)

    component install bigcompany/resource

# API

## resource.define(name, controller [*optional*], mschema [*optional*] )

Defines a new type of Resource.

### name
The name of the new resource to define. Example: `weapon`

### controller
An optional CommonJS module with exported methods. Any functions the CommonJS module exports are interpreted as controller methods.

### mschema
An optional [mschema](http://mschema.org) to the define the properties and methods of the resource using a schema.

## Resource.method(name, fn, mschema [*optional*])
Maps a new function to the resource.

### name
The name of the method as it should appear on the resource. Example: `fire`

### fn
The JavaScript function to bind to the method.

### mschema
An optional [mschema](http://mschema.org) to the define the input and output of the method.

## Resource.property(name, mschema  [*optional*])
Maps a new property to the resource.

### name
The name of the property to add to the resource. Example: `ammo`

### mschema
An optional [mschema](http://mschema.org) to the define the input and output of the method.

## Resource.persist(datasource)
Enables persistence of Resource instances to a datasource. 

**Adds the following methods to the resource:**

 - Resource.all
 - Resource.create
 - Resource.destroy
 - Resource.find
 - Resource.get
 - Resource.update
 - Resource.updateOrCreate


### datasource
The type of datasource to use. Can be string such as `memory` or an object literal such as `{ type: 'couchdb', username: 'foo', password: 'bar' }`

# Tests

```
tap test
```