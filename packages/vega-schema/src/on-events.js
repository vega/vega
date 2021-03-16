import {
  allOf, anyType, array, booleanType, def, object,
  oneOf, signalRef, stringType
} from './util';

// types defined elsewhere
const exprStringRef = def('exprString');
const exprRef = def('expr');
const selectorRef = def('selector');
const streamRef = def('stream');
const listenerRef = def('listener');

const listener = oneOf(
  signalRef,
  object({_scale_: stringType}, undefined),
  streamRef
);

const onEvents = array(allOf(
  object({
    _events_: oneOf(
      selectorRef,
      listenerRef,
      array(listenerRef, {minItems: 1})
    ),
    force: booleanType
  }, undefined),
  oneOf(
    object({
      _encode_: stringType
    }, undefined),
    object({
      _update_: oneOf(
        exprStringRef,
        exprRef,
        signalRef,
        object({_value_: anyType}, undefined)
      )
    }, undefined)
  )
));

export default {
  listener,
  onEvents
};
