export default function visitArray<T, U>(
  array: readonly T[] | null | undefined,
  filter: ((item: T) => U | null | undefined) | null | undefined,
  visitor: (item: U, index: number, array: readonly T[]) => void
): void {
  if (array) {
    if (filter) {
      const n = array.length;
      for (let i = 0; i < n; ++i) {
        const t = filter(array[i]);
        if (t) visitor(t, i, array);
      }
    } else {
      (array as T[]).forEach(visitor as any);
    }
  }
}
