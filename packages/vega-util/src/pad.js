import repeat from './repeat.js';

/**
 * Pads a string to a specified length with a padding character.
 * @param {string} str - string to pad.
 * @param {number} length - target length of padded string.
 * @param {string} [padchar=' '] - character to use for padding.
 * @param {'left'|'center'|'right'} [align='right'] - The alignment of the original string ('left' for left-align, 'center' for center-align, 'right' for right-align).
 * @returns {string} The padded string.
 */
export default function(str, length, padchar, align) {
  const c = padchar || ' ',
        s = str + '',
        n = length - s.length;

  return n <= 0 ? s
    : align === 'left' ? repeat(c, n) + s
    : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
    : s + repeat(c, n);
}
