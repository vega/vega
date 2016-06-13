import DataScope from './DataScope';
import {
  error, isString,
  ref, fieldRef, compareRef,
  aggrField, ASCENDING,
  operator, transform
} from './util';

export default function Scope() {
  this.nextId = 0;
  this.field = {};
  this.signal = {};
  this.scale = {};
  this.data = {};
  this.operators = [];
}

var prototype = Scope.prototype;

prototype.id = function() {
  return this.nextId++;
};

prototype.add = function(op) {
  return this.operators.push(op), op.id = this.id(), op;
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

prototype.sortRef = function(sort) {
  if (!sort) return sort;

  var a = aggrField(sort.op, sort.field),
      o = sort.order || ASCENDING;

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
    throw Error('Parse error. Duplicate signal: ' + name);
  }
  this.signal[name] = this.add(operator(value));
};

prototype.signalRef = function(name) {
  return ref(this.signal[name]);
};

// ----

prototype.addScale = function(name, params) {
  if (this.scale.hasOwnProperty(name)) {
    throw Error('Parse error. Duplicate data set: ' + name);
  }

  this.scale[name] = this.add(transform('Scale', params));
};

prototype.scaleRef = function(name) {
  return ref(this.scale[name]);
};

// ----

prototype.getData = function(name) {
  return this.data[name];
};

prototype.addData = function(name, entries) {
  if (this.data.hasOwnProperty(name)) {
    throw Error('Parse error. Duplicate data set: ' + name);
  }

  for (var i=0, n=entries.length; i<n; ++i) {
    this.add(entries[i]);
  }
  this.data[name] = new DataScope(this, entries);
};
