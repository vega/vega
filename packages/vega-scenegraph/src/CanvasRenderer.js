import Renderer from './Renderer';
import Bounds from './Bounds';
import marks from './marks/index';

import {domClear} from './util/dom';
import clip from './util/canvas/clip';
import resize from './util/canvas/resize';
import {canvas} from 'vega-canvas';
import {inherits} from 'vega-util';

export default function CanvasRenderer(loader) {
  Renderer.call(this, loader);
  this._redraw = false;
  this._dirty = new Bounds();
}

var prototype = inherits(CanvasRenderer, Renderer),
    base = Renderer.prototype,
    tempBounds = new Bounds();

prototype.initialize = function(el, width, height, origin, scaleFactor, options) {
  this._options = options;
  this._canvas = canvas(1, 1, options && options.type); // instantiate a small canvas

  if (el) {
    domClear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  // this method will invoke resize to size the canvas appropriately
  return base.initialize.call(this, el, width, height, origin, scaleFactor);
};

prototype.resize = function(width, height, origin, scaleFactor) {
  base.resize.call(this, width, height, origin, scaleFactor);
  resize(this._canvas, this._width, this._height,
    this._origin, this._scale, this._options && this._options.context);
  this._redraw = true;
  return this;
};

prototype.canvas = function() {
  return this._canvas;
};

prototype.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};

prototype.dirty = function(item) {
  var b = translate(item.bounds, item.mark.group);
  this._dirty.union(b);
};

function clipToBounds(g, b, origin) {
  // expand bounds by 1 pixel, then round to pixel boundaries
  b.expand(1).round();

  // to avoid artifacts translate if origin has fractional pixels
  b.translate(-(origin[0] % 1), -(origin[1] % 1));

  // set clipping path
  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();

  return b;
}

function viewBounds(origin, width, height) {
  return tempBounds
    .set(0, 0, width, height)
    .translate(-origin[0], -origin[1]);
}

function translate(bounds, group) {
  if (group == null) return bounds;
  var b = tempBounds.clear().union(bounds);
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}

prototype._render = function(scene) {
  var g = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b = this._dirty;

  // setup
  g.save();
  if (this._redraw || b.empty()) {
    this._redraw = false;
    b = viewBounds(o, w, h).expand(1);
  } else {
    b = clipToBounds(g, b.intersect(viewBounds(o, w, h)), o, w, h);
  }

  this.clear(-o[0], -o[1], w, h);

  // render
  this.draw(g, scene, b);

  // takedown
  g.restore();

  this._dirty.clear();
  return this;
};

prototype.draw = function(ctx, scene, bounds) {
  var mark = marks[scene.marktype];
  if (scene.clip) clip(ctx, scene);
  mark.draw.call(this, ctx, scene, bounds);
  if (scene.clip) ctx.restore();
};

prototype.clear = function(x, y, w, h) {
  var g = this.context();
  g.clearRect(x, y, w, h);
  if (this._bgcolor != null) {
    g.fillStyle = this._bgcolor;
    g.fillRect(x, y, w, h);
  }
};
