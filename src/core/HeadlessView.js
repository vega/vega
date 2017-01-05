var sg = require('vega-scenegraph').render,
    canvas = sg.canvas,
    svg = sg.svg.string,
    View = require('./View');

function HeadlessView(width, height, model) {
  View.call(this, width, height, model);
  this._type = 'canvas';
  this._renderers = {canvas: canvas, svg: svg};
}

var prototype = (HeadlessView.prototype = new View());

prototype.renderer = function(type) {
  if(type) this._type = type;
  return View.prototype.renderer.apply(this, arguments);
};

prototype.canvas = function() {
  return (this._type === 'canvas') ? this._renderer.canvas() : null;
};

prototype.canvasAsync = function(callback) {
  var r = this._renderer, view = this;

  function wait() {
    if (r.pendingImages() === 0) {
      view.render(); // re-render with all images
      callback(view.canvas());
    } else {
      setTimeout(wait, 10);
    }
  }

  // if images loading, poll until ready
  if (this._type !== 'canvas') return null;
  if (r.pendingImages() > 0) { wait(); } else { callback(this.canvas()); }
};

prototype.svg = function() {
  return (this._type === 'svg') ? this._renderer.svg() : null;
};

prototype.initialize = function() {
  var w = this._width,
      h = this._height,
      bg  = this._bgcolor,
      pad = this._padding,
      config = this.model().config();

  if (this._viewport) {
    w = this._viewport[0] - (pad ? pad.left + pad.right : 0);
    h = this._viewport[1] - (pad ? pad.top + pad.bottom : 0);
  }

  this._renderer = (this._renderer || new this._io.Renderer(config.load))
    .initialize(null, w, h, pad)
    .background(bg);

  return (this._repaint = true, this);
};

module.exports = HeadlessView;
