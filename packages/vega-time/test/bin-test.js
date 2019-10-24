var tape = require('tape'),
    vega = require('../');

tape('timeBin determines time unit bins', function(t) {
  var extent = [new Date(2000, 0, 1), new Date(2001, 0, 1)];

  t.deepEqual(
    vega.timeBin({extent, maxbins: 2}),
    {units: ['year'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 12}),
    {units: ['year', 'month'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366}),
    {units: ['year', 'month', 'date'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24}),
    {units: ['year', 'month', 'date', 'hours'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60}),
    {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'], step: 1}
  );
  t.deepEqual(
    vega.timeBin({extent, maxbins: 366*24*60*60*1000}),
    {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'], step: 1}
  );
  t.end();
});