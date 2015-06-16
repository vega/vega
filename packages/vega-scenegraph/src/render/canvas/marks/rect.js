var util = require('./util');

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var items = scene.items,
      o, opac, x, y, w, h;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;

    x = o.x || 0;
    y = o.y || 0;
    w = o.width || 0;
    h = o.height || 0;

    if (o.fill && util.fill(g, o, opac)) {
      g.fillRect(x, y, w, h);
    }
    if (o.stroke && util.stroke(g, o, opac)) {
      g.strokeRect(x, y, w, h);
    }
  }
}

module.exports = {
  draw: draw,
  pick: util.pick()
};