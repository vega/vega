import {
  alignValue, anchorValue, anyOf,
  baselineValue, booleanType,
  colorValue, def, enums, fontWeightValue,
  numberOrSignal, numberType, numberValue,
  object, oneOf, orSignal, pattern,
  stringType, stringValue, textOrSignal
} from './util';

// types defined elsewhere
const guideEncodeRef = def('guideEncode');
const encodeEntryRef = def('encodeEntry');
const stringValueRef = def('stringValue');
const styleRef = def('style');

const titleOrientEnum = ['none', 'left', 'right', 'top', 'bottom'];
const titleFrameEnum = ['group', 'bounds'];

const titleEncode = pattern({
  '^(?!interactive|name|style).+$': encodeEntryRef
});

const title = oneOf(
  stringType,
  object({
    orient: orSignal(enums(titleOrientEnum, {default: 'top'})),
    anchor: anchorValue,
    frame: oneOf(enums(titleFrameEnum), stringValueRef),
    offset: numberValue,

    // ARIA CONFIG
    aria: booleanType,

    // SHARED TEXT CONFIG
    limit: numberValue,
    zindex: numberType,
    align: alignValue,
    angle: numberValue,
    baseline: baselineValue,
    dx: numberValue,
    dy: numberValue,

    // TITLE TEXT CONFIG
    text: textOrSignal,
    color: colorValue,
    font: stringValue,
    fontSize: numberValue,
    fontStyle: stringValue,
    fontWeight: fontWeightValue,
    lineHeight: numberValue,

    // SUBTITLE TEXT CONFIG
    subtitle: textOrSignal,
    subtitleColor: colorValue,
    subtitleFont: stringValue,
    subtitleFontSize: numberValue,
    subtitleFontStyle: stringValue,
    subtitleFontWeight: fontWeightValue,
    subtitleLineHeight: numberValue,
    subtitlePadding: numberOrSignal,

    // CUSTOM ENCODERS
    encode: anyOf(
      titleEncode, // deprecated! (v5.7.0)
      object({
        group: guideEncodeRef,
        title: guideEncodeRef,
        subtitle: guideEncodeRef
      })
    ),

    // deprecated! (v5.7.0)
    name: stringType,
    interactive: booleanType,
    style: styleRef
  })
);

export default {
  title
};
