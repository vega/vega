var tape = require('tape'),
    vega = require('../'),
    {local, utc} = require('./util');

tape('timeInterval provides local intervals for time units', t => {
  let ti;

  ti = vega.timeInterval('year');
  t.equal(+local(2000), +ti(local(2000, 0, 1)));
  t.equal(+local(2000), +ti(local(2000, 11, 31)));
  t.equal(+local(2012), +ti(local(2012, 3, 4)));

  ti = vega.timeInterval('quarter');
  t.equal(+local(2000, 0), +ti(local(2000, 1, 1)));
  t.equal(+local(2012, 3), +ti(local(2012, 5, 4)));

  ti = vega.timeInterval('month');
  t.equal(+local(2000, 1), +ti(local(2000, 1, 1)));
  t.equal(+local(2012, 3), +ti(local(2012, 3, 4)));

  ti = vega.timeInterval('week');
  t.equal(+local(2000, 0, 30), +ti(local(2000, 1, 1)));
  t.equal(+local(2012, 3), +ti(local(2012, 3, 4)));

  ti = vega.timeInterval('date');
  t.equal(+local(2000, 0, 1), +ti(local(2000, 0, 1, 12)));
  t.equal(+local(2012, 3, 4), +ti(local(2012, 3, 4, 7)));

  ti = vega.timeInterval('day');
  t.equal(+local(2000, 0, 1), +ti(local(2000, 0, 1, 12)));
  t.equal(+local(2012, 3, 4), +ti(local(2012, 3, 4, 7)));

  ti = vega.timeInterval('dayofyear');
  t.equal(+local(2000, 0, 1), +ti(local(2000, 0, 1, 12)));
  t.equal(+local(2012, 3, 4), +ti(local(2012, 3, 4, 7)));

  ti = vega.timeInterval('hours');
  t.equal(+local(2000, 0, 1), +ti(local(2000, 0, 1, 0, 15)));
  t.equal(+local(2000, 0, 1, 7), +ti(local(2000, 0, 1, 7, 30)));

  ti = vega.timeInterval('minutes');
  t.equal(+local(2000, 0, 1), +ti(local(2000, 0, 1, 0, 0, 15)));
  t.equal(+local(2000, 0, 1, 7, 30), +ti(local(2000, 0, 1, 7, 30, 45)));

  ti = vega.timeInterval('seconds');
  t.equal(+local(2000, 0, 1), +ti(local(2000, 0, 1, 0, 0, 0, 15)));
  t.equal(+local(2000, 0, 1, 7, 30, 20), +ti(local(2000, 0, 1, 7, 30, 20, 45)));

  ti = vega.timeInterval('milliseconds');
  const d = local(2000, 1, 2, 7, 15, 30, 120);
  t.equal(+d, +ti(d));

  t.end();
});

tape('utcInterval provides utc intervals for time units', t => {
  let ti;

  ti = vega.utcInterval('year');
  t.equal(+utc(2000), +ti(utc(2000, 0, 1)));
  t.equal(+utc(2000), +ti(utc(2000, 11, 31)));
  t.equal(+utc(2012), +ti(utc(2012, 3, 4)));

  ti = vega.utcInterval('quarter');
  t.equal(+utc(2000, 0), +ti(utc(2000, 1, 1)));
  t.equal(+utc(2012, 3), +ti(utc(2012, 5, 4)));

  ti = vega.utcInterval('month');
  t.equal(+utc(2000, 1), +ti(utc(2000, 1, 1)));
  t.equal(+utc(2012, 3), +ti(utc(2012, 3, 4)));

  ti = vega.utcInterval('week');
  t.equal(+utc(2000, 0, 30), +ti(utc(2000, 1, 1)));
  t.equal(+utc(2012, 3), +ti(utc(2012, 3, 4)));

  ti = vega.utcInterval('date');
  t.equal(+utc(2000, 0, 1), +ti(utc(2000, 0, 1, 12)));
  t.equal(+utc(2012, 3, 4), +ti(utc(2012, 3, 4, 7)));

  ti = vega.utcInterval('day');
  t.equal(+utc(2000, 0, 1), +ti(utc(2000, 0, 1, 12)));
  t.equal(+utc(2012, 3, 4), +ti(utc(2012, 3, 4, 7)));

  ti = vega.utcInterval('dayofyear');
  t.equal(+utc(2000, 0, 1), +ti(utc(2000, 0, 1, 12)));
  t.equal(+utc(2012, 3, 4), +ti(utc(2012, 3, 4, 7)));

  ti = vega.utcInterval('hours');
  t.equal(+utc(2000, 0, 1), +ti(utc(2000, 0, 1, 0, 15)));
  t.equal(+utc(2000, 0, 1, 7), +ti(utc(2000, 0, 1, 7, 30)));

  ti = vega.utcInterval('minutes');
  t.equal(+utc(2000, 0, 1), +ti(utc(2000, 0, 1, 0, 0, 15)));
  t.equal(+utc(2000, 0, 1, 7, 30), +ti(utc(2000, 0, 1, 7, 30, 45)));

  ti = vega.utcInterval('seconds');
  t.equal(+utc(2000, 0, 1), +ti(utc(2000, 0, 1, 0, 0, 0, 15)));
  t.equal(+utc(2000, 0, 1, 7, 30, 20), +ti(utc(2000, 0, 1, 7, 30, 20, 45)));

  ti = vega.utcInterval('milliseconds');
  const d = utc(2000, 1, 2, 7, 15, 30, 120);
  t.equal(+d, +ti(d));

  t.end();
});
