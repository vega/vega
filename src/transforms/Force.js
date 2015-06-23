var d3 = require('d3'),
    tuple = require('vega-dataflow/src/Tuple'),
    Transform = require('./Transform');

function Force(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    size: {type: "array<value>", default: [500, 500]},
    links: {type: "data"},
    linkDistance: {type: "field|value", default: 20},
    linkStrength: {type: "field|value", default: 1},
    charge: {type: "field|value", default: -30},
    chargeDistance: {type: "field|value", default: Infinity},
    iterations: {type: "value", default: 500},
    friction: {type: "value", default: 0.9},
    theta: {type: "value", default: 0.8},
    gravity: {type: "value", default: 0.1},
    alpha: {type: "value", default: 0.1}
  });

  this._nodes  = [];
  this._links = [];
  this._layout = d3.layout.force();

  this._output = {
    "x": "layout_x",
    "y": "layout_y",
    "source": "_source",
    "target": "_target"
  };

  return this;
}

var proto = (Force.prototype = new Transform());

proto.transform = function(nodeInput) {
  // get variables
  var linkInput = this.param("links").source.last(),
      layout = this._layout,
      output = this._output,
      nodes = this._nodes,
      links = this._links,
      iter = this.param("iterations");

  // process added nodes
  nodeInput.add.forEach(function(n) {
    nodes.push({tuple: n});
  });

  // process added edges
  linkInput.add.forEach(function(l) {
    var link = {
      tuple: l,
      source: nodes[l.source],
      target: nodes[l.target]
    };
    tuple.set(l, output.source, link.source.tuple);
    tuple.set(l, output.target, link.target.tuple);
    links.push(link);
  });

  // TODO process "mod" of edge source or target?

  // configure layout
  layout
    .size(this.param("size"))
    .linkDistance(this.param("linkDistance"))
    .linkStrength(this.param("linkStrength"))
    .charge(this.param("charge"))
    .chargeDistance(this.param("chargeDistance"))
    .friction(this.param("friction"))
    .theta(this.param("theta"))
    .gravity(this.param("gravity"))
    .alpha(this.param("alpha"))
    .nodes(nodes)
    .links(links);

  // run layout
  layout.start();
  for (var i=0; i<iter; ++i) {
    layout.tick();
  }
  layout.stop();

  // copy layout values to nodes
  nodes.forEach(function(n) {
    tuple.set(n.tuple, output.x, n.x);
    tuple.set(n.tuple, output.y, n.y);
  });

  // process removed nodes
  if (nodeInput.rem.length > 0) {
    var nodeIds = tuple.idMap(nodeInput.rem);
    this._nodes = nodes.filter(function(n) { return !nodeIds[n.tuple._id]; });
  }

  // process removed edges
  if (linkInput.rem.length > 0) {
    var linkIds = tuple.idMap(linkInput.rem);
    this._links = links.filter(function(l) { return !linkIds[l.tuple._id]; });
  }

  // return changeset
  nodeInput.fields[output.x] = 1;
  nodeInput.fields[output.y] = 1;
  return nodeInput;
};

module.exports = Force;
Force.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Force transform",
  "description": "Performs force-directed layout for network data.",
  "type": "object",
  "properties": {
    "type": {"enum": ["force"]},
    "size": {
      "description": "The dimensions [width, height] of this force layout.",
      "oneOf": [
        {
          "type": "array",
          "minItems": 2,
          "maxItems": 2,
          "items": {"oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}]}
        },
        {"$ref": "#/refs/signal"}
      ],

      "default": [500, 500]
    },
    "links": {
      "type": "string",
      "description": "The name of the link (edge) data set."
    },
    "linkDistance": {
      "description": "Determines the length of edges, in pixels.",
      "oneOf": [{"type": "number"}, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "default": 20
    },
    "linkStrength": {
      "oneOf": [{"type": "number"}, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "Determines the tension of edges (the spring constant).",
      "default": 1
    },
    "charge": {
      "oneOf": [{"type": "number"}, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "The strength of the charge each node exerts.",
      "default": -30
    },
    "chargeDistance": {
      "oneOf": [{"type": "number"}, {"type": "string"}, {"$ref": "#/refs/signal"}],
      "description": "The maximum distance over which charge forces are applied.",
      "default": Infinity
    },
    "iterations": {
      "description": "The number of iterations to run the force directed layout.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 500
    },
    "friction": {
      "description": "The strength of the friction force used to stabilize the layout.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.9
    },
    "theta": {
      "description": "The theta parameter for the Barnes-Hut algorithm, which is used to compute charge forces between nodes.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.8
    },
    "gravity": {
      "description": "The strength of the pseudo-gravity force that pulls nodes towards the center of the layout area.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.1
    },
    "alpha": {
      "description": "A \"temperature\" parameter that determines how much node positions are adjusted at each step.",
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
      "default": 0.1
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "x": {"type": "string", "default": "layout_x"},
        "y": {"type": "string", "default": "layout_y"},
        "source": {"type": "string", "default": "_source"},
        "target": {"type": "string", "default": "_target"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type", "links"]
};