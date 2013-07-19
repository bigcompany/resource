/*

 A quick primer on working with Events and Resource Methods

 The resource module itself is an Event Emitter

   resources('hello', fn);
   resource.emit('hello', fn)

 All defined resources are also Event Emitters

   resource.resources.creature.on('hello', fn)
   resource.resources.creature.emit('hello', fn)

 When resource methods are executed on a defined resource, a local resource event is emitted

   resource.resources.creature.create({ type: 'dragon' }, fn); => resource.resources.creature.emit('create', { type: 'dragon' });

 When any event is emitted from a defined resource, it is rebroadcasted to the resource module ( delimited with :: )

  resource.resources.creature.create({ type: 'dragon' }, fn); => resource.emit('creature::create', { type: 'dragon' });

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