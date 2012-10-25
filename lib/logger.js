//
// Simple logging module
//
var logger = exports;

var colors = require('colors');

var levels = {
  info: 'green',
  data: 'grey',
  warn: 'yellow',
  error: 'red',
  event: 'grey',
  exec: 'grey',
  help: 'cyan'
};

//
// logger may be set to silent at anytime by setting logger.silent=true
//
logger.silent = false;

logger.log = function (level, data) {
  if(logger.silent) {
    console.log(level[levels[level]] + ':', data);
  }
}

function hoistLevels (levels) {
  Object.keys(levels).forEach(function(level){
    logger[level] = function (data) {
      logger.log(level, data);
    }
  });
};

function pad (str, count) {
  for (var i = 0; i < count; i++) {
    str += " ";
  }
  return str;
};

logger.put = function (input) {

  if (Array.isArray(input)) {
    //
    // headers
    //
    var headers = [];
    Object.keys(input[0]).forEach(function(prop){
      headers.push(prop);
    })
    logger.data(headers.join(' '));
    //
    // rows
    //
    input.forEach(function(item){
      logger.put(item);
    });
    return;
  }

  if (typeof input === 'object') {
    logger.data('{');
    Object.keys(input).forEach(function(prop){
      logger.data('  ' + prop + ': ' + input[prop]);
    });
    logger.data('}');
    return;
  }

  logger.data(input);
};

hoistLevels(levels);