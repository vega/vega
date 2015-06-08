var util = require('./util'),
    parse = require('../../../path/parse'),
    render = require('../../../path/render'),
    areaPath = require('../../../path/area');

function path(g, items) {
  var o = items[0],
      p = o.pathCache || (o.pathCache = parse(areaPath(items)));
  render(g, p);
}

function pick(g, scene, x, y, gx, gy) {
  if (!scene.items || !scene.items.length) return false;

  var items = scene.items,
      b = items[0].bounds;

  if (b && !b.contains(gx, gy)) return false;
  if (g.pixelratio !== 1) {
    x *= g.pixelratio;
    y *= g.pixelratio;
  }
  if (!hit(g, items, x, y)) return false;
  return items[0];
}

function hit(g, s, x, y) {
  path(g, s);
  return g.isPointInPath(x, y);
}

module.exports = {
  draw: util.drawOne(path),
  pick: pick
};
