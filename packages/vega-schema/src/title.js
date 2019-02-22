import {
  numberValue, stringValue, stringOrSignal, anchorValue,
  alignValue, baselineValue, colorValue, fontWeightValue,
  def, enums, object, oneOf, pattern, ref,
  booleanType, numberType, stringType
} from './util';

// types defined elsewhere
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
    name: stringType,
    orient: enums(titleOrientEnum, {default: 'top'}),
    anchor: anchorValue,
    frame: oneOf(enums(titleFrameEnum), stringValueRef),
    offset: numberValue,
    style: styleRef,
    text: stringOrSignal,
    zindex: numberType,
    interactive: booleanType,
    align: alignValue,
    angle: numberValue,
    baseline: baselineValue,
    color: colorValue,
    font: stringValue,
    fontSize: numberValue,
    fontStyle: stringValue,
    fontWeight: fontWeightValue,
    limit: numberValue,
    encode: titleEncode
  })
)

export default {
  defs: {
    title
  }
};
