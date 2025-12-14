export type Writable = Record<string, unknown>;

export default function extend<T extends Writable>(
  _: T,
  ...args: Writable[]
): T {
  // Use arguments object directly to avoid rest parameter array allocation overhead
  for (let x, k, i = 1, len = arguments.length; i < len; ++i) {
    x = arguments[i] as Writable;
    for (k in x) {
      (_ as Writable)[k] = x[k];
    }
  }

  return _;
}
