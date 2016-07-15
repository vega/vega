import numbers from './numbers';
import {quantile, ascending} from 'd3-array';

export default function(array, f) {
  var values = numbers(array, f);

  return [
    quantile(values.sort(ascending), 0.25),
    quantile(values, 0.50),
    quantile(values, 0.75)
  ];
}
