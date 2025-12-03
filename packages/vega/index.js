// -- Transforms -----

import {extend} from '@omni-co/vega-util';
import {transforms} from '@omni-co/vega-dataflow';
import * as tx from '@omni-co/vega-transforms';
import * as vtx from '@omni-co/vega-view-transforms';
import * as encode from '@omni-co/vega-encode';
import * as geo from '@omni-co/vega-geo';
import * as force from '@omni-co/vega-force';
import * as tree from '@omni-co/vega-hierarchy';
import * as label from '@omni-co/vega-label';
import * as reg from '@omni-co/vega-regression';
import * as voronoi from '@omni-co/vega-voronoi';
import * as wordcloud from '@omni-co/vega-wordcloud';
import * as xf from '@omni-co/vega-crossfilter';
extend(
  transforms,
  tx, vtx, encode, geo, force, label, tree, reg, voronoi, wordcloud, xf
);


// -- Exports -----

import * as pkg from './package.json' with { type: 'json' };
export const version = pkg.version;

export * from '@omni-co/vega-statistics';

export * from '@omni-co/vega-time';

export * from '@omni-co/vega-util';

export * from '@omni-co/vega-loader';

export * from '@omni-co/vega-scenegraph';

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
} from '@omni-co/vega-dataflow';

export {
  scale,
  scheme,
  interpolate,
  interpolateColors,
  interpolateRange,
  quantizeInterpolator
} from '@omni-co/vega-scale';

export {
  projection
} from '@omni-co/vega-projection';

export {
  View
} from '@omni-co/vega-view';

export {
  numberFormatDefaultLocale as formatLocale,
  timeFormatDefaultLocale as timeFormatLocale,
  locale,
  defaultLocale,
  resetDefaultLocale
} from '@omni-co/vega-format';

export {
  expressionFunction
} from '@omni-co/vega-functions';

export {
  parse
} from '@omni-co/vega-parser';

export {
  context as runtimeContext
} from '@omni-co/vega-runtime';

export {
  codegenExpression,
  parseExpression
} from '@omni-co/vega-expression';

export {
  parseSelector
} from '@omni-co/vega-event-selector';
