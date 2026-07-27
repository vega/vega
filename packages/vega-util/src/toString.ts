/**
 * Coerces a value to a string, returning `null` for empty inputs.
 */
export default function toString(_: unknown): string | null {
  return _ == null || _ === '' ? null : _ + '';
}
