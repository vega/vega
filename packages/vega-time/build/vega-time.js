(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-util')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-util'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.vega = {}, global.vega));
})(this, (function (exports, vegaUtil) { 'use strict';

  const YEAR = 'year';
  const QUARTER = 'quarter';
  const MONTH = 'month';
  const WEEK = 'week';
  const DATE = 'date';
  const DAY = 'day';
  const DAYOFYEAR = 'dayofyear';
  const HOURS = 'hours';
  const MINUTES = 'minutes';
  const SECONDS = 'seconds';
  const MILLISECONDS = 'milliseconds';
  const TIME_UNITS = [YEAR, QUARTER, MONTH, WEEK, DATE, DAY, DAYOFYEAR, HOURS, MINUTES, SECONDS, MILLISECONDS];
  const UNITS = TIME_UNITS.reduce((o, u, i) => (o[u] = 1 + i, o), {});
  function timeUnits(units) {
    const u = vegaUtil.array(units).slice(),
      m = {};

    // check validity
    if (!u.length) vegaUtil.error('Missing time unit.');
    u.forEach(unit => {
      if (vegaUtil.hasOwnProperty(UNITS, unit)) {
        m[unit] = 1;
      } else {
        vegaUtil.error(`Invalid time unit: ${unit}.`);
      }
    });
    const numTypes = (m[WEEK] || m[DAY] ? 1 : 0) + (m[QUARTER] || m[MONTH] || m[DATE] ? 1 : 0) + (m[DAYOFYEAR] ? 1 : 0);
    if (numTypes > 1) {
      vegaUtil.error(`Incompatible time units: ${units}`);
    }

    // ensure proper sort order
    u.sort((a, b) => UNITS[a] - UNITS[b]);
    return u;
  }
  const defaultSpecifiers = {
    [YEAR]: '%Y ',
    [QUARTER]: 'Q%q ',
    [MONTH]: '%b ',
    [DATE]: '%d ',
    [WEEK]: 'W%U ',
    [DAY]: '%a ',
    [DAYOFYEAR]: '%j ',
    [HOURS]: '%H:00',
    [MINUTES]: '00:%M',
    [SECONDS]: ':%S',
    [MILLISECONDS]: '.%L',
    [`${YEAR}-${MONTH}`]: '%Y-%m ',
    [`${YEAR}-${MONTH}-${DATE}`]: '%Y-%m-%d ',
    [`${HOURS}-${MINUTES}`]: '%H:%M'
  };
  function timeUnitSpecifier(units, specifiers) {
    const s = vegaUtil.extend({}, defaultSpecifiers, specifiers),
      u = timeUnits(units),
      n = u.length;
    let fmt = '',
      start = 0,
      end,
      key;
    for (start = 0; start < n;) {
      for (end = u.length; end > start; --end) {
        key = u.slice(start, end).join('-');
        if (s[key] != null) {
          fmt += s[key];
          start = end;
          break;
        }
      }
    }
    return fmt.trim();
  }

  const t0$1 = new Date(),
    t1 = new Date();
  function timeInterval$1(floori, offseti, count, field) {
    function interval(date) {
      return floori(date = arguments.length === 0 ? new Date() : new Date(+date)), date;
    }
    interval.floor = date => {
      return floori(date = new Date(+date)), date;
    };
    interval.ceil = date => {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };
    interval.round = date => {
      const d0 = interval(date),
        d1 = interval.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };
    interval.offset = (date, step) => {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };
    interval.range = (start, stop, step) => {
      const range = [];
      start = interval.ceil(start);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      let previous;
      do range.push(previous = new Date(+start)), offseti(start, step), floori(start); while (previous < start && start < stop);
      return range;
    };
    interval.filter = test => {
      return timeInterval$1(date => {
        if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
      }, (date, step) => {
        if (date >= date) {
          if (step < 0) while (++step <= 0) {
            while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
          } else while (--step >= 0) {
            while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
          }
        }
      });
    };

    if (count) {
      interval.count = (start, end) => {
        t0$1.setTime(+start), t1.setTime(+end);
        floori(t0$1), floori(t1);
        return Math.floor(count(t0$1, t1));
      };
      interval.every = step => {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null : !(step > 1) ? interval : interval.filter(field ? d => field(d) % step === 0 : d => interval.count(0, d) % step === 0);
      };
    }
    return interval;
  }

  const millisecond = timeInterval$1(() => {
    // noop
  }, (date, step) => {
    date.setTime(+date + step);
  }, (start, end) => {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = k => {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) return null;
    if (!(k > 1)) return millisecond;
    return timeInterval$1(date => {
      date.setTime(Math.floor(date / k) * k);
    }, (date, step) => {
      date.setTime(+date + step * k);
    }, (start, end) => {
      return (end - start) / k;
    });
  };
  millisecond.range;

  const durationSecond$1 = 1000;
  const durationMinute$1 = durationSecond$1 * 60;
  const durationHour$1 = durationMinute$1 * 60;
  const durationDay$1 = durationHour$1 * 24;
  const durationWeek$1 = durationDay$1 * 7;

  const second = timeInterval$1(date => {
    date.setTime(date - date.getMilliseconds());
  }, (date, step) => {
    date.setTime(+date + step * durationSecond$1);
  }, (start, end) => {
    return (end - start) / durationSecond$1;
  }, date => {
    return date.getUTCSeconds();
  });
  second.range;

  const timeMinute = timeInterval$1(date => {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond$1);
  }, (date, step) => {
    date.setTime(+date + step * durationMinute$1);
  }, (start, end) => {
    return (end - start) / durationMinute$1;
  }, date => {
    return date.getMinutes();
  });
  timeMinute.range;
  const utcMinute = timeInterval$1(date => {
    date.setUTCSeconds(0, 0);
  }, (date, step) => {
    date.setTime(+date + step * durationMinute$1);
  }, (start, end) => {
    return (end - start) / durationMinute$1;
  }, date => {
    return date.getUTCMinutes();
  });
  utcMinute.range;

  const timeHour = timeInterval$1(date => {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond$1 - date.getMinutes() * durationMinute$1);
  }, (date, step) => {
    date.setTime(+date + step * durationHour$1);
  }, (start, end) => {
    return (end - start) / durationHour$1;
  }, date => {
    return date.getHours();
  });
  timeHour.range;
  const utcHour = timeInterval$1(date => {
    date.setUTCMinutes(0, 0, 0);
  }, (date, step) => {
    date.setTime(+date + step * durationHour$1);
  }, (start, end) => {
    return (end - start) / durationHour$1;
  }, date => {
    return date.getUTCHours();
  });
  utcHour.range;

  const timeDay = timeInterval$1(date => date.setHours(0, 0, 0, 0), (date, step) => date.setDate(date.getDate() + step), (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationDay$1, date => date.getDate() - 1);
  timeDay.range;
  const utcDay = timeInterval$1(date => {
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  }, (start, end) => {
    return (end - start) / durationDay$1;
  }, date => {
    return date.getUTCDate() - 1;
  });
  utcDay.range;
  const unixDay = timeInterval$1(date => {
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCDate(date.getUTCDate() + step);
  }, (start, end) => {
    return (end - start) / durationDay$1;
  }, date => {
    return Math.floor(date / durationDay$1);
  });
  unixDay.range;

  function timeWeekday(i) {
    return timeInterval$1(date => {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setDate(date.getDate() + step * 7);
    }, (start, end) => {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute$1) / durationWeek$1;
    });
  }
  const timeSunday = timeWeekday(0);
  const timeMonday = timeWeekday(1);
  const timeTuesday = timeWeekday(2);
  const timeWednesday = timeWeekday(3);
  const timeThursday = timeWeekday(4);
  const timeFriday = timeWeekday(5);
  const timeSaturday = timeWeekday(6);
  timeSunday.range;
  timeMonday.range;
  timeTuesday.range;
  timeWednesday.range;
  timeThursday.range;
  timeFriday.range;
  timeSaturday.range;
  function utcWeekday(i) {
    return timeInterval$1(date => {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, (start, end) => {
      return (end - start) / durationWeek$1;
    });
  }
  const utcSunday = utcWeekday(0);
  const utcMonday = utcWeekday(1);
  const utcTuesday = utcWeekday(2);
  const utcWednesday = utcWeekday(3);
  const utcThursday = utcWeekday(4);
  const utcFriday = utcWeekday(5);
  const utcSaturday = utcWeekday(6);
  utcSunday.range;
  utcMonday.range;
  utcTuesday.range;
  utcWednesday.range;
  utcThursday.range;
  utcFriday.range;
  utcSaturday.range;

  const timeMonth = timeInterval$1(date => {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setMonth(date.getMonth() + step);
  }, (start, end) => {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, date => {
    return date.getMonth();
  });
  timeMonth.range;
  const utcMonth = timeInterval$1(date => {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, (start, end) => {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  }, date => {
    return date.getUTCMonth();
  });
  utcMonth.range;

  const timeYear = timeInterval$1(date => {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setFullYear(date.getFullYear() + step);
  }, (start, end) => {
    return end.getFullYear() - start.getFullYear();
  }, date => {
    return date.getFullYear();
  });

  // An optimized implementation for this simple case.
  timeYear.every = k => {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval$1(date => {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };
  timeYear.range;
  const utcYear = timeInterval$1(date => {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, (date, step) => {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, (start, end) => {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, date => {
    return date.getUTCFullYear();
  });

  // An optimized implementation for this simple case.
  utcYear.every = k => {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : timeInterval$1(date => {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, (date, step) => {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };
  utcYear.range;

  function ascending(a, b) {
    return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function descending(a, b) {
    return a == null || b == null ? NaN : b < a ? -1 : b > a ? 1 : b >= a ? 0 : NaN;
  }

  function bisector(f) {
    let compare1, compare2, delta;

    // If an accessor is specified, promote it to a comparator. In this case we
    // can test whether the search value is (self-) comparable. We can’t do this
    // for a comparator (except for specific, known comparators) because we can’t
    // tell if the comparator is symmetric, and an asymmetric comparator can’t be
    // used to test whether a single value is comparable.
    if (f.length !== 2) {
      compare1 = ascending;
      compare2 = (d, x) => ascending(f(d), x);
      delta = (d, x) => f(d) - x;
    } else {
      compare1 = f === ascending || f === descending ? f : zero;
      compare2 = f;
      delta = f;
    }
    function left(a, x, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0) return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a[mid], x) < 0) lo = mid + 1;else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function right(a, x, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0) return hi;
        do {
          const mid = lo + hi >>> 1;
          if (compare2(a[mid], x) <= 0) lo = mid + 1;else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }
    function center(a, x, lo = 0, hi = a.length) {
      const i = left(a, x, lo, hi - 1);
      return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
    }
    return {
      left,
      center,
      right
    };
  }
  function zero() {
    return 0;
  }

  const e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);
  function tickSpec(start, stop, count) {
    const step = (stop - start) / Math.max(0, count),
      power = Math.floor(Math.log10(step)),
      error = step / Math.pow(10, power),
      factor = error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1;
    let i1, i2, inc;
    if (power < 0) {
      inc = Math.pow(10, -power) / factor;
      i1 = Math.round(start * inc);
      i2 = Math.round(stop * inc);
      if (i1 / inc < start) ++i1;
      if (i2 / inc > stop) --i2;
      inc = -inc;
    } else {
      inc = Math.pow(10, power) * factor;
      i1 = Math.round(start / inc);
      i2 = Math.round(stop / inc);
      if (i1 * inc < start) ++i1;
      if (i2 * inc > stop) --i2;
    }
    if (i2 < i1 && 0.5 <= count && count < 2) return tickSpec(start, stop, count * 2);
    return [i1, i2, inc];
  }
  function tickIncrement(start, stop, count) {
    stop = +stop, start = +start, count = +count;
    return tickSpec(start, stop, count)[2];
  }
  function tickStep(start, stop, count) {
    stop = +stop, start = +start, count = +count;
    const reverse = stop < start,
      inc = reverse ? tickIncrement(stop, start, count) : tickIncrement(start, stop, count);
    return (reverse ? -1 : 1) * (inc < 0 ? 1 / -inc : inc);
  }

  const t0 = new Date();
  function localYear(y) {
    t0.setFullYear(y);
    t0.setMonth(0);
    t0.setDate(1);
    t0.setHours(0, 0, 0, 0);
    return t0;
  }
  function dayofyear(d) {
    return localDayOfYear(new Date(d));
  }
  function week(d) {
    return localWeekNum(new Date(d));
  }
  function localDayOfYear(d) {
    return timeDay.count(localYear(d.getFullYear()) - 1, d);
  }
  function localWeekNum(d) {
    return timeSunday.count(localYear(d.getFullYear()) - 1, d);
  }
  function localFirst(y) {
    return localYear(y).getDay();
  }
  function localDate(y, m, d, H, M, S, L) {
    if (0 <= y && y < 100) {
      const date = new Date(-1, m, d, H, M, S, L);
      date.setFullYear(y);
      return date;
    }
    return new Date(y, m, d, H, M, S, L);
  }
  function utcdayofyear(d) {
    return utcDayOfYear(new Date(d));
  }
  function utcweek(d) {
    return utcWeekNum(new Date(d));
  }
  function utcDayOfYear(d) {
    const y = Date.UTC(d.getUTCFullYear(), 0, 1);
    return utcDay.count(y - 1, d);
  }
  function utcWeekNum(d) {
    const y = Date.UTC(d.getUTCFullYear(), 0, 1);
    return utcSunday.count(y - 1, d);
  }
  function utcFirst(y) {
    t0.setTime(Date.UTC(y, 0, 1));
    return t0.getUTCDay();
  }
  function utcDate(y, m, d, H, M, S, L) {
    if (0 <= y && y < 100) {
      const date = new Date(Date.UTC(-1, m, d, H, M, S, L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(y, m, d, H, M, S, L));
  }

  function floor(units, step, get, inv, newDate) {
    const s = step || 1,
      b = vegaUtil.peek(units),
      _ = (unit, p, key) => {
        key = key || unit;
        return getUnit(get[key], inv[key], unit === b && s, p);
      };
    const t = new Date(),
      u = vegaUtil.toSet(units),
      y = u[YEAR] ? _(YEAR) : vegaUtil.constant(2012),
      m = u[MONTH] ? _(MONTH) : u[QUARTER] ? _(QUARTER) : vegaUtil.zero,
      d = u[WEEK] && u[DAY] ? _(DAY, 1, WEEK + DAY) : u[WEEK] ? _(WEEK, 1) : u[DAY] ? _(DAY, 1) : u[DATE] ? _(DATE, 1) : u[DAYOFYEAR] ? _(DAYOFYEAR, 1) : vegaUtil.one,
      H = u[HOURS] ? _(HOURS) : vegaUtil.zero,
      M = u[MINUTES] ? _(MINUTES) : vegaUtil.zero,
      S = u[SECONDS] ? _(SECONDS) : vegaUtil.zero,
      L = u[MILLISECONDS] ? _(MILLISECONDS) : vegaUtil.zero;
    return function (v) {
      t.setTime(+v);
      const year = y(t);
      return newDate(year, m(t), d(t, year), H(t), M(t), S(t), L(t));
    };
  }
  function getUnit(f, inv, step, phase) {
    const u = step <= 1 ? f : phase ? (d, y) => phase + step * Math.floor((f(d, y) - phase) / step) : (d, y) => step * Math.floor(f(d, y) / step);
    return inv ? (d, y) => inv(u(d, y), y) : u;
  }

  // returns the day of the year based on week number, day of week,
  // and the day of the week for the first day of the year
  function weekday(week, day, firstDay) {
    return day + week * 7 - (firstDay + 6) % 7;
  }

  // -- LOCAL TIME --

  const localGet = {
    [YEAR]: d => d.getFullYear(),
    [QUARTER]: d => Math.floor(d.getMonth() / 3),
    [MONTH]: d => d.getMonth(),
    [DATE]: d => d.getDate(),
    [HOURS]: d => d.getHours(),
    [MINUTES]: d => d.getMinutes(),
    [SECONDS]: d => d.getSeconds(),
    [MILLISECONDS]: d => d.getMilliseconds(),
    [DAYOFYEAR]: d => localDayOfYear(d),
    [WEEK]: d => localWeekNum(d),
    [WEEK + DAY]: (d, y) => weekday(localWeekNum(d), d.getDay(), localFirst(y)),
    [DAY]: (d, y) => weekday(1, d.getDay(), localFirst(y))
  };
  const localInv = {
    [QUARTER]: q => 3 * q,
    [WEEK]: (w, y) => weekday(w, 0, localFirst(y))
  };
  function timeFloor(units, step) {
    return floor(units, step || 1, localGet, localInv, localDate);
  }

  // -- UTC TIME --

  const utcGet = {
    [YEAR]: d => d.getUTCFullYear(),
    [QUARTER]: d => Math.floor(d.getUTCMonth() / 3),
    [MONTH]: d => d.getUTCMonth(),
    [DATE]: d => d.getUTCDate(),
    [HOURS]: d => d.getUTCHours(),
    [MINUTES]: d => d.getUTCMinutes(),
    [SECONDS]: d => d.getUTCSeconds(),
    [MILLISECONDS]: d => d.getUTCMilliseconds(),
    [DAYOFYEAR]: d => utcDayOfYear(d),
    [WEEK]: d => utcWeekNum(d),
    [DAY]: (d, y) => weekday(1, d.getUTCDay(), utcFirst(y)),
    [WEEK + DAY]: (d, y) => weekday(utcWeekNum(d), d.getUTCDay(), utcFirst(y))
  };
  const utcInv = {
    [QUARTER]: q => 3 * q,
    [WEEK]: (w, y) => weekday(w, 0, utcFirst(y))
  };
  function utcFloor(units, step) {
    return floor(units, step || 1, utcGet, utcInv, utcDate);
  }

  const timeIntervals = {
    [YEAR]: timeYear,
    [QUARTER]: timeMonth.every(3),
    [MONTH]: timeMonth,
    [WEEK]: timeSunday,
    [DATE]: timeDay,
    [DAY]: timeDay,
    [DAYOFYEAR]: timeDay,
    [HOURS]: timeHour,
    [MINUTES]: timeMinute,
    [SECONDS]: second,
    [MILLISECONDS]: millisecond
  };
  const utcIntervals = {
    [YEAR]: utcYear,
    [QUARTER]: utcMonth.every(3),
    [MONTH]: utcMonth,
    [WEEK]: utcSunday,
    [DATE]: utcDay,
    [DAY]: utcDay,
    [DAYOFYEAR]: utcDay,
    [HOURS]: utcHour,
    [MINUTES]: utcMinute,
    [SECONDS]: second,
    [MILLISECONDS]: millisecond
  };
  function timeInterval(unit) {
    return timeIntervals[unit];
  }
  function utcInterval(unit) {
    return utcIntervals[unit];
  }
  function offset(ival, date, step) {
    return ival ? ival.offset(date, step) : undefined;
  }
  function timeOffset(unit, date, step) {
    return offset(timeInterval(unit), date, step);
  }
  function utcOffset(unit, date, step) {
    return offset(utcInterval(unit), date, step);
  }
  function sequence(ival, start, stop, step) {
    return ival ? ival.range(start, stop, step) : undefined;
  }
  function timeSequence(unit, start, stop, step) {
    return sequence(timeInterval(unit), start, stop, step);
  }
  function utcSequence(unit, start, stop, step) {
    return sequence(utcInterval(unit), start, stop, step);
  }

  const durationSecond = 1000,
    durationMinute = durationSecond * 60,
    durationHour = durationMinute * 60,
    durationDay = durationHour * 24,
    durationWeek = durationDay * 7,
    durationMonth = durationDay * 30,
    durationYear = durationDay * 365;
  const Milli = [YEAR, MONTH, DATE, HOURS, MINUTES, SECONDS, MILLISECONDS],
    Seconds = Milli.slice(0, -1),
    Minutes = Seconds.slice(0, -1),
    Hours = Minutes.slice(0, -1),
    Day = Hours.slice(0, -1),
    Week = [YEAR, WEEK],
    Month = [YEAR, MONTH],
    Year = [YEAR];
  const intervals = [[Seconds, 1, durationSecond], [Seconds, 5, 5 * durationSecond], [Seconds, 15, 15 * durationSecond], [Seconds, 30, 30 * durationSecond], [Minutes, 1, durationMinute], [Minutes, 5, 5 * durationMinute], [Minutes, 15, 15 * durationMinute], [Minutes, 30, 30 * durationMinute], [Hours, 1, durationHour], [Hours, 3, 3 * durationHour], [Hours, 6, 6 * durationHour], [Hours, 12, 12 * durationHour], [Day, 1, durationDay], [Week, 1, durationWeek], [Month, 1, durationMonth], [Month, 3, 3 * durationMonth], [Year, 1, durationYear]];
  function bin (opt) {
    const ext = opt.extent,
      max = opt.maxbins || 40,
      target = Math.abs(vegaUtil.span(ext)) / max;
    let i = bisector(i => i[2]).right(intervals, target),
      units,
      step;
    if (i === intervals.length) {
      units = Year, step = tickStep(ext[0] / durationYear, ext[1] / durationYear, max);
    } else if (i) {
      i = intervals[target / intervals[i - 1][2] < intervals[i][2] / target ? i - 1 : i];
      units = i[0];
      step = i[1];
    } else {
      units = Milli;
      step = Math.max(tickStep(ext[0], ext[1], max), 1);
    }
    return {
      units,
      step
    };
  }

  exports.DATE = DATE;
  exports.DAY = DAY;
  exports.DAYOFYEAR = DAYOFYEAR;
  exports.HOURS = HOURS;
  exports.MILLISECONDS = MILLISECONDS;
  exports.MINUTES = MINUTES;
  exports.MONTH = MONTH;
  exports.QUARTER = QUARTER;
  exports.SECONDS = SECONDS;
  exports.TIME_UNITS = TIME_UNITS;
  exports.WEEK = WEEK;
  exports.YEAR = YEAR;
  exports.dayofyear = dayofyear;
  exports.timeBin = bin;
  exports.timeFloor = timeFloor;
  exports.timeInterval = timeInterval;
  exports.timeOffset = timeOffset;
  exports.timeSequence = timeSequence;
  exports.timeUnitSpecifier = timeUnitSpecifier;
  exports.timeUnits = timeUnits;
  exports.utcFloor = utcFloor;
  exports.utcInterval = utcInterval;
  exports.utcOffset = utcOffset;
  exports.utcSequence = utcSequence;
  exports.utcdayofyear = utcdayofyear;
  exports.utcweek = utcweek;
  exports.week = week;

}));
