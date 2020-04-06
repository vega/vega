export default function (_) {
  const s = {};
  for (let i = 0, n = _.length; i < n; ++i) s[_[i]] = true;
  return s;
}
