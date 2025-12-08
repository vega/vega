/**
 * Coerces a value to a boolean, matching Vega signal semantics.
 * Strings like `'false'` or `'0'` map to `false`; `null` and empty strings map to `null`.
 */
export default function toBoolean(_: unknown): boolean | null {
  return _ == null || _ === '' ? null : !_ || _ === 'false' || _ === '0' ? false : !!_;
}
