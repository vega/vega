const fontWeightEnum = [
  null, 'normal', 'bold', 'lighter', 'bolder',
  '100', '200', '300', '400', '500', '600', '700', '800', '900',
  100, 200, 300, 400, 500, 600, 700, 800, 900
];

const alignEnum = ['left', 'right', 'center'];

const baselineEnum = ['top', 'middle', 'bottom', 'alphabetic', 'line-top', 'line-bottom'];

const anchorEnum = [null, 'start', 'middle', 'end'];

const formatTypeEnum = ['number', 'time', 'utc'];

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
  return {$ref: '#/definitions/' + name};
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

  for (const key in properties) {
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
export const signalRef = def('signalRef');

export const formatTypeType = enums(formatTypeEnum);

export const formatSpecifier = object({
  year: stringType,
  quarter: stringType,
  month: stringType,
  date: stringType,
  week: stringType,
  day: stringType,
  hours: stringType,
  minutes: stringType,
  seconds: stringType,
  milliseconds: stringType
});

export const formatTypeOrSignal = {
  oneOf: [
    stringType,
    formatSpecifier,
    signalRef
  ]
};

export const textType = {
  oneOf: [
    stringType,
    {type: 'array', items: stringType}
  ]
};

export const alignValue = oneOf(
  enums(alignEnum),
  def('alignValue')
);

export const anchorValue = oneOf(
  enums(anchorEnum),
  def('anchorValue')
);

export const baselineValue = oneOf(
  enums(baselineEnum),
  def('baselineValue')
);

export const booleanValue = oneOf(
  booleanType,
  def('booleanValue')
);

export const colorValue = oneOf(
  nullType,
  stringType,
  def('colorValue')
);

export const dashArrayValue = oneOf(
  array(numberType),
  def('arrayValue')
);

export const fontWeightValue = oneOf(
  enums(fontWeightEnum),
  def('fontWeightValue')
);

export const numberValue = oneOf(
  numberType,
  def('numberValue')
);

export const orientValue = oneOf(
  enums(orientEnum),
  def('orientValue')
);

export const stringValue = oneOf(
  stringType,
  def('stringValue')
);

export const booleanOrNumberOrSignal = oneOf(booleanType,numberType,signalRef);
export const booleanOrSignal = def('booleanOrSignal');
export const arrayOrSignal = def('arrayOrSignal');
export const numberOrSignal = def('numberOrSignal');
export const stringOrSignal = def('stringOrSignal');
export const textOrSignal = def('textOrSignal');
