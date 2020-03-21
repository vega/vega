import {
  numberValue, stringValue, textOrSignal, anchorValue,
  alignValue, baselineValue, booleanValue, colorValue, fontWeightValue,
  def, enums, object, anyOf, oneOf, pattern, ref,
  booleanType, numberType, stringType, orSignal, numberOrSignal
} from './util';

// types defined elsewhere
const guideEncodeRef = def('guideEncode');
const encodeEntryRef = def('encodeEntry');
const stringValueRef = ref('stringValue');
const styleRef = ref('style');

const titleOrientEnum = ['none', 'left', 'right', 'top', 'bottom'];
const titleFrameEnum = ['group', 'bounds'];

const titleEncode = pattern({
  '^(?!interactive|name|style).+$': encodeEntryRef,
});

const title = oneOf(
  stringType,
  object({
    orient: orSignal(enums(titleOrientEnum, {default: 'top'})),
    anchor: anchorValue,
    frame: oneOf(enums(titleFrameEnum), stringValueRef),
    offset: numberValue,
    limit: numberValue,
    text: textOrSignal,
    subtitle: textOrSignal,
    zindex: numberType,
    align: alignValue,
    angle: numberValue,
    baseline: baselineValue,
    dx: numberValue,
    dy: numberValue,
    color: colorValue,
    font: stringValue,
    fontSize: numberValue,
    fontStyle: stringValue,
    fontWeight: fontWeightValue,
    lineHeight: numberValue,
    ariaHidden: booleanValue,
    ariaLabel: stringValue,
    ariaRole: stringValue,
    ariaRoleDescription: stringValue,
    tabindex: numberValue,
    subtitleColor: colorValue,
    subtitleFont: stringValue,
    subtitleFontSize: numberValue,
    subtitleFontStyle: stringValue,
    subtitleFontWeight: fontWeightValue,
    subtitleLineHeight: numberValue,
    subtitlePadding: numberOrSignal,
    subtitleAriaHidden: booleanValue,
    subtitleAriaLabel: stringValue,
    subtitleAriaRole: stringValue,
    subtitleAriaRoleDescription: stringValue,
    subtitleTabindex: numberValue,

    // custom encoders
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
  defs: {
    title
  }
};
