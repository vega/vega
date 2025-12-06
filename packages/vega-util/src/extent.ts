export default function extent<T>(
  array: readonly T[],
  f?: (value: T) => any
): [any, any] {
  let i = 0, n: number, v: any, min: any, max: any;

  if (array && (n = array.length)) {
    if (f == null) {
      for (v = array[i]; i < n && (v == null || v !== v); v = array[++i]);
      min = max = v;

      for (; i<n; ++i) {
        v = array[i];
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    } else {
      for (v = f(array[i]); i < n && (v == null || v !== v); v = f(array[++i]));
      min = max = v;

      for (; i<n; ++i) {
        v = f(array[i]);
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
  }

  return [min, max];
}
