import { extend } from 'vega-util';
export * from 'vega-util';
import { transforms } from 'vega-dataflow';
export { Dataflow, EventStream, MultiPulse, Operator, Parameters, Pulse, Transform, changeset, definition, ingest, isTuple, transform, transforms, tupleid } from 'vega-dataflow';
import * as tx from 'vega-transforms';
import * as vtx from 'vega-view-transforms';
import * as encode from 'vega-encode';
import * as geo from 'vega-geo';
import * as force from 'vega-force';
import * as tree from 'vega-hierarchy';
import * as label from 'vega-label';
import * as reg from 'vega-regression';
import * as voronoi from 'vega-voronoi';
import * as wordcloud from 'vega-wordcloud';
import * as xf from 'vega-crossfilter';
export * from 'vega-statistics';
export * from 'vega-time';
export * from 'vega-loader';
export * from 'vega-scenegraph';
export { interpolate, interpolateColors, interpolateRange, quantizeInterpolator, scale, scheme } from 'vega-scale';
export { projection } from 'vega-projection';
export { View } from 'vega-view';
export { defaultLocale, numberFormatDefaultLocale as formatLocale, locale, resetDefaultLocale, timeFormatDefaultLocale as timeFormatLocale } from 'vega-format';
export { expressionFunction } from 'vega-functions';
export { parse } from 'vega-parser';
export { context as runtimeContext } from 'vega-runtime';
export { codegenExpression, parseExpression } from 'vega-expression';
export { parseSelector } from 'vega-event-selector';

var version = "5.25.0";

// -- Transforms -----
extend(transforms, tx, vtx, encode, geo, force, label, tree, reg, voronoi, wordcloud, xf);

export { version };
