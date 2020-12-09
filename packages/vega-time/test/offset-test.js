var tape = require('tape'),
    vega = require('../'),
    {local, utc} = require('./util');

tape('timeOffset computes local date offsets', t => {
  t.equal(+vega.timeOffset('year', local(2012)), +local(2013));
  t.equal(+vega.timeOffset('year', local(2012), 2), +local(2014));
  t.equal(+vega.timeOffset('quarter', local(2012)), +local(2012, 3));
  t.equal(+vega.timeOffset('quarter', local(2012), 2), +local(2012, 6));
  t.equal(+vega.timeOffset('month', local(2012)), +local(2012, 1));
  t.equal(+vega.timeOffset('month', local(2012), 2), +local(2012, 2));
  t.equal(+vega.timeOffset('week', local(2012)), +local(2012, 0, 8));
  t.equal(+vega.timeOffset('week', local(2012), 2), +local(2012, 0, 15));
  t.equal(+vega.timeOffset('date', local(2012)), +local(2012, 0, 2));
  t.equal(+vega.timeOffset('date', local(2012), 2), +local(2012, 0, 3));
  t.equal(+vega.timeOffset('day', local(2012)), +local(2012, 0, 2));
  t.equal(+vega.timeOffset('day', local(2012), 2), +local(2012, 0, 3));
  t.equal(+vega.timeOffset('dayofyear', local(2012)), +local(2012, 0, 2));
  t.equal(+vega.timeOffset('dayofyear', local(2012), 2), +local(2012, 0, 3));
  t.equal(+vega.timeOffset('hours', local(2012)), +local(2012, 0, 1, 1));
  t.equal(+vega.timeOffset('hours', local(2012), 2), +local(2012, 0, 1, 2));
  t.equal(+vega.timeOffset('minutes', local(2012)), +local(2012, 0, 1, 0, 1));
  t.equal(+vega.timeOffset('minutes', local(2012), 2), +local(2012, 0, 1, 0, 2));
  t.equal(+vega.timeOffset('seconds', local(2012)), +local(2012, 0, 1, 0, 0, 1));
  t.equal(+vega.timeOffset('seconds', local(2012), 2), +local(2012, 0, 1, 0, 0, 2));
  t.equal(+vega.timeOffset('milliseconds', local(2012)), +local(2012, 0, 1, 0, 0, 0, 1));
  t.equal(+vega.timeOffset('milliseconds', local(2012), 2), +local(2012, 0, 1, 0, 0, 0, 2));
  t.end();
});

tape('utcOffset computes utc date offsets', t => {
  t.equal(+vega.utcOffset('year', utc(2012)), +utc(2013));
  t.equal(+vega.utcOffset('year', utc(2012), 2), +utc(2014));
  t.equal(+vega.utcOffset('quarter', utc(2012)), +utc(2012, 3));
  t.equal(+vega.utcOffset('quarter', utc(2012), 2), +utc(2012, 6));
  t.equal(+vega.utcOffset('month', utc(2012)), +utc(2012, 1));
  t.equal(+vega.utcOffset('month', utc(2012), 2), +utc(2012, 2));
  t.equal(+vega.utcOffset('week', utc(2012)), +utc(2012, 0, 8));
  t.equal(+vega.utcOffset('week', utc(2012), 2), +utc(2012, 0, 15));
  t.equal(+vega.utcOffset('date', utc(2012)), +utc(2012, 0, 2));
  t.equal(+vega.utcOffset('date', utc(2012), 2), +utc(2012, 0, 3));
  t.equal(+vega.utcOffset('day', utc(2012)), +utc(2012, 0, 2));
  t.equal(+vega.utcOffset('day', utc(2012), 2), +utc(2012, 0, 3));
  t.equal(+vega.utcOffset('dayofyear', utc(2012)), +utc(2012, 0, 2));
  t.equal(+vega.utcOffset('dayofyear', utc(2012), 2), +utc(2012, 0, 3));
  t.equal(+vega.utcOffset('hours', utc(2012)), +utc(2012, 0, 1, 1));
  t.equal(+vega.utcOffset('hours', utc(2012), 2), +utc(2012, 0, 1, 2));
  t.equal(+vega.utcOffset('minutes', utc(2012)), +utc(2012, 0, 1, 0, 1));
  t.equal(+vega.utcOffset('minutes', utc(2012), 2), +utc(2012, 0, 1, 0, 2));
  t.equal(+vega.utcOffset('seconds', utc(2012)), +utc(2012, 0, 1, 0, 0, 1));
  t.equal(+vega.utcOffset('seconds', utc(2012), 2), +utc(2012, 0, 1, 0, 0, 2));
  t.equal(+vega.utcOffset('milliseconds', utc(2012)), +utc(2012, 0, 1, 0, 0, 0, 1));
  t.equal(+vega.utcOffset('milliseconds', utc(2012), 2), +utc(2012, 0, 1, 0, 0, 0, 2));
  t.end();
});
