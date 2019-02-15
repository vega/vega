import { identity } from './accessors';
import peek from './peek';
import toNumber from './toNumber';

function exp(sign: number) {
  return function(x: number) {
    return sign * Math.exp(x);
  };
}

function log(sign: number) {
  return function(x: number) {
    return Math.log(sign * x);
  };
}

function symlog(c: number) {
  return function(x: number) {
    return Math.sign(x) * Math.log1p(Math.abs(x / c));
  };
}

function symexp(c: number) {
  return function(x: number) {
    return Math.sign(x) * Math.expm1(Math.abs(x)) * c;
  };
}

function pow(exponent: number) {
  return function(x: number) {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
  };
}

type ScaleFunc = (_: number) => number | null;

function pan(domain: number[], delta: number, lift: ScaleFunc, ground: ScaleFunc) {
  var d0 = lift(domain[0]) as number, // fixme: don't force return value to number
    d1 = lift(peek(domain)) as number, // fixme: don't force return value to number
    dd = (d1 - d0) * delta;

  return [ground(d0 - dd), ground(d1 - dd)];
}

export function panLinear(domain: number[], delta: number) {
  return pan(domain, delta, toNumber, identity);
}

export function panLog(domain: number[], delta: number) {
  var sign = Math.sign(domain[0]);
  return pan(domain, delta, log(sign), exp(sign));
}

export function panPow(domain: number[], delta: number, exponent: number) {
  return pan(domain, delta, pow(exponent), pow(1 / exponent));
}

export function panSymlog(domain: number[], delta: number, constant: number) {
  return pan(domain, delta, symlog(constant), symexp(constant));
}

function zoom(domain: number[], anchor: number, scale: number, lift: ScaleFunc, ground: ScaleFunc) {
  var d0 = lift(domain[0]) as number, // fixme: don't force return value to number
    d1 = lift(peek(domain)) as number, // fixme: don't force return value to number
    da = anchor != null ? (lift(anchor) as number) : (d0 + d1) / 2; // fixme: don't force return value to number

  return [ground(da + (d0 - da) * scale), ground(da + (d1 - da) * scale)];
}

export function zoomLinear(domain: number[], anchor: number, scale: number) {
  return zoom(domain, anchor, scale, toNumber, identity);
}

export function zoomLog(domain: number[], anchor: number, scale: number) {
  var sign = Math.sign(domain[0]);
  return zoom(domain, anchor, scale, log(sign), exp(sign));
}

export function zoomPow(domain: number[], anchor: number, scale: number, exponent: number) {
  return zoom(domain, anchor, scale, pow(exponent), pow(1 / exponent));
}

export function zoomSymlog(domain: number[], anchor: number, scale: number, constant: number) {
  return zoom(domain, anchor, scale, symlog(constant), symexp(constant));
}
