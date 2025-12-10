/**
 * Returns the last element of an array.
 */
export default function peek<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}
