/**
 * Truncate a string to a specified length with an optional ellipsis.
 */
export default function truncate(
  str: string,
  length: number,
  align?: 'left' | 'center',
  ellipsis?: string
): string {
  const e = ellipsis != null ? ellipsis : '\u2026',
        s = str + '',
        n = s.length,
        l = Math.max(0, length - e.length);

  return n <= length ? s
    : align === 'left' ? e + s.slice(n - l)
    : align === 'center' ? s.slice(0, Math.ceil(l/2)) + e + s.slice(n - ~~(l/2))
    : s.slice(0, l) + e;
}
