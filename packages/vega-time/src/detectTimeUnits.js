import detectTimeGrain from 'time-grain-detector';

import {
    DATE,
    HOURS,
    MILLISECONDS,
    MINUTES,
    MONTH,
    SECONDS,
    YEAR
} from './units';

const allowedUnits = [YEAR, MONTH, DATE, HOURS, MINUTES, SECONDS, MILLISECONDS];
const unitNameConversion = {
    'year': YEAR,
    'month': MONTH,
    'day': DATE,
    'hour': HOURS,
    'minute': MINUTES,
    'second': SECONDS,
    'millisecond': MILLISECONDS
};

export default function detectTimeUnits(array, f) {
    const { unit: rawUnit, count: step } = detectTimeGrain(array.map(f));
    const unit = unitNameConversion[rawUnit];
    const unitIndex = allowedUnits.indexOf(unit);
    const units = allowedUnits.slice(0, unitIndex + 1);
    return { units, step };
}