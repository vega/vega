var tape = require('tape'),
    vega = require('../');

tape('Dataflow propagates values', function(test) {
  var df = new vega.Dataflow(),
      s1 = df.add(10),
      s2 = df.add(3),
      n1 = df.add(function(_) { return _.s1 + 0.25; }, {s1:s1}),
      n2 = df.add(function(_) { return _.n1 * _.s2; }, {n1:n1, s2:s2}),
      op = [s1, s2, n1, n2],
      stamp = function(_) { return _.stamp; };

  test.equal(df.stamp(), 0); // timestamp 0

  df.run();
  test.equal(df.stamp(), 1); // timestamp 1
  test.deepEqual(op.map(stamp), [1, 1, 1, 1]);
  test.equal(n2.value, 30.75);

  df.update(s1, 5).run();
  test.equal(df.stamp(), 2); // timestamp 2
  test.deepEqual(op.map(stamp), [2, 1, 2, 2]);
  test.equal(n2.value, 15.75);

  df.update(s2, 1).run();
  test.equal(df.stamp(), 3); // timestamp 3
  test.deepEqual(op.map(stamp), [2, 3, 2, 3]);
  test.equal(n2.value, 5.25);

  test.end();
});

tape('Dataflow loads external data', function(test) {
  var df = new vega.Dataflow(),
      op = df.add(null);

  df.request(op, null)
    .then(function(v) {
      test.equal(v, -1); // load fail due to bad url
      return df.request(op, 'README.md', {type: 'json'});
    })
    .then(function(v) {
      test.equal(v, -2); // parse fail due to improper format
      return df.request(op, 'package.json');
    })
    .then(function(v) {
      test.equal(v, 0); // successful load and parse
      test.equal(op.pulse.add.length, 1);
      test.equal(op.pulse.add[0].name, 'vega-dataflow');
      test.end();
    });
});

tape('Dataflow handles errors', function(test) {
  var df = new vega.Dataflow(),
      error = 0;

  df.error = function() { error = 1; };
  df.add(function() { throw Error('!!!') });

  df.run();

  test.equal(error, 1);
  test.equal(df._pulse, null);
  test.equal(Object.keys(df._pulses).length, 0);
  test.equal(df._postrun.length, 0);
  test.end();
});
