/**
 * Return an array with minimum and maximum values, in the
 * form [min, max]. Ignores null, undefined, and NaN values.
 */
/**
 * Overload 1: Without accessor function, returns extent of array values directly.
 * Example: extent([1, 5, 3]) returns [1, 5] with type [number | undefined, number | undefined]
 */
export default function extent<T>(array: ArrayLike<T>): [T | undefined, T | undefined];
/**
 * Overload 2: With accessor function that transforms T to U, returns extent of transformed values.
 * Example: extent([{a:1}, {a:5}], d => d.a) returns [1, 5] with type [number | undefined, number | undefined]
 * The returned extent has type U (the accessor's return type), not T (the array element type).
 */
export default function extent<T, U>(array: ArrayLike<T>, f: (value: T) => U): [U | undefined, U | undefined];
/**
 * Implementation signature: Handles both cases at runtime.
 * Returns T | U since the actual type depends on whether an accessor function is provided.
 */
export default function extent<T, U>(array: ArrayLike<T>, f?: (value: T) => U): [(T | U) | undefined, (T | U) | undefined] {
  let i = 0, n: number;
  let v: T | U | null | undefined;
  let min: T | U | undefined;
  let max: T | U | undefined;

  if (array && (n = array.length)) {
    if (f == null) {
      // find first valid value
      for (v = array[i]; i < n && (v == null || v !== v); v = array[++i]);
      min = max = v;

      // visit all other values
      for (; i<n; ++i) {
        v = array[i];
        // skip null/undefined; NaN will fail all comparisons
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    } else {
      // find first valid value
      for (v = f(array[i]); i < n && (v == null || v !== v); v = f(array[++i]));
      min = max = v;

      // visit all other values
      for (; i<n; ++i) {
        v = f(array[i]);
        // skip null/undefined; NaN will fail all comparisons
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
  }

  return [min, max];
}
