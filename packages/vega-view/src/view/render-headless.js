import initializeRenderer from './initialize-renderer';

import {
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
  return view.runAsync().then(function() {
    var renderClass = (type === SVG) ? SVGStringRenderer : CanvasRenderer;
    return initializeRenderer(view, null, null, renderClass)
      .renderAsync(view._scenegraph.root);
  });
}
