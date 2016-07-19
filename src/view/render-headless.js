import initializeRenderer from './initialize-renderer';
import renderAsync from './render-async';

import {
  CANVAS,
  SVG
} from './render-types';

import {
  CanvasRenderer,
  SVGStringRenderer
} from 'vega-scenegraph';

/**
 * Render the current scene in a headless fashion.
 */
export default function(view, type, callback) {
  var renderer = view._renderer,
      scaled = type === CANVAS
            && typeof window !== 'undefined'
            && window.devicePixelRatio > 1;

  if (scaled || !renderer || view.renderer() !== type) {
    renderer = initializeRenderer(view, null, null,
      (type === SVG) ? SVGStringRenderer : CanvasRenderer);
  }

  renderAsync(renderer, view._scenegraph.root, callback);
}
