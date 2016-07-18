import color from './color';
import field from './field';
import scale from './scale';
import signal from './signal';
import {stringValue} from 'vega-util';

export default function(channel, enc, scope, params, fields) {
  var value = (enc.color != null) ? color(enc.color, scope, params, fields)
    : (enc.field != null) ? field(enc.field, fields)
    : (enc.signal != null) ? signal(enc.signal, scope, params)
    : (enc.value != null) ? stringValue(enc.value)
    : null;

  if (enc.scale != null) {
    value = scale(enc, value, scope, params)
  }

  if (enc.mult != null) {
    value += '*' + (+enc.mult);
  }

  if (enc.offset != null) {
    value += '+' + (+enc.offset);
  }

  return value;
}
