import {ref, operator, transform} from './util';
import DataScope from './DataScope';

export default function Scope() {
  this.nextId = 0;
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
