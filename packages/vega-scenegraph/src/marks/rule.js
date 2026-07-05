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
// (draw/hit) must wrap this in save/restore since the translate is not
// undone here: it needs to still be active when the stroke/hit-test runs.
function path(context, item, opacity, renderer) {
  var x1, y1, x2, y2;

  if (item.stroke && stroke(context, item, opacity, renderer)) {
    x1 = item.x || 0;
    y1 = item.y || 0;
    x2 = item.x2 != null ? item.x2 : x1;
    y2 = item.y2 != null ? item.y2 : y1;

    if (isPattern(item.stroke)) {
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
    if (path(context, item, opacity, renderer)) {
      blend(context, item);
      context.stroke();
    }
    if (patterned) context.restore();
  });
}

function hit(context, item, x, y) {
  if (!context.isPointInStroke) return false;

  // hit() receives x, y already expressed in the same (untranslated) local
  // space as item.x/item.y under the ambient (group) CTM — the space path()
  // draws in when there is no pattern translate. When path() adds its
  // pattern-only translate(x1, y1), that same translate becomes part of the
  // CTM in effect when isPointInStroke runs; isPointInStroke maps its own
  // (x, y) argument through the CURRENT CTM before comparing to the
  // (already CTM-baked) path. So the test point must be counter-shifted by
  // (-x1, -y1) here to land back on the original device-space test
  // location once the CTM re-applies the translate. The save/restore must
  // bracket both path() (which performs the translate) and the
  // isPointInStroke call (which must run while that translate is active).
  const patterned = isPattern(item.stroke);
  if (patterned) context.save();

  const hx = patterned ? x - (item.x || 0) : x;
  const hy = patterned ? y - (item.y || 0) : y;
  const result = path(context, item, 1, null) && context.isPointInStroke(hx, hy);

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
