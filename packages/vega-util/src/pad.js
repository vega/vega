import repeat from './repeat';

export default function(str, length, padchar, align) {
  const c = padchar || ' ';
  const s = str + '';
  const n = length - s.length;

  return n <= 0 ? s
    : align === 'left' ? repeat(c, n) + s
    : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
    : s + repeat(c, n);
}
