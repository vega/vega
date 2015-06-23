var d3 = require('d3'),
    util = require('datalib/src/util'),
    tuple = require('vega-dataflow/src/Tuple'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

var defaultRatio = 0.5 * (1 + Math.sqrt(5));

function Treemap(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    // hierarchy parameters
    sort: {type: "array<field>", default: ["-value"]},
    children: {type: "field", default: "children"},
    value: {type: "field", default: "value"},
    // treemap parameters
    size: {type: "array<value>", default: [500, 500]},
    round: {type: "value", default: true},
    sticky: {type: "value", default: false},
    ratio: {type: "value", default: defaultRatio},
    padding: {type: "value", default: null},
    mode: {type: "value", default: "squarify"}
  });

  this._layout = d3.layout.treemap();

  this._output = {
    "x":      "layout_x",
    "y":      "layout_y",
    "width":  "layout_width",
    "height": "layout_height"
  };
  return this;
}

var proto = (Treemap.prototype = new BatchTransform());

proto.batchTransform = function(input, data) {
  // get variables
  var layout = this._layout,
      output = this._output;

  // configure layout
  layout
    .sort(util.comparator(this.param("sort").field))
    .children(this.param("children").accessor)
    .value(this.param("value").accessor)
    .size(this.param("size"))
    .round(this.param("round"))
    .sticky(this.param("sticky"))
    .ratio(this.param("ratio"))
    .padding(this.param("padding"))
    .mode(this.param("mode"))
    .nodes(data[0]);

  // copy layout values to nodes
  data.forEach(function(n) {
    tuple.set(n, output.x, n.x);
    tuple.set(n, output.y, n.y);
    tuple.set(n, output.width, n.dx);
    tuple.set(n, output.height, n.dy);
  });

  // return changeset
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.width] = 1;
  input.fields[output.height] = 1;
  return input;
};

module.exports = Treemap;
Treemap.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "type": {"enum": ["treemap"]},
    "sort": {
      "description": "A list of fields to use as sort criteria for sibling nodes.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": ["-value"]
    },
    "children": {
      "description": "A data field that represents the children array",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "children"
    },
    "value": {
      "description": "The values to use to determine the area of each leaf-level treemap cell.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "value"
    },
    "size": {
      "description": "The dimensions of the treemap layout",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": [500, 500]
    },
    "round": {
      "description": "If true, treemap cell dimensions will be rounded to integer pixels.",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": true
    },
    "sticky": {
      "description": "If true, repeated runs of the treemap will use cached partition boundaries.",
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "default": false
    },
    "ratio": {
      "description": "The target aspect ratio for the layout to optimize.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": defaultRatio
    },
    "padding": {
      "oneOf": [
        {"type": "number"},
        {
          "type": "array", 
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 4,
          "maxItems": 4
        },
        {"$ref": "#/refs/signal"}
      ],
      "description": "he padding (in pixels) to provide around internal nodes in the treemap."
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"},
        "width": {"type": "string", "default": "layout_width"},
        "height": {"type": "string", "default": "layout_height"}
      }
    }
  },
  "additionalProperties": false,
  "required": ["type", "value"]
}