var vega = require('../');

test('Dataflow propagates values (run)', function() {
  var df = new vega.Dataflow(),
      s1 = df.add(10),
      s2 = df.add(3),
      n1 = df.add(function(_) { return _.s1 + 0.25; }, {s1:s1}),
      n2 = df.add(function(_) { return _.n1 * _.s2; }, {n1:n1, s2:s2}),
      op = [s1, s2, n1, n2],
      stamp = function(_) { return _.stamp; };

  expect(df.stamp()).toBe(0); // timestamp 0

  // these tests ensure that dataflow evaluation completes synchronously
  // (i.e., subsequent code lines have access to calculated output)
  // if run is invoked with no pending datasets or async operators

  df.run();
  expect(df.stamp()).toBe(1); // timestamp 1
  expect(op.map(stamp)).toEqual([1, 1, 1, 1]);
  expect(n2.value).toBe(30.75);

  df.update(s1, 5).run();
  expect(df.stamp()).toBe(2); // timestamp 2
  expect(op.map(stamp)).toEqual([2, 1, 2, 2]);
  expect(n2.value).toBe(15.75);

  df.update(s2, 1).run();
  expect(df.stamp()).toBe(3); // timestamp 3
  expect(op.map(stamp)).toEqual([2, 3, 2, 3]);
  expect(n2.value).toBe(5.25);
});

test('Dataflow propagates values (runAsync)', function(done) {
  var df = new vega.Dataflow(),
      s1 = df.add(10),
      s2 = df.add(3),
      n1 = df.add(function(_) { return _.s1 + 0.25; }, {s1:s1}),
      n2 = df.add(function(_) { return _.n1 * _.s2; }, {n1:n1, s2:s2}),
      op = [s1, s2, n1, n2],
      stamp = function(_) { return _.stamp; };

  expect(df.stamp()).toBe(0); // timestamp 0

  df.runAsync()
    .then(function() {
      expect(df.stamp()).toBe(1); // timestamp 1
      expect(op.map(stamp)).toEqual([1, 1, 1, 1]);
      expect(n2.value).toBe(30.75);
      return df.update(s1, 5).runAsync();
    })
    .then(function() {
      expect(df.stamp()).toBe(2); // timestamp 2
      expect(op.map(stamp)).toEqual([2, 1, 2, 2]);
      expect(n2.value).toBe(15.75);
      return df.update(s2, 1).runAsync();
    })
    .then(function() {
      expect(df.stamp()).toBe(3); // timestamp 3
      expect(op.map(stamp)).toEqual([2, 3, 2, 3]);
      expect(n2.value).toBe(5.25);
      done();
    });
});

test('Dataflow loads external data', function(done) {
  var df = new vega.Dataflow(),
      op = df.add(null);

  df.preload(op, null)
    .then(function(res) {
      expect(res.status).toBe(-1); // load fail due to bad url
      return df.preload(op, 'README.md', {type: 'json'});
    })
    .then(function(res) {
      expect(res.status).toBe(-2); // parse fail due to improper format
      return df.preload(op, 'package.json');
    })
    .then(function(res) {
      expect(res.status).toBe(0); // successful load and parse
      return df.runAsync();
    })
    .then(function() {
      expect(op.pulse.add.length).toBe(1);
      expect(op.pulse.add[0].name).toBe('vega-dataflow');
      done();
    });
});

test('Dataflow handles errors', function() {
  var df = new vega.Dataflow(),
      error = 0;

  df.error = function() { error = 1; };
  df.add(function() { throw Error('!!!') });

  df.run();

  expect(error).toBe(1);
  expect(df._pulse).toBe(null);
  expect(Object.keys(df._pulses).length).toBe(0);
  expect(df._postrun.length).toBe(0);
});
