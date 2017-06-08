import Bounds from '../Bounds';
import {font, offset, textMetrics, textValue} from '../util/text';
import {visit} from '../util/visit';
import fill from '../util/canvas/fill';
import {pick} from '../util/canvas/pick';
import stroke from '../util/canvas/stroke';
import translate from '../util/svg/translate';

var textAlign = {
  'left':   'start',
  'center': 'middle',
  'right':  'end'
};

var tempBounds = new Bounds();

function attr(emit, item) {
  var dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item),
      x = item.x || 0,
      y = item.y || 0,
      a = item.angle || 0,
      r = item.radius || 0, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  emit('text-anchor', textAlign[item.align] || 'start');

  if (a) {
    t = translate(x, y) + ' rotate('+a+')';
    if (dx || dy) t += ' ' + translate(dx, dy);
  } else {
    t = translate(x + dx, y + dy);
  }
  emit('transform', t);
}

function bound(bounds, item, noRotate) {
  var h = textMetrics.height(item),
      a = item.align,
      r = item.radius || 0,
      x = item.x || 0,
      y = item.y || 0,
      dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item) - Math.round(0.8*h), // use 4/5 offset
      w, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  // horizontal alignment
  w = textMetrics.width(item);
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  } else {
    // left by default, do nothing
  }

  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  if (item.angle && !noRotate) {
    bounds.rotate(item.angle*Math.PI/180, x, y);
  }
  return bounds.expand(noRotate || !w ? 0 : 1);
}

function draw(context, scene, bounds) {
  visit(scene, function(item) {
    var opacity, x, y, r, t, str;
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    if (!(str = textValue(item))) return; // get text string

    opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity === 0) return;

    context.font = font(item);
    context.textAlign = item.align || 'left';

    x = item.x || 0;
    y = item.y || 0;
    if ((r = item.radius)) {
      t = (item.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    if (item.angle) {
      context.save();
      context.translate(x, y);
      context.rotate(item.angle * Math.PI/180);
      x = y = 0; // reset x, y
    }
    x += (item.dx || 0);
    y += (item.dy || 0) + offset(item);

    if (item.fill && fill(context, item, opacity)) {
      context.fillText(str, x, y);
    }
    if (item.stroke && stroke(context, item, opacity)) {
      context.strokeText(str, x, y);
    }
    if (item.angle) context.restore();
  });
}

function hit(context, item, x, y, gx, gy) {
  if (item.fontSize <= 0) return false;
  if (!item.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var b = bound(tempBounds, item, true),
      a = -item.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ix = item.x,
      iy = item.y,
      px = cos*gx - sin*gy + (ix - ix*cos + iy*sin),
      py = sin*gx + cos*gy + (iy - ix*sin - iy*cos);

  return b.contains(px, py);
}

export default {
  type:   'text',
  tag:    'text',
  nested: false,
  attr:   attr,
  bound:  bound,
  draw:   draw,
  pick:   pick(hit)
};
