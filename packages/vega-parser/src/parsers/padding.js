import {isObject} from 'vega-util';

export default function(spec, config) {
  spec = spec || config.padding;
  if (isObject(spec)) {
    return spec;
  } else {
    spec = +spec || 0;
    return {top: spec, bottom: spec, left: spec, right: spec};
  }
}
