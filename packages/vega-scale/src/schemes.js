import {continuous, discrete} from './palettes';
import {interpolateColors} from './interpolate';

function colors(palette) {
  const n = palette.length / 6 | 0,
        c = new Array(n);

  for (let i = 0; i < n;) {
    c[i] = '#' + palette.slice(i * 6, ++i * 6);
  }
  return c;
}

function apply(_, f) {
  for (const k in _) scheme(k, f(_[k]));
}

const schemes = {};
apply(discrete, colors);
apply(continuous, _ => interpolateColors(colors(_)));

export function scheme(name, scheme) {
  name = name && name.toLowerCase();
  if (arguments.length > 1) {
    schemes[name] = scheme;
    return this;
  } else {
    return schemes[name];
  }
}
