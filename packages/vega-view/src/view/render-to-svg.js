import renderHeadless from './render-headless';
import {ModuleType} from 'vega-scenegraph';

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
export default function() {
  return renderHeadless(this, ModuleType.SVG)
    .then(function(renderer) { return renderer.svg(); });
}
