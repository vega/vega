import {isArray} from './isArray.js';
import isObject from './isObject.js';

const isLegalKey = (key: string) => key !== '__proto__';

type Config = Record<string, unknown>;

// Named items have a 'name' property used for deduplication
interface NamedItem {
  name: string;
  [key: string]: unknown;
}

export function mergeConfig(...configs: Config[]): Config {
  return configs.reduce((out, source) => {
    for (const key in source) {
      if (key === 'signals') {
        // signals is an array that needs special merging logic
        out.signals = mergeNamed(
          out.signals as NamedItem[] | null | undefined,
          source.signals as NamedItem[]
        );
      } else {
        const r = key === 'legend' ? {layout: 1 as const}
          : key === 'style' ? true
          : null;
        writeConfig(out, key, source[key], r);
      }
    }
    return out;
  }, {} as Config);
}

export function writeConfig(
  output: Config,
  key: string,
  value: unknown,
  recurse?: Record<string, 1> | boolean | null
): void {
  if (!isLegalKey(key)) return;

  if (isObject(value) && !isArray(value)) {
    // After isObject check, we know value is a non-array object
    // TypeScript doesn't narrow unknown with isObject, so we assert to Config
    const valueAsConfig = value as Config;

    // Ensure output[key] is an object, creating it if needed
    let o: Config;
    if (isObject(output[key])) {
      o = output[key] as Config;
    } else {
      o = {};
      output[key] = o;
    }

    for (const k in valueAsConfig) {
      if (recurse && (recurse === true || (recurse as Record<string, unknown>)[k])) {
        writeConfig(o, k, valueAsConfig[k]);
      } else if (isLegalKey(k)) {
        o[k] = valueAsConfig[k];
      }
    }
  } else {
    output[key] = value;
  }
}

function mergeNamed(
  a: NamedItem[] | null | undefined,
  b: NamedItem[]
): NamedItem[] {
  if (a == null) return b;

  const map: Record<string, 1> = {};
  const out: NamedItem[] = [];

  function add(item: NamedItem) {
    if (!map[item.name]) {
      map[item.name] = 1;
      out.push(item);
    }
  }

  b.forEach(add);
  a.forEach(add);
  return out;
}
