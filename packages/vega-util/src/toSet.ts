export default function toSet<T>(_: readonly T[] | ArrayLike<T>): Record<string, true> {
  const s: Record<string, true> = {},
        n = _.length;
  for (let i=0; i<n; ++i) s[_[i] + ''] = true;
  return s;
}
