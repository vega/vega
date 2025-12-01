/**
 * Determine if the value is a boolean primitive.
 */
export default function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}
