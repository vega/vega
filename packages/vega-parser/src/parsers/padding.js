import {isObject} from 'vega-util';

export default function(spec, config) {
  spec = spec || config.padding;
  return isObject(spec) ? spec
    : (spec = +spec || 0, {top:spec, bottom:spec, left:spec, right:spec});
}
