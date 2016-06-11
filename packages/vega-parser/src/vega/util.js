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

export function ref(op) {
  return {$ref: op.id};
}

export function fieldRef(field) {
  return {$field: field};
}

export function error(message) {
  throw Error(message);
}

export function isObject(_) {
  return _ === Object(_);
}
