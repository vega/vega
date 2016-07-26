import {rectangle} from '../path/shapes';
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
  var offset = item.stroke ? -0.5 : 0;
  emit('class', 'background');
  emit('d', rectangle(null, item, offset, offset));
}

function bound(bounds, group) {
  var items = group.items || [],
      j, m;

  if (!group.clip) {
    for (j=0, m=items.length; j<m; ++j) {
      if (items[j].bounds) bounds.union(items[j].bounds);
    }
  }
  if (group.clip || group.width || group.height) {
    boundStroke(
      bounds.add(0, 0).add(group.width || 0, group.height || 0),
      group
    );
  }
  return bounds.translate(group.x || 0, group.y || 0);
}

function draw(context, scene, bounds) {
  var renderer = this,
      groups = scene.items,
      group, items, gx, gy, offset, w, h, opacity, i, n, j, m;

  if (!groups || !groups.length) return;

  for (i=0, n=groups.length; i<n; ++i) {
    group = groups[i];
    items = group.items || EMPTY;
    gx = group.x || 0;
    gy = group.y || 0;
    w = group.width || 0;
    h = group.height || 0;

    // setup graphics context
    context.save();
    context.translate(gx, gy);

    // draw group background
    if (group.stroke || group.fill) {
      opacity = group.opacity == null ? 1 : group.opacity;
      if (opacity > 0) {
        context.beginPath();
        offset = group.stroke ? -0.5 : 0;
        rectangle(context, group, offset, offset);
        if (group.fill && fill(context, group, opacity)) {
          context.fill();
        }
        if (group.stroke && stroke(context, group, opacity)) {
          context.stroke();
        }
      }
    }

    // set clip and bounds
    if (group.clip) {
      context.beginPath();
      context.rect(0, 0, w, h);
      context.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
    for (j=0, m=items.length; j<m; ++j) {
      renderer.draw(context, items[j], bounds);
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
      subscene, group, items, hit, hits, dx, dy, i, j, b;

  for (i=groups.length; --i>=0;) {
    group = groups[i];

    // first hit test against bounding box
    // if a group is clipped, that should be handled by the bounds check.
    b = group.bounds;
    if (b && !b.contains(gx, gy)) continue;

    // passed bounds check, so test sub-groups
    dx = (group.x || 0);
    dy = (group.y || 0);

    context.save();
    context.translate(dx, dy);

    dx = gx - dx;
    dy = gy - dy;

    items = group.items || EMPTY;
    for (j=items.length; --j>=0;) {
      subscene = items[j];
      if (subscene.interactive !== false) {
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
