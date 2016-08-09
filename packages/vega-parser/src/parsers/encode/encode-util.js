import parseEncode from '../encode';
import {
  GroupMark, LineMark, PathMark, RuleMark, ShapeMark, SymbolMark
} from '../marks/marktypes';
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

  applyDefaults(encode, type, scope.config.mark);

  for (key in encode) {
    enc[key] = parseEncode(encode[key], type, params, scope);
  }

  return params;
}

function applyDefaults(encode, type, config) {
  if (!config || type === GroupMark) return;

  var enter = extend({}, encode.enter),
      set = 0, color;

  if (type === SymbolMark && !enter.size && config.symbolSize != null) {
    enter.size = {value: config.symbolSize};
    set = 1;
  }

  if (config.color && !enter[color = colorProperty(type)]) {
    enter[color] = {value: config.color};
    set = 1;
  }

  if (set) encode.enter = enter;
}

function colorProperty(type) {
  switch (type) {
    case LineMark:
    case PathMark:
    case RuleMark:
    case ShapeMark:
      return 'stroke';
    default:
      return 'fill';
  }
}