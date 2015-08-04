var Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform');

function LinkPath(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    sourceX:  {type: 'field', default: '_source.layout_x'},
    sourceY:  {type: 'field', default: '_source.layout_y'},
    targetX:  {type: 'field', default: '_target.layout_x'},
    targetY:  {type: 'field', default: '_target.layout_y'},
    tension:  {type: 'value', default: 0.2},
    shape:    {type: 'value', default: 'line'}
  });

  this._output = {'path': 'layout_path'};
  return this.mutates(true);
}

var prototype = (LinkPath.prototype = Object.create(Transform.prototype));
prototype.constructor = LinkPath;

function line(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}

function curve(sx, sy, tx, ty, tension) {
  var dx = tx - sx,
      dy = ty - sy,
      ix = tension * (dx + dy),
      iy = tension * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}

function diagonalX(sx, sy, tx, ty) {
  var m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
}

function diagonalY(sx, sy, tx, ty) {
  var m = (sy + ty) / 2;
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
      sourceX = this.param('sourceX').accessor,
      sourceY = this.param('sourceY').accessor,
      targetX = this.param('targetX').accessor,
      targetY = this.param('targetY').accessor,
      tension = this.param('tension');

  function set(t) {
    var path = shape(sourceX(t), sourceY(t), targetX(t), targetY(t), tension);
    Tuple.set(t, output.path, path);
  }

  input.add.forEach(set);
  if (this.reevaluate(input)) {
    input.mod.forEach(set);
    input.rem.forEach(set);
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
    "sourceX": {
      "description": "The data field that references the source x-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_source"
    },
    "sourceY": {
      "description": "The data field that references the source y-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_source"
    },
    "targetX": {
      "description": "The data field that references the target x-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_target"
    },
    "targetY": {
      "description": "The data field that references the target y-coordinate for this link.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "_target"
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
