import {hasOwnProperty} from 'vega-util';
import {UTC} from './types';

import {
  timeMillisecond, utcMillisecond,
  timeSecond, utcSecond,
  timeMinute, utcMinute,
  timeHour, utcHour,
  timeDay, utcDay,
  timeWeek, utcWeek,
  timeMonth, utcMonth,
  timeYear, utcYear
} from 'd3-time';

var time = {
  millisecond: timeMillisecond,
  second:      timeSecond,
  minute:      timeMinute,
  hour:        timeHour,
  day:         timeDay,
  week:        timeWeek,
  month:       timeMonth,
  year:        timeYear
};

var utc = {
  millisecond: utcMillisecond,
  second:      utcSecond,
  minute:      utcMinute,
  hour:        utcHour,
  day:         utcDay,
  week:        utcWeek,
  month:       utcMonth,
  year:        utcYear
}

export function timeInterval(unit, type) {
  const t = (type === UTC ? utc : time);
  return hasOwnProperty(t, unit) && t[unit];
}
