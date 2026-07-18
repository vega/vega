import {isGradient} from '../../Gradient.js';
import gradient from './gradient.js';

export default function(context, item, value) {
  return isGradient(value)
    ? gradient(context, value, item.bounds)
    : value;
}
