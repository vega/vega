import {DATE, HOURS, MILLISECONDS, MINUTES, MONTH, SECONDS, WEEK, YEAR, TimeUnit} from './units.js';
import {span} from 'vega-util';
import {bisector, tickStep} from 'd3-array';

const durationSecond = 1000,
      durationMinute = durationSecond * 60,
      durationHour = durationMinute * 60,
      durationDay = durationHour * 24,
      durationWeek = durationDay * 7,
      durationMonth = durationDay * 30,
      durationYear = durationDay * 365;

const Milli: TimeUnit[]   = [YEAR, MONTH, DATE, HOURS, MINUTES, SECONDS, MILLISECONDS],
      Seconds: TimeUnit[] = Milli.slice(0, -1),
      Minutes: TimeUnit[] = Seconds.slice(0, -1),
      Hours: TimeUnit[]   = Minutes.slice(0, -1),
      Day: TimeUnit[]     = Hours.slice(0, -1),
      Week: TimeUnit[]    = [YEAR, WEEK],
      Month: TimeUnit[]   = [YEAR, MONTH],
      Year: TimeUnit[]    = [YEAR];

/** Interval tuple: [units, step, duration] */
type Interval = [TimeUnit[], number, number];

const intervals: Interval[] = [
  [Seconds,  1,      durationSecond],
  [Seconds,  5,  5 * durationSecond],
  [Seconds, 15, 15 * durationSecond],
  [Seconds, 30, 30 * durationSecond],
  [Minutes,  1,      durationMinute],
  [Minutes,  5,  5 * durationMinute],
  [Minutes, 15, 15 * durationMinute],
  [Minutes, 30, 30 * durationMinute],
  [  Hours,  1,      durationHour  ],
  [  Hours,  3,  3 * durationHour  ],
  [  Hours,  6,  6 * durationHour  ],
  [  Hours, 12, 12 * durationHour  ],
  [    Day,  1,      durationDay   ],
  [   Week,  1,      durationWeek  ],
  [  Month,  1,      durationMonth ],
  [  Month,  3,  3 * durationMonth ],
  [   Year,  1,      durationYear  ]
];

/** Options for time binning */
export interface TimeBinOptions {
  /** Date range as [start, end] timestamps */
  extent: [number, number];
  /** Maximum number of bins (default: 40) */
  maxbins?: number;
}

/** Result of time binning */
export interface TimeBinResult {
  /** Time units for the bin */
  units: TimeUnit[];
  /** Step size for the bin */
  step: number;
}

export default function timeBin(opt: TimeBinOptions): TimeBinResult {
  const ext = opt.extent,
        max = opt.maxbins || 40,
        target = Math.abs(span(ext)) / max;

  let i = bisector((interval: Interval) => interval[2]).right(intervals, target),
      units: TimeUnit[],
      step: number;

  if (i === intervals.length) {
    units = Year,
    step = tickStep(ext[0] / durationYear, ext[1] / durationYear, max);
  } else if (i) {
    const interval = intervals[target / intervals[i - 1][2] < intervals[i][2] / target ? i - 1 : i];
    units = interval[0];
    step = interval[1];
  } else {
    units = Milli;
    step = Math.max(tickStep(ext[0], ext[1], max), 1);
  }

  return {units, step};
}
