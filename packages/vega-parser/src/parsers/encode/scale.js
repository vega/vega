import {scalePrefix} from '../expression';
import {isString, stringValue} from 'vega-util';

export default function(enc, value, scope, params) {
  var scale = getScale(enc.scale, scope, params),
      interp, func, flag;

  if (enc.range != null) {
    // pull value from scale range
    interp = +enc.range;
    func = scale + '.range()';
    value = (interp === 0) ? (func + '[0]')
      : '($=' + func + ',' + ((interp === 1) ? '$[$.length-1]'
      : '$[0]+' + interp + '*($[$.length-1]-$[0])') + ')';
  } else {
    // run value through scale and/or pull scale bandwidth
    value = value != null ? scale + '(' + value + ')' : null;

    if (enc.band && (flag = hasBandwidth(enc.scale, scope))) {
      func = scale + '.bandwidth';
      interp = +enc.band;
      interp = func + '()' + (interp===1 ? '' : '*' + interp);

      // if we don't know the scale type, check for bandwidth
      if (flag < 0) interp = '(' + func + '?' + interp + ':0)';

      value = (value ? value + '+' : '') + interp;
    }

    if (value == null) value = '0';
  }

  return value;
}

function hasBandwidth(name, scope) {
  if (!isString(name)) return -1;
  var type = scope.scaleType(name);
  return type === 'band' || type === 'point' ? 1 : 0;
}

export function getScale(name, scope, params) {
  var scaleName = scalePrefix + name;
  if (!params.hasOwnProperty(scaleName)) {
    params[scaleName] = scope.scaleRef(name);
  }
  return '_[' + stringValue(scaleName) + ']';
}
