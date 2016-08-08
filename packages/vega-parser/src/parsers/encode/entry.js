import color from './color';
import field from './field';
import scale from './scale';
import signal from './signal';
import property from './property';
import expression from './expression';
import {stringValue} from 'vega-util';

export default function(channel, enc, scope, params, fields) {
  var value = (enc.color != null) ? color(enc.color, scope, params, fields)
    : (enc.field != null) ? field(enc.field, fields)
    : (enc.signal != null) ? signal(enc.signal, scope, params)
    : (enc.expr != null) ? expression(enc.expr, scope, params, fields)
    : (enc.value != null) ? stringValue(enc.value)
    : null;

  if (enc.scale != null) {
    value = scale(enc, value, scope, params, fields);
  }

  if (enc.exponent != null) {
    value = 'Math.pow(' + value + ','
      + property(enc.exponent, scope, params, fields) + ')';
  }

  if (enc.mult != null) {
    value += '*' + property(enc.mult, scope, params, fields);
  }

  if (enc.offset != null) {
    value += '+' + property(enc.offset, scope, params, fields);
  }

  if (enc.round) {
    value = 'Math.round(' + value + ')';
  }

  return value;
}
