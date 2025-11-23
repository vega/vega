import {isObject} from '@omni-co/vega-util';

export default function(spec) {
  return isObject(spec) ? spec : {type: spec || 'pad'};
}
