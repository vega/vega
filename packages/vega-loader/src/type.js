import {toBoolean, toDate, toNumber, toString} from 'vega-util';

export var typeParsers = {
  boolean: toBoolean,
  integer: toNumber,
  number:  toNumber,
  date:    toDate,
  string:  toString
};

var typeTests = [
  isBoolean,
  isInteger,
  isNumber,
  isDate
];

var typeList = [
  'boolean',
  'integer',
  'number',
  'date'
];

export function inferType(values, field) {
  var tests = typeTests.slice(),
      value, i, n, j;

  for (i=0, n=values.length; i<n; ++i) {
    value = field ? values[i][field] : values[i];
    for (j=0; j<tests.length; ++j) {
      if (isValid(value) && !tests[j](value)) {
        tests.splice(j, 1); --j;
      }
    }
    if (tests.length === 0) return 'string';
  }
  return typeList[typeTests.indexOf(tests[0])];
}

export function inferTypes(data, fields) {
  return fields.reduce(function(types, field) {
    return types[field] = inferType(data, field), types;
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
  return !isNaN(Date.parse(_));
}

function isNumber(_) {
  return !isNaN(+_) && !(_ instanceof Date);
}

function isInteger(_) {
  return isNumber(_) && (_=+_) === ~~_;
}
