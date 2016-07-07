import boundStroke from '../bound/boundStroke';
import translateItem from '../util/svg/translateItem';
import stroke from '../util/canvas/stroke';
import fill from '../util/canvas/fill';

var EMPTY = [];

function attr(emit, item, renderer) {
  var id = null, defs, c;

  emit('transform', translateItem(item));

  if (item.clip) {
    defs = renderer._defs;
    id = item.clip_id || (item.clip_id = 'clip' + defs.clip_id++);
    c = defs.clipping[id] || (defs.clipping[id] = {id: id});
    c.width = item.width || 0;
    c.height = item.height || 0;
  }

  emit('clip-path', id ? ('url(#' + id + ')') : null);
}

function background(emit, item) {
  emit('class', 'background');
  emit('width', item.width || 0);
  emit('height', item.height || 0);
}

function bound(bounds, group, includeLegends) {
  var axes = group.axisItems || [],
      items = group.items || [],
      legends = group.legendItems || [],
      j, m;

  if (!group.clip) {
    for (j=0, m=axes.length; j<m; ++j) {
      bounds.union(axes[j].bounds);
    }
    for (j=0, m=items.length; j<m; ++j) {
      if (items[j].bounds) bounds.union(items[j].bounds);
    }
    if (includeLegends) {
      for (j=0, m=legends.length; j<m; ++j) {
        bounds.union(legends[j].bounds);
      }
    }
  }
  if (group.clip || group.width || group.height) {
    boundStroke(group, bounds
      .add(0, 0)
      .add(group.width || 0, group.height || 0));
  }
  return bounds.translate(group.x || 0, group.y || 0);
}

function draw(context, scene, bounds) {
  var renderer = this,
      groups = scene.items,
      group, items, axes, legends, gx, gy, w, h, opacity, i, n, j, m;

  if (!groups || !groups.length) return;

  for (i=0, n=groups.length; i<n; ++i) {
    group = groups[i];
    axes = group.axisItems || EMPTY;
    items = group.items || EMPTY;
    legends = group.legendItems || EMPTY;
    gx = group.x || 0;
    gy = group.y || 0;
    w = group.width || 0;
    h = group.height || 0;

    // draw group background
    if (group.stroke || group.fill) {
      opacity = group.opacity == null ? 1 : group.opacity;
      if (opacity > 0) {
        if (group.fill && fill(context, group, opacity)) {
          context.fillRect(gx, gy, w, h);
        }
        if (group.stroke && stroke(context, group, opacity)) {
          context.strokeRect(gx, gy, w, h);
        }
      }
    }

    // setup graphics context
    context.save();
    context.translate(gx, gy);
    if (group.clip) {
      context.beginPath();
      context.rect(0, 0, w, h);
      context.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer === 'back') {
        renderer.draw(context, axes[j], bounds);
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      renderer.draw(context, items[j], bounds);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer !== 'back') {
        renderer.draw(context, axes[j], bounds);
      }
    }
    for (j=0, m=legends.length; j<m; ++j) {
      renderer.draw(context, legends[j], bounds);
    }

    // restore graphics context
    if (bounds) bounds.translate(gx, gy);
    context.restore();
  }
}

function pick(context, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy)) {
    return null;
  }

  var groups = scene.items || EMPTY,
      subscene, group, axes, items, legends, hit, hits, dx, dy, i, j, b;

  for (i=groups.length; --i>=0;) {
    group = groups[i];

    // first hit test against bounding box
    // if a group is clipped, that should be handled by the bounds check.
    b = group.bounds;
    if (b && !b.contains(gx, gy)) continue;

    // passed bounds check, so test sub-groups
    axes = group.axisItems || EMPTY;
    items = group.items || EMPTY;
    legends = group.legendItems || EMPTY;

    dx = (group.x || 0);
    dy = (group.y || 0);

    context.save();
    context.translate(dx, dy);

    dx = gx - dx;
    dy = gy - dy;

    for (j=legends.length; --j>=0;) {
      subscene = legends[j];
      if (subscene.interactive !== false) {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { context.restore(); return hits; }
      }
    }
    for (j=axes.length; --j>=0;) {
      subscene = axes[j];
      if (subscene.interactive !== false && subscene.layer !== 'back') {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { context.restore(); return hits; }
      }
    }
    for (j=items.length; --j>=0;) {
      subscene = items[j];
      if (subscene.interactive !== false) {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { context.restore(); return hits; }
      }
    }
    for (j=axes.length; --j>=0;) {
      subscene = axes[j];
      if (subscene.interative !== false && subscene.layer === 'back') {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { context.restore(); return hits; }
      }
    }

    context.restore();

    hit = scene.interactive !== false
      && (group.fill || group.stroke)
      && dx >= 0
      && dx <= group.width
      && dy >= 0
      && dy <= group.height;
    if (hit) return group;
  }

  return null;
}

export default {
  type:       'group',
  tag:        'g',
  nested:     false,
  attr:       attr,
  bound:      bound,
  draw:       draw,
  pick:       pick,
  background: background
};
