import {isArray} from './isArray.js';
import isObject from './isObject.js';


const isLegalKey = (key: string) => key !== '__proto__' && key !== 'constructor' && key !== 'prototype';

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
 *
 * The signature is generic because declared interfaces such as the vega-typings
 * and vega-lite `Config` types have no implicit index signature and would not be
 * assignable to the internal structural types. */
export function mergeConfig<C extends object>(...configs: C[]): C {
  return (configs as Partial<VegaConfig>[]).reduce((out, source) => {
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
  }, {} as VegaConfig) as C;
}

/** Writes config value to output with optional recursion, rejecting illegal keys that could be used to modify the prototype chain.
 * Generic for the same reason as mergeConfig. */
export function writeConfig<C extends object>(
  output: C,
  key: string,
  value: unknown,
  recurse?: boolean | object | null
): void {
  if (!isLegalKey(key)) return;

  const out = output as ConfigObject;
  let k: string, o: ConfigObject;
  if (isObject(value) && !isArray(value)) {
    const valueObj = value as ConfigObject;
    o = (isObject(out[key]) ? out[key] : (out[key] = {})) as ConfigObject;
    for (k in valueObj) {
      if (recurse && (recurse === true || (recurse as Record<string, unknown>)[k])) {
        writeConfig(o, k, valueObj[k]);
      } else if (isLegalKey(k)) {
        o[k] = valueObj[k];
      }
    }
  } else {
    out[key] = value as ConfigValue;
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
