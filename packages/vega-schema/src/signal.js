import {
  anyType, arrayType, booleanType, def, enums, not, numberType, object,
  oneOf, orSignal, stringType, textType, type
} from './util';

// types defined elsewhere
const exprStringRef = def('exprString');
const onEventsRef = def('onEvents');
const bindRef = def('bind');

const ReservedNameEnum = ['parent', 'datum', 'event', 'item'];

const signalRef = object({_signal_: stringType}, undefined);
const arrayOrSignal = orSignal(arrayType);
const booleanOrSignal = orSignal(booleanType);
const numberOrSignal = orSignal(numberType);
const stringOrSignal = orSignal(stringType);
const textOrSignal = orSignal(textType);

const signalNameRef = def('signalName');
const signalName = type(
  'string',
  not(enums(ReservedNameEnum))
);

const signalNew = object({
  _name_: signalNameRef,
  description: stringType,
  value: anyType,
  react: type('boolean', {default: true}),
  update: exprStringRef,
  on: onEventsRef,
  bind: bindRef
});

const signalInit = object({
  _name_: signalNameRef,
  description: stringType,
  value: anyType,
  _init_: exprStringRef,
  on: onEventsRef,
  bind: bindRef
});

const signalPush = object({
  _name_: signalNameRef,
  description: stringType,
  _push_: enums(['outer']),
  on: onEventsRef
});

const signal = oneOf(
  signalPush,
  signalNew,
  signalInit
);

export default {
  signal,
  signalName,
  signalRef,
  arrayOrSignal,
  booleanOrSignal,
  numberOrSignal,
  stringOrSignal,
  textOrSignal
};
