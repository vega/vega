import {scalePrefix} from '../expression';
import {stringValue} from 'vega-util';

export default function(enc, value, scope, params) {
  var scale = getScale(enc.scale, scope, params),
      interp, func;

  if (enc.range != null) {
    // pull value from scale range
    interp = +enc.range;
    func = scale + '.range()';
    value = (interp === 0) ? (func + '[0]')
      : '($=' + func + ',' + ((interp === 1) ? '$[$.length-1]'
      : '$[0]+' + interp + '*($[$.length-1]-$[0])') + ')';
  } else {
    // run value through scale and/or pull scale bandwidth
    value = value ? scale + '(' + value + ')' : null;

    if (enc.band) {
      // TODO streamline codegen using scale type info?
      interp = +enc.band;
      func = scale + '.bandwidth';
      value = (value ? value + '+' : '')
        + '(' + func
        + '?' + func + '()' + (interp===1 ? '' : '*' + interp)
        + ':0)';
    }

    if (value == null) value = '0';
  }

  return value;
}

export function getScale(name, scope, params) {
  var scaleName = scalePrefix + name;
  if (!params.hasOwnProperty(scaleName)) {
    params[scaleName] = scope.scaleRef(name);
  }
  return '_[' + stringValue(scaleName) + ']';
}
