var tape = require('tape'),
    vega = require('../');

tape('Dataflow propagates values (run)', t => {
  var df = new vega.Dataflow(),
      s1 = df.add(10),
      s2 = df.add(3),
      n1 = df.add(_ => _.s1 + 0.25, {s1:s1}),
      n2 = df.add(_ => _.n1 * _.s2, {n1:n1, s2:s2}),
      op = [s1, s2, n1, n2],
      stamp = function(_) { return _.stamp; };

  t.equal(df.stamp(), 0); // timestamp 0

  // these tests ensure that dataflow evaluation completes synchronously
  // (i.e., subsequent code lines have access to calculated output)
  // if run is invoked with no pending datasets or async operators

  df.run();
  t.equal(df.stamp(), 1); // timestamp 1
  t.deepEqual(op.map(stamp), [1, 1, 1, 1]);
  t.equal(n2.value, 30.75);

  df.update(s1, 5).run();
  t.equal(df.stamp(), 2); // timestamp 2
  t.deepEqual(op.map(stamp), [2, 1, 2, 2]);
  t.equal(n2.value, 15.75);

  df.update(s2, 1).run();
  t.equal(df.stamp(), 3); // timestamp 3
  t.deepEqual(op.map(stamp), [2, 3, 2, 3]);
  t.equal(n2.value, 5.25);

  t.end();
});

tape('Dataflow propagates values (runAsync)', t => {
  var df = new vega.Dataflow(),
      s1 = df.add(10),
      s2 = df.add(3),
      n1 = df.add(_ => _.s1 + 0.25, {s1:s1}),
      n2 = df.add(_ => _.n1 * _.s2, {n1:n1, s2:s2}),
      op = [s1, s2, n1, n2],
      stamp = function(_) { return _.stamp; };

  t.equal(df.stamp(), 0); // timestamp 0

  df.runAsync()
    .then(() => {
      t.equal(df.stamp(), 1); // timestamp 1
      t.deepEqual(op.map(stamp), [1, 1, 1, 1]);
      t.equal(n2.value, 30.75);
      return df.update(s1, 5).runAsync();
    })
    .then(() => {
      t.equal(df.stamp(), 2); // timestamp 2
      t.deepEqual(op.map(stamp), [2, 1, 2, 2]);
      t.equal(n2.value, 15.75);
      return df.update(s2, 1).runAsync();
    })
    .then(() => {
      t.equal(df.stamp(), 3); // timestamp 3
      t.deepEqual(op.map(stamp), [2, 3, 2, 3]);
      t.equal(n2.value, 5.25);
      t.end();
    });
});

tape('Dataflow loads external data', t => {
  var df = new vega.Dataflow(),
      op = df.add(null);

  df.preload(op, null)
    .then(res => {
      t.equal(res.status, -1); // load fail due to bad url
      return df.preload(op, 'README.md', {type: 'json'});
    })
    .then(res => {
      t.equal(res.status, -2); // parse fail due to improper format
      return df.preload(op, 'package.json');
    })
    .then(res => {
      t.equal(res.status, 0); // successful load and parse
      return df.runAsync();
    })
    .then(() => {
      t.equal(op.pulse.add.length, 1);
      t.equal(op.pulse.add[0].name, 'vega-dataflow');
      t.end();
    });
});

tape('Dataflow handles errors', t => {
  var df = new vega.Dataflow(),
      error = 0;

  df.error = function() { error = 1; };
  df.add(() => { throw Error('!!!'); });

  df.run();

  t.equal(error, 1);
  t.equal(df._pulse, null);
  t.equal(Object.keys(df._input).length, 0);
  t.equal(df._postrun.length, 0);
  t.equal(df._heap.size(), 0);
  t.end();
});

tape('Dataflow accepts new logger', t => {
  const store = [];
  const logger = {
    level: lvl => store.push('level:'+lvl),
    error: msg => store.push(msg),
    warn: msg => store.push(msg),
    info: msg => store.push(msg),
    debug: msg => store.push(msg)
  };
  const df = new vega.Dataflow().logger(logger);

  df.logLevel(99);
  df.error('error');
  df.warn('warn');
  df.info('info');
  df.debug('debug');

  t.deepEqual(store, ['level:99', 'error', 'warn', 'info', 'debug']);
  t.end();
});
