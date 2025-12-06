/**
 * Confirm whether the value is a `RegExp` object.
 */
export default function isRegExp(value: unknown): value is RegExp {
  return Object.prototype.toString.call(value) === '[object RegExp]';
}
