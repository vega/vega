import {
  allOf, array, booleanType, def, numberType, object,
  oneOf, stringType
} from './util';

// types defined elsewhere
const exprStringRef = def('exprString');

const streamRef = def('stream');

const streamParams = object({
  between: array(streamRef, {minItems: 2, maxItems: 2}),
  marktype: stringType,
  markname: stringType,
  filter: oneOf(exprStringRef, array(exprStringRef, {minItems: 1})),
  throttle: numberType,
  debounce: numberType,
  consume: booleanType
}, undefined);

const streamEvents = object({
  _type_: stringType,
  source: stringType
}, undefined);

const stream = allOf(
  streamParams,
  oneOf(
    streamEvents,
    object({_stream_: streamRef}, undefined),
    object({_merge_: array(streamRef, {minItems: 1})}, undefined)
  )
);

export default {
  stream
};
