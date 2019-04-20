import {getState, setState} from './state';
import {canonicalType, isCollect} from './util';

/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, accessors, etc.
 * Provides a 'fork' method for creating child contexts for subflows.
 */
export default function(df, transforms, functions) {
  return new Context(df, transforms, functions);
}

function Context(df, transforms, functions) {
  this.dataflow = df;
  this.transforms = transforms;
  this.events = df.events.bind(df);
  this.signals = {};
  this.scales = {};
  this.nodes = {};
  this.data = {};
  this.fn = {};
  if (functions) {
    this.functions = Object.create(functions);
    this.functions.context = this;
  }
}

function ContextFork(ctx) {
  this.dataflow = ctx.dataflow;
  this.transforms = ctx.transforms;
  this.functions = ctx.functions;
  this.events = ctx.events;
  this.signals = Object.create(ctx.signals);
  this.scales = Object.create(ctx.scales);
  this.nodes = Object.create(ctx.nodes);
  this.data = Object.create(ctx.data);
  this.fn = Object.create(ctx.fn);
  if (ctx.functions) {
    this.functions = Object.create(ctx.functions);
    this.functions.context = this;
  }
}

Context.prototype = ContextFork.prototype = {
  fork: function() {
    var ctx = new ContextFork(this);
    (this.subcontext || (this.subcontext = [])).push(ctx);
    return ctx;
  },
  get: function(id) {
    return this.nodes[id];
  },
  set: function(id, node) {
    return this.nodes[id] = node;
  },
  add: function(spec, op) {
    var ctx = this,
        df = ctx.dataflow,
        data;

    ctx.set(spec.id, op);

    if (isCollect(spec.type) && (data = spec.value)) {
      if (data.$ingest) {
        df.ingest(op, data.$ingest, data.$format);
      } else if (data.$request) {
        df.preload(op, data.$request, data.$format);
      } else {
        df.pulse(op, df.changeset().insert(data));
      }
    }

    if (spec.root) {
      ctx.root = op;
    }

    if (spec.parent) {
      var p = ctx.get(spec.parent.$ref);
      if (p) {
        df.connect(p, [op]);
        op.targets().add(p);
      } else {
        (ctx.unresolved = ctx.unresolved || []).push(function() {
          p = ctx.get(spec.parent.$ref);
          df.connect(p, [op]);
          op.targets().add(p);
        });
      }
    }

    if (spec.signal) {
      ctx.signals[spec.signal] = op;
    }

    if (spec.scale) {
      ctx.scales[spec.scale] = op;
    }

    if (spec.data) {
      for (var name in spec.data) {
        data = ctx.data[name] || (ctx.data[name] = {});
        spec.data[name].forEach(function(role) { data[role] = op; });
      }
    }
  },
  resolve: function() {
    (this.unresolved || []).forEach(function(fn) { fn(); });
    delete this.unresolved;
    return this;
  },
  operator: function(spec, update) {
    this.add(spec, this.dataflow.add(spec.value, update));
  },
  transform: function(spec, type) {
    this.add(spec, this.dataflow.add(this.transforms[canonicalType(type)]));
  },
  stream: function(spec, stream) {
    this.set(spec.id, stream);
  },
  update: function(spec, stream, target, update, params) {
    this.dataflow.on(stream, target, update, params, spec.options);
  },
  getState: getState,
  setState: setState
};
