var tape = require('tape'),
    field = require('vega-util').field,
    vega = require('vega-dataflow'),
    tx = require('../'),
    Sequence = tx.sequence;

tape('Sequence generates sequences', t => {
  var df = new vega.Dataflow(),
      start = df.add(0),
      stop = df.add(11),
      step = df.add(null),
      as = df.add(null),
      s = df.add(Sequence, {start:start, stop:stop, step:step, as:as}),
      seq_step1 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      seq_step2 = [0, 2, 4, 6, 8, 10];

  // -- initial run
  df.run();
  t.equal(s.value.length, 11);
  t.deepEqual(s.value.map(field('data')), seq_step1);
  t.deepEqual(s.pulse.add.map(field('data')), seq_step1);
  t.deepEqual(s.pulse.rem, []);

  // -- set step size
  df.update(step, 2).run();
  t.equal(s.value.length, 6);
  t.deepEqual(s.value.map(field('data')), seq_step2);
  t.deepEqual(s.pulse.add.map(field('data')), seq_step2);
  t.deepEqual(s.pulse.rem.map(field('data')), seq_step1);

  // -- set output field name
  df.update(as, 'foo').run();
  t.equal(s.value.length, 6);
  t.deepEqual(s.value.map(field('foo')), seq_step2);
  t.deepEqual(s.pulse.add.map(field('foo')), seq_step2);
  t.deepEqual(s.pulse.rem.map(field('data')), seq_step2);

  t.end();
});
