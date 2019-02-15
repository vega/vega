
type Fn<R> = (...args: any[]) => R;
export type AccessorFn<R=any> = Fn<R> & {fname?: string, fields: string[]};

export default function<R>(fn: Fn<R>, fields: string[], name?: string): AccessorFn<R> {
  const f = fn as AccessorFn<R>;
  f.fields = fields || [];
  f.fname = name;
  return f;
}

export function accessorName(fn: AccessorFn<any>): string | null | undefined {
  return fn == null ? null : fn.fname;
}

export function accessorFields(fn: AccessorFn<any>): string[] | null {
  return fn == null ? null : fn.fields;
}
