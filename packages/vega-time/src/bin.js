import {YEAR, MONTH, DATE, HOURS, MINUTES, SECONDS, MILLISECONDS} from './units';
import {span} from 'vega-util';

const units = [
  YEAR,
  MONTH,
  DATE,
  HOURS,
  MINUTES,
  SECONDS,
  MILLISECONDS
];

const durations = [
  1,       // millisecond
  1e3,     // second
  6e4,     // minute
  36e5,    // hour
  864e5,   // day
  26784e5  // month
];

export default function(opt) {
  const maxb = opt.maxbins || 40,
        delt = span(opt.extent),
        n = durations.length;

  let i = 0, unit;

  for (; i<n; ++i) {
    if (delt / durations[i] <= maxb) {
      unit = i ? units.slice(0, -i) : units.slice();
      break;
    }
  }

  // TODO support other step sizes
  return {
    units: unit || [YEAR],
    step: 1
  };
}
