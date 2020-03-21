import {layoutAlign} from './layout';

import {
  anyOf, allOf, def, enums, object, pattern, required, ref, type,
  alignValue, anchorValue, baselineValue, booleanValue, colorValue,
  dashArrayValue, fontWeightValue, numberValue, orientValue, stringValue,
  arrayOrSignal, numberOrSignal, textOrSignal, formatTypeOrSignal,
  formatTypeType, numberType, stringType, orSignal
} from './util';

// types defined elsewhere
const encodeEntryRef = def('encodeEntry');
const styleRef = ref('style');
const labelOverlapRef = ref('labelOverlap');
const tickCountRef = ref('tickCount');

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
  // LEGEND SCALES
  size:        stringType,
  shape:       stringType,
  fill:        stringType,
  stroke:      stringType,
  opacity:     stringType,
  strokeDash:  stringType,
  strokeWidth: stringType,

  // LEGEND TYPE
  type:        enums(legendTypeEnum),
  direction:   enums(legendDirectionEnum),
  orient:      orSignal(enums(legendOrientEnum, {default: 'right'})),

  // LEGEND CONFIG
  tickCount: tickCountRef,
  tickMinStep: numberOrSignal,
  symbolLimit: numberOrSignal,
  values: arrayOrSignal,
  zindex: numberType,

  // LEGEND GROUP CONFIG
  cornerRadius: numberValue,
  fillColor: colorValue,
  offset: numberValue,
  padding: numberValue,
  strokeColor: colorValue,
  legendX: numberValue,
  legendY: numberValue,
  ariaHidden: booleanValue,
  ariaLabel: stringValue,
  ariaRole: stringValue,
  ariaRoleDescription: stringValue,
  tabindex: numberValue,

  // LEGEND TITLE CONFIG
  title: textOrSignal,
  titleAlign: alignValue,
  titleAnchor: anchorValue,
  titleBaseline: baselineValue,
  titleColor: colorValue,
  titleFont: stringValue,
  titleFontSize: numberValue,
  titleFontStyle: stringValue,
  titleFontWeight: fontWeightValue,
  titleLimit: numberValue,
  titleLineHeight: numberValue,
  titleOpacity: numberValue,
  titleOrient: orientValue,
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
  symbolDash: dashArrayValue,
  symbolDashOffset: numberValue,
  symbolFillColor: colorValue,
  symbolOffset: numberValue,
  symbolOpacity: numberValue,
  symbolSize: numberValue,
  symbolStrokeColor: colorValue,
  symbolStrokeWidth: numberValue,
  symbolType: stringValue,

  // LABEL CONFIG
  format: formatTypeOrSignal,
  formatType: orSignal(formatTypeType),
  labelAlign: alignValue,
  labelBaseline: baselineValue,
  labelColor: colorValue,
  labelFont: stringValue,
  labelFontSize: numberValue,
  labelFontStyle: stringValue,
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
    required('strokeDash'),
    required('strokeWidth')
  )
);

export default {
  defs: {
    guideEncode,
    legend
  }
};
