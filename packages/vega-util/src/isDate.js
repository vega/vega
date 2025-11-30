/**
 * Check if the value is an actual Date object.
 * @param {unknown} value
 * @returns {value is Date}
 */
export default function isDate(value) {
  return Object.prototype.toString.call(value) === '[object Date]';
}
