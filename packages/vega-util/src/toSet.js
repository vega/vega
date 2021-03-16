export default function(_) {
  const s = {};
  const n = _.length;
  for (let i=0; i<n; ++i) s[_[i]] = true;
  return s;
}
