import renderHeadless from './render-headless';
import {CANVAS, PNG, SVG} from './render-types';

/**
 * Produce an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @return {Promise} - A promise that resolves to an image URL.
 */
export default function(type) {
  if (type === PNG) type = CANVAS;

  if (type !== SVG && type !== CANVAS) {
    return Promise.reject('Unrecognized image type: ' + type);
  } else {
    return renderHeadless(this, type).then(function(renderer) {
      return type === CANVAS
        ? renderer.canvas().toDataURL('image/png')
        : window.URL.createObjectURL(
            new Blob([renderer.svg()], {type: 'image/svg+xml'})
          );
    });
  }
}
