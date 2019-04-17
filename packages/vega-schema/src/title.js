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

const titleOrientEnum = ['none', 'left', 'right', 'top', 'bottom'];
const titleFrameEnum = ['group', 'bounds'];

const titleEncode = pattern({
  '^(?!interactive|name|style).+$': encodeEntryRef,
});

const title = oneOf(
  stringType,
  object({
    name: stringType,
    orient: orSignal(enums(titleOrientEnum, {default: 'top'})),
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
    dx: numberValue,
    dy: numberValue,
    font: stringValue,
    fontSize: numberValue,
    fontStyle: stringValue,
    fontWeight: fontWeightValue,
    limit: numberValue,
    encode: titleEncode
  })
);
const DESCRIPTION = "The title directive adds a descriptive title to a chart. Similar to scales, axes, and legends, a title can be defined at the top-level of a specification or as part of a [group mark](https://vega.github.io/vega/docs/marks/group).\n\n__Required__: `text`. The title text.";

Object.assign(title, { description: DESCRIPTION })

export default {
  defs: {
    title
  }
};
