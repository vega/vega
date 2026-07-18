// Adapted from the time-grain-detector package by Paul Rosenzweig (ISC license).
import {
  DATE,
  DAY,
  HOURS,
  MILLISECONDS,
  MINUTES,
  MONTH,
  SECONDS,
  WEEK,
  YEAR
} from './units.js';
import {error} from 'vega-util';

const localGetters = {
  [YEAR]:         d => d.getFullYear(),
  [MONTH]:        d => d.getMonth(),
  [DATE]:         d => d.getDate(),
  [DAY]:          d => d.getDay(),
  [HOURS]:        d => d.getHours(),
  [MINUTES]:      d => d.getMinutes(),
  [SECONDS]:      d => d.getSeconds(),
  [MILLISECONDS]: d => d.getMilliseconds()
};

const utcGetters = {
  [YEAR]:         d => d.getUTCFullYear(),
  [MONTH]:        d => d.getUTCMonth(),
  [DATE]:         d => d.getUTCDate(),
  [DAY]:          d => d.getUTCDay(),
  [HOURS]:        d => d.getUTCHours(),
  [MINUTES]:      d => d.getUTCMinutes(),
  [SECONDS]:      d => d.getUTCSeconds(),
  [MILLISECONDS]: d => d.getUTCMilliseconds()
};

const grains = [
  {
    units: [YEAR, MONTH, DATE, HOURS, MINUTES, SECONDS, MILLISECONDS],
    step: 1,
    aligned: () => true
  },
  {
    units: [YEAR, MONTH, DATE, HOURS, MINUTES, SECONDS],
    step: 1,
    aligned: (dates, g) => dates.every(d => g[MILLISECONDS](d) === 0)
  },
  {
    units: [YEAR, MONTH, DATE, HOURS, MINUTES],
    step: 1,
    aligned: (dates, g) => dates.every(d => g[SECONDS](d) === 0)
  },
  {
    units: [YEAR, MONTH, DATE, HOURS, MINUTES],
    step: 5,
    aligned: (dates, g) => dates.every(d => g[MINUTES](d) % 5 === 0)
  },
  {
    units: [YEAR, MONTH, DATE, HOURS, MINUTES],
    step: 10,
    aligned: (dates, g) => dates.every(d => g[MINUTES](d) % 10 === 0)
  },
  {
    units: [YEAR, MONTH, DATE, HOURS],
    step: 1,
    aligned: (dates, g) => dates.every(d => g[MINUTES](d) === 0)
  },
  {
    units: [YEAR, MONTH, DATE],
    step: 1,
    aligned: (dates, g) => dates.every(d => g[HOURS](d) === 0)
  },
  {
    units: [YEAR, WEEK],
    step: 1,
    skippable: true,
    aligned: (dates, g) => new Set(dates.map(d => g[DAY](d))).size === 1
  },
  {
    units: [YEAR, MONTH],
    step: 1,
    aligned: (dates, g) => dates.every(d => g[DATE](d) === 1)
  },
  {
    units: [YEAR, MONTH],
    step: 3,
    aligned: (dates, g) => dates.every(d => g[MONTH](d) % 3 === 0)
  },
  {
    units: [YEAR],
    step: 1,
    aligned: (dates, g) => dates.every(d => g[MONTH](d) === 0)
  },
  {
    units: [YEAR],
    step: 10,
    aligned: (dates, g) => dates.every(d => g[YEAR](d) % 10 === 0)
  },
  {
    aligned: () => false
  }
];

export default function detectTimeUnits(data, field, utc) {
  const getters = utc ? utcGetters : localGetters;

  const dates = data.map(t => {
    const v = field(t), d = new Date(v);
    if (Number.isNaN(+d)) error(`Invalid date: ${v}`);
    return d;
  });

  const mismatch = grains.findIndex(g => !g.aligned(dates, getters)),
        required = grains.findIndex(g => !g.skippable && !g.aligned(dates, getters)),
        index = required > mismatch + 1 ? required : mismatch;

  const {units, step} = grains[index - 1];
  return {units, step};
}
