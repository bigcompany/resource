/*

 A quick primer on working with Events and Resource Methods

 The resource module itself is an Event Emitter

   resource.emit('hello', fn)

 All defined resource methods are also Event Emitters

   creature.on('hello', fn)
   creature.emit('hello', fn)

 When resource methods are executed a local event is emitted

   creature.create({ type: 'dragon' }, fn); => creature.emit('create', { type: 'dragon' });

 When any event is emitted from a resource it is rebroadcasted to the resource module ( namespaced with :: )

  creature.create({ type: 'dragon' }, fn); => resource.emit('creature::create', { type: 'dragon' });

 Inversely, emitted events can also invoke resource methods. Note: This will not cause an infinite loop.

   resource.emit('creature::create', { type: 'dragon' }); => creature.create({ type: 'dragon' }, fn);
   creature.emit('create', { type: 'dragon' }); => creature.create({ type: 'dragon' }, fn);


*/

module['exports'] = function () {
  var resource = require('../'),
      args = [].slice.call(arguments),
      event = args.shift(),
      splitted = event.split('::'),
      r;
  if (splitted.length > 1 && resource[splitted[0]]) {
    r = resource[splitted[0]];
  }
  if (r && r._emit) {
    r._emit.apply(r, [ splitted.slice(1).join('::') ].concat(args));
  }
  return resource._emit.apply(resource, [ event ].concat(args));
};