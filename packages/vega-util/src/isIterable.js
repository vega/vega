import isFunction from './isFunction.js';

/**
 * Test if the value exposes the iterator protocol via `Symbol.iterator`.
 * @param {{ [Symbol.iterator]?: unknown } | null | undefined} value
 * @returns {boolean}
 */
export default function isIterable(value) {
  return value != null && isFunction(value[Symbol.iterator]);
}
