import error from './error.js';
import peek from './peek.js';
import toNumber from './toNumber.js';

type NonEmptyArray<T> = [T, ...T[]];
type TransformFn = (x: number) => number;
type Domain = [number, number];
type Anchor = number | null | undefined;

function isNonEmpty<T>(arr: T[]): arr is NonEmptyArray<T> {
  return arr.length > 0;
}

const exp = (sign: number): TransformFn =>
  x => sign * Math.exp(x);

const log = (sign: number): TransformFn =>
  x => Math.log(sign * x);

const symlog = (c: number): TransformFn =>
  x => Math.sign(x) * Math.log1p(Math.abs(x / c));

const symexp = (c: number): TransformFn =>
  x => Math.sign(x) * Math.expm1(Math.abs(x)) * c;

const pow = (exponent: number): TransformFn =>
  x => x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);

// Internal wrappers to adapt utility functions to TransformFn signature
// Unlike toNumber, coerceNumber always returns a number (never null)
const coerceNumber: TransformFn = x => toNumber(x) ?? 0;
const identity: TransformFn = x => x;

function pan(domain: number[], delta: number, lift: TransformFn, ground: TransformFn): Domain {
  if (!isNonEmpty(domain)) error('Domain array must not be empty');
  const d0 = lift(domain[0]),
        d1 = lift(peek(domain)),
        dd = (d1 - d0) * delta;

  return [
    ground(d0 - dd),
    ground(d1 - dd)
  ];
}

export function panLinear(domain: number[], delta: number): Domain {
  return pan(domain, delta, coerceNumber, identity);
}

export function panLog(domain: number[], delta: number): Domain {
  const sign = Math.sign(domain[0]);
  return pan(domain, delta, log(sign), exp(sign));
}

export function panPow(domain: number[], delta: number, exponent: number): Domain {
  return pan(domain, delta, pow(exponent), pow(1/exponent));
}

export function panSymlog(domain: number[], delta: number, constant: number): Domain {
  return pan(domain, delta, symlog(constant), symexp(constant));
}

function zoom(domain: number[], anchor: Anchor, scale: number, lift: TransformFn, ground: TransformFn): Domain {
  if (!isNonEmpty(domain)) error('Domain array must not be empty');
  const d0 = lift(domain[0]),
        d1 = lift(peek(domain)),
        da = anchor != null ? lift(anchor) : (d0 + d1) / 2;

  return [
    ground(da + (d0 - da) * scale),
    ground(da + (d1 - da) * scale)
  ];
}

export function zoomLinear(domain: number[], anchor: Anchor, scale: number): Domain {
  return zoom(domain, anchor, scale, coerceNumber, identity);
}

export function zoomLog(domain: number[], anchor: Anchor, scale: number): Domain {
  const sign = Math.sign(domain[0]);
  return zoom(domain, anchor, scale, log(sign), exp(sign));
}

export function zoomPow(domain: number[], anchor: Anchor, scale: number, exponent: number): Domain {
  return zoom(domain, anchor, scale, pow(exponent), pow(1/exponent));
}

export function zoomSymlog(domain: number[], anchor: Anchor, scale: number, constant: number): Domain {
  return zoom(domain, anchor, scale, symlog(constant), symexp(constant));
}
