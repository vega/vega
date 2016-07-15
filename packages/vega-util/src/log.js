function log(level, msg) {
  var args = [level].concat([].slice.call(msg));
  console.log.apply(console, args); // eslint-disable-line no-console
}

export var None  = 0;
export var Warn  = 1;
export var Info  = 2;
export var Debug = 3;

export default function(_) {
  var level = _ || None;
  return {
    level: function(_) { if (arguments.length) level = +_; return level; },
    warn: function()   { if (level >= Warn)  log('WARN', arguments);  },
    info: function()   { if (level >= Info)  log('INFO', arguments);  },
    debug: function()  { if (level >= Debug) log('DEBUG', arguments); }
  }
}
