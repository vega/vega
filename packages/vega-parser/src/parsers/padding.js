import {isObject} from 'vega-util';

export default function(spec, config) {
  spec = spec || config.padding;
  return isObject(spec)
    ? {
        top:    number(spec.top),
        bottom: number(spec.bottom),
        left:   number(spec.left),
        right:  number(spec.right)
      }
    : paddingObject(number(spec));
}

function number(_) {
  return +_ || 0;
}

function paddingObject(_) {
  return {top: _, bottom: _, left: _, right: _};
}
