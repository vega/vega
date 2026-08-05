/**
 * Verify that the value is a function-like object.
 */
export default function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}
