var d3 = require('d3'),
    dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

var defaultRatio = 0.5 * (1 + Math.sqrt(5));

function Treemap(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    // hierarchy parameters
    sort: {type: 'array<field>', default: ['-value']},
    children: {type: 'field', default: 'children'},
    parent: {type: 'field', default: 'parent'},
    field: {type: 'field', default: 'value'},
    // treemap parameters
    size: {type: 'array<value>', default: require('./screen').size},
    round: {type: 'value', default: true},
    sticky: {type: 'value', default: false},
    ratio: {type: 'value', default: defaultRatio},
    padding: {type: 'value', default: null},
    mode: {type: 'value', default: 'squarify'}
  });

  this._layout = d3.layout.treemap();

  this._output = {
    'x':      'layout_x',
    'y':      'layout_y',
    'width':  'layout_width',
    'height': 'layout_height',
    'depth':  'layout_depth',
  };
  return this.mutates(true);
}

var prototype = (Treemap.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Treemap;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['treemap']);

  // get variables
  var layout = this._layout,
      output = this._output,
      sticky = this.param('sticky'),
      parent = this.param('parent').accessor,
      root = data.filter(function(d) { return parent(d) === null; })[0];

  // layout.sticky resets state _regardless_ of input value
  // so, we perform out own check first
  if (layout.sticky() !== sticky) { layout.sticky(sticky); }

  // configure layout
  layout
    .sort(dl.comparator(this.param('sort').field))
    .children(this.param('children').accessor)
    .value(this.param('field').accessor)
    .size(this.param('size'))
    .round(this.param('round'))
    .ratio(this.param('ratio'))
    .padding(this.param('padding'))
    .mode(this.param('mode'))
    .nodes(root);

  // copy layout values to nodes
  data.forEach(function(n) {
    Tuple.set(n, output.x, n.x);
    Tuple.set(n, output.y, n.y);
    Tuple.set(n, output.width, n.dx);
    Tuple.set(n, output.height, n.dy);
    Tuple.set(n, output.depth, n.depth);
  });

  // return changeset
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.width] = 1;
  input.fields[output.height] = 1;
  input.fields[output.depth] = 1;
  return input;
};

module.exports = Treemap;

Treemap.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Treemap transform",
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
      "description": "The data field for the children node array",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "children"
    },
    "parent": {
      "description": "The data field for the parent node",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": "parent"
    },
    "field": {
      "description": "The values to use to determine the area of each leaf-level treemap cell.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "mode": {
      "description": "The treemap layout algorithm to use.",
      "oneOf": [
        {"enum": ["squarify", "slice", "dice", "slice-dice"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "squarify"
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
        "height": {"type": "string", "default": "layout_height"},
        "depth": {"type": "string", "default": "layout_depth"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};
