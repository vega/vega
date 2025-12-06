import isDate from './isDate.js';
import isNumber from './isNumber.js';

const defaultParser = (_: unknown): Date | number =>
  isNumber(_) ? _ : isDate(_) ? _ : Date.parse(_ as string);

/**
 * Coerces a value to a Date-like value using an optional parser.
 */
export default function toDate(_: unknown, parser?: (value: unknown) => Date | number): Date | number | null {
  parser = parser || defaultParser;
  return _ == null || _ === '' ? null : parser(_);
}
