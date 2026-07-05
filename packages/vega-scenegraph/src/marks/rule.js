import boundStroke from '../bound/boundStroke.js';
import {intersectRule} from '../util/intersect.js';
import {visit} from '../util/visit.js';
import blend from '../util/canvas/blend.js';
import {pick} from '../util/canvas/pick.js';
import stroke from '../util/canvas/stroke.js';
import {translateItem} from '../util/svg/transform.js';
import {isPattern} from 'vega-pattern';

function attr(emit, item) {
  emit('transform', translateItem(item));
  emit('x2', item.x2 != null ? item.x2 - (item.x || 0) : 0);
  emit('y2', item.y2 != null ? item.y2 - (item.y || 0) : 0);
}

function bound(bounds, item) {
  var x1, y1;
  return boundStroke(bounds.set(
    x1 = item.x || 0,
    y1 = item.y || 0,
    item.x2 != null ? item.x2 : x1,
    item.y2 != null ? item.y2 : y1
  ), item);
}

// SVG resolves a userSpaceOnUse stroke pattern in the referencing <line>'s
// own coordinate space, so it inherently rides the item. Canvas instead
// draws the path at the item's absolute x/y, leaving a pattern's grid fixed
// to the group frame (view-anchored). Frame-match Canvas to SVG by
// translating to the rule's start point and drawing the segment relative
// to it — the exact move text.js already makes for rotated text. Callers
// compute the `patterned` flag, pass it in, and wrap this in save/restore
// since the translate is not undone here: it must still be active when the
// stroke runs.
function path(context, item, opacity, renderer, patterned) {
  var x1, y1, x2, y2;

  if (item.stroke && stroke(context, item, opacity, renderer)) {
    x1 = item.x || 0;
    y1 = item.y || 0;
    x2 = item.x2 != null ? item.x2 : x1;
    y2 = item.y2 != null ? item.y2 : y1;

    if (patterned) {
      context.translate(x1, y1);
      x2 -= x1;
      y2 -= y1;
      x1 = y1 = 0;
    }

    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    return true;
  }
  return false;
}

function draw(context, scene, bounds) {
  const renderer = this;
  visit(scene, item => {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    var opacity = item.opacity == null ? 1 : item.opacity;
    if (!opacity) return;

    const patterned = isPattern(item.stroke);
    if (patterned) context.save();
    if (path(context, item, opacity, renderer, patterned)) {
      blend(context, item);
      context.stroke();
    }
    if (patterned) context.restore();
  });
}

function hit(context, item, x, y) {
  if (!context.isPointInStroke) return false;

  // Per the HTML spec, isPointInStroke's point argument is in DEVICE space:
  // it is NOT transformed through the current CTM. The path itself was
  // already baked through the CTM as each segment was constructed (see WPT
  // 2d.path.isPointInPath.transform.1), so when path() adds its
  // pattern-only translate(x1, y1) the baked path coordinates land at the
  // same device positions as the untranslated form and the test point
  // passes through unchanged — patterned and solid rules hit-test
  // identically. (node-canvas is known to deviate by CTM-mapping the
  // point, but that is moot here: node-canvas does not implement
  // isPointInStroke at all, so this code path only runs in browsers.) The
  // save/restore still brackets path() so the pattern translate cannot
  // leak into the shared pick context's CTM.
  const patterned = isPattern(item.stroke);
  if (patterned) context.save();

  const result = path(context, item, 1, null, patterned) && context.isPointInStroke(x, y);

  if (patterned) context.restore();
  return result;
}

export default {
  type:   'rule',
  tag:    'line',
  nested: false,
  attr:   attr,
  bound:  bound,
  draw:   draw,
  pick:   pick(hit),
  isect:  intersectRule
};
