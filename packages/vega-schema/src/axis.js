import {timeIntervals} from './scale';
import {
  alignValue, anchorValue, arrayOrSignal, baselineValue,
  booleanOrNumberOrSignal, booleanOrSignal, booleanType, booleanValue,
  colorValue, dashArrayValue, def, enums,
  fontWeightValue, formatTypeOrSignal, formatTypeType,
  numberOrSignal, numberType, numberValue, object, oneOf, orSignal,
  signalRef, stringType, stringValue, textOrSignal
} from './util';

// types defined elsewhere
const guideEncodeRef = def('guideEncode');

const overlapEnum = ['parity', 'greedy'];

const labelOverlap = oneOf(
  booleanType,
  enums(overlapEnum),
  signalRef
);
const labelOverlapRef = def('labelOverlap');

const tickBandEnum = ['center', 'extent'];

const tickBand = oneOf(
  enums(tickBandEnum),
  signalRef
);
const tickBandRef = def('tickBand');

const tickCount = oneOf(
  numberType,
  enums(timeIntervals),
  object({
    _interval_: orSignal(enums(timeIntervals)),
    step: numberOrSignal
  }),
  signalRef
);
const tickCountRef = def('tickCount');

const axisOrientEnum = [
  'top',
  'bottom',
  'left',
  'right'
];

const axisOrient = orSignal(enums(axisOrientEnum));

const axis = object({
  _orient_: axisOrient,
  _scale_: stringType,
  format: formatTypeOrSignal,
  formatType: orSignal(formatTypeType),
  minExtent: numberValue,
  maxExtent: numberValue,
  offset: numberValue,
  position: numberValue,
  bandPosition: numberValue,
  translate: numberValue,
  values: arrayOrSignal,
  zindex: numberType,

  // ARIA CONFIG
  aria: booleanType,
  description: stringType,

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
  domainCap: stringValue,
  domainColor: colorValue,
  domainDash: dashArrayValue,
  domainDashOffset: numberValue,
  domainOpacity: numberValue,
  domainWidth: numberValue,

  // TICK CONFIG
  ticks: booleanType,
  tickBand: tickBandRef,
  tickCap: stringValue,
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
  gridCap: stringValue,
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
  labelLineHeight: numberValue,
  labelOpacity: numberValue,
  labelOffset: numberValue,
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
  axis,
  labelOverlap,
  tickBand,
  tickCount
};
