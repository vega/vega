import initializeRenderer from './initialize-renderer';

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
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
export default function(view, type) {
  var renderer = view._renderer,
      scaled = type === CANVAS
            && typeof window !== 'undefined'
            && window.devicePixelRatio > 1;

  if (scaled || !renderer || view.renderer() !== type) {
    renderer = initializeRenderer(view, null, null,
      (type === SVG) ? SVGStringRenderer : CanvasRenderer);
  }

  return view
    .runAsync()
    .then(function() { return renderer.renderAsync(view._scenegraph.root); });
}
