import {identity, toBoolean, toDate, toNumber, toString} from 'vega-util';

export const typeParsers = {
  boolean: toBoolean,
  integer: toNumber,
  number: toNumber,
  date: toDate,
  string: toString,
  unknown: identity
};

const typeTests = [isBoolean, isInteger, isNumber, isDate];

const typeList = ['boolean', 'integer', 'number', 'date'];

export function inferType(values, field) {
  if (!values || !values.length) return 'unknown';

  let value;
  let i;
  let j;
  let t = 0;
  let n = values.length;
  const m = typeTests.length;
  const a = typeTests.map(function (_, i) {
    return i + 1;
  });

  for (i = 0, n = values.length; i < n; ++i) {
    value = field ? values[i][field] : values[i];
    for (j = 0; j < m; ++j) {
      if (a[j] && isValid(value) && !typeTests[j](value)) {
        a[j] = 0;
        ++t;
        if (t === typeTests.length) return 'string';
      }
    }
  }

  t =
    a.reduce(function (u, v) {
      return u === 0 ? v : u;
    }, 0) - 1;
  return typeList[t];
}

export function inferTypes(data, fields) {
  return fields.reduce(function (types, field) {
    types[field] = inferType(data, field);
    return types;
  }, {});
}

// -- Type Checks ----

function isValid(_) {
  return _ != null && _ === _;
}

function isBoolean(_) {
  return _ === 'true' || _ === 'false' || _ === true || _ === false;
}

function isDate(_) {
  return !Number.isNaN(Date.parse(_));
}

function isNumber(_) {
  return !Number.isNaN(+_) && !(_ instanceof Date);
}

function isInteger(_) {
  return isNumber(_) && Number.isInteger(+_);
}
