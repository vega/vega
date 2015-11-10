var d3 = require('d3'),
    dl = require('datalib'),
    Tuple = require('vega-dataflow').Tuple,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function TreeLayout(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    // hierarchy parameters
    sort: {type: 'array<field>', default: null},
    children: {type: 'field', default: 'children'},
    parent: {type: 'field', default: 'parent'},
    // treemap parameters
    size: {type: 'array<value>', default: [500, 500]},
    nodesize: {type: 'array<value>', default: null},
    separation: {type: 'value', default: 'linear'}
  });

  this._layout = d3.layout.tree();

  this._output = {
    'x':     'layout_x',
    'y':     'layout_y',
    'depth': 'layout_depth',
  };
  return this.mutates(true);
}

var SEPARATION = {
  linear: function(a, b) { return (a.parent === b.parent ? 1 : 2); },
  angular: function(a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; }
};

var prototype = (TreeLayout.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = TreeLayout;

prototype.batchTransform = function(input, data) {
  log.debug(input, ['tree layout']);

  // get variables
  var layout = this._layout,
      output = this._output,
      sort   = this.param('sort'),
      nsize  = this.param('nodesize'),
      parent = this.param('parent').accessor,
      root = data.filter(function(d) { return parent(d) === null; })[0];

  // configure layout
  if (nsize && nsize.length) {
    layout.nodeSize(nsize);
  } else {
    layout.size(this.param('size'));
  };
  layout
    .sort(sort.field.length ? dl.comparator(sort.field) : null)
    .children(this.param('children').accessor)
    .separation(SEPARATION[this.param('separation')])
    .value(this.param('field').accessor)
    .nodes(root);

  // copy layout values to nodes
  data.forEach(function(n) {
    Tuple.set(n, output.x, n.x);
    Tuple.set(n, output.y, n.y);
    Tuple.set(n, output.depth, n.depth);
  });

  // return changeset
  input.fields[output.x] = 1;
  input.fields[output.y] = 1;
  input.fields[output.depth] = 1;
  return input;
};

module.exports = TreeLayout;

TreeLayout.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "TreeLayout transform",
  "type": "object",
  "properties": {
    "type": {"enum": ["treelayout"]},
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
      "description": "Sets a fixed x,y size for each node (overriding the size parameter)",
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
        "depth": {"type": "string", "default": "layout_depth"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};
