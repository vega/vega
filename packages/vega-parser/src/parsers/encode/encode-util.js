import parseEncode from '../encode';
import {FrameRole, MarkRole} from '../marks/roles';
import {array, extend, isArray, isObject} from 'vega-util';

export function encoder(_) {
  return isObject(_) ? extend({}, _) : {value: _};
}

export function addEncode(object, name, value, set) {
  if (value != null) {
    if (isObject(value) && !isArray(value)) {
      object.update[name] = value;
    } else {
      object[set || 'enter'][name] = {value: value};
    }
    // object[name] = isObject(value) && !isArray(value) ? value : {value: value};
    return 1;
  } else {
    return 0;
  }
}

export function extendEncode(encode, extra, skip) {
  for (var name in extra) {
    if (skip && skip.hasOwnProperty(name)) continue;
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}

export function encoders(encode, type, role, style, scope, params) {
  var enc, key;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  encode = applyDefaults(encode, type, role, style, scope.config);

  for (key in encode) {
    enc[key] = parseEncode(encode[key], type, params, scope);
  }

  return params;
}

function applyDefaults(encode, type, role, style, config) {
  var enter = {}, key, skip, props;

  // ignore legend and axis
  if (role == 'legend' || String(role).indexOf('axis') === 0) {
    role = null;
  }

  // resolve mark config
  props = role === FrameRole ? config.group
    : (role === MarkRole) ? extend({}, config.mark, config[type])
    : null;

  for (key in props) {
    // do not apply defaults if relevant fields are defined
    skip = has(key, encode)
      || (key === 'fill' || key === 'stroke')
      && (has('fill', encode) || has('stroke', encode));

    if (!skip) enter[key] = defaultEncode(props[key]);
  }

  // resolve styles, apply with increasing precedence
  array(style).forEach(function(name) {
    var props = config.style && config.style[name];
    for (var key in props) {
      if (!has(key, encode)) {
        enter[key] = defaultEncode(props[key]);
      }
    }
  });

  encode = extend({}, encode); // defensive copy
  encode.enter = extend(enter, encode.enter);

  return encode;
}

function defaultEncode(value) {
  return value && value.signal
    ? {signal: value.signal}
    : {value: value};
}

export function has(key, encode) {
  return encode && (
    (encode.enter && encode.enter[key]) ||
    (encode.update && encode.update[key])
  );
}
