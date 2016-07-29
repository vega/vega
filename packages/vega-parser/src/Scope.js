import DataScope from './DataScope';
import {
  aggrField, Ascending, compareRef, Entry,
  fieldRef, isSignal, operator, ref, transform
} from './util';
import {array, error, isString, peek} from 'vega-util';

export default function Scope() {
  this.nextId = 0;
  this.field = {};
  this.signals = {};
  this.scales = {};
  this.events = {};
  this.data = {};

  this.streams = [];
  this.updates = [];
  this.operators = [];

  this._parent = [];
  this._encode = [];
  this._markpath = [];
}

function Subscope(scope) {
  this.nextId = 1000 + scope.nextId;
  this.field = Object.create(scope.field);
  this.signals = Object.create(scope.signals);
  this.scales = Object.create(scope.scales);
  this.events = Object.create(scope.events);
  this.data = Object.create(scope.data);

  this.streams = [];
  this.updates = [];
  this.operators = [];

  this._parent = scope._parent.slice();
  this._encode = scope._encode.slice();
  this._markpath = scope._markpath;
}

var prototype = Scope.prototype = Subscope.prototype;

// ----

prototype.fork = function() {
  return new Subscope(this);
};

prototype.toRuntime = function() {
  return this.finish(), {
    operators: this.operators,
    streams:   this.streams,
    updates:   this.updates
  };
};

prototype.id = function() {
  return this.nextId++;
};

prototype.add = function(op) {
  return this.operators.push(op), op.id = this.id(), op;
};

prototype.addStream = function(stream) {
  return this.streams.push(stream), stream.id = this.id(), stream;
};

prototype.addUpdate = function(update) {
  return this.updates.push(update), update;
};

// Apply metadata
prototype.finish = function() {
  var name, ds;

  // annotate root
  if (this.root) this.root.root = true;

  // annotate signals
  for (name in this.signals) {
    this.signals[name].signal = name;
  }

  // annotate scales
  for (name in this.scales) {
    this.scales[name].scale = name;
  }

  // annotate data sets
  function annotate(op, name, type) {
    var data, list;
    if (op) {
      data = op.data || (op.data = {});
      list = data[name] || (data[name] = []);
      list.push(type);
    }
  }
  for (name in this.data) {
    ds = this.data[name];
    annotate(ds.input,  name, 'input');
    annotate(ds.output, name, 'output');
    annotate(ds.values, name, 'values');
    for (var field in ds.index) {
      annotate(ds.index[field], name, 'index:' + field);
    }
  }

  return this;
};

// ----

prototype.pushState = function(encode, parent) {
  this._encode.push(ref(this.add(transform('Sieve', {pulse: encode}))));
  this._parent.push(parent);
  this._markpath.push(-1);
};

prototype.popState = function() {
  this._parent.pop();
  this._encode.pop();
  this._markpath.pop();
};

prototype.parent = function() {
  return peek(this._parent);
};

prototype.encode = function() {
  return peek(this._encode);
};

prototype.markpath = function() {
  var p = this._markpath;
  return ++p[p.length-1], p.slice();
};

// ----

prototype.fieldRef = function(field, name) {
  if (isString(field)) return fieldRef(field, name);
  if (!field.signal) error('Unsupported field reference: ' + JSON.stringify(field));

  var s = field.signal, f = this.field[s], params;
  if (!f) {
    params = {name: ref(this.signals[s])};
    if (name) params.as = name;
    this.field[s] = f = ref(this.add(transform('Field', params)));
  }
  return f;
};

prototype.compareRef = function(cmp) {
  function check(_) {
    return isSignal(_) ? (signal = true, ref(sig[_.signal])) : _;
  }

  var sig = this.signals,
      signal = false,
      fields = array(cmp.field).map(check),
      orders = array(cmp.order).map(check);

  return signal
    ? ref(this.add(transform('Compare', {
        fields: fields,
        orders: orders
      })))
    : compareRef(fields, orders);
};

prototype.sortRef = function(sort) {
  if (!sort) return sort;

  var a = aggrField(sort.op, sort.field),
      o = sort.order || Ascending;

  return o.signal
    ? ref(this.add(transform('Compare', {
        fields: a,
        orders: this.signalRef(o.signal)
      })))
    : compareRef(a, o);
};

// ----

prototype.event = function(source, type) {
  var key = source + ':' + type;
  if (!this.events[key]) {
    var id = this.id();
    this.streams.push({
      id: id,
      source: source,
      type: type
    });
    this.events[key] = id;
  }
  return this.events[key];
};

// ----

prototype.addSignal = function(name, value) {
  if (this.signals.hasOwnProperty(name)) {
    error('Duplicate signal name: ' + name);
  }
  var op = value instanceof Entry ? value : this.add(operator(value));
  return this.signals[name] = op;
};

prototype.getSignal = function(name) {
  if (!this.signals[name]) {
    error('Unrecognized signal name: ' + name);
  }
  return this.signals[name];
};

prototype.signalRef = function(name) {
  return ref(this.getSignal(name));
};

prototype.property = function(spec) {
  return spec && spec.signal ? this.signalRef(spec.signal) : spec;
};

// ----

prototype.addScaleProj = function(type, name, params) {
  if (this.scales.hasOwnProperty(name)) {
    error('Duplicate scale or projection name: ' + name);
  }

  this.scales[name] = this.add(transform(type, params));
}

prototype.addScale = function(name, params) {
  this.addScaleProj('Scale', name, params);
};

prototype.addProjection = function(name, params) {
  this.addScaleProj('Projection', name, params);
};

prototype.scaleRef = function(name) {
  return ref(this.scales[name]);
};

prototype.projectionRef = prototype.scaleRef;

// ----

prototype.addData = function(name, dataScope) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + name);
  }
  this.data[name] = dataScope;
};

prototype.getData = function(name) {
  if (!this.data[name]) {
    error('Undefined data set name: ' + name);
  }
  return this.data[name];
};

prototype.addDataPipeline = function(name, entries) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + name);
  }

  // add operator entries to this scope, wire up pulse chain
  // TODO: should pulse wiring happen here, in DataScope, or ...?
  this.add(entries[0]);
  for (var i=1, n=entries.length; i<n; ++i) {
    entries[i].params.pulse = ref(entries[i-1]);
    this.add(entries[i]);
  }

  // create new scope for the data pipeline
  this.addData(name, DataScope.fromEntries(this, entries));
};
