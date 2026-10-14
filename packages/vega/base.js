// The Vega API with no transforms registered, allowing for a smaller bundle. Import
// from `vega/base` and only register the transforms you need:
//
//   import {transforms} from 'vega/base';
//   import * as encode from 'vega-encode';
//   import * as viewTransforms from 'vega-view-transforms';
//   import {aggregate, collect, filter, sieve} from 'vega-transforms';
//   Object.assign(transforms, encode, viewTransforms, {aggregate, collect, filter, sieve});
//
// Nearly every spec needs the transforms in vega-encode and vega-view-transforms,
// plus collect and sieve from vega-transforms, since the parser uses them
// internally for marks, axes and legends. Beyond that, register the transforms
// that your specs use, plus any that the parser adds for some features: `facet`
// and `prefacet` for facets, and `projection` (from vega-geo) for projections.

// -- Exports -----

import * as pkg from './package.json' with { type: 'json' };
export const version = pkg.version;

export * from 'vega-statistics';

export * from 'vega-time';

export * from 'vega-util';

export * from 'vega-loader';

export * from 'vega-scenegraph';

export {
  Dataflow,
  EventStream,
  Parameters,
  Pulse,
  MultiPulse,
  Operator,
  Transform,
  changeset,
  ingest,
  isTuple,
  definition,
  transform,
  transforms,
  tupleid
} from 'vega-dataflow';

export {
  scale,
  scheme,
  interpolate,
  interpolateColors,
  interpolateRange,
  quantizeInterpolator
} from 'vega-scale';

export {
  projection
} from 'vega-projection';

export {
  View
} from 'vega-view';

export {
  numberFormatDefaultLocale as formatLocale,
  timeFormatDefaultLocale as timeFormatLocale,
  locale,
  defaultLocale,
  resetDefaultLocale
} from 'vega-format';

export {
  expressionFunction
} from 'vega-functions';

export {
  parse
} from 'vega-parser';

export {
  context as runtimeContext
} from 'vega-runtime';

export {
  codegenExpression,
  parseExpression
} from 'vega-expression';

export {
  parseSelector
} from 'vega-event-selector';
