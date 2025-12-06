export interface Accessor<T = any, R = any> {
  (value: T): R;
  fields?: string[];
  fname?: string;
}

export default function accessor<T = any, R = any>(
  fn: (value: T) => R,
  fields?: string[],
  name?: string
): Accessor<T, R> {
  const accessorFn = fn as Accessor<T, R>;
  accessorFn.fields = fields || [];
  accessorFn.fname = name;
  return accessorFn;
}

export function accessorName(fn: Accessor | null | undefined): string | null | undefined {
  return fn == null ? null : fn.fname;
}

export function accessorFields(fn: Accessor | null | undefined): string[] | null | undefined {
  return fn == null ? null : fn.fields;
}
