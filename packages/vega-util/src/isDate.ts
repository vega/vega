/**
 * Check if the value is an actual Date object.
 */
export default function isDate(value: unknown): value is Date {
  return Object.prototype.toString.call(value) === '[object Date]';
}
