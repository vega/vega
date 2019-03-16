const fontWeightEnum = [
  null, 'normal', 'bold', 'lighter', 'bolder',
  '100', '200', '300', '400', '500', '600', '700', '800', '900',
  100, 200, 300, 400, 500, 600, 700, 800, 900
];

const alignEnum = ['left', 'right', 'center'];

const baselineEnum = ['top', 'middle', 'bottom', 'alphabetic'];

const anchorEnum = [null, 'start', 'middle', 'end'];

const formatTypeEnum = ['number', 'time'];

const orientEnum = ['left', 'right', 'top', 'bottom'];

export function oneOf(...types) {
  return {oneOf: types};
}

export function allOf(...types) {
  return {allOf: types};
}

export function anyOf(...types) {
  return {anyOf: types};
}

export function not(schema) {
  return {not: schema};
}

export function def(name) {
  return {$ref: '#/defs/' + name};
}

export function ref(name) {
  return {$ref: '#/refs/' + name};
}

export function type(name, props) {
  return Object.assign({
    type: name
  }, props);
}

export function enums(values, props) {
  return Object.assign({
    enum: values
  }, props);
}

export function array(items, props) {
  return Object.assign({
    type: 'array',
    items: items || undefined
  }, props);
}

export function object(properties, addl) {
  const p = {},
        r = [];

  for (let key in properties) {
    let k = key;
    if (key.startsWith('_') && key.endsWith('_')) {
      r.push(k = key.slice(1, -1));
    }
    p[k] = properties[key];
  }

  return {
    type: 'object',
    properties: p,
    required: r.length ? r : undefined,
    additionalProperties: arguments.length < 2 ? false : addl
  };
}

export function required(...types) {
  return {
    type: 'object',
    required: types
  };
}

export function pattern(obj, properties) {
  if (arguments.length === 1) {
    properties = obj;
    obj = {type: 'object', additionalProperties: false};
  }
  obj.patternProperties = properties;
  return obj;
}

export function orSignal(obj) {
  return oneOf(obj, signalRef);
}

export const anyType = {};
export const arrayType = type('array');
export const booleanType = type('boolean');
export const numberType = type('number');
export const objectType = type('object');
export const stringType = type('string');
export const colorStringType = stringType;
export const nullType = type('null');
export const signalRef = ref('signal');

export const formatType = enums(formatTypeEnum);

export const alignValue = oneOf(
  enums(alignEnum),
  ref('alignValue')
);

export const anchorValue = oneOf(
  enums(anchorEnum),
  ref('anchorValue')
);

export const baselineValue = oneOf(
  enums(baselineEnum),
  ref('baselineValue')
);

export const booleanValue = oneOf(
  booleanType,
  ref('booleanValue')
);

export const colorValue = oneOf(
  nullType,
  stringType,
  ref('colorValue')
);

export const dashArrayValue = oneOf(
  array(numberType),
  ref('arrayValue')
);

export const fontWeightValue = oneOf(
  enums(fontWeightEnum),
  ref('fontWeightValue')
);

export const numberValue = oneOf(
  numberType,
  ref('numberValue')
);

export const orientValue = oneOf(
  enums(orientEnum),
  ref('orientValue')
);

export const stringValue = oneOf(
  stringType,
  ref('stringValue')
);

export const booleanOrNumberOrSignal = oneOf(booleanType,numberType,signalRef);
export const booleanOrSignal = ref('booleanOrSignal');
export const arrayOrSignal = ref('arrayOrSignal');
export const numberOrSignal = ref('numberOrSignal');
export const stringOrSignal = ref('stringOrSignal');
