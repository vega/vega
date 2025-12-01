/** @template T
 * @param {readonly T[] | ArrayLike<T>} _ - Collection to convert.
 * @returns {Record<string, true>}
 */
export default function(_) {
  /** @type {Record<string, true>} */
  const s = {},
        n = _.length;
  for (let i=0; i<n; ++i) s[_[i] + ''] = true;
  return s;
}
