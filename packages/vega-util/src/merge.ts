interface TypedArray {
  length: number;
  [index: number]: number;
}

interface TypedArrayConstructor {
  new(length: number): TypedArray;
  readonly prototype: TypedArray;
}

/**
 * Creates a new TypedArray of the same type as the template with the specified length.
 *
 * TypeScript doesn't have proper typing for TypedArray constructors in the type system,
 * so we need to use constructor property access. This is safe because:
 * - All TypedArray types (Int8Array, Uint8Array, etc.) have a (length: number) constructor
 * - The constructor property on a TypedArray instance is always a TypedArray constructor
 * - We return the same type T as the template array
 */
function createTypedArray<T extends TypedArray>(template: T, length: number): T {
  // @ts-ignore - TypeScript can't verify that template.constructor has the right signature,
  // but all TypedArray constructors support new(length: number) at runtime
  return new template.constructor(length);
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

  const merged = output || createTypedArray(array0, n0 + n1);
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
