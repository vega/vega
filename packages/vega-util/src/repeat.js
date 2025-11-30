/**
 * Repeat a string a specified number of times.
 * @param {string} str - The string to repeat
 * @param {number} reps - The number of times to repeat the string
 * @returns {string} The repeated string
 */
export default function(str, reps) {
  let s = '';
  while (--reps >= 0) s += str;
  return s;
}
