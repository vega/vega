var tape = require('tape'),
    vega = require('../');

tape('timeUnits standardizes time units', t => {
  t.deepEqual(vega.timeUnits('year'), ['year']);
  t.deepEqual(vega.timeUnits(['year']), ['year']);

  t.deepEqual(vega.timeUnits(['year', 'month', 'date']), ['year', 'month', 'date']);
  t.deepEqual(vega.timeUnits(['year', 'date', 'month']), ['year', 'month', 'date']);
  t.deepEqual(vega.timeUnits(['date', 'month', 'year']), ['year', 'month', 'date']);

  t.deepEqual(vega.timeUnits(['year', 'week', 'day']), ['year', 'week', 'day']);
  t.deepEqual(vega.timeUnits(['year', 'day', 'week']), ['year', 'week', 'day']);
  t.deepEqual(vega.timeUnits(['day', 'week', 'year']), ['year', 'week', 'day']);

  t.deepEqual(vega.timeUnits(['year', 'dayofyear']), ['year', 'dayofyear']);
  t.deepEqual(vega.timeUnits(['dayofyear', 'year']), ['year', 'dayofyear']);

  t.deepEqual(vega.timeUnits(['hours', 'minutes', 'seconds']), ['hours', 'minutes', 'seconds']);
  t.deepEqual(vega.timeUnits(['hours', 'seconds', 'minutes']), ['hours', 'minutes', 'seconds']);
  t.deepEqual(vega.timeUnits(['seconds', 'minutes', 'hours']), ['hours', 'minutes', 'seconds']);

  t.throws(() => vega.timeUnits());
  t.throws(() => vega.timeUnits([]));
  t.throws(() => vega.timeUnits('foo'));
  t.throws(() => vega.timeUnits(['foo']));
  t.throws(() => vega.timeUnits(['quarter', 'week']));
  t.throws(() => vega.timeUnits(['month', 'week']));
  t.throws(() => vega.timeUnits(['quarter', 'day']));
  t.throws(() => vega.timeUnits(['month', 'day']));
  t.throws(() => vega.timeUnits(['quarter', 'dayofyear']));
  t.throws(() => vega.timeUnits(['month', 'dayofyear']));
  t.throws(() => vega.timeUnits(['date', 'day']));
  t.throws(() => vega.timeUnits(['date', 'dayofyear']));
  t.throws(() => vega.timeUnits(['day', 'dayofyear']));
  t.throws(() => vega.timeUnits(['week', 'date']));
  t.throws(() => vega.timeUnits(['week', 'dayofyear']));

  t.end();
});
