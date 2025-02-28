import isDate from './isDate.js';
import isNumber from './isNumber.js';

const defaultParser = _ =>
  isNumber(_) ? _ : isDate(_) ? _ : Date.parse(_);

export default function(_, parser) {
  parser = parser || defaultParser;
  return _ == null || _ === '' ? null : parser(_);
}
