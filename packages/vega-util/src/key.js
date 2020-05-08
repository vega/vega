import accessor from './accessor';
import array from './array';
import getter from './getter';
import splitAccessPath from './splitAccessPath';

const DELIM = '|';

export default function(fields, flat) {
  if (fields) {
    fields = flat
      ? array(fields).map(f => f.replace(/\\(.)/g, '$1'))
      : array(fields);
  }

  const len = fields && fields.length;
  let fn;

  if (!len) {
    fn = function() { return ''; };
  } else {
    const get = fields.map(f => getter(flat ? [f] : splitAccessPath(f)));
    fn = function(_) {
      let s = '' + get[0](_), i = 0;
      while (++i < len) s += DELIM + get[i](_);
      return s;
    };
  }

  return accessor(fn, fields, 'key');
}
