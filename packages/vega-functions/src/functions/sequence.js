import { ascending, error, isArray, isFunction, isRegExp, isString } from 'vega-util';

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

export function replace(str, pattern, repl) {
  if (isFunction(repl)) error('Function argument passed to replace.');
  if (!isString(pattern) && !isRegExp(pattern)) error('Please pass a string or RegExp argument to replace.');

  return String(str).replace(pattern, repl);
}
export function reverse(seq) {
  return array(seq).slice().reverse();
}
export function sort(seq) {
  return array(seq).slice().sort(ascending);
}
