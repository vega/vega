import boundStroke from '../bound/boundStroke';
import translateItem from '../util/svg/translateItem';
import stroke from '../util/canvas/stroke';
import fill from '../util/canvas/fill';
import {pick} from '../util/canvas/pick';

function attr(emit, item) {
  emit('transform', translateItem(item));
  emit('width', item.width || 0);
  emit('height', item.height || 0);
}

function bound(bounds, item) {
  var x, y;
  return boundStroke(item, bounds.set(
    x = item.x || 0,
    y = item.y || 0,
    (x + item.width) || 0,
    (y + item.height) || 0
  ));
}

function draw(context, scene, bounds) {
  var items = scene.items,
      o, opac, x, y, w, h, i, n;

  if (!items || !items.length) return;

  for (i=0, n=items.length; i<n; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds)) continue; // bounds check

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;

    x = o.x || 0;
    y = o.y || 0;
    w = o.width || 0;
    h = o.height || 0;

    if (o.fill && fill(context, o, opac)) {
      context.fillRect(x, y, w, h);
    }
    if (o.stroke && stroke(context, o, opac)) {
      context.strokeRect(x, y, w, h);
    }
  }
}

export default {
  type:   'rect',
  tag:    'rect',
  nested: false,
  attr:   attr,
  bound:  bound,
  draw:   draw,
  pick:   pick()
};
