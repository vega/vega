export * from 'vega-statistics';

export * from 'vega-util';

export {
  load
} from 'vega-loader';

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
  register,
  definition,
  definitions,
  transform,
  transforms,
  tupleid
} from 'vega-dataflow';

export {
  scale,
  scheme
} from 'vega-scale';

export {
  projection
} from 'vega-geo';

/* eslint-disable no-unused-vars */
import * as encode from 'vega-encode';
import * as force from 'vega-force';
import * as hierarchy from 'vega-hierarchy';
import * as voronoi from 'vega-voronoi';
import * as xfilter from 'vega-crossfilter';
/* eslint-enable */

import {transform} from 'vega-dataflow';
import Bound from './src/transforms/Bound';
import Mark from './src/transforms/Mark';
import Render from './src/transforms/Render';
import ViewLayout from './src/transforms/ViewLayout';
transform('Bound', Bound);
transform('Mark', Mark);
transform('Render', Render);
transform('ViewLayout', ViewLayout);

export {
  Bounds,
  Gradient,
  ImageLoader,
  Item,
  Scenegraph,
  Handler,
  Renderer,
  CanvasHandler,
  CanvasRenderer,
  SVGHandler,
  SVGRenderer,
  SVGStringRenderer
} from 'vega-scenegraph';

export {
  default as View
} from './src/view/View';

export {
  parse
} from 'vega-parser';

export {
  parse as runtime,
  context as runtimeContext
} from 'vega-runtime';
