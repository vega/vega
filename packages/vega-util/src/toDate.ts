import isDate from './isDate';
import isNumber from './isNumber';

function defaultParser(_: string): number | Date {
  return isNumber(_) ? _ : isDate(_) ? _ : Date.parse(_);
}

export default function(_: string, parser: typeof defaultParser) {
  parser = parser || defaultParser;
  return _ == null || _ === '' ? null : parser(_);
}
