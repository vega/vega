import Renderer from './Renderer.js';
import SVGRenderer from './SVGRenderer.js';
import CanvasRenderer from './CanvasRenderer.js';
import {domChild} from './util/dom.js';

/**
 * @typedef {Object} HybridRendererOptions
 *
 * @property {string[]} [svgMarkTypes=['text']] - An array of SVG mark types to render
 *                                                in the SVG layer. All other mark types
 *                                                will be rendered in the Canvas layer.
 * @property {boolean} [svgOnTop=true] - Flag to determine if SVG should be rendered on top.
 * @property {boolean} [debug=false] - Flag to enable or disable debugging mode. When true,
 *                                     the top layer will be stacked below the bottom layer
 *                                     rather than overlaid on top.
 */

/** @type {HybridRendererOptions} */
export const OPTS = {
  svgMarkTypes: ['text'],
  svgOnTop: true,
  debug: false
};

/**
 * Configure the HybridRenderer
 *
 * @param {HybridRendererOptions} options - HybridRenderer configuration options.
 */
export function setHybridRendererOptions(options) {
  OPTS['svgMarkTypes'] = options.svgMarkTypes ?? ['text'];
  OPTS['svgOnTop'] = options.svgOnTop ?? true;
  OPTS['debug'] = options.debug ?? false;
}

export default class HybridRenderer extends Renderer {
  constructor(loader) {
    super(loader);
    this._svgRenderer = new SVGRenderer(loader);
    this._canvasRenderer = new CanvasRenderer(loader);
  }

  /**
   * Initialize a new HybridRenderer instance.
   * @param {DOMElement} el - The containing DOM element for the display.
   * @param {number} width - The coordinate width of the display, in pixels.
   * @param {number} height - The coordinate height of the display, in pixels.
   * @param {Array<number>} origin - The origin of the display, in pixels.
   *   The coordinate system will be translated to this point.
   * @param {number} [scaleFactor=1] - Optional scaleFactor by which to multiply
   *   the width and height to determine the final pixel size.
   * @return {HybridRenderer} - This renderer instance.
   */
  initialize(el, width, height, origin, scaleFactor) {
    this._root_el = domChild(el, 0, 'div');

    const bottomEl = domChild(this._root_el, 0, 'div');
    const topEl = domChild(this._root_el, 1, 'div');

    this._root_el.style.position = 'relative';

    // Set position absolute to overlay svg on top of canvas
    if (!OPTS.debug) {
      bottomEl.style.height = '100%';
      topEl.style.position = 'absolute';
      topEl.style.top = '0';
      topEl.style.left = '0';
      topEl.style.height = '100%';
      topEl.style.width = '100%';
    }

    this._svgEl = OPTS.svgOnTop? topEl: bottomEl;
    this._canvasEl = OPTS.svgOnTop? bottomEl: topEl;

    // pointer-events to none on SVG layer so that canvas gets all events
    this._svgEl.style.pointerEvents = 'none';

    this._canvasRenderer.initialize(this._canvasEl, width, height, origin, scaleFactor);
    this._svgRenderer.initialize(this._svgEl, width, height, origin, scaleFactor);
    return super.initialize(el, width, height, origin, scaleFactor);
  }

  /**
   * Flag a mark item as dirty.
   * @param {Item} item - The mark item.
   */
  dirty(item) {
    if (OPTS.svgMarkTypes.includes(item.mark.marktype)) {
      this._svgRenderer.dirty(item);
    } else {
      this._canvasRenderer.dirty(item);
    }
    return this;
  }

  /**
   * Internal rendering method.
   * @param {object} scene - The root mark of a scenegraph to render.
   * @param {Array} markTypes - Array of the mark types to render.
   *                            If undefined, render all mark types
   */
  _render(scene, markTypes) {
    const allMarkTypes = markTypes ?? [
      'arc', 'area', 'image', 'line', 'path', 'rect', 'rule', 'shape', 'symbol', 'text', 'trail'
    ];
    const canvasMarkTypes = allMarkTypes.filter((m) => !OPTS.svgMarkTypes.includes(m));
    this._svgRenderer.render(scene, OPTS.svgMarkTypes);
    this._canvasRenderer.render(scene, canvasMarkTypes);
  }

  /**
   * Resize the display.
   * @param {number} width - The new coordinate width of the display, in pixels.
   * @param {number} height - The new coordinate height of the display, in pixels.
   * @param {Array<number>} origin - The new origin of the display, in pixels.
   *   The coordinate system will be translated to this point.
   * @param {number} [scaleFactor=1] - Optional scaleFactor by which to multiply
   *   the width and height to determine the final pixel size.
   * @return {SVGRenderer} - This renderer instance;
   */
  resize(width, height, origin, scaleFactor) {
    super.resize(width, height, origin, scaleFactor);
    this._svgRenderer.resize(width, height, origin, scaleFactor);
    this._canvasRenderer.resize(width, height, origin, scaleFactor);
    return this;
  }

  background(bgcolor) {
    // Propagate background color to lower canvas renderer
    if (OPTS.svgOnTop) {
      this._canvasRenderer.background(bgcolor);
    } else {
      this._svgRenderer.background(bgcolor);
    }
    return this;
  }
}
