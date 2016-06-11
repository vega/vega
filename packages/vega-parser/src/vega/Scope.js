import {ref, fieldRef, operator, transform, isString, error} from './util';
import DataScope from './DataScope';

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

prototype.fieldRef = function(field) {
  if (isString(field)) return fieldRef(field);
  if (!field.signal) error('Unsupported field reference: ' + JSON.stringify(field));

  var s = field.signal,
      f = this.field[s];
  if (!f) {
    f = this.add(transform('Field', {name: ref(this.signal[s])}));
    this.field[s] = f = ref(f);
  }
  return f;
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
