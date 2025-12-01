/** Coerces a value to a number, returning `null` for empty inputs.
 * @param {unknown} _ - Input value to coerce.
 * @returns {number | null}
 */
export default function(_) {
  return _ == null || _ === '' ? null : +_;
}
