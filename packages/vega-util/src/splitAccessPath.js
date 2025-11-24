import error from './error.js';

/**
 * Splits an access path string into its component parts.
 * Handles dot notation, bracket notation, and quoted strings.
 *
 * @param {string} p - The access path string to split
 * @returns {string[]} An array of path components
 */
export default function(p) {
  /** @type {string[]} */
  const path = [],
        n = p.length;

  let q = null,
      b = 0,
      s = '';
  /** @type {number} */ let i;
  /** @type {number} */ let j;
  /** @type {string} */ let c;

  p = p + '';

  function push() {
    path.push(s + p.substring(i, j));
    s = '';
    i = j + 1;
  }

  for (i=j=0; j<n; ++j) {
    c = p[j];
    if (c === '\\') {
      s += p.substring(i, j++);
      i = j;
    } else if (c === q) {
      push();
      q = null;
      b = -1;
    } else if (q) {
      continue;
    } else if (i === b && c === '"') {
      i = j + 1;
      q = c;
    } else if (i === b && c === "'") {
      i = j + 1;
      q = c;
    } else if (c === '.' && !b) {
      if (j > i) {
        push();
      } else {
        i = j + 1;
      }
    } else if (c === '[') {
      if (j > i) push();
      b = i = j + 1;
    } else if (c === ']') {
      if (!b) error('Access path missing open bracket: ' + p);
      if (b > 0) push();
      b = 0;
      i = j + 1;
    }
  }

  if (b) error('Access path missing closing bracket: ' + p);
  if (q) error('Access path missing closing quote: ' + p);

  if (j > i) {
    j++;
    push();
  }

  return path;
}
