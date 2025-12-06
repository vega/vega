import accessor, { Accessor } from './accessor.js';
import array from './array.js';
import getter from './getter.js';
import splitAccessPath from './splitAccessPath.js';

export interface KeyOptions {
  get?: (path: string[]) => (obj: any) => any;
}

export default function key(
  fields?: string | string[] | null,
  flat?: boolean,
  opt?: KeyOptions
): Accessor<any, string> {
  let processedFields: string[] | undefined;

  if (fields) {
    const arrayFields = array(fields);
    processedFields = flat
      ? arrayFields.map(f => f.replace(/\\(.)/g, '$1'))
      : [...arrayFields];
  }

  const len = processedFields && processedFields.length;
  const gen = opt && opt.get || getter;
  const map = (f: string) => gen(flat ? [f] : splitAccessPath(f));
  let fn: (obj: any) => string;

  if (!len) {
    fn = function() { return ''; };
  } else if (len === 1) {
    const get = map(processedFields![0]);
    fn = function(_) { return '' + get(_); };
  } else {
    const get = processedFields!.map(map);
    fn = function(_) {
      let s = '' + get[0](_), i = 0;
      while (++i < len) s += '|' + get[i](_);
      return s;
    };
  }

  return accessor(fn, processedFields, 'key');
}
