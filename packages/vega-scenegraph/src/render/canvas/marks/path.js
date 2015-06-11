var util = require('./util'),
    parse = require('../../../path/parse'),
    render = require('../../../path/render');

function path(g, o) {
  if (o.path == null) return true;
  var p = o.pathCache || (o.pathCache = parse(o.path));
  render(g, p, o.x, o.y);
}

function hit(g, o, x, y) {
  return path(g, o) ? false : g.isPointInPath(x, y);
}

module.exports = {
  draw: util.drawAll(path),
  pick: util.pick(hit)
};
