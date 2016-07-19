import renderHeadless from './render-headless';
import {CANVAS, PNG, SVG} from './render-types';

/**
 * Generate an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, with the generated url returned via a callback
 * function (the underlying renderer will complete image loading, if needed,
 * before returning).
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @param {function} callback - A callback function for returning the
 *   error state (first argument) or image url (second argument).
 */
export default function(type, callback) {
  if (type === PNG) type = CANVAS;

  if (type !== SVG && type !== CANVAS) {
    callback('Unrecognized image type: ' + type);
  } else {
    renderHeadless(this, type, function(error, renderer) {
      if (error) { callback(error); return; }
      try {
        callback(null, type === CANVAS
          ? renderer.canvas().toDataURL('image/png')
          : window.URL.createObjectURL(
              new Blob([renderer.svg()], {type: 'image/svg+xml'}))
        );
      } catch (error) {
        callback(error);
      }
    });
  }
}
