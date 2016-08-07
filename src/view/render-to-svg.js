import renderHeadless from './render-headless';
import {SVG} from './render-types';

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
export default function() {
  return renderHeadless(this, SVG)
    .then(function(renderer) { return renderer.svg(); });
}
