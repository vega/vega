export default function extend<T extends object>(_: T, ...sources: object[]): T {
  for (let i = 0, len = sources.length; i < len; ++i) {
    const x = sources[i];
    for (const k in x) {
      (_ as any)[k] = (x as any)[k];
    }
  }
  return _;
}
