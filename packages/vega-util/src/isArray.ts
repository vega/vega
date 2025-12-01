/**
 * Return whether the provided value is an array.
 */
const isArray: <T = unknown>(value: unknown) => value is readonly T[] = Array.isArray;

export default isArray;
