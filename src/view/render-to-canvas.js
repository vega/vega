import renderHeadless from './render-headless';
import {CANVAS} from './render-types';

/**
 * Returns a Canvas instance containing a rendered visualization.
 * This method is asynchronous, with the generated url returned via a
 * callback function (the underlying renderer will complete image loading
 * before returning). If this View is using a canvas renderer, the
 * returned Canvas instance will be the same as the live instance used
 * by the renderer, and thus subject to change over time. Any
 * methods for exporting canvas state should be called immediately.
 * @param {function} callback - A callback function for returning the
 *   error state (first argument) or Canvas instance (second argument).
 */
export default function(callback) {
  renderHeadless(this, CANVAS, function(error, renderer) {
    callback(error, renderer ? renderer.canvas() : undefined);
  });
}
