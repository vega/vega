/**
 * Returns the last element of an array.
 */
export default function peek<T>(array: readonly [T, ...T[]]): T;
export default function peek<T>(array: readonly T[]): T | undefined;
export default function peek<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}
