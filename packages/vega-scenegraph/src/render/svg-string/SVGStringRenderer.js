var Renderer = require('../Renderer'),
    Builder = require('./SVGStringBuilder');

function SVGStringRenderer() {
  Renderer.call(this);
  this._builder = null;
}

var parent = Renderer.prototype;
var prototype = (SVGStringRenderer.prototype = Object.create(parent));

prototype.initialize = function(context, width, height, padding) {
  this._builder = new Builder();
  return parent.initialize.call(this, null, width, height, padding);
};

prototype.resize = function(width, height, padding) {
  parent.resize.call(this, width, height, padding);
  this._builder.initialize(this._width, this._height, this._padding);
  return this;
};

prototype.render = function(scene, items) {
  // headless always draws the entire scene, ignoring items
  this._builder.render(scene);
  return this;
};

prototype.svg = function() {
  return this._builder.svg();
};

module.exports = SVGStringRenderer;
