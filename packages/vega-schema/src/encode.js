import {
  allOf, anyOf, array, booleanType, def, enums, nullType, numberType, numberValue,
  object, oneOf, pattern, required, signalRef,
  stringType, textType, type
} from './util';

export const blendEnum = [
  null, 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference',
  'exclusion', 'hue', 'saturation', 'color', 'luminosity'
];

export const fontWeightEnum = [
  null, 'normal', 'bold', 'lighter', 'bolder',
  '100', '200', '300', '400', '500', '600', '700', '800', '900',
  100, 200, 300, 400, 500, 600, 700, 800, 900
];

export const alignEnum = ['left', 'right', 'center'];
export const baselineEnum = ['top', 'middle', 'bottom', 'alphabetic'];
export const anchorEnum = ['start', 'middle', 'end'];
export const orientEnum = ['left', 'right', 'top', 'bottom'];
export const directionEnum = ['horizontal', 'vertical'];
export const strokeCapEnum = ['butt', 'round', 'square'];
export const strokeJoinEnum = ['miter', 'round', 'bevel'];

export function baseValueSchema(type, nullable) {
  type = Array.isArray(type) ? {enum: type}
    : type && type.oneOf ? type
    : {type: type};

  var modType = type.type === 'number' ? 'number' : 'string',
      valueType = nullable ? oneOf(type, nullType) : type;

  const valueRef = allOf(
    def(modType + 'Modifiers'),
    anyOf(
      oneOf(
        signalRef,
        object({_value_: valueType}, undefined),
        object({_field_: fieldRef}, undefined),
        object({_range_: oneOf(numberType, booleanType)}, undefined)
      ),
      required('scale', 'value'),
      required('scale', 'band'),
      required('offset')
    )
  );

  return valueRef;
}

export function valueSchema(type, nullable) {
  const valueRef = baseValueSchema(type, nullable);
  return oneOf(
    array(allOf(ruleRef, valueRef)),
    valueRef
  );
}

const ruleRef = def('rule');
const rule = object({
  test: stringType
}, undefined);

const fieldRef = def('field');
const field = oneOf(
  stringType,
  signalRef,
  object({_datum_: fieldRef}),
  object({_group_: fieldRef, level: numberType}),
  object({_parent_: fieldRef, level: numberType})
);

const scaleRef = fieldRef;

const stringModifiers = object({
  scale: scaleRef
}, undefined);

const numberModifiers = object({
  exponent: numberValue,
  mult: numberValue,
  offset: numberValue,
  round: type('boolean', {default: false}),
  scale: scaleRef,
  band: oneOf(numberType, booleanType),
  extra: booleanType
}, undefined);

// defined below
const anyValueRef = def('anyValue');
const arrayValueRef = def('arrayValue');
const booleanValueRef = def('booleanValue');
const colorValueRef = def('colorValue');
const numberValueRef = def('numberValue');
const stringValueRef = def('stringValue');
const textValueRef = def('textValue');

const colorRGB = object({
  _r_: numberValueRef,
  _g_: numberValueRef,
  _b_: numberValueRef
}, undefined);

const colorHSL = object({
  _h_: numberValueRef,
  _s_: numberValueRef,
  _l_: numberValueRef
}, undefined);

const colorLAB = object({
  _l_: numberValueRef,
  _a_: numberValueRef,
  _b_: numberValueRef
}, undefined);

const colorHCL = object({
  _h_: numberValueRef,
  _c_: numberValueRef,
  _l_: numberValueRef
}, undefined);

const gradientStops = array(
  object({
    _offset_: numberType,
    _color_: stringType
  })
);

const linearGradient = object({
  _gradient_: enums(['linear']),
  id: stringType,
  x1: numberType,
  y1: numberType,
  x2: numberType,
  y2: numberType,
  _stops_: def('gradientStops')
});

const radialGradient = object({
  _gradient_: enums(['radial']),
  id: stringType,
  x1: numberType,
  y1: numberType,
  r1: numberType,
  x2: numberType,
  y2: numberType,
  r2: numberType,
  _stops_: def('gradientStops')
});

const baseColorValue = oneOf(
  baseValueSchema('string', true),
  object({_value_: def('linearGradient')}),
  object({_value_: def('radialGradient')}),
  object({
    _gradient_: scaleRef,
    start: array(numberType, {minItems: 2, maxItems: 2}),
    stop:  array(numberType, {minItems: 2, maxItems: 2}),
    count: numberType
  }),
  object({
    _color_: oneOf(
      def('colorRGB'),
      def('colorHSL'),
      def('colorLAB'),
      def('colorHCL')
    )
  })
);

const colorValue = oneOf(
  array(allOf(ruleRef, def('baseColorValue'))),
  def('baseColorValue')
);

const encodeEntryRef = def('encodeEntry');
const encodeEntry = object({
  // Common Properties
  x: numberValueRef,
  x2: numberValueRef,
  xc: numberValueRef,
  width: numberValueRef,
  y: numberValueRef,
  y2: numberValueRef,
  yc: numberValueRef,
  height: numberValueRef,
  opacity: numberValueRef,
  fill: colorValueRef,
  fillOpacity: numberValueRef,
  stroke: colorValueRef,
  strokeOpacity: numberValueRef,
  strokeWidth: numberValueRef,
  strokeCap: def('strokeCapValue'),
  strokeDash: arrayValueRef,
  strokeDashOffset: numberValueRef,
  strokeJoin: def('strokeJoinValue'),
  strokeMiterLimit: numberValueRef,
  blend: def('blendValue'),
  cursor: stringValueRef,
  tooltip: anyValueRef,
  zindex: numberValueRef,
  description: stringValueRef,
  aria: booleanValueRef,

  // experimental aria properties, may change
  ariaRole: stringValueRef,
  ariaRoleDescription: stringValueRef,

  // Group-mark properties
  clip: booleanValueRef,
  strokeForeground: booleanValueRef,
  strokeOffset: numberValueRef,

  // Rect-mark properties
  cornerRadius: numberValueRef,
  cornerRadiusTopLeft: numberValueRef,
  cornerRadiusTopRight: numberValueRef,
  cornerRadiusBottomRight: numberValueRef,
  cornerRadiusBottomLeft: numberValueRef,

  // Symbol-, Path- and text-mark properties
  angle: numberValueRef,

  // Symbol-mark properties
  size: numberValueRef,
  shape: stringValueRef,

  // Path-mark properties
  path: stringValueRef,
  scaleX: numberValueRef,
  scaleY: numberValueRef,

  // Arc-mark properties
  innerRadius: numberValueRef,
  outerRadius: numberValueRef,
  startAngle: numberValueRef,
  endAngle: numberValueRef,
  padAngle: numberValueRef,

  // Area- and line-mark properties
  interpolate: stringValueRef,
  tension: numberValueRef,
  orient: def('directionValue'),
  defined: booleanValueRef,

  // Image-mark properties
  url: stringValueRef,
  align: def('alignValue'),
  baseline: def('baselineValue'),
  aspect: booleanValueRef,
  smooth: booleanValueRef,

  // Text-mark properties
  text: textValueRef,
  dir: stringValueRef,
  ellipsis: stringValueRef,
  limit: numberValueRef,
  lineBreak: stringValueRef,
  lineHeight: numberValueRef,
  dx: numberValueRef,
  dy: numberValueRef,
  radius:numberValueRef,
  theta: numberValueRef,
  font: stringValueRef,
  fontSize: numberValueRef,
  fontWeight: def('fontWeightValue'),
  fontStyle: stringValueRef
}, true);

const encode = pattern({
  '^.+$': encodeEntryRef
});

export default {
  rule,
  encodeEntry,
  encode,
  field,
  stringModifiers,
  numberModifiers,
  anyValue: valueSchema(undefined),
  blendValue: valueSchema(blendEnum),
  numberValue: valueSchema('number'),
  stringValue: valueSchema('string'),
  textValue: valueSchema(textType),
  booleanValue: valueSchema('boolean'),
  arrayValue: valueSchema('array'),
  fontWeightValue: valueSchema(fontWeightEnum),
  anchorValue: valueSchema(anchorEnum),
  alignValue: valueSchema(alignEnum),
  baselineValue: valueSchema(baselineEnum),
  directionValue: valueSchema(directionEnum),
  orientValue: valueSchema(orientEnum),
  strokeCapValue: valueSchema(strokeCapEnum),
  strokeJoinValue: valueSchema(strokeJoinEnum),
  baseColorValue,
  colorRGB,
  colorHSL,
  colorLAB,
  colorHCL,
  colorValue,
  gradientStops,
  linearGradient,
  radialGradient
};
