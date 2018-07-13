var tape = require('tape'),
    field = require('vega-util').field,
    range = require('d3-array').range,
    vega = require('vega-dataflow'),
    tx = require('../'),
    Sequence = tx.sequence;

tape('Sequence generates sequences', function(test) {
  var df = new vega.Dataflow(),
      start = df.add(0),
      stop = df.add(11),
      step = df.add(null),
      as = df.add(null),
      s = df.add(Sequence, {start:start, stop:stop, step:step, as:as});

  // -- initial run
  df.run();
  test.equal(s.value.length, 11);
  test.deepEqual(s.value.map(field('data')), range(0, 11));
  test.deepEqual(s.pulse.add.map(field('data')), range(0, 11));
  test.deepEqual(s.pulse.rem, []);

  // -- set step size
  df.update(step, 2).run();
  test.equal(s.value.length, 6);
  test.deepEqual(s.value.map(field('data')), range(0, 11, 2));
  test.deepEqual(s.pulse.add.map(field('data')), range(0, 11, 2));
  test.deepEqual(s.pulse.rem.map(field('data')), range(0, 11));

  // -- set output field name
  df.update(as, 'foo').run();
  test.equal(s.value.length, 6);
  test.deepEqual(s.value.map(field('foo')), range(0, 11, 2));
  test.deepEqual(s.pulse.add.map(field('foo')), range(0, 11, 2));
  test.deepEqual(s.pulse.rem.map(field('data')), range(0, 11, 2));

  test.end();
});
