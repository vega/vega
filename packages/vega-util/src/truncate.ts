export default function(
  str: string,
  length: number,
  align?: 'left' | 'center' | 'right',
  ellipsis?: string,
) {
  var e = ellipsis != null ? ellipsis : '\u2026',
    s = str + '',
    n = s.length,
    l = Math.max(0, length - e.length);

  return n <= length
    ? s
    : align === 'left'
    ? e + s.slice(n - l)
    : align === 'center'
    ? s.slice(0, Math.ceil(l / 2)) + e + s.slice(n - ~~(l / 2))
    : s.slice(0, l) + e;
}
