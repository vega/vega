import Renderer from './Renderer.js';
import Bounds from './Bounds.js';
import marks from './marks/index.js';

import {domClear} from './util/dom.js';
import clip from './util/canvas/clip.js';
import resize from './util/canvas/resize.js';
import {visitItems} from './util/visit.js';
import {canvas} from 'vega-canvas';
import {error} from 'vega-util';

const SCHEDULING_BATCH = 64;

export default class CanvasRenderer extends Renderer {
  constructor(loader) {
    super(loader);
    this._options = {};
    this._redraw = false;
    this._dirty = new Bounds();
    this._tempb = new Bounds();
  }

  initialize(el, width, height, origin, scaleFactor, options) {
    this._options = options || {};

    this._scheduler = (this._options.scheduler
        && !this._options.externalContext
        && this._options.type !== 'pdf')
      ? this._options.scheduler : null;
    this._scratch = null;
    this._rendering = null;

    this._canvas = this._options.externalContext
      ? null
      : canvas(1, 1, this._options.type); // instantiate a small canvas

    if (el && this._canvas) {
      domClear(el, 0).appendChild(this._canvas);
      this._canvas.setAttribute('class', 'marks');
    }

    // this method will invoke resize to size the canvas appropriately
    return super.initialize(el, width, height, origin, scaleFactor);
  }

  resize(width, height, origin, scaleFactor) {
    super.resize(width, height, origin, scaleFactor);

    if (this._canvas) {
      // configure canvas size and transform
      resize(this._canvas, this._width, this._height,
        this._origin, this._scale, this._options.context);
    } else {
      // external context needs to be scaled and positioned to origin
      const ctx = this._options.externalContext;
      if (!ctx) error('CanvasRenderer is missing a valid canvas or context');
      ctx.scale(this._scale, this._scale);
      ctx.translate(this._origin[0], this._origin[1]);
    }

    this._scratch = null;

    this._redraw = true;
    return this;
  }

  canvas() {
    return this._canvas;
  }

  context() {
    return this._options.externalContext
      || (this._canvas ? this._canvas.getContext('2d') : null);
  }

  dirty(item) {
    const b = this._tempb.clear().union(item.bounds);
    let g = item.mark.group;

    while (g) {
      b.translate(g.x || 0, g.y || 0);
      g = g.mark.group;
    }

    this._dirty.union(b);
  }

  render(scene, markTypes) {
    if (this._scheduler) {
      this._scratch = null;
    }
    return super.render(scene, markTypes);
  }

  renderAsync(scene, markTypes) {
    if (!this._scheduler) return super.renderAsync(scene, markTypes);

    const r = this;
    r._call = () => {
      r._renderScheduled(scene, markTypes).catch(err => {
        if (!r._scheduler.didAbort(err)) throw err;
      });
    };

    return r._renderScheduled(scene, markTypes)
      .then(() => r._ready)
      .then(() => r._rendering)
      .then(() => r);
  }

  async _renderScheduled(scene, markTypes) {
    while (this._rendering) {
      await this._rendering.catch(() => {});
    }
    const p = this._rendering = this._renderChunked(scene, markTypes);
    const done = () => { if (this._rendering === p) this._rendering = null; };
    p.then(done, done);
    return p;
  }

  async _renderChunked(scene, markTypes) {
    const fresh = !this._scratch,
          scratch = this._scratchCanvas(),
          g = scratch.getContext('2d'),
          o = this._origin,
          w = this._width,
          h = this._height,
          db = this._dirty,
          vb = viewBounds(o, w, h);

    g.save();
    const b = this._redraw || fresh || db.empty()
      ? (this._redraw = false, vb.expand(1))
      : clipToBounds(g, vb.intersect(db), o);

    this.clear(-o[0], -o[1], w, h, g);

    try {
      await this.drawAsync(g, scene, b, markTypes);
    } catch (err) {
      this._scratch = null;
      this._redraw = true;
      throw err;
    }

    g.restore();
    db.clear();

    if (this._scratch === scratch) {
      const vg = this.context(),
            vc = this._canvas;
      vg.save();
      vg.setTransform(1, 0, 0, 1, 0, 0);
      // neutralize context effects already baked into the scratch canvas
      // so the blit does not apply them a second time
      vg.globalAlpha = 1;
      vg.globalCompositeOperation = 'source-over';
      vg.filter = 'none';
      vg.shadowBlur = 0;
      vg.shadowColor = 'transparent';
      vg.clearRect(0, 0, vc.width, vc.height);
      vg.drawImage(scratch, 0, 0);
      vg.restore();
    }

    return this;
  }

  _scratchCanvas() {
    if (!this._scratch) {
      const source = this._canvas,
            ratio = source.getContext('2d').pixelRatio || 1,
            opt = this._options.context,
            scratch = canvas(1, 1, this._options.type),
            g = scratch.getContext('2d');

      scratch.width = source.width;
      scratch.height = source.height;
      for (const key in opt) { g[key] = opt[key]; }
      g.pixelRatio = ratio;
      g.setTransform(ratio, 0, 0, ratio,
        ratio * this._origin[0], ratio * this._origin[1]);

      this._scratch = scratch;
    }
    return this._scratch;
  }

  _render(scene, markTypes) {
    const g = this.context(),
          o = this._origin,
          w = this._width,
          h = this._height,
          db = this._dirty,
          vb = viewBounds(o, w, h);

    // setup
    g.save();
    const b = this._redraw || db.empty()
      ? (this._redraw = false, vb.expand(1))
      : clipToBounds(g, vb.intersect(db), o);

    this.clear(-o[0], -o[1], w, h);

    // render
    this.draw(g, scene, b, markTypes);

    // takedown
    g.restore();
    db.clear();

    return this;
  }

  draw(ctx, scene, bounds, markTypes) {
    if (scene.marktype !== 'group' && markTypes != null && !markTypes.includes(scene.marktype)) {
      return;
    }

    const mark = marks[scene.marktype];
    if (scene.clip) clip(ctx, scene);
    mark.draw.call(this, ctx, scene, bounds, markTypes);
    if (scene.clip) ctx.restore();
  }

  async drawAsync(ctx, scene, bounds, markTypes) {
    if (scene.marktype !== 'group' && markTypes != null && !markTypes.includes(scene.marktype)) {
      return;
    }

    const scheduler = this._scheduler;
    if (scheduler.shouldYield()) await scheduler.yield();

    const mark = marks[scene.marktype];
    if (scene.clip) clip(ctx, scene);
    if (mark.drawAsync) {
      await mark.drawAsync.call(this, ctx, scene, bounds, markTypes, scheduler);
    } else if (mark.nested) {
      mark.draw.call(this, ctx, scene, bounds, markTypes);
    } else {
      await this._drawItemsChunked(mark, ctx, scene, bounds, scheduler);
    }
    if (scene.clip) ctx.restore();
  }

  async _drawItemsChunked(mark, ctx, scene, bounds, scheduler) {
    const items = visitItems(scene),
          n = items.length;

    for (let i = 0; i < n; i += SCHEDULING_BATCH) {
      if (i > 0 && scheduler.shouldYield()) await scheduler.yield();

      const batch = Object.create(scene);
      batch.items = items.slice(i, i + SCHEDULING_BATCH);
      batch.zdirty = false;
      batch.zitems = null;
      mark.draw.call(this, ctx, batch, bounds);
    }
  }

  clear(x, y, w, h, g = this.context()) {
    const opt = this._options;

    if (opt.type !== 'pdf' && !opt.externalContext) {
      // calling clear rect voids vector output in pdf mode
      // and could remove external context content (#2615)
      g.clearRect(x, y, w, h);
    }

    if (this._bgcolor != null) {
      g.fillStyle = this._bgcolor;
      g.fillRect(x, y, w, h);
    }
  }
}

const viewBounds = (origin, width, height) => new Bounds()
  .set(0, 0, width, height)
  .translate(-origin[0], -origin[1]);

function clipToBounds(g, b, origin) {
  // expand bounds by 1 pixel, then round to pixel boundaries
  b.expand(1).round();

  // align to base pixel grid in case of non-integer scaling (#2425)
  if (g.pixelRatio % 1) {
    b.scale(g.pixelRatio).round().scale(1 / g.pixelRatio);
  }

  // to avoid artifacts translate if origin has fractional pixels
  b.translate(-(origin[0] % 1), -(origin[1] % 1));

  // set clip path
  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();

  return b;
}
