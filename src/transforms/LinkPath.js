var Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform');

function LinkPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    source:  {type: 'field', default: '_source'},
    target:  {type: 'field', default: '_target'},
    x:       {type: 'field', default: 'layout_x'},
    y:       {type: 'field', default: 'layout_y'},
    tension: {type: 'value', default: 0.2},
    shape:   {type: 'value', default: 'line'}
  });

  this._output = {'path': 'layout_path'};
  return this.mutates(true);
}

var prototype = (LinkPath.prototype = Object.create(Transform.prototype));
prototype.constructor = LinkPath;

function line(d, source, target, x, y) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t);
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}

function curve(d, source, target, x, y, tension) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      dx = tx - sx,
      dy = ty - sy,
      ix = tension * (dx + dy),
      iy = tension * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}

function diagonalX(d, source, target, x, y) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
}

function diagonalY(d, source, target, x, y) {
  var s = source(d), sx = x(s), sy = y(s),
      t = target(d), tx = x(t), ty = y(t),
      m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy +
         'C' + sx + ',' + m +
         ' ' + tx + ',' + m +
         ' ' + tx + ',' + ty;
}

var shapes = {
  line:      line,
  curve:     curve,
  diagonal:  diagonalX,
  diagonalX: diagonalX,
  diagonalY: diagonalY
};

prototype.transform = function(input) {
  log.debug(input, ['linkpath']);

  var output = this._output,
      shape = shapes[this.param('shape')] || shapes.line,
      source = this.param('source').accessor,
      target = this.param('target').accessor,
      x = this.param('x').accessor,
      y = this.param('y').accessor,
      tension = this.param('tension');
  
  function set(t) {
    var path = shape(t, source, target, x, y, tension);
    Tuple.set(t, output.path, path);
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
  }

  input.fields[output.path] = 1;
  return input;
};

module.exports = LinkPath;

LinkPath.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "LinkPath transform",
  "description": "Computes a path definition for connecting nodes within a node-link network or tree diagram.",
  "type": "object",
  "properties": {
    "type": {"enum": ["linkpath"]},
    "source": {
      "description": "The data field that references the source node for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_source"
    },
    "target": {
      "description": "The data field that references the target node for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_target"
    },
    "x": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "layout_x"
    },
    "y": {
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "layout_y"
    },
    "tension": {
      "description": "A tension parameter for the \"tightness\" of \"curve\"-shaped links.",
      "oneOf": [
        {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": 0.2
    },
    "shape": {
      "description": "The path shape to use",
      "oneOf": [
        {"enum": ["line", "curve", "diagonal", "diagonalX", "diagonalY"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "line"
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "path": {"type": "string", "default": "layout_path"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};
