/** Coerces a value to a boolean, matching Vega signal semantics.
 * Strings like `'false'` or `'0'` map to `false`; `null` and empty strings map to `null`.
 * @param {unknown} _ - Input value to coerce.
 * @returns {boolean | null}
 */
export default function(_) {
  return _ == null || _ === '' ? null : !_ || _ === 'false' || _ === '0' ? false : !!_;
}
