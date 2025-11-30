/**
 * Determine if the value is a boolean primitive.
 * @param {unknown} value
 * @returns {value is boolean}
 */
export default function isBoolean(value) {
  return typeof value === 'boolean';
}
