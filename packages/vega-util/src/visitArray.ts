// Overload: when filter is not provided, visitor operates on T directly
export default function visitArray<T>(
  array: readonly T[] | null | undefined,
  filter: null | undefined,
  visitor: (item: T, index: number, array: readonly T[]) => void
): void;
// Overload: when filter is provided, visitor operates on U (filtered type)
export default function visitArray<T, U>(
  array: readonly T[] | null | undefined,
  filter: (item: T) => U | null | undefined,
  visitor: (item: U, index: number, array: readonly T[]) => void
): void;
// Implementation: handle both cases
export default function visitArray<T, U = T>(
  array: readonly T[] | null | undefined,
  filter: ((item: T) => U | null | undefined) | null | undefined,
  visitor: (item: T | U, index: number, array: readonly T[]) => void
): void {
  if (array) {
    if (filter) {
      const n = array.length;
      for (let i = 0; i < n; ++i) {
        const t = filter(array[i]);
        if (t) visitor(t, i, array);
      }
    } else {
      // When no filter is provided, T and U are the same, so iterate directly
      const n = array.length;
      for (let i = 0; i < n; ++i) {
        visitor(array[i], i, array);
      }
    }
  }
}
