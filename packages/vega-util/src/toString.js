/** Coerces a value to a string, returning `null` for empty inputs.
 * @param {unknown} _ - Input value to coerce.
 * @returns {string | null}
 */
export default function(_) {
  return _ == null || _ === '' ? null : _ + '';
}
