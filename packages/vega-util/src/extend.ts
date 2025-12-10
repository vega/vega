<<<<<<< HEAD
export type Writable = Record<string, unknown>;

export default function extend<T extends Writable>(_: T, ...args: Writable[]): T {
  for (const arg of args) {
    for (const k in arg) {
      (_ as Writable)[k] = arg[k];
=======
type Writable = Record<string, unknown>;

export default function extend<T extends Writable>(_: T, ...args: (Writable | object)[]): T {
  const target = _ as Writable;

  for (let i = 0; i < args.length; ++i) {
    const x = args[i] as Writable;
    for (const k in x) {
      target[k] = x[k];
>>>>>>> c5c1ce6d (chore(vega-util): migrate medium risk components to TS)
    }
  }

  return _;
}
