import {
  numberFormatDefaultLocale,
  numberFormatLocale
} from './number';

import {
  timeFormatDefaultLocale,
  timeFormatLocale
} from './time';

const createLocale = (number, time) =>
  Object.assign({}, number, time);

export function locale(numberSpec, timeSpec) {
  timeSpec = timeSpec || numberSpec;
  return createLocale(
    numberFormatLocale(numberSpec),
    timeFormatLocale(timeSpec)
  );
}

export function defaultLocale(numberSpec, timeSpec) {
  timeSpec = timeSpec || numberSpec;
  return arguments.length
    ? createLocale(
        numberFormatDefaultLocale(numberSpec),
        timeFormatDefaultLocale(timeSpec)
      )
    : createLocale(
        numberFormatDefaultLocale(),
        timeFormatDefaultLocale()
      );
}
