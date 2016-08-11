import renderHeadless from './render-headless';
import {Canvas, PNG, SVG} from './render-types';

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
  if (type === PNG) type = Canvas;

  if (type !== SVG && type !== Canvas) {
    return Promise.reject('Unrecognized image type: ' + type);
  } else {
    return renderHeadless(this, type).then(function(renderer) {
      return type === Canvas
        ? renderer.canvas().toDataURL('image/png')
        : window.URL.createObjectURL(
            new Blob([renderer.svg()], {type: 'image/svg+xml'})
          );
    });
  }
}
