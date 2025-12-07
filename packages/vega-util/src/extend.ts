export default function extend<T extends object>(_: T, ...sources: object[]): T {
  for (let i = 0, len = sources.length; i < len; ++i) {
    const x = sources[i] as Record<string, unknown>;
    for (const k in x) {
      (_ as Record<string, unknown>)[k] = x[k];
    }
  }
  return _;
}
