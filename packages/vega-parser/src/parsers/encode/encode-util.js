import parseEncode from '../encode';
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

export function encoders(encode, type, scope, params) {
  var enc, key;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  for (key in encode) {
    enc[key] = parseEncode(encode[key], type, params, scope);
  }

  return params;
}
