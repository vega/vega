/**
 * Identify if the value is a number primitive.
 * @param {unknown} value
 * @returns {value is number}
 */
export default function isNumber(value) {
  return typeof value === 'number';
}
