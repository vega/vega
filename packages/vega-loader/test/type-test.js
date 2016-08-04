var tape = require('tape'),
    d3 = require('d3-time-format'),
    vega = require('../'),
    inferType = vega.inferType,
    inferTypes = vega.inferTypes,
    typeParsers = vega.typeParsers;

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

tape('inferType should infer booleans', function(test) {
  test.equal(inferType(['true', 'false', NaN, null]), 'boolean');
  test.equal(inferType([true, false, null]), 'boolean');
  test.end();
});

tape('inferType should infer integers', function(test) {
  test.equal(inferType(['0', '1', null, '3', NaN, undefined, '-5']), 'integer');
  test.equal(inferType([1, 2, 3]), 'integer');
  test.end();
});

tape('inferType should infer numbers', function(test) {
  test.equal(inferType(['0', '1', null, '3.1415', NaN, 'Infinity', '1e-5']), 'number');
  test.equal(inferType([1, 2.2, 3]), 'number');
  test.end();
});

tape('inferType should infer dates', function(test) {
  test.equal(inferType(['1/1/2001', null, NaN, 'Jan 5, 2001']), 'date');
  test.equal(inferType([new Date('1/1/2001'), null, new Date('Jan 5, 2001')]), 'date');
  test.end();
});

tape('inferType should infer strings when all else fails', function(test) {
  test.equal(inferType(['hello', '', '1', 'true', null]), 'string');
  test.end();
});

tape('inferType should handle fields', function(test) {
  var data = [
    {a:'1', b:'true'},
    {a:'2', b:'false'},
    {a:'3', b:null}
  ];
  test.equal(inferType(data, 'a'), 'integer');
  test.equal(inferType(data, 'b'), 'boolean');
  test.end();
});

tape('inferTypes should infer types for all fields', function(test) {
  test.deepEqual(inferTypes(data, fields), types);
  test.deepEqual(inferTypes(strings, fields), types);
  test.end();
});

tape('type parsers should parse booleans', function(test) {
  test.equal(typeParsers.boolean('true'), true);
  test.equal(typeParsers.boolean('false'), false);
  test.equal(typeParsers.boolean(null), null);
  test.end();
});

tape('type parsers should parse numbers', function(test) {
  test.equal(typeParsers.number('1'), 1);
  test.equal(typeParsers.number('3.14'), 3.14);
  test.equal(typeParsers.number('1e2'), 100);
  test.equal(typeParsers.number(null), null);
  test.end();
});

tape('type parsers should parse date', function(test) {
  test.equal(+typeParsers.date('1/1/2000'), +(new Date(2000, 0, 1)));
  test.equal(typeParsers.date(null), null);
  test.end();
});

tape('type parsers should parse date with format', function(test) {
  test.equal(
    +typeParsers.date('18.07.1990', d3.timeParse('%d.%m.%Y')),
    +(new Date(1990, 6, 18))
  );
  test.equal(
    +typeParsers.date('07.18.1990', d3.timeParse('%m.%d.%Y')),
    +(new Date(1990, 6, 18))
  );
  test.equal(typeParsers.date(null, '%d.%m.%Y'), null);
  test.end();
});

tape('type parsers should parse strings', function(test) {
  test.equal(typeParsers.string('a'), 'a');
  test.equal(typeParsers.string('bb'), 'bb');
  test.equal(typeParsers.string(''), null);
  test.equal(typeParsers.string(null), null);
  test.end();
});
