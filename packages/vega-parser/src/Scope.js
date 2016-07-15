import DataScope from './DataScope';
import {
  aggrField, Ascending, compareRef,
  fieldRef, isSignal, operator, ref, transform
} from './util';
import {array, error, isString} from 'vega-util';

export default function Scope() {
  this.nextId = 0;
  this.field = {};
  this.signal = {};
  this.scale = {};
  this.data = {};
  this.operators = [];
  this.scenepath = [-1];
}

var prototype = Scope.prototype;

prototype.id = function() {
  return this.nextId++;
};

prototype.add = function(op) {
  return this.operators.push(op), op.id = this.id(), op;
};

// Apply metadata
prototype.finish = function() {
  var name, ds;

  // annotate root
  if (this.root) this.root.root = true;

  // annotate signals
  for (name in this.signal) {
    this.signal[name].signal = name;
  }

  // annotate data sets
  function annotate(ds, name, type) {
    var op = ds[type], data, list;
    if (op) {
      data = op.data || (op.data = {});
      list = data[name] || (data[name] = []);
      list.push(type);
    }
  }
  for (name in this.data) {
    ds = this.data[name];
    annotate(ds, name, 'input');
    annotate(ds, name, 'output');
    annotate(ds, name, 'values');
  }

  return this;
};

// ----

prototype.scenepathNext = function() {
  this.scenepath[this.scenepath.length-1] += 1;
  return this.scenepath.slice();
};

prototype.scenepathPush = function() {
  this.scenepath.push(0);
  this.scenepath.push(-1);
};

prototype.scenepathPop = function() {
  this.scenepath.pop();
  this.scenepath.pop();
};

// ----

prototype.fieldRef = function(field, name) {
  if (isString(field)) return fieldRef(field, name);
  if (!field.signal) error('Unsupported field reference: ' + JSON.stringify(field));

  var s = field.signal, f = this.field[s], params;
  if (!f) {
    params = {name: ref(this.signal[s])};
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

prototype.addSignal = function(name, value) {
  if (this.signal.hasOwnProperty(name)) {
    error('Duplicate signal name: ' + name);
  }
  this.signal[name] = this.add(operator(value));
};

prototype.signalRef = function(name) {
  if (!this.signal.hasOwnProperty(name)) {
    error('Unrecognized signal name: ' + name);
  }
  return ref(this.signal[name]);
};

prototype.property = function(spec) {
  return spec && spec.signal ? this.signalRef(spec.signal) : spec;
};

// ----

prototype.addScale = function(name, params) {
  if (this.scale.hasOwnProperty(name)) {
    error('Duplicate scale name: ' + name);
  }

  this.scale[name] = this.add(transform('Scale', params));
};

prototype.scaleRef = function(name) {
  return ref(this.scale[name]);
};

// ----

prototype.addData = function(name, dataScope) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + name);
  }
  this.data[name] = dataScope;
};

prototype.getData = function(name) {
  if (!this.data.hasOwnProperty(name)) {
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
