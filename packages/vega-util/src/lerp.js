import peek from './peek.js';

export default function(array, frac) {
  const lo = array[0],
        hi = peek(array),
        f = +frac;
  return !f ? lo : f === 1 ? hi : lo + f * (hi - lo);
}
