import {isArray, peek} from 'vega-util';

/**
 * Piecewise-linear interpolation across an array of values.
 *
 * Unlike `lerp`, which interpolates between the first and last entries only,
 * this treats the array as evenly-spaced control points and interpolates
 * within the segment that `frac` falls into. It turns an array into a
 * piecewise-linear function of position -- a custom easing curve, for
 * instance, or any sampled series read at an arbitrary point.
 *
 * @param {Array<number>} values - The control points, in order.
 * @param {number} frac - Position along the array, in [0, 1].
 * @return {number} The interpolated value.
 */
export function interpolateLinear(values, frac) {
  if (!isArray(values) || !values.length) return undefined;

  const n = values.length,
        lo = values[0],
        f = +frac;

  if (n === 1 || !(f > 0)) return lo;
  if (f >= 1) return peek(values);

  const pos = f * (n - 1),
        i = Math.floor(pos),
        t = pos - i;

  return t ? values[i] + t * (values[i + 1] - values[i]) : values[i];
}
