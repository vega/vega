import renderHeadless from './render-headless';
import {SVG} from './render-types';

/**
 * Returns a rendered SVG string of the visualization. This method is
 * asynchronous, with the generated url returned via a callback function
 * (the underlying renderer will complete image loading before returning).
 * @param {function} callback - A callback function for returning the
 *   error state (first argument) or svg string (second argument).
 */
export default function(callback) {
  renderHeadless(this, SVG, function(error, renderer) {
    callback(error, renderer ? renderer.svg() : undefined);
  });
}
