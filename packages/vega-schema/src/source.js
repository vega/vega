import {
  numberValue, stringValue, stringOrSignal, anchorValue,
  alignValue, baselineValue, colorValue, fontWeightValue,
  def, enums, object, oneOf, pattern, ref,
  booleanType, numberType, stringType, orSignal
} from './util';

// types defined elsewhere
const encodeEntryRef = def('encodeEntry');
const stringValueRef = ref('stringValue');
const styleRef = ref('style');

const sourceOrientEnum = ['none', 'left', 'right', 'top', 'bottom'];
const sourceFrameEnum = ['group', 'bounds'];

const sourceEncode = pattern({
  '^(?!interactive|name|style).+$': encodeEntryRef,
});

const source = oneOf(
  stringType,
  object({
    name: stringType,
    orient: orSignal(enums(sourceOrientEnum, {default: 'bottom'})),
    anchor: anchorValue,
    frame: oneOf(enums(sourceFrameEnum), stringValueRef),
    offset: numberValue,
    style: styleRef,
    text: stringOrSignal,
    zindex: numberType,
    interactive: booleanType,
    align: alignValue,
    angle: numberValue,
    baseline: baselineValue,
    color: colorValue,
    dx: numberValue,
    dy: numberValue,
    font: stringValue,
    fontSize: numberValue,
    fontStyle: stringValue,
    fontWeight: fontWeightValue,
    limit: numberValue,
    encode: sourceEncode
  })
);

export default {
  defs: {
    source
  }
};
