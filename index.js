export {
  version
} from './build/package';

export * from 'vega-statistics';

export * from 'vega-util';

export {
  load
} from 'vega-loader';

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
  changeset,
  Dataflow,
  EventStream,
  Parameters,
  Pulse,
  MultiPulse,
  Operator,
  Transform,
  Tuple,
  transforms,
  scale,
  scheme,
  projection
} from 'vega-dataflow';

import {transform} from 'vega-dataflow';
import Bound from './src/transforms/Bound';
import Mark from './src/transforms/Mark';
import Render from './src/transforms/Render';
import ViewLayout from './src/transforms/ViewLayout';
transform('Bound', Bound);
transform('Mark', Mark);
transform('Render', Render);
transform('ViewLayout', ViewLayout);
export {transform};

export {default as View} from './src/view/View';

export {
  parse,
  definition,
  definitions
} from 'vega-parser';

export {
  parse as runtime,
  context as runtimeContext
} from 'vega-runtime';
