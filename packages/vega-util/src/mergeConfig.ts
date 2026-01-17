import {isArray} from './isArray.js';
import isObject from './isObject.js';


const isLegalKey = (key: string) => key !== '__proto__';

/** Represents any valid configuration value (primitives, arrays, or nested config objects). */
type ConfigValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ConfigValue[]
  | ConfigObject;

interface ConfigObject {
  [key: string]: ConfigValue;
}

/** A signal object with a required name property; compatible with vega-typings InitSignal | NewSignal. */
interface NamedSignal {
  name: string;
  [key: string]: ConfigValue;
}

/** Represents top-level Vega configuration object; compatible with vega-typings Config. */
interface VegaConfig extends ConfigObject {
  signals?: NamedSignal[];
}

/** Internal type used to determine which properties should be recursively merged. Currently only supports legend layout and style blocks */
type RecurseStrategy = Record<string, unknown> | boolean | null;


/** Merges Vega config objects. Signals merged by name (source takes precedence),
 * legend.layout recursively merged, style fully recursive, others shallow.
 * Return type is compatible with vega-typings Config. */
export function mergeConfig(...configs: Partial<VegaConfig>[]): VegaConfig {
  return configs.reduce((out, source) => {
    for (const key in source) {
      if (key === 'signals') {
        // for signals, we merge the signals arrays
        // source signals take precedence over
        // existing signals with the same name
        out.signals = mergeNamed(out.signals, source.signals);
      } else {
        // otherwise, merge objects subject to recursion constraints
        // for legend block, recurse for the layout entry only
        // for style block, recurse for all properties
        // otherwise, no recursion: objects overwrite, no merging
        const r: RecurseStrategy = key === 'legend' ? {layout: 1}
          : key === 'style' ? true
          : null;
        writeConfig(out, key, source[key], r);
      }
    }
    return out;
  }, {} as VegaConfig);
}

/** Writes config value to output with optional recursion, rejecting illegal keys that could be used to modify the prototype chain */
export function writeConfig(
  output: ConfigObject,
  key: string,
  value: ConfigValue,
  recurse?: RecurseStrategy
): void {
  if (!isLegalKey(key)) return;

  let k: string, o: ConfigObject;
  if (isObject(value) && !isArray(value)) {
    const valueObj = value as ConfigObject;
    o = (isObject(output[key]) ? output[key] : (output[key] = {})) as ConfigObject;
    for (k in valueObj) {
      if (recurse && (recurse === true || recurse[k])) {
        writeConfig(o, k, valueObj[k]);
      } else if (isLegalKey(k)) {
        o[k] = valueObj[k];
      }
    }
  } else {
    output[key] = value;
  }
}

/** Merges named object arrays, deduplicating by name. (b takes precedence). */
function mergeNamed(
  a: NamedSignal[] | null | undefined,
  b: NamedSignal[] | undefined
): NamedSignal[] | undefined {
  if (a == null) return b;
  if (b == null) return a;

  const map: Record<string, number> = {};
  const out: NamedSignal[] = [];

  function add(item: NamedSignal): void {
    if (!map[item.name]) {
      map[item.name] = 1;
      out.push(item);
    }
  }

  b.forEach(add);
  a.forEach(add);
  return out;
}
