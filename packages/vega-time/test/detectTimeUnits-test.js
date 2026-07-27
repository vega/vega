import tape from 'tape';
import * as vega from '../index.js';
import {local, utc} from './util.js';

const detect = (dates, isUTC) => vega.detectTimeUnits(dates.map(ts => ({ts})), _ => _.ts, isUTC);

tape('detectTimeUnits detects UTC time units', t => {
  const fn = dates => detect(dates, true);
  t.deepEqual(fn([utc(2000), utc(2010)]), {units: ['year'], step: 10});
  t.deepEqual(fn([utc(2000), utc(2001)]), {units: ['year'], step: 1});
  t.deepEqual(fn([utc(2000), utc(2002)]), {units: ['year'], step: 1});
  t.deepEqual(fn([utc(2000, 0), utc(2000, 3)]), {units: ['year', 'month'], step: 3});
  t.deepEqual(fn([utc(2000, 0), utc(2000, 1)]), {units: ['year', 'month'], step: 1});
  t.deepEqual(fn([utc(2000, 0, 1), utc(2000, 0, 8)]), {units: ['year', 'week'], step: 1});
  t.deepEqual(fn([utc(2000, 0, 2), utc(2000, 0, 9)]), {units: ['year', 'week'], step: 1});
  t.deepEqual(fn([utc(2000, 0, 1), utc(2000, 0, 2)]), {units: ['year', 'month', 'date'], step: 1});
  t.deepEqual(fn([utc(2000, 0, 1, 0), utc(2000, 0, 1, 1)]), {units: ['year', 'month', 'date', 'hours'], step: 1});
  t.deepEqual(fn([utc(2000, 0, 1, 0, 0), utc(2000, 0, 1, 0, 1)]), {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 1});
  t.deepEqual(fn([utc(2000, 0, 1, 0, 0), utc(2000, 0, 1, 0, 5)]), {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 5});
  t.deepEqual(fn([utc(2000, 0, 1, 0, 0), utc(2000, 0, 1, 0, 10)]), {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 10});
  t.deepEqual(fn([utc(2000, 0, 1, 0, 0, 0), utc(2000, 0, 1, 0, 0, 1)]), {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds'], step: 1});
  t.deepEqual(fn([utc(2000, 0, 1, 0, 0, 0, 123), utc(2000, 0, 1, 0, 0, 0, 234)]), {units: ['year', 'month', 'date', 'hours', 'minutes', 'seconds', 'milliseconds'], step: 1});
  t.end();
});

tape('detectTimeUnits detects local time units', t => {
  const fn = dates => detect(dates, false);
  t.deepEqual(fn([local(2000), local(2010)]), {units: ['year'], step: 10});
  t.deepEqual(fn([local(2000), local(2001)]), {units: ['year'], step: 1});
  t.deepEqual(fn([local(2000, 0), local(2000, 3)]), {units: ['year', 'month'], step: 3});
  t.deepEqual(fn([local(2000, 0), local(2000, 1)]), {units: ['year', 'month'], step: 1});
  t.deepEqual(fn([local(2000, 0, 1), local(2000, 0, 8)]), {units: ['year', 'week'], step: 1});
  t.deepEqual(fn([local(2000, 0, 1), local(2000, 0, 2)]), {units: ['year', 'month', 'date'], step: 1});
  t.deepEqual(fn([local(2000, 0, 1, 0), local(2000, 0, 1, 1)]), {units: ['year', 'month', 'date', 'hours'], step: 1});
  t.deepEqual(fn([local(2000, 0, 1, 0, 0), local(2000, 0, 1, 0, 1)]), {units: ['year', 'month', 'date', 'hours', 'minutes'], step: 1});
  t.end();
});

tape('detectTimeUnits prefers coarser grains over weeks', t => {
  const fn = dates => detect(dates, true);
  t.deepEqual(fn([utc(2000, 0, 1), utc(2000, 6, 1)]), {units: ['year', 'month'], step: 3});
  t.deepEqual(fn([utc(2000, 0, 1), utc(2000, 1, 1)]), {units: ['year', 'month'], step: 1});
  t.end();
});

tape('detectTimeUnits respects the timezone setting', t => {
  const offset = local(2000, 0, 1).getTimezoneOffset();
  if (offset !== 0) {
    const localDates = [local(2000, 0, 1), local(2000, 0, 2), local(2000, 0, 3)];
    t.deepEqual(detect(localDates, false).units, ['year', 'month', 'date']);
    t.ok(detect(localDates, true).units.length > 3);

    const utcDates = [utc(2000, 0, 1), utc(2000, 0, 2), utc(2000, 0, 3)];
    t.deepEqual(detect(utcDates, true).units, ['year', 'month', 'date']);
    t.ok(detect(utcDates, false).units.length > 3);
  }
  t.end();
});

tape('detectTimeUnits errors on invalid dates', t => {
  t.throws(() => detect(['bogus'], true));
  t.end();
});
