export default function(_: (string | number)[]): { [key: string]: true } {
  for (var s: any = {}, i = 0, n = _.length; i < n; ++i) s[_[i]] = true;
  return s;
}
