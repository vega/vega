var Bounds = require('../../../util/Bounds'),
    textBounds = require('../../../util/bound').text,
    text = require('../../../util/text'),
    util = require('./util'),
    tempBounds = new Bounds();

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var items = scene.items,
      o, opac, x, y, r, t, str;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    str = text.value(o.text);
    if (!str) continue;
    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;

    g.font = text.font(o);
    g.textAlign = o.align || 'left';

    x = (o.x || 0);
    y = (o.y || 0);
    if ((r = o.radius)) {
      t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    if (o.angle) {
      g.save();
      g.translate(x, y);
      g.rotate(o.angle * Math.PI/180);
      x = y = 0; // reset x, y
    }
    x += (o.dx || 0);
    y += (o.dy || 0) + text.offset(o);

    if (o.fill && util.fill(g, o, opac)) {
      g.fillText(str, x, y);
    }
    if (o.stroke && util.stroke(g, o, opac)) {
      g.strokeText(str, x, y);
    }
    if (o.angle) g.restore();
  }
}

function hit(g, o, x, y, gx, gy) {
  if (o.fontSize <= 0) return false;
  if (!o.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var b = textBounds(o, tempBounds, true),
      a = -o.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ox = o.x,
      oy = o.y,
      px = cos*gx - sin*gy + (ox - ox*cos + oy*sin),
      py = sin*gx + cos*gy + (oy - ox*sin - oy*cos);

  return b.contains(px, py);
}

module.exports = {
  draw: draw,
  pick: util.pick(hit)
};
