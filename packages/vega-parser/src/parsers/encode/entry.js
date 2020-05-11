// import field from './field';
// import scale from './scale';
// import gradient from './gradient';
// import property from './property';
import {error, isObject, isString, splitAccessPath, stringValue} from 'vega-util';

const arg = val => stringValue(val == null ? null : val);

const colorValue = (type, x, y, z) =>
  `(${type}(${[x, y, z].map(entry).join(',')})+'')`;

const field = ref => resolveField(isObject(ref) ? ref : {datum: ref});

const getScale = scale => isString(scale) ? stringValue(scale)
  : scale.signal ? `(${scale.signal})`
  : field(scale);

export default function entry(enc) {
  if (enc.gradient != null) {
    return gradient(enc);
  }

  var value = enc.signal ? `(${enc.signal})`
    : enc.color ? color(enc.color)
    : enc.field != null ? field(enc.field)
    : enc.value !== undefined ? stringValue(enc.value)
    : undefined;

  if (enc.scale != null) {
    value = scale(enc, value);
  }

  if (value === undefined) {
    value = null;
  }

  if (enc.exponent != null) {
    value = `pow(${value},${property(enc.exponent)})`;
  }

  if (enc.mult != null) {
    value += `*${property(enc.mult)}`;
  }

  if (enc.offset != null) {
    value += `+${property(enc.offset)}`;
  }

  if (enc.round) {
    value = `round(${value})`;
  }

  return value;
}

function color(enc) {
  return (enc.c) ? colorValue('hcl', enc.h, enc.c, enc.l)
    : (enc.h || enc.s) ? colorValue('hsl', enc.h, enc.s, enc.l)
    : (enc.l || enc.a) ? colorValue('lab', enc.l, enc.a, enc.b)
    : (enc.r || enc.g || enc.b) ? colorValue('rgb', enc.r, enc.g, enc.b)
    : null;
}

function gradient(enc) {
  return 'gradient('
    + getScale(enc.gradient) + ','
    + arg(enc.start) + ','
    + arg(enc.stop) + ','
    + arg(enc.count)
    + ')';
}

function property(property) {
  return isObject(property) ? '(' + entry(property) + ')' : property;
}

function resolveField(ref) {
  var object, level, field;

  if (ref.signal) {
    object = 'datum';
    field = ref.signal;
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';

    while (level-- > 0) {
      object += '.mark.group';
    }

    if (ref.parent) {
      field = ref.parent;
      object += '.datum';
    } else {
      field = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field = ref.datum;
  } else {
    error('Invalid field reference: ' + stringValue(ref));
  }

  if (!ref.signal) {
    field = isString(field)
      ? splitAccessPath(field).map(stringValue).join('][')
      : resolveField(field);
  }

  return object + '[' + field + ']';
}

function scale(enc, value) {
  var scale = getScale(enc.scale);

  if (enc.range != null) {
    // pull value from scale range
    value = `lerp(_range(${scale}), ${+enc.range})`;
  } else {
    // run value through scale and/or pull scale bandwidth
    if (value !== undefined) value = `_scale(${scale}, ${value})`;

    if (enc.band) {
      value = (value ? value + '+' : '')
        + `_bandwidth(${scale})`
        + (+enc.band === 1 ? '' : '*' + property(enc.band));

      if (enc.extra) {
        // include logic to handle extraneous elements
        value = `(datum.extra ? _scale(${scale}, datum.extra.value) : ${value})`;
      }
    }

    if (value == null) value = '0';
  }

  return value;
}
