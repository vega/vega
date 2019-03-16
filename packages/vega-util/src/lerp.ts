import peek from './peek';

export default function(array: number[], frac: number): number {
  const lo = array[0],
        hi = peek(array),
        f = +frac;
  return !f ? lo : f === 1 ? hi : lo + f * (hi - lo);
}
