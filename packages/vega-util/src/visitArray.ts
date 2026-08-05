/**
 * Overload 1: When filter transforms T to U, visitor receives the filtered type U.
 * Example: visitArray([1,2,3], x => x * x, (squared) => { ... })
 * The visitor receives squared values (type U), not original values (type T).
 */
export default function visitArray<T, U>(
  array: T[] | null | undefined,
  filter: ((value: T) => U | null | undefined) | null | undefined,
  visitor: (value: U, index: number, array: T[]) => void
): void;
/**
 * Overload 2: When filter is null/undefined, visitor receives original type T.
 * Example: visitArray([1,2,3], null, (value) => { ... })
 * The visitor receives original values (type T) since no transformation occurs.
 */
export default function visitArray<T>(
  array: T[] | null | undefined,
  filter: null | undefined,
  visitor: (value: T, index: number, array: T[]) => void
): void;
/**
 * Implementation signature: Handles both cases at runtime.
 * Visitor accepts T | U because the actual type depends on whether filter is provided.
 */
export default function visitArray<T, U>(
  array: T[] | null | undefined,
  filter: ((value: T) => U | null | undefined) | null | undefined,
  visitor: (value: T | U, index: number, array: T[]) => void
): void {
  if (array) {
    if (filter) {
      const n = array.length;
      for (let i = 0; i < n; ++i) {
        const t = filter(array[i]);
        if (t) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}
