export default function(str, length, align, ellipsis) {
  var e = ellipsis != null ? ellipsis : '\u2026',
      n = str.length,
      l = Math.max(0, length - e.length);

  return n <= length ? str
    : align === 'left' ? e + str.slice(n - l)
    : align === 'center' ? str.slice(0, Math.ceil(l/2)) + e + str.slice(n - ~~(l/2))
    : str.slice(0, l) + e;
}
