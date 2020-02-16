import {
  allOf, anyOf, oneOf, ref, array, def, object, pattern, required,
  type, booleanType, nullType, numberType, stringType, textType,
  signalRef, numberValue, enums
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

  var valueRef = allOf(
    ref(modType + 'Modifiers'),
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
  var valueRef = baseValueSchema(type, nullable);
  return oneOf(
    array(allOf(ruleRef, valueRef)),
    valueRef
  );
}

const ruleRef = def('rule');
const rule = object({
  test: stringType
}, undefined);

const fieldRef = ref('field');
const field = oneOf(
  stringType,
  signalRef,
  object({_datum_: fieldRef}),
  object({_group_: fieldRef, level: numberType}),
  object({_parent_: fieldRef, level: numberType})
);

const scaleRef = ref('scale');
const scale = fieldRef;

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
const anyValueRef = ref('anyValue');
const arrayValueRef = ref('arrayValue');
const booleanValueRef = ref('booleanValue');
const colorValueRef = ref('colorValue');
const numberValueRef = ref('numberValue');
const stringValueRef = ref('stringValue');
const textValueRef = ref('textValue');

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
  _stops_: ref('gradientStops')
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
  _stops_: ref('gradientStops')
});

const baseColorValue = oneOf(
  baseValueSchema('string', true),
  object({_value_: ref('linearGradient')}),
  object({_value_: ref('radialGradient')}),
  object({
    _gradient_: scaleRef,
    start: array(numberType, {minItems: 2, maxItems: 2}),
    stop:  array(numberType, {minItems: 2, maxItems: 2}),
    count: numberType
  }),
  object({
    _color_: oneOf(
      ref('colorRGB'),
      ref('colorHSL'),
      ref('colorLAB'),
      ref('colorHCL')
    )
  })
);

const colorValue = oneOf(
  array(allOf(ruleRef, ref('baseColorValue'))),
  ref('baseColorValue')
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
  strokeCap: ref('strokeCapValue'),
  strokeDash: arrayValueRef,
  strokeDashOffset: numberValueRef,
  strokeJoin: ref('strokeJoinValue'),
  strokeMiterLimit: numberValueRef,
  blend: ref('blendValue'),
  tabindex: numberValueRef,
  ariaLabel: stringValueRef,
  ariaRole: stringValueRef,
  ariaHidden: booleanValueRef,
  cursor: stringValueRef,
  tooltip: anyValueRef,
  zindex: numberValueRef,

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
  orient: ref('directionValue'),
  defined: booleanValueRef,

  // Image-mark properties
  url: stringValueRef,
  align: ref('alignValue'),
  baseline: ref('baselineValue'),
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
  fontWeight: ref('fontWeightValue'),
  fontStyle: stringValueRef
}, true);

const encode = pattern({
  '^.+$': encodeEntryRef
});

export default {
  refs: {
    field,
    scale,
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
  },
  defs: {
    rule,
    encodeEntry,
    encode
  }
};
