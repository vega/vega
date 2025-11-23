import {error, hasOwnProperty} from '@omni-co/vega-util';

export function scale(name) {
  var scales = this._runtime.scales;
  if (!hasOwnProperty(scales, name)) {
    error('Unrecognized scale or projection: ' + name);
  }
  return scales[name].value;
}
