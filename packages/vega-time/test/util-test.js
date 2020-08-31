var tape = require('tape'),
    vega = require('../'),
    {local, utc} = require('./util');

tape('dayofyear extracts day of year from datetime', t => {
  t.equal(vega.dayofyear(local(2012, 0, 1)), 1);
  t.equal(vega.dayofyear(local(2012, 11, 31)), 366);
  t.equal(vega.dayofyear(local(2011, 0, 1)), 1);
  t.equal(vega.dayofyear(local(2011, 11, 31)), 365);
  t.end();
});

tape('dayofyear extracts day of year from timestamp', t => {
  t.equal(vega.dayofyear(+local(2012, 0, 1)), 1);
  t.equal(vega.dayofyear(+local(2012, 11, 31)), 366);
  t.equal(vega.dayofyear(+local(2011, 0, 1)), 1);
  t.equal(vega.dayofyear(+local(2011, 11, 31)), 365);
  t.end();
});

tape('week extracts week number of year from datetime', t => {
  t.equal(vega.week(local(2012, 0, 1)), 1);
  t.equal(vega.week(local(2012, 0, 8)), 2);
  t.equal(vega.week(local(2012, 11, 31)), 53);
  t.equal(vega.week(local(2011, 0, 1)), 0);
  t.equal(vega.week(local(2011, 0, 8)), 1);
  t.equal(vega.week(local(2011, 11, 31)), 52);
  t.end();
});

tape('week extracts week number of year from timestamp', t => {
  t.equal(vega.week(+local(2012, 0, 1)), 1);
  t.equal(vega.week(+local(2012, 0, 8)), 2);
  t.equal(vega.week(+local(2012, 11, 31)), 53);
  t.equal(vega.week(+local(2011, 0, 1)), 0);
  t.equal(vega.week(+local(2011, 0, 8)), 1);
  t.equal(vega.week(+local(2011, 11, 31)), 52);
  t.end();
});

tape('utcdayofyear extracts day of year from utc datetime', t => {
  t.equal(vega.utcdayofyear(utc(2012, 0, 1)), 1);
  t.equal(vega.utcdayofyear(utc(2012, 11, 31)), 366);
  t.equal(vega.utcdayofyear(utc(2011, 0, 1)), 1);
  t.equal(vega.utcdayofyear(utc(2011, 11, 31)), 365);
  t.end();
});

tape('utcdayofyear extracts day of year from timestamp', t => {
  t.equal(vega.utcdayofyear(+utc(2012, 0, 1)), 1);
  t.equal(vega.utcdayofyear(+utc(2012, 11, 31)), 366);
  t.equal(vega.utcdayofyear(+utc(2011, 0, 1)), 1);
  t.equal(vega.utcdayofyear(+utc(2011, 11, 31)), 365);
  t.end();
});

tape('utcweek extracts week number of year from utc datetime', t => {
  t.equal(vega.utcweek(utc(2012, 0, 1)), 1);
  t.equal(vega.utcweek(utc(2012, 0, 8)), 2);
  t.equal(vega.utcweek(utc(2012, 11, 31)), 53);
  t.equal(vega.utcweek(utc(2011, 0, 1)), 0);
  t.equal(vega.utcweek(utc(2011, 0, 8)), 1);
  t.equal(vega.utcweek(utc(2011, 11, 31)), 52);
  t.end();
});

tape('utcweek extracts week number of year from timestamp', t => {
  t.equal(vega.utcweek(+utc(2012, 0, 1)), 1);
  t.equal(vega.utcweek(+utc(2012, 0, 8)), 2);
  t.equal(vega.utcweek(+utc(2012, 11, 31)), 53);
  t.equal(vega.utcweek(+utc(2011, 0, 1)), 0);
  t.equal(vega.utcweek(+utc(2011, 0, 8)), 1);
  t.equal(vega.utcweek(+utc(2011, 11, 31)), 52);
  t.end();
});
