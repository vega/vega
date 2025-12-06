interface TypedArray {
  length: number;
  [index: number]: any;
}

interface TypedArrayConstructor {
  new(length: number): TypedArray;
}

export default function merge<T extends TypedArray>(
  compare: (a: T[number], b: T[number]) => number,
  array0: T,
  array1: T,
  output?: T
): T {
  const n0 = array0.length,
        n1 = array1.length;

  if (!n1) return array0;
  if (!n0) return array1;

  const merged = output || new (array0.constructor as TypedArrayConstructor)(n0 + n1) as T;
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
