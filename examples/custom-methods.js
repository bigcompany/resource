var resource = require('../'),
    creature = resource.define('creature');

function poke (callback) {
  return callback(null, 'poked!');
}
function talk (options, callback) {
  console.log(options.text)
  var result = {
    text: options.text,
    status: 200
  }
  return callback(null, result);
}
function fire (options, callback) {
  var result = {
    status: "fired",
    direction: options.direction,
    power: options.power
  };
  return callback(null, result);
}

creature.method('poke', poke);

creature.method('fire', fire, { 
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
});

creature.method('talk', talk, {
  "text": {
    "type": "string",
    "default": "hello!",
    "required": true
  }
});
creature.on('talk', function (data){
  console.log('talk event fired', data)
})

creature.poke(function(err, result) {
  console.log(err, result)
});

creature.talk({ text: 'hello' }, function(err, result) {
  console.log(err, result)
});

creature.emit('talk', { text: "goodbye"})

