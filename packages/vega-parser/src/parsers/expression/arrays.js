/**
 * Return an array with minimum and maximum values, in the
 * form [min, max]. Ignores null, undefined, and NaN values.
 */
export function extent(array) {
  var i = 0, n, v, min, max;

  if (array && (n = array.length)) {
    // find first valid value
    for (v = array[i]; v == null || v !== v; v = array[++i]);
    min = max = v;

    // visit all other values
    for (; i<n; ++i) {
      v = array[i];
      // skip null/undefined; NaN will fail all comparisons
      if (v != null) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
  }

  return [min, max];
}

/**
 * Predicate that returns true if the value lies within the span
 * of the given range. The left and right flags control the use
 * of inclusive (true) or exclusive (false) comparisons.
 */
export function inrange(value, range, left, right) {
  var r0 = range[0], r1 = range[range.length-1], t;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  left = left === undefined || left;
  right = right === undefined || right;

  return (left ? r0 <= value : r0 < value) &&
    (right ? value <= r1 : value < r1);
}

/**
 * Span-preserving range clamp. If the span of the input range is less
 * than (max - min) and an endpoint exceeds either the min or max value,
 * the range is translated such that the span is preserved and one
 * endpoint touches the boundary of the min/max range.
 * If the span exceeds (max - min), the range [min, max] is returned.
 */
export function clampRange(range, min, max) {
  var lo = range[0],
      hi = range[1],
      span;

  if (hi < lo) {
    span = hi;
    hi = lo;
    lo = span;
  }
  span = hi - lo;

  return span >= (max - min)
    ? [min, max]
    : [
        (lo = Math.min(Math.max(lo, min), max - span)),
        lo + span
      ];
}

/**
 * Return the numerical span of an array: the difference between
 * the last and first values.
 */
export function span(array) {
  return (array[array.length-1] - array[0]) || 0;
}
