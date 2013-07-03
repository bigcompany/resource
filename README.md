# resource

## what is a resource?

 - is a JavaScript object
 - a resource can have methods
 - a resource can have properties
 - a resource can have [npm](http://npmjs.org) dependencies
 - a resource is part of the Resource-View-Presenter development pattern

## why are resources useful?

 - resources easily extend functionality through intelligent dependency injection
 - resources unify validation and invocation code across all business-logic
 - the curated [resources](http://github.com/bigcompany/resources) will solve most of your problems
 - using resources in an existing application is easy

## resource library features

  - a very friendly API
  - dependency injection 
  - intelligent method deferment until each resource's dependencies are satisfied
  
## resources library

The `resources` library provides a robust set of [pre-defined resources](http://github.com/bigcompany/resources). These are useful for tackling many of the issues involved with solving the domain problem of building applications for the web.

 - `persistence` for resource database persistence
 - `config` for resource configuration 
 - `creature` a simple example resource
 - `bitcoin` for interacting with Bitcoin
 - `admin` web admin for managing resources
 - [many many more !](http://github.com/bigcompany/resources)

## Installation

```bash
npm install resource
```

## Tests

```
tap test
```