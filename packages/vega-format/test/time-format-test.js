var tape = require('tape'),
    vega = require('../'),
    {local, utc} = require('./util');

tape('timeFormat supports specifier strings', function(t) {
  var d = local(2001, 0, 1);
  t.equal(vega.timeFormat('%Y')(d), '2001');
  t.equal(vega.timeFormat('%m')(d), '01');
  t.equal(vega.timeFormat('%d')(d), '01');
  t.throws(() => vega.timeFormat(2));
  t.throws(() => vega.timeFormat(true));
  t.end();
});

tape('timeFormat supports specifier objects', function(t) {
  var f = vega.timeFormat();
  t.equal(f(local(2001, 0, 1)), '2001');
  t.equal(f(local(2001, 1, 1)), 'February');
  t.equal(f(local(2001, 1, 2)), 'Fri 02');
  t.equal(f(local(2001, 1, 4)), 'Feb 04');
  t.equal(f(local(2001, 3, 1)), 'April');
  t.equal(f(local(2001, 0, 1, 0, 0, 30)), ':30');

  f = vega.timeFormat({
    year: '%y',
    quarter: 'Q%q',
    month: '%m',
    week: 'W%U',
    seconds: '%Ss'
  });
  t.equal(f(local(2001, 0, 1)), '01');
  t.equal(f(local(2001, 1, 1)), '02');
  t.equal(f(local(2001, 1, 2)), 'Fri 02');
  t.equal(f(local(2001, 1, 4)), 'W05');
  t.equal(f(local(2001, 3, 1)), 'Q2');
  t.equal(f(local(2001, 0, 1, 0, 0, 30)), '30s');

  t.end();
});

tape('utcFormat supports specifier strings', function(t) {
  var d = utc(2001, 0, 1);
  t.equal(vega.utcFormat('%Y')(d), '2001');
  t.equal(vega.utcFormat('%m')(d), '01');
  t.equal(vega.utcFormat('%d')(d), '01');
  t.throws(() => vega.utcFormat(2));
  t.throws(() => vega.utcFormat(true));
  t.end();
});

tape('utcFormat supports specifier objects', function(t) {
  var f = vega.utcFormat();
  t.equal(f(utc(2001, 0, 1)), '2001');
  t.equal(f(utc(2001, 1, 1)), 'February');
  t.equal(f(utc(2001, 1, 2)), 'Fri 02');
  t.equal(f(utc(2001, 1, 4)), 'Feb 04');
  t.equal(f(utc(2001, 3, 1)), 'April');
  t.equal(f(utc(2001, 0, 1, 0, 0, 30)), ':30');

  f = vega.utcFormat({
    year: '%y',
    quarter: 'Q%q',
    month: '%m',
    week: 'W%U',
    seconds: '%Ss'
  });
  t.equal(f(utc(2001, 0, 1)), '01');
  t.equal(f(utc(2001, 1, 1)), '02');
  t.equal(f(utc(2001, 1, 2)), 'Fri 02');
  t.equal(f(utc(2001, 1, 4)), 'W05');
  t.equal(f(utc(2001, 3, 1)), 'Q2');
  t.equal(f(utc(2001, 0, 1, 0, 0, 30)), '30s');

  t.end();
});
