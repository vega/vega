import isArray from './isArray.js';
import isObject from './isObject.js';

const isLegalKey = (key: string) => key !== '__proto__';

export function mergeConfig(...configs: any[]): any {
  return configs.reduce((out, source) => {
    for (const key in source) {
      if (key === 'signals') {
        out.signals = mergeNamed(out.signals, source.signals);
      } else {
        const r = key === 'legend' ? {layout: 1}
          : key === 'style' ? true
          : null;
        writeConfig(out, key, source[key], r);
      }
    }
    return out;
  }, {});
}

export function writeConfig(
  output: any,
  key: string,
  value: any,
  recurse?: Record<string, 1> | boolean | null
): void {
  if (!isLegalKey(key)) return;

  let k: string, o: any;
  if (isObject(value) && !isArray(value)) {
    o = isObject(output[key]) ? output[key] : (output[key] = {});
    for (k in value) {
      if (recurse && (recurse === true || recurse[k])) {
        writeConfig(o, k, value[k]);
      } else if (isLegalKey(k)) {
        o[k] = value[k];
      }
    }
  } else {
    output[key] = value;
  }
}

function mergeNamed(a: any[] | null | undefined, b: any[]): any[] {
  if (a == null) return b;

  const map: Record<string, 1> = {}, out: any[] = [];

  function add(_: any) {
    if (!map[_.name]) {
      map[_.name] = 1;
      out.push(_);
    }
  }

  b.forEach(add);
  a.forEach(add);
  return out;
}
