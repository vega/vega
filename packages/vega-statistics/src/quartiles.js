import numbers from './numbers';
import {quantile, ascending} from 'd3-array';

export default function(array, f) {
  var values = Float64Array.from(numbers(array, f));

  // don't depend on return value from typed array sort call
  // protects against undefined sort results in Safari (vega/vega-lite#4964)
  values.sort(ascending);

  return [
    quantile(values, 0.25),
    quantile(values, 0.50),
    quantile(values, 0.75)
  ];
}
