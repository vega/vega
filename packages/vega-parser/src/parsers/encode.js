import {isString, stringValue} from '../util';

export default function parseEncode(encode, params, scope) {
  var fields = {},
      code = 'var o=item,t=o.datum,$;',
      k, v, c;

  for (k in encode) {
    v = encode[k];
    c = parseEntry(k, v, scope, params, fields);
    code += objectSetter('o', k, c);
  }

  return {
    $expr: code,
    $fields: Object.keys(fields)
  };
}

function objectSetter(obj, key, value) {
  return obj + '["' + key + '"]=' + value + ';';
}

function parseEntry(channel, enc, scope, params, fields) {
  var value, scale, interp, func;

  value = (enc.field != null) ? getField(enc.field, fields)
    : (enc.signal != null) ? getSignal(enc.signal, scope, params)
    : (enc.value != null) ? stringValue(enc.value)
    : null;

  if (enc.scale != null) {
    scale = getScale(enc.scale, scope, params);

    if (enc.range) {
      // pull value from scale range
      interp = +enc.range;
      func = scale + '.range()';
      value = (interp === 0) ? func + '[0]'
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
  }

  if (enc.offset != null) {
    value += '+' + (+enc.offset);
  }

  return value;
}

function getSignal(name, scope, params) {
  var signalName = '!' + name;
  if (!params.hasOwnProperty(signalName)) {
    params[signalName] = scope.signalRef(name);
  }
  return '_["' + signalName + '"]';
}

function getScale(name, scope, params) {
  var scaleName = '$' + name;
  if (!params.hasOwnProperty(scaleName)) {
    params[scaleName] = scope.scaleRef(name);
  }
  return '_["' + scaleName + '"]';
}

function getField(name, fields) {
  if (!isString(name)) {
    fields[name.parent] = 1;
    return 'item.parent.datum["' + name.parent + '"]';
  } else {
    fields[name] = 1;
    return 't["' + name + '"]';
  }
}
