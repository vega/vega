import {extend, isObject} from 'vega-util';

export function encoder(_) {
  return isObject(_) ? _ : {value: _};
}

export function extendEncode(encode, extra) {
  for (var name in extra) {
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}
