import peek from './peek.js';

/**
 * Return the numerical span of an array: the difference between
 * the last and first values.
 */
export default function(array: readonly number[] | null | undefined): number {
  return array && (peek(array) - array[0]) || 0;
}
