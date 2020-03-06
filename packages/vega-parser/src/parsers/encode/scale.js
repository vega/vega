import expression from './expression';
import field from './field';
import property from './property';
import {ScalePrefix} from 'vega-functions';
import {hasOwnProperty, isString, stringValue} from 'vega-util';

export default function(enc, value, scope, params, fields) {
  var scale = getScale(enc.scale, scope, params, fields),
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
    if (value !== undefined) value = scale + '(' + value + ')';

    if (enc.band && (flag = hasBandwidth(enc.scale, scope))) {
      func = scale + '.bandwidth';

      if (enc.band.signal) {
        interp = func + '()*' + property(enc.band, scope, params, fields);
      } else {
        interp = +enc.band;
        interp = func + '()' + (interp===1 ? '' : '*' + interp);
      }

      // if we don't know the scale type, check for bandwidth
      if (flag < 0) interp = '(' + func + '?' + interp + ':0)';

      value = (value ? value + '+' : '') + interp;

      if (enc.extra) {
        // include logic to handle extraneous elements
        value = '(datum.extra?' + scale + '(datum.extra.value):' + value + ')';
      }
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

export function getScale(name, scope, params, fields) {
  var scaleName;

  if (isString(name)) {
    // direct scale lookup; add scale as parameter
    scaleName = ScalePrefix + name;
    if (!hasOwnProperty(params, scaleName)) {
      params[scaleName] = scope.scaleRef(name);
    }
    scaleName = stringValue(scaleName);
  } else {
    // indirect scale lookup; add all scales as parameters
    for (scaleName in scope.scales) {
      params[ScalePrefix + scaleName] = scope.scaleRef(scaleName);
    }
    scaleName = stringValue(ScalePrefix) + '+'
      + (name.signal
        ? '(' + expression(name.signal, scope, params, fields) + ')'
        : field(name, scope, params, fields));
  }

  return '_[' + scaleName + ']';
}
