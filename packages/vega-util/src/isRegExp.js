/**
 * Confirm whether the value is a `RegExp` object.
 * @param {unknown} value
 * @returns {value is RegExp}
 */
export default function isRegExp(value) {
  return Object.prototype.toString.call(value) === '[object RegExp]';
}
