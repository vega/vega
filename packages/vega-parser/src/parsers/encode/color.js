import entry from './entry';

export default function (enc, scope, params, fields) {
  function color(type, x, y, z) {
    const a = entry(null, x, scope, params, fields);
    const b = entry(null, y, scope, params, fields);
    const c = entry(null, z, scope, params, fields);
    return 'this.' + type + '(' + [a, b, c].join(',') + ').toString()';
  }

  return enc.c
    ? color('hcl', enc.h, enc.c, enc.l)
    : enc.h || enc.s
    ? color('hsl', enc.h, enc.s, enc.l)
    : enc.l || enc.a
    ? color('lab', enc.l, enc.a, enc.b)
    : enc.r || enc.g || enc.b
    ? color('rgb', enc.r, enc.g, enc.b)
    : null;
}
