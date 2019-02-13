import {layoutAlign} from './layout';

import {
  numberValue, stringValue, colorValue,
  alignValue, baselineValue, fontWeightValue,
  numberOrSignal, stringOrSignal, arrayOrSignal,
  anyOf, allOf, def, enums, object, pattern, required, ref, type,
  numberType, stringType
} from './util';

// types defined elsewhere
const encodeEntryRef = def('encodeEntry');
const styleRef = ref('style');
const labelOverlapRef = ref('labelOverlap');
const tickCountRef = ref('tickCountRef');

const guideEncodeRef = def('guideEncode');
const guideEncode = pattern(
  object({
    name: stringType,
    interactive: type('boolean', {default: false}),
    style: styleRef
  }), {
    '^(?!interactive|name|style).+$': encodeEntryRef
  }
);

const legendTypeEnum = ['gradient', 'symbol'];

const legendDirectionEnum = ['vertical', 'horizontal'];

const legendOrientEnum = [
  'none',
  'left',
  'right',
  'top',
  'bottom',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right'
];

const legendProps = object({
  size:        stringType,
  shape:       stringType,
  fill:        stringType,
  stroke:      stringType,
  opacity:     stringType,
  strokeDash:  stringType,
  strokeWidth: stringType,
  type: enums(legendTypeEnum),
  direction: enums(legendDirectionEnum),
  orient: enums(legendOrientEnum, {default: 'right'}),

  format: stringOrSignal,
  title: stringOrSignal,
  tickCount: tickCountRef,
  values: arrayOrSignal,
  zindex: numberType,

  // LEGEND GROUP CONFIG
  cornerRadius: numberValue,
  fillColor: colorValue,
  offset: numberValue,
  padding: numberValue,
  strokeColor: colorValue,

  // LEGEND TITLE CONFIG
  titleAlign: alignValue,
  titleBaseline: baselineValue,
  titleColor: colorValue,
  titleFont: stringValue,
  titleFontSize: numberValue,
  titleFontWeight: fontWeightValue,
  titleLimit: numberValue,
  titleOpacity: numberValue,
  titlePadding: numberValue,

  // GRADIENT CONFIG
  gradientLength: numberOrSignal,
  gradientOpacity: numberValue,
  gradientStrokeColor: colorValue,
  gradientStrokeWidth: numberValue,
  gradientThickness: numberOrSignal,

  // SYMBOL LAYOUT CONFIG
  clipHeight: numberOrSignal,
  columns: numberOrSignal,
  columnPadding: numberOrSignal,
  rowPadding: numberOrSignal,
  gridAlign: layoutAlign,

  // SYMBOL CONFIG
  symbolFillColor: colorValue,
  symbolOffset: numberValue,
  symbolOpacity: numberValue,
  symbolSize: numberValue,
  symbolStrokeColor: colorValue,
  symbolStrokeWidth: numberValue,
  symbolType: stringValue,

  // LABEL CONFIG
  labelAlign: alignValue,
  labelBaseline: baselineValue,
  labelColor: colorValue,
  labelFont: stringValue,
  labelFontSize: numberValue,
  labelFontWeight: fontWeightValue,
  labelLimit: numberValue,
  labelOffset: numberValue,
  labelOpacity: numberValue,
  labelOverlap: labelOverlapRef,
  labelSeparation: numberOrSignal,

  // CUSTOMIZED ENCODERS
  encode: object({
    title: guideEncodeRef,
    labels: guideEncodeRef,
    legend: guideEncodeRef,
    entries: guideEncodeRef,
    symbols: guideEncodeRef,
    gradient: guideEncodeRef
  })
});

const legend = allOf(
  legendProps,
  anyOf(
    required('size'),
    required('shape'),
    required('fill'),
    required('stroke'),
    required('opacity'),
    required('strokeDash')
  )
);

export default {
  defs: {
    guideEncode,
    legend
  }
};
