import {
  def, enums, not, object, oneOf, orSignal, ref, type,
  anyType, arrayType, booleanType, numberType, stringType
} from '../util';
import { en } from '../consts';
import { ENGLISH } from './description';

// types defined elsewhere
const exprStringRef = ref('exprString');
const onEventsRef = def('onEvents');
const bindRef = def('bind');

const ReservedNameEnum = ['parent', 'datum', 'event', 'item'];

const signal = object({_signal_: stringType}, undefined);
const arrayOrSignal = orSignal(arrayType);
const booleanOrSignal = orSignal(booleanType);
const numberOrSignal = orSignal(numberType);
const stringOrSignal = orSignal(stringType);

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

const signalDef = oneOf(
  signalPush,
  signalNew,
  signalInit
);

switch(en) { // en is hardcoded currently. A language setting function will go here which will depend on the client side such window.navigator.language
  case en:
    Object.assign(signal, { description: ENGLISH })
    break
  default:
    Object.assign(signal, { description: ENGLISH })
    break
}

export default {
  refs: {
    signal,
    arrayOrSignal,
    booleanOrSignal,
    numberOrSignal,
    stringOrSignal
  },

  defs: {
    signalName,
    signal: signalDef
  }
};
