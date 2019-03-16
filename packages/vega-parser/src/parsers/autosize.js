import {isObject} from 'vega-util';

export default function(spec, config) {
  spec = spec || config.autosize;
  return isObject(spec)
    ? spec
    : {type: spec || 'pad'};
}
