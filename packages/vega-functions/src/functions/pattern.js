import {isString} from 'vega-util';

// Pure construction only: inputs (e.g. shared scale range wrappers) are
// never mutated, and validation stays with the vega-pattern normalizer.
export default function(spec, overrides) {
  if (spec == null) return null;
  const def = isString(spec) ? {name: spec}
    : spec.pattern != null ? spec.pattern
    : spec;
  return {pattern: {...def, ...overrides}};
}
