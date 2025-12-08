export default function extentIndex<T>(
  array: readonly T[],
  f?: undefined
): [number, number];
export default function extentIndex<T, R>(
  array: readonly T[],
  f: (value: T, index: number, array: readonly T[]) => R
): [number, number];
export default function extentIndex<T, R = T>(
  array: readonly T[],
  f?: (value: T, index: number, array: readonly T[]) => R
): [number, number] {
  const n = array.length;
  let i = -1, a: T | R | undefined, b: T | R, c: T | R | undefined, u: number, v: number;

  if (f == null) {
    while (++i < n) {
      b = array[i];
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    if (i === n) return [-1, -1];
    u = v = i;
    while (++i < n) {
      b = array[i];
      if (b != null) {
        // a and c are guaranteed to be assigned by the first loop above
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
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    if (i === n) return [-1, -1];
    u = v = i;
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null) {
        // a and c are guaranteed to be assigned by the first loop above
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
