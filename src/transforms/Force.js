var d3 = require('d3'),
    df = require('vega-dataflow'),
    Tuple = df.Tuple,
    ChangeSet = df.ChangeSet,
    log = require('vega-logging'),
    Transform = require('./Transform');

function Force(graph) {
  Transform.prototype.init.call(this, graph);

  this._prev = null;
  this._interactive = false;
  this._setup = true;
  this._nodes  = [];
  this._links = [];
  this._layout = d3.layout.force();

  Transform.addParameters(this, {
    size: {type: 'array<value>', default: [500, 500]},
    bound: {type: 'value', default: true},
    links: {type: 'data'},

    // TODO: force these to be value-only parameters for now
    // Can update to include fields after Parameter refactoring.
    linkStrength: {type: 'value', default: 1},
    linkDistance: {type: 'value', default: 20},
    charge: {type: 'value', default: -30},

    chargeDistance: {type: 'value', default: Infinity},
    friction: {type: 'value', default: 0.9},
    theta: {type: 'value', default: 0.8},
    gravity: {type: 'value', default: 0.1},
    alpha: {type: 'value', default: 0.1},
    iterations: {type: 'value', default: 500},

    interactive: {type: 'value', default: this._interactive},    
    active: {type: 'value', default: this._prev},
    fixed: {type: 'data'}
  });

  this._output = {
    'x': 'layout_x',
    'y': 'layout_y',
    'px': 'layout_px',
    'py': 'layout_py',
    'fixed': 'layout_fixed',
    'weight': 'layout_weight',
    'source': '_source',
    'target': '_target'
  };

  return this.mutates(true);
}

var prototype = (Force.prototype = Object.create(Transform.prototype));
prototype.constructor = Force;

prototype.transform = function(nodeInput) {
  log.debug(nodeInput, ['force']);

  // get variables
  var interactive = this.param('interactive'),
      linkInput = this.param('links').source.last(),
      active = this.param('active'),
      output = this._output,
      layout = this._layout,
      nodes = this._nodes,
      links = this._links;

  // configure nodes, links and layout
  this.configure(nodeInput, linkInput, interactive);
  
  // run batch layout
  if (!interactive) {
    var iterations = this.param('iterations');
    for (var i=0; i<iterations; ++i) layout.tick();
    layout.stop();
  }

  // update node positions
  this.update(active);

  // update active node status
  if (active !== this._prev) {
    if (active && active.update) {
      layout.alpha(this.param('alpha')); // re-start layout
    }
    this._prev = active;
  }

  // process removed nodes or edges
  if (nodeInput.rem.length) {
    layout.nodes(this._nodes = Tuple.idFilter(nodes, nodeInput.rem));
  }
  if (linkInput.rem.length) {
    layout.links(this._links = Tuple.idFilter(links, linkInput.rem));
  }

  // return changeset
  nodeInput.fields[output.x] = 1;
  nodeInput.fields[output.y] = 1;
  nodeInput.fields[output.source] = 1;
  nodeInput.fields[output.target] = 1;
  return nodeInput;
};

prototype.configure = function(nodeInput, linkInput, interactive) {
  var force = this,
      output = this._output,
      layout = this._layout,
      nodes = this._nodes,
      links = this._links,
      a, i, x, link, run;

  // check if we need to run configuration
  run = this._setup ||
    nodeInput.add.length || linkInput.add.length ||
    interactive !== this._interactive ||
    this.param('charge') !== layout.charge() ||
    this.param('linkStrength') !== layout.linkStrength() ||
    this.param('linkDistance') !== layout.linkDistance();
  this._setup = false;
  this._interactive = interactive;
  if (!run) return;

  // process added nodes
  for (a=nodeInput.add, i=0; i<a.length; ++i) {
    nodes.push({tuple: a[i]});
  }

  // process added edges
  for (a=linkInput.add, i=0; i<a.length; ++i) {
    x = a[i];
    link = {
      tuple:  x,
      source: nodes[x.source],
      target: nodes[x.target]
    };
    Tuple.set(x, output.source, link.source.tuple);
    Tuple.set(x, output.target, link.target.tuple);
    links.push(link);
  }

  // TODO process 'mod' of edge source or target?

  // setup handler for force layout tick events
  var tickHandler = !interactive ? null : function() {
    // re-schedule the transform, force reflow
    // comment out for now (see comments below!)
    // graph.propagate(ChangeSet.create(null, true), force);

    // hard-code propagation to links
    // TODO: dataflow graph should propagate automatically
    force.param('links').source.fire(ChangeSet.create(null, true));
    // NOTE: because the Force operator depends on the links data set
    // this pulse cascades back to Force to ensure it runs.
    // For now we only make one propagate call for efficiency.
    // If the dependency issue is worked out, we should swap calls.
  };

  // configure layout
  layout
    .size(this.param('size'))
    .linkStrength(this.param('linkStrength'))
    .linkDistance(this.param('linkDistance'))
    .charge(this.param('charge'))
    .chargeDistance(this.param('chargeDistance'))
    .theta(this.param('theta'))
    .gravity(this.param('gravity'))
    .friction(this.param('friction'))
    .nodes(nodes)
    .links(links)
    .on('tick', tickHandler)
    .start().alpha(this.param('alpha'));
};

prototype.update = function(active) {
  var output = this._output,
      bound = this.param('bound'),
      fixed = this.param('fixed'),
      size = this.param('size'),
      nodes = this._nodes,
      lut = {}, id, i, n, t, x, y;

  if (fixed && fixed.source) {
    // TODO: could cache and update as needed?
    fixed = fixed.source.values();
    for (i=0, n=fixed.length; i<n; ++i) {
      lut[fixed[i].id] = 1;
    }
  }

  for (i=0; i<nodes.length; ++i) {
    n = nodes[i];
    t = n.tuple;
    id = t._id;

    if (active && active.id === id) {
      n.fixed = 1;
      if (active.update) {
        n.x = n.px = active.x;
        n.y = n.py = active.y;
      }
    } else {
      n.fixed = lut[id] || 0;
    }

    x = bound ? Math.max(0, Math.min(n.x, size[0])) : n.x;
    y = bound ? Math.max(0, Math.min(n.y, size[1])) : n.y;
    Tuple.set(t, output.x, x);
    Tuple.set(t, output.y, y);
  }
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
      "oneOf": [{"type": "number"}, {"$ref": "#/refs/signal"}],
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