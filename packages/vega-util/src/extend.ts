export type Writable = Record<string, unknown>;

export default function extend<T extends Writable>(_: T, ...args: Writable[]): T {
  for (let i = 0; i < args.length; ++i) {
    const x = args[i];
    for (const k in x) {
      (_ as Writable)[k] = x[k];
    }
  }

  return _;
}
