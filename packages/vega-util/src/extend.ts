export type Writable = Record<string, unknown>;

export default function extend<T extends Writable>(_: T, ...args: Writable[]): T {
  for (const arg of args) {
    for (const k in arg) {
      (_ as Writable)[k] = arg[k];
    }
  }

  return _;
}
