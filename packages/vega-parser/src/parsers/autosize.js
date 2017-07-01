import {isObject} from 'vega-util';

export default function(spec, config) {
  spec = spec || config.autosize;
  if (isObject(spec)) {
    return spec;
  } else {
    spec = spec || 'pad';
    return {type: spec};
  }
}
