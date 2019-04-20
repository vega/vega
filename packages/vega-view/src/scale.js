import {error} from 'vega-util';

export function scale(name) {
  var scales = this._runtime.scales;
  if (!scales.hasOwnProperty(name)) {
    error('Unrecognized scale or projection: ' + name);
  }
  return scales[name].value;
}
