/**
 * Return whether the provided value is an array.
 */
export const isArray: <T = unknown>(value: unknown) => value is readonly T[] = Array.isArray;
