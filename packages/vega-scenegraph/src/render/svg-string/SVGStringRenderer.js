var Renderer = require('../Renderer'),
    Builder = require('./SVGStringBuilder');

function SVGStringRenderer() {
  Renderer.call(this);
  this._builder = new Builder();
}

var base = Renderer.prototype;
var prototype = (SVGStringRenderer.prototype = Object.create(base));

prototype.resize = function(width, height, padding) {
  base.resize.call(this, width, height, padding);
  this._builder.initialize(this._width, this._height, this._padding);
  return this;
};

prototype.render = function(scene) {
  // headless always draws the entire scene, ignoring items
  this._builder.render(scene);
  return this;
};

prototype.svg = function() {
  return this._builder.svg();
};

module.exports = SVGStringRenderer;
