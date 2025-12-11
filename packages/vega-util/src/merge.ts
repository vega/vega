/** Type guard for Array or TypedArray constructors */
function isArrayConstructor(ctor: Function): ctor is ArrayConstructor {

  // isView is a cheap check for if the constructor is a TypedArray
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer/isView
  return ctor === Array || (typeof ctor === 'function' && ctor.prototype && ArrayBuffer.isView(ctor.prototype));
}

export default function merge<T>(
  compare: (a: T, b: T) => number,
  array0: T[],
  array1: T[],
  output?: T[]
): T[] {
  const n0 = array0.length,
        n1 = array1.length;

  if (!n1) return array0;
  if (!n0) return array1;

  // Use array constructor to preserve type (Array or TypedArray), fallback to Array if invalid
  const ctor = array0.constructor;
  const merged = output || (
    isArrayConstructor(ctor)
      ? new ctor(n0 + n1)
      : new Array(n0 + n1)
  );
  let i0 = 0, i1 = 0, i = 0;

  for (; i0<n0 && i1<n1; ++i) {
    merged[i] = compare(array0[i0], array1[i1]) > 0
       ? array1[i1++]
       : array0[i0++];
  }

  for (; i0<n0; ++i0, ++i) {
    merged[i] = array0[i0];
  }

  for (; i1<n1; ++i1, ++i) {
    merged[i] = array1[i1];
  }

  return merged;
}
