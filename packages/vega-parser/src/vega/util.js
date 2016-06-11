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
  return entry(type, null, params);
}

// -----

export function ref(op) {
  return {$ref: op.id};
}

export function fieldRef(field, name) {
  return name ? {$field: field, $name: name} : {$field: field};
}

export var keyRef = fieldRef('key');

// -----

export function error(message) {
  throw Error(message);
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
