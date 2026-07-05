import {isGradient} from '../../Gradient.js';
import gradient from './gradient.js';
import {isPattern} from 'vega-pattern';
import patternFill from './pattern.js';

export default function(context, item, value, renderer) {
  return isGradient(value) ? gradient(context, value, item.bounds)
    : isPattern(value) ? (patternFill(renderer, context, item, value) || 'transparent')
    : value;
}
