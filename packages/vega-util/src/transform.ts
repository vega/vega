import peek from './peek.js';

type Domain = number[] | readonly number[];
type TransformFunction = (x: number) => number;

// Local number-specific helpers for domain transformations
// These have stricter signatures than the general utility versions
const numberIdentity: TransformFunction = (x: number) => x;
const toNumberStrict: TransformFunction = (x: number) => x;

const exp = (sign: number): TransformFunction =>
  x => sign * Math.exp(x);

const log = (sign: number): TransformFunction =>
  x => Math.log(sign * x);

const symlog = (c: number): TransformFunction =>
  x => Math.sign(x) * Math.log1p(Math.abs(x / c));

const symexp = (c: number): TransformFunction =>
  x => Math.sign(x) * Math.expm1(Math.abs(x)) * c;

const pow = (exponent: number): TransformFunction =>
  x => x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);

function pan(
  domain: Domain,
  delta: number,
  lift: (x: number) => number,
  ground: (x: number) => number
): [number, number] {
  const d0 = lift(domain[0]),
        d1 = lift(peek(domain)!),
        dd = (d1 - d0) * delta;

  return [
    ground(d0 - dd),
    ground(d1 - dd)
  ];
}

export function panLinear(domain: Domain, delta: number): [number, number] {
  return pan(domain, delta, toNumberStrict, numberIdentity);
}

export function panLog(domain: Domain, delta: number): [number, number] {
  const sign = Math.sign(domain[0]);
  return pan(domain, delta, log(sign), exp(sign));
}

export function panPow(domain: Domain, delta: number, exponent: number): [number, number] {
  return pan(domain, delta, pow(exponent), pow(1/exponent));
}

export function panSymlog(domain: Domain, delta: number, constant: number): [number, number] {
  return pan(domain, delta, symlog(constant), symexp(constant));
}

function zoom(
  domain: Domain,
  anchor: number | null | undefined,
  scale: number,
  lift: (x: number) => number,
  ground: (x: number) => number
): [number, number] {
  const d0 = lift(domain[0]),
        d1 = lift(peek(domain)!),
        da = anchor != null ? lift(anchor) : (d0 + d1) / 2;

  return [
    ground(da + (d0 - da) * scale),
    ground(da + (d1 - da) * scale)
  ];
}

export function zoomLinear(
  domain: Domain,
  anchor: number | null | undefined,
  scale: number
): [number, number] {
  return zoom(domain, anchor, scale, toNumberStrict, numberIdentity);
}

export function zoomLog(
  domain: Domain,
  anchor: number | null | undefined,
  scale: number
): [number, number] {
  const sign = Math.sign(domain[0]);
  return zoom(domain, anchor, scale, log(sign), exp(sign));
}

export function zoomPow(
  domain: Domain,
  anchor: number | null | undefined,
  scale: number,
  exponent: number
): [number, number] {
  return zoom(domain, anchor, scale, pow(exponent), pow(1/exponent));
}

export function zoomSymlog(
  domain: Domain,
  anchor: number | null | undefined,
  scale: number,
  constant: number
): [number, number] {
  return zoom(domain, anchor, scale, symlog(constant), symexp(constant));
}
