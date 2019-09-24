import {timeIntervals} from './scale';
import {
  numberValue, stringValue, booleanValue, colorValue, alignValue,
  anchorValue, baselineValue, fontWeightValue, dashArrayValue,
  booleanOrSignal, arrayOrSignal, numberOrSignal, stringOrSignal,
  textOrSignal, booleanOrNumberOrSignal,
  def, enums, object, oneOf, orSignal, ref,
  booleanType, formatType, numberType, stringType, signalRef
} from './util';

// types defined elsewhere
const guideEncodeRef = def('guideEncode');

const overlapEnum = ['parity', 'greedy'];

const labelOverlap = oneOf(
  booleanType,
  enums(overlapEnum),
  signalRef
);
const labelOverlapRef = ref('labelOverlap');

const tickCount = oneOf(
  numberType,
  enums(timeIntervals),
  object({
    _interval_: orSignal(enums(timeIntervals)),
    step: numberOrSignal
  }),
  signalRef
);
const tickCountRef = ref('tickCount');

const axisOrientEnum = [
  'top',
  'bottom',
  'left',
  'right'
];

const axis = object({
  _orient_: enums(axisOrientEnum),
  _scale_: stringType,
  format: stringOrSignal,
  formatType: orSignal(formatType),
  minExtent: numberValue,
  maxExtent: numberValue,
  offset: numberValue,
  position: numberValue,
  bandPosition: numberValue,
  values: arrayOrSignal,
  zindex: numberType,

  // TITLE CONFIG
  title: textOrSignal,
  titlePadding: numberValue,
  titleAlign: alignValue,
  titleAnchor: anchorValue,
  titleAngle: numberValue,
  titleX: numberValue,
  titleY: numberValue,
  titleBaseline: baselineValue,
  titleColor: colorValue,
  titleFont: stringValue,
  titleFontSize: numberValue,
  titleFontStyle: stringValue,
  titleFontWeight: fontWeightValue,
  titleLimit: numberValue,
  titleLineHeight: numberValue,
  titleOpacity: numberValue,

  // DOMAIN CONFIG
  domain: booleanType,
  domainColor: colorValue,
  domainDash: dashArrayValue,
  domainDashOffset: numberValue,
  domainOpacity: numberValue,
  domainWidth: numberValue,

  // TICK CONFIG
  ticks: booleanType,
  tickColor: colorValue,
  tickDash: dashArrayValue,
  tickDashOffset: numberValue,
  tickOffset: numberValue,
  tickOpacity: numberValue,
  tickRound: booleanValue,
  tickSize: numberValue,
  tickWidth: numberValue,
  tickCount: tickCountRef,
  tickExtra: booleanOrSignal,
  tickMinStep: numberOrSignal,

  // GRID CONFIG
  grid: booleanType,
  gridScale: stringType,
  gridColor: colorValue,
  gridDash: dashArrayValue,
  gridDashOffset: numberValue,
  gridOpacity: numberValue,
  gridWidth: numberValue,

  // LABEL CONFIG
  labels: booleanType,
  labelAlign: alignValue,
  labelBaseline: baselineValue,
  labelBound: booleanOrNumberOrSignal,
  labelFlush: booleanOrNumberOrSignal,
  labelFlushOffset: numberOrSignal,
  labelOverlap: labelOverlapRef,
  labelAngle: numberValue,
  labelColor: colorValue,
  labelFont: stringValue,
  labelFontSize: numberValue,
  labelFontWeight: fontWeightValue,
  labelFontStyle: stringValue,
  labelLimit: numberValue,
  labelOpacity: numberValue,
  labelPadding: numberValue,
  labelSeparation: numberOrSignal,

  // CUSTOMIZED ENCODERS
  encode: object({
    axis: guideEncodeRef,
    ticks: guideEncodeRef,
    labels: guideEncodeRef,
    title: guideEncodeRef,
    grid: guideEncodeRef,
    domain: guideEncodeRef
  })
});

export default {
  refs: {
    labelOverlap,
    tickCount
  },
  defs: {
    axis
  }
};
