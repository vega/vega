import isDate from './isDate.js';
import isNumber from './isNumber.js';

const defaultParser = (_: unknown): Date | number =>
  // Date.parse accepts string but will implicitly coerce the input value.
  // Type assertion allows Date.parse to handle its own coercion behavior.
  isNumber(_) ? _ : isDate(_) ? _ : Date.parse(_ as string);

/**
 * Coerces a value to a Date-like value using an optional parser.
 */
export default function toDate(_: unknown, parser?: (value: unknown) => Date | number): Date | number | null {
  parser = parser || defaultParser;
  return _ == null || _ === '' ? null : parser(_);
}
