var tape = require('tape'),
    vega = require('../');


tape('logger calls a custom log handler', t => {
  let called = false;
  function log() {
    called = true;
  }

  // tested first since this handler is used for testing the next parts
  const warnLogger = vega.logger(vega.Warn, undefined, log);
  warnLogger.warn('a warning');
  t.true(called);

  t.end();
});

tape('logger has a log level', t => {
  let logArgs;
  function log(...args) {
    logArgs = args;
  }

  // the default level is None
  const noneLogger = vega.logger(undefined, undefined, log);
  t.equal(noneLogger.level(), vega.None);
  noneLogger.error('an error');
  t.equal(logArgs, undefined);

  // a level can be set at init
  const debugLogger = vega.logger(vega.Debug, undefined, log);
  t.equal(debugLogger.level(), vega.Debug);
  debugLogger.error('an error');
  t.equal(logArgs[2][0], 'an error');
  debugLogger.warn('a warning');
  t.equal(logArgs[2][0], 'a warning');
  debugLogger.info('an info');
  t.equal(logArgs[2][0], 'an info');
  debugLogger.debug('a debug');
  t.equal(logArgs[2][0], 'a debug');

  // a level can be changed
  logArgs = undefined;
  const varyingLogger = vega.logger(vega.None, undefined, log);
  t.equal(varyingLogger.level(), vega.None);
  varyingLogger.error();
  t.equal(logArgs, undefined);
  varyingLogger.level(vega.Error);
  t.equal(varyingLogger.level(), vega.Error);
  varyingLogger.error();
  t.equal(logArgs[0], 'error');

  t.end();
});


tape('logger has a default dynamic method', t => {
  let logArgs;
  function log(...args) {
    logArgs = args;
  }

  // it passes a dynamic method to the handler
  const debugLogger = vega.logger(vega.Debug, undefined, log);
  t.equal(debugLogger.level(), vega.Debug);
  debugLogger.error();
  t.equal(logArgs[0], 'error');
  t.equal(logArgs[1], 'ERROR');
  debugLogger.warn();
  t.equal(logArgs[0], 'warn');
  t.equal(logArgs[1], 'WARN');
  debugLogger.info();
  t.equal(logArgs[0], 'log');
  t.equal(logArgs[1], 'INFO');
  debugLogger.debug();
  t.equal(logArgs[0], 'log');
  t.equal(logArgs[1], 'DEBUG');

  t.end();
});


tape('logger has a static method', t => {
  let logArgs;
  function log(...args) {
    logArgs = args;
  }

  // it passes a static method to the handler
  const debugLogger = vega.logger(vega.Debug, 'log', log);
  t.equal(debugLogger.level(), vega.Debug);
  debugLogger.error();
  t.equal(logArgs[0], 'log');
  t.equal(logArgs[1], 'ERROR');
  debugLogger.warn();
  t.equal(logArgs[0], 'log');
  t.equal(logArgs[1], 'WARN');
  debugLogger.info();
  t.equal(logArgs[0], 'log');
  t.equal(logArgs[1], 'INFO');
  debugLogger.debug();
  t.equal(logArgs[0], 'log');
  t.equal(logArgs[1], 'DEBUG');

  t.end();
});
