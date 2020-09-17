var tape = require('tape'),
    d3 = require('d3-time-format'),
    vega = require('../'),
    inferType = vega.inferType,
    inferTypes = vega.inferTypes,
    typeParsers = vega.typeParsers;

const fields = ['a', 'b', 'c', 'd', 'e'];

const data = [
  {a:1, b:'aaa', c:true,  d:'1/1/2001', e:1.2},
  {a:2, b:'bbb', c:false, d:'1/2/2001', e:3.4},
  {a:3, b:'ccc', c:false, d:'1/3/2001', e:5.6},
  {a:4, b:'ddd', c:true,  d:'1/4/2001', e:7.8}
];

const strings = [
  {a:'1', b:'aaa', c:'true',  d:'1/1/2001', e:'1.2'},
  {a:'2', b:'bbb', c:'false', d:'1/2/2001', e:'3.4'},
  {a:'3', b:'ccc', c:'false', d:'1/3/2001', e:'5.6'},
  {a:'4', b:'ddd', c:'true',  d:'1/4/2001', e:'7.8'}
];

const types = {
  a: 'integer',
  b: 'string',
  c: 'boolean',
  d: 'date',
  e: 'number'
};

tape('inferType should infer booleans', t => {
  t.equal(inferType(['true', 'false', NaN, null]), 'boolean');
  t.equal(inferType([true, false, null]), 'boolean');
  t.end();
});

tape('inferType should infer integers', t => {
  t.equal(inferType(['0', '1', null, '3', NaN, undefined, '-5']), 'integer');
  t.equal(inferType([1, 2, 3]), 'integer');
  t.end();
});

tape('inferType should infer numbers', t => {
  t.equal(inferType(['0', '1', null, '3.1415', NaN, 'Infinity', '1e-5']), 'number');
  t.equal(inferType([1, 2.2, 3]), 'number');
  t.end();
});

tape('inferType should infer dates', t => {
  t.equal(inferType(['1/1/2001', null, NaN, 'Jan 5, 2001']), 'date');
  t.equal(inferType([new Date('1/1/2001'), null, new Date('Jan 5, 2001')]), 'date');
  t.end();
});

tape('inferType should infer strings when all else fails', t => {
  t.equal(inferType(['hello', '', '1', 'true', null]), 'string');
  t.end();
});

tape('inferType should handle fields', t => {
  const data = [
    {a:'1', b:'true'},
    {a:'2', b:'false'},
    {a:'3', b:null}
  ];
  t.equal(inferType(data, 'a'), 'integer');
  t.equal(inferType(data, 'b'), 'boolean');
  t.end();
});

tape('inferTypes should infer types for all fields', t => {
  t.deepEqual(inferTypes(data, fields), types);
  t.deepEqual(inferTypes(strings, fields), types);
  t.end();
});

tape('type parsers should parse booleans', t => {
  t.equal(typeParsers.boolean('true'), true);
  t.equal(typeParsers.boolean('false'), false);
  t.equal(typeParsers.boolean(null), null);
  t.end();
});

tape('type parsers should parse numbers', t => {
  t.equal(typeParsers.number('1'), 1);
  t.equal(typeParsers.number('3.14'), 3.14);
  t.equal(typeParsers.number('1e2'), 100);
  t.equal(typeParsers.number(null), null);
  t.end();
});

tape('type parsers should parse date', t => {
  t.equal(+typeParsers.date('1/1/2000'), +(new Date(2000, 0, 1)));
  t.equal(typeParsers.date(null), null);
  t.end();
});

tape('type parsers should parse date with format', t => {
  t.equal(
    +typeParsers.date('18.07.1990', d3.timeParse('%d.%m.%Y')),
    +(new Date(1990, 6, 18))
  );
  t.equal(
    +typeParsers.date('07.18.1990', d3.timeParse('%m.%d.%Y')),
    +(new Date(1990, 6, 18))
  );
  t.equal(typeParsers.date(null, '%d.%m.%Y'), null);
  t.end();
});

tape('type parsers should parse strings', t => {
  t.equal(typeParsers.string('a'), 'a');
  t.equal(typeParsers.string('bb'), 'bb');
  t.equal(typeParsers.string(''), null);
  t.equal(typeParsers.string(null), null);
  t.end();
});
