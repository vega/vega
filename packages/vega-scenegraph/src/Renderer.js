import ImageLoader from './ImageLoader';

/**
 * Create a new Renderer instance.
 * @param {object} [imageLoader] - Optional loader instance for
 *   image URL sanitization. If not specified, a standard loader
 *   instance will be generated.
 * @constructor
 */
export default function Renderer(imageLoader) {
  this._el = null;
  this._bgcolor = null;
  this._loader = new ImageLoader(imageLoader);
}

var prototype = Renderer.prototype;

/**
 * Initialize a new Renderer instance.
 * @param {DOMElement} el - The containing DOM element for the display.
 * @param {number} width - The width of the display, in pixels.
 * @param {number} height - The height of the display, in pixels.
 * @param {Array<number>} origin - The origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype.initialize = function(el, width, height, origin) {
  this._el = el;
  return this.resize(width, height, origin);
};

/**
 * Returns the parent container element for a visualization.
 * @return {DOMElement} - The containing DOM element.
 */
prototype.element = function() {
  return this._el;
};

/**
 * Returns the scene element (e.g., canvas or SVG) of the visualization
 * Subclasses must override if the first child is not the scene element.
 * @return {DOMElement} - The scene (e.g., canvas or SVG) element.
 */
prototype.scene = function() {
  return this._el && this._el.firstChild;
};

/**
 * Get / set the background color.
 */
prototype.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};

/**
 * Resize the display.
 * @param {number} width - The new width of the display, in pixels.
 * @param {number} height - The new height of the display, in pixels.
 * @param {Array<number>} origin - The new origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype.resize = function(width, height, origin) {
  this._width = width;
  this._height = height;
  this._origin = origin || [0, 0];
  return this;
};

/**
 * Render an input scenegraph, potentially with a set of dirty items.
 * This method will perform an immediate rendering with available resources.
 * The renderer may also need to perform image loading to perform a complete
 * render. This process can lead to asynchronous re-rendering of the scene
 * after this method returns. To receive notification when rendering is
 * complete, use the renderAsync method instead.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 * @return {Renderer} - This renderer instance.
 */
prototype.render = function(scene, items) {
  var r = this;

  // bind arguments into a render call, and cache it
  // this function may be subsequently called for async redraw
  r._call = function() { r._render(scene, items); };

  // invoke the renderer
  r._call();

  // clear the cached call for garbage collection
  // async redraws will stash their own copy
  r._call = null;

  return r;
};

/**
 * Internal rendering method. Renderer subclasses should override this
 * method to actually perform rendering.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 */
prototype._render = function(/*scene, items*/) {
  // subclasses to override
};

/**
 * Asynchronous rendering method. Similar to render, but returns a Promise
 * that resolves when all rendering is completed. Sometimes a renderer must
 * perform image loading to get a complete rendering. The returned
 * Promise will not resolve until this process completes.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 * @return {Promise} - A Promise that resolves when rendering is complete.
 */
prototype.renderAsync = function(scene, items) {
  var r = this.render(scene, items);
  return this._ready
    ? this._ready.then(function() { return r; })
    : Promise.resolve(r);
};

/**
 * Requests an image to include in the rendered scene.
 * This method proxies a call to ImageLoader.loadImage, but also tracks
 * image loading progress and invokes a re-render once complete.
 * @return {Image} - The requested image instance.
 *   The image content may not be loaded yet.
 */
prototype.loadImage = function(uri) {
  var r = this,
      p = r._loader.loadImage(uri);

  if (!r._ready) {
    // re-render the scene when image loading completes
    var call = r._call;
    r._ready = r._loader.ready()
      .then(function(redraw) {
        if (redraw) call();
        r._ready = null;
      });
  }

  return p;
};
