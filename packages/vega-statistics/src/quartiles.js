import quantiles from './quantiles';

export default function (array, f) {
  return quantiles(array, [0.25, 0.5, 0.75], f);
}
