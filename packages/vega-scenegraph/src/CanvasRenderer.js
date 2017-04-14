import Renderer from './Renderer';
import Bounds from './Bounds';
import marks from './marks/index';

import {domClear} from './util/dom';
import clip from './util/canvas/clip';
import Canvas from './util/canvas/canvas';
import resize from './util/canvas/resize';
import {inherits} from 'vega-util';

export default function CanvasRenderer(loader) {
  Renderer.call(this, loader);
  this._redraw = false;
}

var prototype = inherits(CanvasRenderer, Renderer),
    base = Renderer.prototype,
    tempBounds = new Bounds();

prototype.initialize = function(el, width, height, origin) {
  this._canvas = Canvas(1, 1); // instantiate a small canvas
  if (el) {
    domClear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  // this method will invoke resize to size the canvas appropriately
  return base.initialize.call(this, el, width, height, origin);
};

prototype.resize = function(width, height, origin) {
  base.resize.call(this, width, height, origin);
  resize(this._canvas, this._width, this._height, this._origin);
  return this._redraw = true, this;
};

prototype.canvas = function() {
  return this._canvas;
};

prototype.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};

function clipToBounds(g, items) {
  var b = new Bounds(), i, n, item, mark, group;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    group = mark.group;
    item = marks[mark.marktype].nested ? mark : item;
    b.union(translate(item.bounds, group));
    if (item.bounds_prev) {
      b.union(translate(item.bounds_prev, group));
    }
  }
  b.expand(1).round();

  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();

  return b;
}

function translate(bounds, group) {
  if (group == null) return bounds;
  var b = tempBounds.clear().union(bounds);
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}

prototype._render = function(scene, items) {
  var g = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b;

  // setup
  g.save();
  b = (!items || this._redraw)
    ? (this._redraw = false, null)
    : clipToBounds(g, items);
  this.clear(-o[0], -o[1], w, h);

  // render
  this.draw(g, scene, b);

  // takedown
  g.restore();

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
