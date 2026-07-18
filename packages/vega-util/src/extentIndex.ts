/**
 * Return an array with the indices of the minimum and maximum values, in the
 * form [minIndex, maxIndex]. Ignores null, undefined, and NaN values.
 * Returns [-1, -1] if no valid values are found.
 */
/**
 * Overload 1: Without accessor function, returns indices of min/max array values directly.
 * Example: extentIndex([3, 1, 5]) returns [1, 2] with type [number, number]
 */
export default function extentIndex<T>(array: ArrayLike<T>): [number, number];
/**
 * Overload 2: With accessor function that transforms T to U, returns indices based on transformed values.
 * Example: extentIndex([{a:3}, {a:1}, {a:5}], d => d.a) returns [1, 2] with type [number, number]
 * The accessor receives (value, index, array) and its return value is used for comparison.
 */
export default function extentIndex<T, U>(array: ArrayLike<T>, f: (value: T, index: number, array: ArrayLike<T>) => U): [number, number];
/**
 * Implementation signature: Handles both cases at runtime.
 */
export default function extentIndex<T, U>(array: ArrayLike<T>, f?: (value: T, index: number, array: ArrayLike<T>) => U): [number, number] {
  const n = array.length;
  let i = -1, u: number, v: number;
  let a: T | U | undefined;
  let b: T | U | null | undefined;
  let c: T | U | undefined;

  if (f == null) {
    // Find first non-null value to initialize min/max
    while (++i < n) {
      b = array[i];
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    if (i === n) return [-1, -1];
    u = v = i;
    // At this point, a and c are guaranteed to be non-null/non-undefined
    // because the initialization loop above found a valid value before reaching here.
    // Non-null assertions (a!, c!) are used in the loop below.
    while (++i < n) {
      b = array[i];
      if (b != null) {
        if (a! > b) {
          a = b;
          u = i;
        }
        if (c! < b) {
          c = b;
          v = i;
        }
      }
    }
  } else {
    // Find first non-null value to initialize min/max
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    if (i === n) return [-1, -1];
    u = v = i;
    // At this point, a and c are guaranteed to be non-null/non-undefined
    // because the initialization loop above found a valid value before reaching here.
    // Non-null assertions (a!, c!) are used in the loop below.
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null) {
        if (a! > b) {
          a = b;
          u = i;
        }
        if (c! < b) {
          c = b;
          v = i;
        }
      }
    }
  }

  return [u, v];
}
