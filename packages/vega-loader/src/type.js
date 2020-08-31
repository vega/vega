import {identity, toBoolean, toDate, toNumber, toString} from 'vega-util';

const isValid = _ => _ != null && _ === _;

const isBoolean = _ => _ === 'true'
  || _ === 'false'
  || _ === true
  || _ === false;

const isDate = _ => !Number.isNaN(Date.parse(_));

const isNumber = _ => !Number.isNaN(+_) && !(_ instanceof Date);

const isInteger = _ => isNumber(_) && Number.isInteger(+_);

export const typeParsers = {
  boolean: toBoolean,
  integer: toNumber,
  number:  toNumber,
  date:    toDate,
  string:  toString,
  unknown: identity
};

const typeTests = [
  isBoolean,
  isInteger,
  isNumber,
  isDate
];

const typeList = [
  'boolean',
  'integer',
  'number',
  'date'
];

export function inferType(values, field) {
  if (!values || !values.length) return 'unknown';

  const n = values.length,
        m = typeTests.length,
        a = typeTests.map((_, i) => i + 1);

  for (let i = 0, t = 0, j, value; i < n; ++i) {
    value = field ? values[i][field] : values[i];
    for (j = 0; j < m; ++j) {
      if (a[j] && isValid(value) && !typeTests[j](value)) {
        a[j] = 0;
        ++t;
        if (t === typeTests.length) return 'string';
      }
    }
  }

  return typeList[
    a.reduce((u, v) => u === 0 ? v : u, 0) - 1
  ];
}

export function inferTypes(data, fields) {
  return fields.reduce((types, field) => {
    types[field] = inferType(data, field);
    return types;
  }, {});
}
