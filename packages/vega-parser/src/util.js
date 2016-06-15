function Entry(type, value, params) {
  this.id = -1,
  this.type = type;
  this.value = value;
  this.params = params;
}

export function entry(type, value, params) {
  return new Entry(type, value, params);
}

export function operator(value, params) {
  return entry('Operator', value, params);
}

export function transform(type, params) {
  return entry(type, undefined, params);
}

// -----

export function ref(op) {
  return {$ref: op.id};
}

export function fieldRef(field, name) {
  return name ? {$field: field, $name: name} : {$field: field};
}

export var keyRef = fieldRef('key');

export function compareRef(fields, orders) {
  return {$compare: fields, $order: orders};
}

// -----

export var ASCENDING  = 'ascending';

export var DESCENDING = 'descending';

export function sortKey(sort) {
  return !isObject(sort) ? ''
    : (sort.order === DESCENDING ? '-' : '+')
      + aggrField(sort.op, sort.field);
}

export function aggrField(op, field) {
  return (op && op.signal ? '$' + op.signal : op || '')
    + (op && field ? '_' : '')
    + (field && field.signal ? '$' + field.signal : field || '');
}

// -----

export function isSignal(_) {
  return _ && _.signal;
}

// -----

export function isObject(_) {
  return _ === Object(_);
}

export function isString(_) {
  return typeof _ === 'string';
}

export function isFunction(_) {
  return typeof _ === 'function';
}

export function isArray(_) {
  return Array.isArray(_);
}

// ------

export function array(_) {
  return _ != null ? (Array.isArray(_) ? _ : [_]) : [];
}

export function extend(_) {
  for (var x, k, i=1, n=arguments.length; i<n; ++i) {
    x = arguments[i];
    for (k in x) { _[k] = x[k]; }
  }
  return _;
}

export function set(_) {
  for (var s={}, i=0, n=_.length; i<n; ++i) s[_[i]] = 1;
  return s;
}

// -----

export function error(message) {
  throw Error(message);
}
