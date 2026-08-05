/**
 * Coerces a value to a number, returning `null` for empty inputs.
 */
export default function toNumber(_: unknown): number | null {
  return _ == null || _ === '' ? null : +_;
}
