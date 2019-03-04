var d3 = require('d3-time-format'), vega = require('../'), inferType = vega.inferType, inferTypes = vega.inferTypes, typeParsers = vega.typeParsers;

var fields = ['a', 'b', 'c', 'd', 'e'];

var data = [
  {a:1, b:'aaa', c:true,  d:'1/1/2001', e:1.2},
  {a:2, b:'bbb', c:false, d:'1/2/2001', e:3.4},
  {a:3, b:'ccc', c:false, d:'1/3/2001', e:5.6},
  {a:4, b:'ddd', c:true,  d:'1/4/2001', e:7.8}
];

var strings = [
  {a:'1', b:'aaa', c:'true',  d:'1/1/2001', e:'1.2'},
  {a:'2', b:'bbb', c:'false', d:'1/2/2001', e:'3.4'},
  {a:'3', b:'ccc', c:'false', d:'1/3/2001', e:'5.6'},
  {a:'4', b:'ddd', c:'true',  d:'1/4/2001', e:'7.8'}
];

var types = {
  a: 'integer',
  b: 'string',
  c: 'boolean',
  d: 'date',
  e: 'number'
};

test('inferType should infer booleans', function() {
  expect(inferType(['true', 'false', NaN, null])).toBe('boolean');
  expect(inferType([true, false, null])).toBe('boolean');
});

test('inferType should infer integers', function() {
  expect(inferType(['0', '1', null, '3', NaN, undefined, '-5'])).toBe('integer');
  expect(inferType([1, 2, 3])).toBe('integer');
});

test('inferType should infer numbers', function() {
  expect(inferType(['0', '1', null, '3.1415', NaN, 'Infinity', '1e-5'])).toBe('number');
  expect(inferType([1, 2.2, 3])).toBe('number');
});

test('inferType should infer dates', function() {
  expect(inferType(['1/1/2001', null, NaN, 'Jan 5, 2001'])).toBe('date');
  expect(inferType([new Date('1/1/2001'), null, new Date('Jan 5, 2001')])).toBe('date');
});

test('inferType should infer strings when all else fails', function() {
  expect(inferType(['hello', '', '1', 'true', null])).toBe('string');
});

test('inferType should handle fields', function() {
  var data = [
    {a:'1', b:'true'},
    {a:'2', b:'false'},
    {a:'3', b:null}
  ];
  expect(inferType(data, 'a')).toBe('integer');
  expect(inferType(data, 'b')).toBe('boolean');
});

test('inferTypes should infer types for all fields', function() {
  expect(inferTypes(data, fields)).toEqual(types);
  expect(inferTypes(strings, fields)).toEqual(types);
});

test('type parsers should parse booleans', function() {
  expect(typeParsers.boolean('true')).toBe(true);
  expect(typeParsers.boolean('false')).toBe(false);
  expect(typeParsers.boolean(null)).toBe(null);
});

test('type parsers should parse numbers', function() {
  expect(typeParsers.number('1')).toBe(1);
  expect(typeParsers.number('3.14')).toBe(3.14);
  expect(typeParsers.number('1e2')).toBe(100);
  expect(typeParsers.number(null)).toBe(null);
});

test('type parsers should parse date', function() {
  expect(+typeParsers.date('1/1/2000')).toBe(+(new Date(2000, 0, 1)));
  expect(typeParsers.date(null)).toBe(null);
});

test('type parsers should parse date with format', function() {
  expect(+typeParsers.date('18.07.1990', d3.timeParse('%d.%m.%Y'))).toBe(+(new Date(1990, 6, 18)));
  expect(+typeParsers.date('07.18.1990', d3.timeParse('%m.%d.%Y'))).toBe(+(new Date(1990, 6, 18)));
  expect(typeParsers.date(null, '%d.%m.%Y')).toBe(null);
});

test('type parsers should parse strings', function() {
  expect(typeParsers.string('a')).toBe('a');
  expect(typeParsers.string('bb')).toBe('bb');
  expect(typeParsers.string('')).toBe(null);
  expect(typeParsers.string(null)).toBe(null);
});
