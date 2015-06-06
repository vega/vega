var util = require('./util'),
    parse = require('../../../path/parse'),
    render = require('../../../path/render');

function path(g, o) {
  if (o.path == null) return;
  var p = o.pathCache || (o.pathCache = parse(o.path));
  return render(g, p, o.x, o.y);
}

function hit(g, o, x, y) {
  path(g, o);
  return g.isPointInPath(x, y);
}

module.exports = {
  draw: util.drawAll(path),
  pick: util.pick(hit)
};
