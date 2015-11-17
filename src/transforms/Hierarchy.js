var d3 = require('d3'),
    dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Hierarchy(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    // hierarchy parameters
    sort: {type: 'array<field>', default: null},
    children: {type: 'field', default: 'children'},
    parent: {type: 'field', default: 'parent'},
    field: {type: 'value', default: null},
    // layout parameters
    mode: {type: 'value', default: 'tidy'}, // tidy, cluster, partition
    size: {type: 'array<value>', default: require('./screen').size},
    nodesize: {type: 'array<value>', default: null},
    orient: {type: 'value', default: 'cartesian'}
  });

  this._mode = null;
  this._output = {
    'x':      'layout_x',
    'y':      'layout_y',
    'width':  'layout_width',
    'height': 'layout_height',
    'depth':  'layout_depth'
  };
  return this.mutates(true);
}

var PARTITION = 'partition';

var SEPARATION = {
  cartesian: function(a, b) { return (a.parent === b.parent ? 1 : 2); },
  radial: function(a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; }
};

var prototype = (Hierarchy.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Hierarchy;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['hierarchy layout']);

  // get variables
  var layout = this._layout,
      output = this._output,
      mode   = this.param('mode'),
      sort   = this.param('sort'),
      nodesz = this.param('nodesize'),
      parent = this.param('parent').accessor,
      root = data.filter(function(d) { return parent(d) === null; })[0];

  if (mode !== this._mode) {
    this._mode = mode;
    if (mode === 'tidy') mode = 'tree';
    layout = (this._layout = d3.layout[mode]());
  }

  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.depth] = 1;
  if (mode === PARTITION) {
    input.fields[output.width] = 1;
    input.fields[output.height] = 1;
    layout.value(this.param('field').accessor);
  } else {
    layout.separation(SEPARATION[this.param('orient')]);
  }

  if (nodesz.length && mode !== PARTITION) {
    layout.nodeSize(nodesz);
  } else {
    layout.size(this.param('size'));
  }

  layout
    .sort(sort.field.length ? dl.comparator(sort.field) : null)
    .children(this.param('children').accessor)
    .nodes(root);

  // copy layout values to nodes
  data.forEach(function(n) {
    Tuple.set(n, output.x, n.x);
    Tuple.set(n, output.y, n.y);
    Tuple.set(n, output.depth, n.depth);
    if (mode === PARTITION) {
      Tuple.set(n, output.width, n.dx);
      Tuple.set(n, output.height, n.dy);
    }
  });

  // return changeset
  return input;
};

module.exports = Hierarchy;

Hierarchy.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Hierarchy transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["hierarchy"]},
    "sort": {
      "description": "A list of fields to use as sort criteria for sibling nodes.",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ]
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
      "description": "The value for the area of each leaf-level node for partition layouts.",
      "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
    },
    "mode": {
      "description": "The layout algorithm mode to use.",
      "oneOf": [
        {"enum": ["tidy", "cluster", "partition"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "tidy"
    },
    "orient": {
      "description": "The layout orientation to use.",
      "oneOf": [
        {"enum": ["cartesian", "radial"]},
        {"$ref": "#/refs/signal"}
      ],
      "default": "cartesian"
    },
    "size": {
      "description": "The dimensions of the tree layout",
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
    "nodesize": {
      "description": "Sets a fixed x,y size for each node (overrides the size parameter)",
      "oneOf": [
        {
          "type": "array",
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]},
          "minItems": 2,
          "maxItems": 2
        },
        {"$ref": "#/refs/signal"}
      ],
      "default": null
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
