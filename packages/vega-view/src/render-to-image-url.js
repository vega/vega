import renderHeadless from './render-headless';
import {RenderType as Type} from 'vega-scenegraph';

/**
 * Produce an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @return {Promise} - A promise that resolves to an image URL.
 */
export default function(type, scaleFactor) {
  return (type !== Type.Canvas && type !== Type.SVG && type !== Type.PNG)
    ? Promise.reject('Unrecognized image type: ' + type)
    : renderHeadless(this, type, scaleFactor).then(function(renderer) {
        return type === Type.SVG
          ? toBlobURL(renderer.svg(), 'image/svg+xml')
          : renderer.canvas().toDataURL('image/png');
      });
}

function toBlobURL(data, mime) {
  var blob = new Blob([data], {type: mime});
  return window.URL.createObjectURL(blob);
}
