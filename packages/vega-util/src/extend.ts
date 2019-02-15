export default function<T>(target: T, ...source: Partial<T>[]): T {
  for (const x of source) {
    for (const k in x) { (target as any)[k] = x[k]; }
  }
  return target;
}
