import {isArray, isString} from 'vega-util';

function array(seq) {
  return isArray(seq) || ArrayBuffer.isView(seq) ? seq : null;
}

function sequence(seq) {
  return array(seq) || (isString(seq) ? seq : null);
}

export function join(seq, ...args) {
  return array(seq).join(...args);
}

export function indexof(seq, ...args) {
  return sequence(seq).indexOf(...args);
}

export function lastindexof(seq, ...args) {
  return sequence(seq).lastIndexOf(...args);
}

export function slice(seq, ...args) {
  return sequence(seq).slice(...args);
}

export function reverse(seq) {
  return array(seq).slice().reverse();
}
