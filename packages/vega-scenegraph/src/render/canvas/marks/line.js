var util = require('./util'),
    parse = require('../../../path/parse'),
    render = require('../../../path/render'),
    linePath = require('../../../path/line');
    
function path(g, items) {
  var o = items[0],
      p = o.pathCache || (o.pathCache = parse(linePath(items)));
  render(g, p);
}

function stroke(g, items) {
  var o = items[0],
      lw = o.strokeWidth,
      lc = o.strokeCap;
  g.lineWidth = lw != null ? lw : 1;
  g.lineCap   = lc != null ? lc : 'butt';
  path(g, items);
}

function pick(g, scene, x, y, gx, gy) {
  if (!scene.items || !scene.items.length) return false;

  var items = scene.items,
      b = items[0].bounds;

  if (b && !b.contains(gx, gy)) return false;

  if (g.pixelratio != null && g.pixelratio !== 1) {
    x *= g.pixelratio;
    y *= g.pixelratio;
  }
  if (!hit(g, items, x, y)) return false;
  return items[0];
}

function hit(g, s, x, y) {
  if (!g.isPointInStroke) return false;
  stroke(g, s);
  return g.isPointInStroke(x, y);
}

module.exports = {
  draw: util.drawOne(path),
  pick: pick,
  nested: true
};
