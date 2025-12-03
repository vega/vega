import {isObject} from '@omni-co/vega-util';

export function Entry(type, value, params, parent) {
  this.id = -1;
  this.type = type;
  this.value = value;
  this.params = params;
  if (parent) this.parent = parent;
}

export function entry(type, value, params, parent) {
  return new Entry(type, value, params, parent);
}

export function operator(value, params) {
  return entry('operator', value, params);
}

// -----

export function ref(op) {
  const ref = {$ref: op.id};
  // if operator not yet registered, cache ref to resolve later
  if (op.id < 0) (op.refs = op.refs || []).push(ref);
  return ref;
}

export const tupleidRef = {
  $tupleid: 1,
  toString: function() { return ':_tupleid_:'; }
};

export function fieldRef(field, name) {
  return name ? {$field: field, $name: name} : {$field: field};
}

export const keyFieldRef = fieldRef('key');

export function compareRef(fields, orders) {
  return {$compare: fields, $order: orders};
}

export function keyRef(fields, flat) {
  const ref = {$key: fields};
  if (flat) ref.$flat = true;
  return ref;
}

// -----

export const Ascending  = 'ascending';

export const Descending = 'descending';

export function sortKey(sort) {
  return !isObject(sort) ? ''
    : (sort.order === Descending ? '-' : '+')
      + aggrField(sort.op, sort.field);
}

export function aggrField(op, field) {
  return (op && op.signal ? '$' + op.signal : op || '')
    + (op && field ? '_' : '')
    + (field && field.signal
        ? '$' + field.signal
        // Replace non-alphanumeric character sequences with underscores and trim leading/trailing underscores
        // to prevent incorrect path extraction for nested target fields or target fields with (escaped) dots. 
        // Example: 'a\\.b[c.d]' => 'a_b_c_d'. 
        // Note: aggregating both a nested field and a field with a dot could lead to conflicting names: 
        // with data like [{ a: {b: 1}, 'a.b': 1 }], summing 'a.b' and 'a\\.b' would both result in a field 'sum_a_b'   
        : field?.replace(/\W+/g, '_').replace(/^_+|_+$/g, '') || '');
}

// -----

export const Scope = 'scope';

export const View = 'view';

export function isSignal(_) {
  return _ && _.signal;
}

export function isExpr(_) {
  return _ && _.expr;
}

export function hasSignal(_) {
  if (isSignal(_)) return true;
  if (isObject(_)) for (const key in _) {
    if (hasSignal(_[key])) return true;
  }
  return false;
}

export function value(specValue, defaultValue) {
  return specValue != null ? specValue : defaultValue;
}

export function deref(v) {
  return v && v.signal || v;
}
