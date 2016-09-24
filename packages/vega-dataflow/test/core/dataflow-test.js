var tape = require('tape'),
    vega = require('../../');

tape('Dataflow propagates values', function(test) {
  var df = new vega.Dataflow(),
      s1 = df.add(10),
      s2 = df.add(3),
      n1 = df.add(function(_) { return _.s1 + 0.25; }, {s1:s1}),
      n2 = df.add(function(_) { return _.n1 * _.s2; }, {n1:n1, s2:s2}),
      op = [s1, s2, n1, n2],
      stamp = function(_) { return _.stamp; };

  test.equal(df.stamp(), 0); // timestamp 0

  test.equal(df.run(), 4); // run 4 ops
  test.equal(df.stamp(), 1); // timestamp 1
  test.deepEqual(op.map(stamp), [1, 1, 1, 1]);
  test.equal(n2.value, 30.75);

  test.equal(df.update(s1, 5).run(), 3); // run 3 ops
  test.equal(df.stamp(), 2); // timestamp 2
  test.deepEqual(op.map(stamp), [2, 1, 2, 2]);
  test.equal(n2.value, 15.75);

  test.equal(df.update(s2, 1).run(), 2); // run 2 ops
  test.equal(df.stamp(), 3); // timestamp 3
  test.deepEqual(op.map(stamp), [2, 3, 2, 3]);
  test.equal(n2.value, 5.25);

  test.end();
});
