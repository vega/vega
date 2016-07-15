export default function(fn, fields, name) {
  return (
    fn.fields = fields || [],
    fn.fname = name,
    fn
  );
}

export function accessorName(fn) {
  return fn == null ? null : fn.fname;
}

export function accessorFields(fn) {
  return fn == null ? null : fn.fields;
}
