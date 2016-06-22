import {isString, stringValue} from '../util';

export default function parseEncode(encode, params, scope) {
  var fields = {},
      code = 'var o=item,t=o.datum;',
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
  var value, scale;

  value = (enc.field != null) ? getField(enc.field, fields)
    : (enc.signal != null) ? getSignal(enc.signal, scope, params)
    : (enc.value != null) ? stringValue(enc.value)
    : null;

  if (enc.scale != null) {
    scale = getScale(enc.scale, scope, params);

    // run through scale function if value is specified.
    if (value != null || enc.band) {
      value = scale + (enc.band
        ? '.bandwidth()'
        : '(' + (value != null ? value : 't.value') + ')');
    }
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
