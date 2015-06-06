var util = require('./util');

function draw(g, scene, bounds) {
  if (!scene.items.length) return;
  var items = scene.items,
      o, fill, stroke, opac, lc, lw, x, y, w, h;

  for (var i=0, len=items.length; i<len; ++i) {
    o = items[i];
    if (bounds && !bounds.intersects(o.bounds))
      continue; // bounds check

    x = o.x || 0;
    y = o.y || 0;
    w = o.width || 0;
    h = o.height || 0;

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac === 0) continue;

    if ((fill = o.fill)) {
      g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
      g.fillStyle = util.color(g, o, fill);
      g.fillRect(x, y, w, h);
    }

    if ((stroke = o.stroke)) {
      lw = (lw = o.strokeWidth) != null ? lw : 1;
      if (lw > 0) {
        g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
        g.strokeStyle = util.color(g, o, stroke);
        g.lineWidth = lw;
        g.lineCap = (lc = o.strokeCap) != null ? lc : 'butt';
        g.vgLineDash(o.strokeDash || null);
        g.vgLineDashOffset(o.strokeDashOffset || 0);
        g.strokeRect(x, y, w, h);
      }
    }
  }
}

module.exports = {
  draw: draw,
  pick: util.pick()
};