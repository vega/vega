import {tickStep, range} from 'd3-array';
import {extent} from 'vega-util';

export default function (k, nice, zero) {
  return function (values) {
    const ex = extent(values);
    const start = zero ? Math.min(ex[0], 0) : ex[0];
    const stop = ex[1];
    const span = stop - start;
    const step = nice ? tickStep(start, stop, k) : span / (k + 1);
    return range(step, stop, step);
  };
}
