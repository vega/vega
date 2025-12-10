export interface Accessor<T = unknown> {
  (obj: unknown, ...args: unknown[]): T;
  fields?: readonly string[];
  fname?: string;
}

export default function accessor<T = unknown>(fn: (obj: unknown, ...args: unknown[]) => T, fields?: readonly string[], name?: string): Accessor<T> {
  return Object.assign(fn, {
    fields: fields || [],
    fname: name
  });
}

export function accessorName(fn: Accessor | null | undefined): string | null | undefined {
  return fn == null ? null : fn.fname;
}

export function accessorFields(fn: Accessor | null | undefined): readonly string[] | null | undefined {
  return fn == null ? null : fn.fields;
}
