import isDate from './isDate.js';
import isNumber from './isNumber.js';

/** @param {unknown} _ @returns {Date | number} */
const defaultParser = _ =>
  isNumber(_) ? _ : isDate(_) ? _ : Date.parse(/** @type {string} */(_));

/** Coerces a value to a Date-like value using an optional parser.
 * @param {unknown} _ - Input value to coerce.
 * @param {(value: unknown) => Date | number} [parser] - Optional parser that receives the raw input.
 * @returns {Date | number | null}
 */
export default function(_, parser) {
  parser = parser || defaultParser;
  return _ == null || _ === '' ? null : parser(_);
}
