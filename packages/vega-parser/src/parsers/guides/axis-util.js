import {extend, stringValue} from 'vega-util';
import {Bottom, Left, Right, Top} from './constants';
import {encoder} from '../encode/encode-util';
import {isSignal} from '../../util';

const isX = orient => orient === Bottom || orient === Top;

// get sign coefficient based on axis orient
export const getSign = (orient, a, b) => isSignal(orient)
  ? ifLeftTopExpr(orient.signal, a, b)
  : orient === Left || orient === Top ? a : b;

// condition on axis x-direction
// short-circuit if first option is undefined
export const ifX = (orient, a, b, f) => !a ? a : isSignal(orient)
  ? ifXEnc(orient.signal, a, b, f)
  : isX(orient) ? a : b;

// condition on axis y-direction
// short-circuit if first option is undefined
export const ifY = (orient, a, b, f) => !a ? a : isSignal(orient)
  ? ifYEnc(orient.signal, a, b, f)
  : isX(orient) ? b : a;

export const ifTop = (orient, a, b) => isSignal(orient)
  ? ifTopExpr(orient.signal, a, b)
  : orient === Top ? {value: a} : {value: b};

export const ifRight = (orient, a, b) => isSignal(orient)
  ? ifRightExpr(orient.signal, a, b)
  : orient === Right ? {value: a} : {value: b};

const ifXEnc = ($orient, a, b, f) => ifEnc(
  `${$orient} === '${Top}' || ${$orient} === '${Bottom}'`, a, b, f
);

const ifYEnc = ($orient, a, b, f) => ifEnc(
  `${$orient} !== '${Top}' && ${$orient} !== '${Bottom}'`, a, b, f
);

const ifLeftTopExpr = ($orient, a, b) => ifExpr(
  `${$orient} === '${Left}' || ${$orient} === '${Top}'`, a, b
);

const ifTopExpr = ($orient, a, b) => ifExpr(
  `${$orient} === '${Top}'`, a, b
);

const ifRightExpr = ($orient, a, b) => ifExpr(
  `${$orient} === '${Right}'`, a, b
);

const ifEnc = (test, a, b, rule) => {
  // ensure inputs are encoder objects (or null)
  a = a != null ? encoder(a) : a;
  b = b != null ? encoder(b) : b;

  if (!rule && isSimple(a) && isSimple(b)) {
    // if possible generate simple signal expression
    a = a ? (a.signal || stringValue(a.value)) : null;
    b = b ? (b.signal || stringValue(b.value)) : null;
    return {signal: `${test} ? (${a}) : (${b})`};
  } else {
    // otherwise generate rule set
    return [extend({test}, a)].concat(b || []);
  }
};

const isSimple = enc => (
  !enc || Object.keys(enc).length === 1
);

const ifExpr = (test, a, b) => ({
  signal: `${test} ? (${toExpr(a)}) : (${toExpr(b)})`
});

export const ifOrient = ($orient, top, bottom, left, right) => ({
  signal: `${$orient}==='${Left}' ? (${toExpr(left)}) : `
        + `${$orient}==='${Bottom}' ? (${toExpr(bottom)}) : `
        + `${$orient}==='${Right}' ? (${toExpr(right)}) : (${toExpr(top)})`
});

const toExpr = v => isSignal(v)
  ? v.signal
  : v == null ? null : stringValue(v);

export const mult = (sign, value) => value === 0 ? 0 : isSignal(sign)
  ? {signal: `(${sign.signal}) * ${value}`}
  : {value: sign * value};
