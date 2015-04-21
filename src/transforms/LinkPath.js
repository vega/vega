var Transform = require('./Transform'),
    tuple = require('../dataflow/tuple');

function LinkPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    source:  {type: "field", default: "_source"},
    target:  {type: "field", default: "_target"},
    x:       {type: "field", default: "layout:x"},
    y:       {type: "field", default: "layout:y"},
    tension: {type: "value", default: 0.2},
    shape:   {type: "value", default: "line"}
  });

  this._output = {"path": "link:path"};
  return this;
}

var proto = (LinkPath.prototype = new Transform());

function line(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t);
  return "M" + sx + "," + sy
       + "L" + tx + "," + ty;
}

function curve(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      dx = tx - sx,
      dy = ty - sy,
      ix = tension * (dx + dy),
      iy = tension * (dy - dx);
  return "M" + sx + "," + sy
       + "C" + (sx+ix) + "," + (sy+iy)
       + " " + (tx+iy) + "," + (ty-ix)
       + " " + tx + "," + ty;
}

function diagonalX(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sx + tx) / 2;
  return "M" + sx + "," + sy
       + "C" + m  + "," + sy
       + " " + m  + "," + ty
       + " " + tx + "," + ty;
}

function diagonalY(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sy + ty) / 2;
  return "M" + sx + "," + sy
       + "C" + sx + "," + m
       + " " + tx + "," + m
       + " " + tx + "," + ty;
}

var shapes = {
  line:      line,
  curve:     curve,
  diagonal:  diagonalX,
  diagonalX: diagonalX,
  diagonalY: diagonalY
};

proto.transform = function(input) {
  var g = this._graph,
      output = this._output,
      shape = shapes[this.shape.get(g)] || shapes.line,
      source = this.source.get(g).accessor,
      target = this.target.get(g).accessor,
      x = this.x.get(g).accessor,
      y = this.y.get(g).accessor,
      tension = this.tension.get(g);
  
  function set(t) {
    var path = shape(t, source, target, x, y, tension)
    tuple.set(t, output.path, path);
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  input.fields[output.path] = 1;
  return input;
};

module.exports = LinkPath;