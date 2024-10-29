var tape = require('tape'),
    vega = require('../'),
    { utc } = require('./util');


tape('detectTimeUnits works for all units', t => {
    const fn = dates => vega.detectTimeUnits(dates.map(ts => ({ ts })), _ => _.ts).units;
    t.deepEqual(fn([utc(2000), utc(2001)]), ['year']);
    t.deepEqual(fn([utc(2000, 0), utc(2000, 1)]), ['year', 'month']);
    t.deepEqual(fn([utc(2000, 0, 1), utc(2000, 0, 2)]), ['year', 'month', 'date']);
    t.deepEqual(fn([utc(2000, 0, 1, 0), utc(2000, 0, 1, 1)]), ['year', 'month', 'date', 'hours']);
    t.deepEqual(fn([utc(2000, 0, 1, 0, 0), utc(2000, 0, 1, 0, 1)]), ['year', 'month', 'date', 'hours', 'minutes']);
    t.deepEqual(fn([utc(2000, 0, 1, 0, 0, 0), utc(2000, 0, 1, 0, 0, 1)]), ['year', 'month', 'date', 'hours', 'minutes', 'seconds']);
    t.end();
});


tape('detectTimeUnits returns correct steps', t => {
    const fn = dates => vega.detectTimeUnits(dates.map(ts => ({ ts })), _ => _.ts);
    t.deepEqual(fn([utc(2000), utc(2001)]), { units: ['year'], step: 1 });
    t.deepEqual(fn([utc(2000), utc(2002)]), { units: ['year'], step: 1 });
    t.deepEqual(fn([utc(2000), utc(2010)]), { units: ['year'], step: 10 });
    t.deepEqual(fn([utc(2000, 0), utc(2000, 1)]), { units: ['year', 'month'], step: 1 });
    t.deepEqual(fn([utc(2000, 0), utc(2000, 3)]), { units: ['year', 'month'], step: 3 });
    t.end();
});
