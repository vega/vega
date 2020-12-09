var tape = require('tape'),
    vega = require('../');

tape('timeBin determines time unit bins', t => {
  const extent = [new Date(2000, 0, 1), new Date(2001, 0, 1)];

  t.deepEqual(
    vega.timeBin({extent: [new Date(2000, 0, 1), new Date(2010, 0, 1)], maxbins: 2}),
    {units: ['year'], step: 5}
  );
  t.deepEqual(
    vega.timeBin({extent: [new Date(2000, 0, 1), new Date(2004, 0, 1)], maxbins: 2}),
    {units: ['year'], step: 2}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 2}),
    {units: ['year'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 5}),
    {units: ['year', 'month'], step: 3}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 13}),
    {units: ['year', 'month'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 53}),
    {units: ['year', 'week'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366}),
    {units: ['year', 'month', 'date'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*2}),
    {units: ['year', 'month', 'date', 'hours'], step: 12}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*4}),
    {units: ['year', 'month', 'date', 'hours'], step: 6}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*8}),
    {units: ['year', 'month', 'date', 'hours'], step: 3}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24}),
    {units: ['year', 'month', 'date', 'hours'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*2}),
    {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 30}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*4}),
    {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 15}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*12}),
    {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 5}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60}),
    {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*2}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'], step: 30}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*4}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'], step: 15}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*12}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'], step: 5}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60*10}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'], step: 100}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60*20}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'], step: 50}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60*50}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'], step: 20}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60*100}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'], step: 10}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60*1000}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'], step: 1}
  );

  t.end();
});
