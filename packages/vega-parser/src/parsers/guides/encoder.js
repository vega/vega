import {isObject} from 'vega-util';

export default function(_) {
  return isObject(_) ? _ : {value: _};
}
