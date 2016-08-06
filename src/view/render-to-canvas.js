import renderHeadless from './render-headless';
import {CANVAS} from './render-types';

/**
 * Produce a Canvas instance containing a rendered visualization.
 * This method is asynchronous, returning a Promise instance.
 * If this View is using a canvas renderer, the returned Canvas instance
 * will be the same as the live instance used by the renderer, and thus
 * subject to change over time. Any methods for exporting canvas state
 * should be called immediately upon promise resolution.
 * @return {Promise} - A promise that resolves to a Canvas instance.
 */
export default function() {
  renderHeadless(this, CANVAS)
    .then(function(renderer) { return renderer.canvas(); });
}
