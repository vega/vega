import accessor, { Accessor } from './accessor.js';
import array from './array.js';
import getter from './getter.js';
import splitAccessPath from './splitAccessPath.js';

export interface KeyOptions {
  get?: (path: string[]) => (obj: unknown) => unknown;
}

export default function key(fields: string | string[] | null | undefined, flat?: boolean, opt?: KeyOptions): Accessor<string> {
  const processedFields = fields
    ? (flat
        ? array(fields).map(f => f.replace(/\\(.)/g, '$1'))
        : array(fields))
    : undefined;

  const len = processedFields?.length,
        gen = opt && opt.get || getter,
        map = (f: string) => gen(flat ? [f] : splitAccessPath(f));
  let fn: (obj: unknown) => string;

  if (!len || !processedFields) {
    fn = function() { return ''; };
  } else if (len === 1) {
    const get = map(processedFields[0]);
    fn = function(_: unknown) { return '' + get(_); };
  } else {
    const get = processedFields.map(map);
    fn = function(_: unknown) {
      let s = '' + get[0](_), i = 0;
      while (++i < len) s += '|' + get[i](_);
      return s;
    };
  }

  return accessor(fn, processedFields, 'key');
}
