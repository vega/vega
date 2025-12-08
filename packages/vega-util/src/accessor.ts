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
  return Object.assign(fn, {
    fields: fields || [],
    fname: name
  });
}

export function accessorName(fn: Accessor | null | undefined): string | null | undefined {
  return fn == null ? null : fn.fname;
}

export function accessorFields(fn: Accessor | null | undefined): string[] | null | undefined {
  return fn == null ? null : fn.fields;
}
