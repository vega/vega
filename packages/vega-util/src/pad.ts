import repeat from './repeat.js';

/**
 * Pads a string to a specified length with a padding character.
 */
export default function pad(
  str: string,
  length: number,
  padchar?: string,
  align?: 'left' | 'center' | 'right'
): string {
  const c = padchar || ' ',
        s = str + '',
        n = length - s.length;

  return n <= 0 ? s
    : align === 'left' ? repeat(c, n) + s
    : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
    : s + repeat(c, n);
}
