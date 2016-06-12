import DataScope from './DataScope';
import {
  error, isString, isObject, isArray,
  ref, fieldRef, compareRef, sortRef,
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
  if (!isObject(sort)) error('Invalid sort argument: ' + sort);

  var order = sort.order && sort.order.signal,
      op = sort.op && sort.op.signal;
  if (!order && !op) return sortRef(sort);

  // TODO modify DataScope to support fields as signals?
  if (op && sort.field) error('Sort field can not be used in conjunction with signals.');

  return ref(this.add(transform('Compare', {
    order: order ? ref(this.signal[order]) : sort.order,
    op:    op ? ref(this.signal[op]) : sort.op,
    field: sort.field
  })));
};

prototype.compareRef = function(cmp) {
  // TODO examine array?
  if (isString(cmp) || isArray(cmp)) return compareRef(cmp);
  if (!cmp.signal) error('Unsupported compare reference: ' + JSON.stringify(cmp));
  return ref(this.add(transform('Compare', {
    fields: ref(this.signal[cmp.signal])
  })));
}

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
