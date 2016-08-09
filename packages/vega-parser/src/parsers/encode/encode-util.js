import parseEncode from '../encode';
import {FrameRole, MarkRole} from '../marks/roles';
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

export function encoders(encode, type, role, scope, params) {
  var enc, key;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  encode = applyDefaults(encode, type, role, scope.config);

  for (key in encode) {
    enc[key] = parseEncode(encode[key], type, params, scope);
  }

  return params;
}

function applyDefaults(encode, type, role, config) {
  var enter, key, skip;

  config = config && (role === FrameRole ? config.group
    : role === MarkRole ? config.mark && config.mark[type]
    : null);

  if (config) {
    enter = {};
    for (key in config) {
      // do not apply defaults if relevant fields are defined
      skip = has(key, encode)
        || (key === 'fill' || key === 'stroke')
        && (has('fill', encode) || has('stroke', encode));

      if (!skip) enter[key] = {value: config[key]};
    }

    encode = extend({}, encode); // defensive copy
    encode.enter = extend(enter, encode.enter);
  }

  return encode;
}

function has(key, encode) {
  return (encode.enter && encode.enter[key])
    || (encode.update && encode.update[key]);
}
