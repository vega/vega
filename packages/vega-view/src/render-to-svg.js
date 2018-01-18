import renderHeadless from './render-headless';
import {RenderType} from 'vega-scenegraph';

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
export default function(scaleFactor) {
  return renderHeadless(this, RenderType.SVG, scaleFactor)
    .then(function(renderer) { return renderer.svg(); });
}
