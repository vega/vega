import peek from './peek';

export default function(array, frac) {
  const lo = array[0];
  const hi = peek(array);
  const f = +frac;
  return !f ? lo : f === 1 ? hi : lo + f * (hi - lo);
}
