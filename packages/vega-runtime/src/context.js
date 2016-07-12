import {changeset} from 'vega-dataflow';

/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, accessors, etc.
 * Provides a 'fork' method for creating child contexts for subflows.
 */
export default function context(df, transforms) {
  return new Context(df, transforms);
}

function Context(df, transforms) {
  this.dataflow = df;
  this.transforms = transforms;
  this.events = df.events.bind(df);
  this.signals = {};
  this.nodes = {};
  this.data = {};
  this.fn = {};
}

function ContextFork(ctx) {
  this.dataflow = ctx.dataflow;
  this.transforms = ctx.transforms;
  this.events = ctx.events;
  this.signals = Object.create(ctx.signals);
  this.nodes = Object.create(ctx.nodes);
  this.data = Object.create(ctx.data);
  this.fn = Object.create(ctx.fn);
}

Context.prototype = ContextFork.prototype = {
  fork: function() {
    return new ContextFork(this);
  },
  get: function(id) {
    return this.nodes.hasOwnProperty(id) && this.nodes[id];
  },
  set: function(id, node) {
    return this.nodes[id] = node;
  },
  add: function(spec, op) {
    var ctx = this;

    ctx.set(spec.id, op);

    if (spec.type === 'Collect' && spec.value) {
      ctx.dataflow.pulse(op, changeset().insert(spec.value));
    }

    if (spec.root) {
      ctx.root = op;
    }

    if (spec.signal) {
      ctx.signals[spec.signal] = op;
    }

    if (spec.data) {
      for (var name in spec.data) {
        var data = ctx.data[name] || (ctx.data[name] = {});
        spec.data[name].forEach(function(role) { data[role] = op; });
      }
    }
  },
  operator: function(spec, update, params) {
    this.add(spec, this.dataflow.add(spec.value, update, params, spec.react));
  },
  transform: function(spec, type, params) {
    this.add(spec, this.dataflow.add(this.transforms[type], params));
  },
  stream: function(spec, stream) {
    this.set(spec.id, stream);
  },
  update: function(spec, stream, target, update, params) {
    this.dataflow.on(stream, target, update, params, spec.options);
  }
};
