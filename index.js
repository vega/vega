export {
  version
} from './build/package';

export * from 'vega-statistics';

export * from 'vega-util';

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
  scale,
  scheme,
  projection
} from 'vega-dataflow';

import * as transforms from './src/transforms/index';
export {transforms};

export {default as View} from './src/view/View';

export {
  parse
} from 'vega-parser';

export {
  parse as runtime,
  context as runtimeContext
} from 'vega-runtime';
