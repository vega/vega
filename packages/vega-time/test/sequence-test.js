var tape = require('tape'),
    vega = require('../'),
    {local, utc} = require('./util');

function test(t, sequence, offset, unit, start, steps) {
  const seq1 = range(steps).map(s => +offset(unit, start, s)),
        seq2 = sequence(unit, start, seq1[seq1.length - 1] + 1);
  t.deepEqual(seq1, seq2.map(_ => +_));
}

function range(n) {
  const a = Array(n);
  for (let i = 0; i<n; ++i) a[i] = i;
  return a;
}

tape('timeSequence generates local date sequences', t => {
  test(t, vega.timeSequence, vega.timeOffset, 'year', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'quarter', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'month', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'week', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'date', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'day', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'dayofyear', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'hours', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'minutes', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'seconds', local(2012), 10);
  test(t, vega.timeSequence, vega.timeOffset, 'milliseconds', local(2012), 10);
  t.end();
});

tape('utcSequence generates utc date sequences', t => {
  test(t, vega.utcSequence, vega.utcOffset, 'year', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'quarter', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'month', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'week', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'date', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'day', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'dayofyear', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'hours', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'minutes', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'seconds', utc(2012), 10);
  test(t, vega.utcSequence, vega.utcOffset, 'milliseconds', utc(2012), 10);
  t.end();
});
