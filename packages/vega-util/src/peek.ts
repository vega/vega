export default function peek<T>(array: readonly T[]): T | undefined {
  return array[array.length - 1];
}
