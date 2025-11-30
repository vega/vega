/**
 * Truncate a string to a specified length with an optional ellipsis.
 * @param {string} str - The string to truncate
 * @param {number} length - The maximum length of the truncated string
 * @param {'left' | 'center'} [align] - The alignment of the ellipsis (defaults to right-aligned)
 * @param {string} [ellipsis] - The ellipsis string to use (defaults to '…')
 * @returns {string} The truncated string
 */
export default function(str, length, align, ellipsis) {
  const e = ellipsis != null ? ellipsis : '\u2026',
        s = str + '',
        n = s.length,
        l = Math.max(0, length - e.length);

  return n <= length ? s
    : align === 'left' ? e + s.slice(n - l)
    : align === 'center' ? s.slice(0, Math.ceil(l/2)) + e + s.slice(n - ~~(l/2))
    : s.slice(0, l) + e;
}
