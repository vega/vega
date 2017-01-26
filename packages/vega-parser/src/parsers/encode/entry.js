import color from './color';
import field from './field';
import scale from './scale';
import gradient from './gradient';
import property from './property';
import expression from './expression';
import {stringValue} from 'vega-util';

export default function(channel, enc, scope, params, fields) {
  if (enc.gradient != null) {
    return gradient(enc, scope, params, fields);
  }

  var value = enc.signal ? expression(enc.signal, scope, params, fields)
    : enc.color ? color(enc.color, scope, params, fields)
    : enc.field != null ? field(enc.field, scope, params, fields)
    : enc.value !== undefined ? stringValue(enc.value)
    : undefined;

  if (enc.scale != null) {
    value = scale(enc, value, scope, params, fields);
  }

  if (value === undefined) {
    value = null;
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
