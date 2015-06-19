var util = require('datalib/src/util'),
    config = require('./config'),
    ts;

/* istanbul ignore next */
function write(msg) {
  msg = "[Vega Log] " + msg;
  console.log(msg);
}

/* istanbul ignore next */
function error(msg) {
  msg = "[Vega Err] " + msg;
  console.error(msg);
}

/* istanbul ignore next */
function debug(input, args) {
  if (!config.debug) return;
  var log = Function.prototype.bind.call(console.log, console);
  var state = {
    prevTime:  Date.now() - ts,
    stamp: input.stamp
  };

  if (input.add) {
    util.extend(state, {
      add: input.add.length,
      mod: input.mod.length,
      rem: input.rem.length,
      reflow: !!input.reflow
    });
  }

  log.apply(console, (args.push(JSON.stringify(state)), args));
  ts = Date.now();
};

module.exports = {
  log: write,
  error: error,
  debug: debug
};