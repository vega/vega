/**
 * Verify that the value is a function-like object.
 * @param {unknown} value
 * @returns {value is Function}
 */
export default function isFunction(value) {
  return typeof value === 'function';
}
