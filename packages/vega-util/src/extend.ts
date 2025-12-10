type Writable = Record<string, unknown>;

export default function extend<T extends Writable>(_: T, ...args: (Writable | object)[]): T {
  const target = _ as Writable;

  for (let i = 0; i < args.length; ++i) {
    const x = args[i] as Writable;
    for (const k in x) {
      target[k] = x[k];
    }
  }

  return _;
}
