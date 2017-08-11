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

export function timeInterval(name) {
  return time.hasOwnProperty(name) && time[name];
}

export function utcInterval(name) {
  return utc.hasOwnProperty(name) && utc[name];
}
