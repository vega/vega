function Renderer() {
  this._el = null;
  this._bgcolor = null;
}

var prototype = Renderer.prototype;

prototype.initialize = function(el, width, height, padding) {
  this._el = el;
  return this.resize(width, height, padding);
};

// Returns the parent container element for a visualization
prototype.element = function() {
  return this._el;
};

// Returns the scene element (e.g., canvas or SVG) of the visualization
// Subclasses must override if the first child is not the scene element
prototype.scene = function() {
  return this._el && this._el.firstChild;
};

prototype.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};

prototype.resize = function(width, height, padding) {
  this._width = width;
  this._height = height;
  this._padding = padding || {top:0, left:0, bottom:0, right:0};
  return this;
};

prototype.render = function(/*scene, items*/) {
  return this;
};

module.exports = Renderer;