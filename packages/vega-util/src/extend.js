export default function (_) {
  let x;
  let k;
  for (let i = 1, len = arguments.length; i < len; ++i) {
    // eslint-disable-next-line prefer-rest-params
    x = arguments[i];
    for (k in x) {
      _[k] = x[k];
    }
  }
  return _;
}
