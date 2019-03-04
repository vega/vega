var topojson = require('topojson-client'), vega = require('../'), read = vega.read;

var fields = ['a', 'b', 'c', 'd', 'e'];

var data = [
  {a:1, b:'aaa', c:true,  d:'1/1/2001', e:1.2},
  {a:2, b:'bbb', c:false, d:'1/2/2001', e:3.4},
  {a:3, b:'ccc', c:false, d:'1/3/2001', e:5.6},
  {a:4, b:'ddd', c:true,  d:'1/4/2001', e:7.8}
];

var parsed = [
  {a:1, b:'aaa', c:true,  d:Date.parse('1/1/2001'), e:1.2},
  {a:2, b:'bbb', c:false, d:Date.parse('1/2/2001'), e:3.4},
  {a:3, b:'ccc', c:false, d:Date.parse('1/3/2001'), e:5.6},
  {a:4, b:'ddd', c:true,  d:Date.parse('1/4/2001'), e:7.8}
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

function toDelimitedText(data, delimiter) {
  var head = fields.join(delimiter);
  var body = data.map(function(row) {
    return fields.map(function(f) {
      var v = row[f];
      return typeof v === 'string' ? ('"'+v+'"') : v;
    }).join(delimiter);
  });
  return head + '\n' + body.join('\n');
}

// JSON

var json = JSON.stringify(data);

test('JSON reader should read json data', function() {
  expect(read(json)).toEqual(data);
  expect(read(json, {type:'json'})).toEqual(data);
});

test('JSON reader should parse json fields', function() {
  expect(read(data, {type:'json', parse: types})).toEqual(parsed);
  expect(read(json, {type:'json', parse: types})).toEqual(parsed);
});

test('JSON reader should auto-parse json fields', function() {
  expect(read(data, {type:'json', parse:'auto'})).toEqual(parsed);
  expect(read(json, {type:'json', parse:'auto'})).toEqual(parsed);
});

test('JSON reader should read json from property', function() {
  var json = JSON.stringify({foo: data});
  expect(read(json, {type:'json', property:'foo'})).toEqual(data);
});

test('JSON reader should parse date with format %d.%m.%Y', function() {
  var expected = function() { return [{foo: new Date(1990, 6, 18)}]; },
      input = function() { return [{foo: '18.07.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%d.%m.%Y'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // single quoted pattern
  types = {foo: "date:'%d.%m.%Y'"};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // double quoted pattern
  types = {foo: 'date:"%d.%m.%Y"'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());
});

test('JSON reader should parse date with format %m.%d.%Y', function() {
  var expected = function() { return [{foo: new Date(1990, 6, 18)}]; },
      input = function() { return [{foo: '07.18.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%m.%d.%Y'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // single quoted pattern
  types = {foo: "date:'%m.%d.%Y'"};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // double quoted pattern
  types = {foo: 'date:"%m.%d.%Y"'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());
});

test('JSON reader should parse time with format %H:%M', function() {
  var expected = function() { return [{foo: new Date(1900, 0, 1, 13, 15)}]; },
      input = function() { return [{foo: '13:15'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%H:%M'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // single quoted pattern
  types = {foo: "date:'%H:%M'"};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // double quoted pattern
  types = {foo: 'date:"%H:%M"'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());
});

test('JSON reader should parse date with custom parse function', function() {
  var expected = [{foo: new Date(2000, 1, 1)}],
      input = [{foo: '18.07.1990'}],
      types = {foo: 'date:custom'};

  function dateParse() {
    return function() { return new Date(2000, 1, 1); }
  }

  expect(read(input, {type:'json', parse: types}, dateParse)).toEqual(expected);
});

test('JSON reader should parse UTC date with format %d.%m.%Y', function() {
  var expected = function() { return [{foo: new Date(Date.UTC(1990, 6, 18))}]; },
      input = function() { return [{foo: '18.07.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%d.%m.%Y'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // single quoted pattern
  types = {foo: "utc:'%d.%m.%Y'"};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // double quoted pattern
  types = {foo: 'utc:"%d.%m.%Y"'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());
});

test('JSON reader should parse UTC date with format %m.%d.%Y', function() {
  var expected = function() { return [{foo: new Date(Date.UTC(1990, 6, 18))}]; },
      input = function() { return [{foo: '07.18.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%m.%d.%Y'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // single quoted pattern
  types = {foo: "utc:'%m.%d.%Y'"};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // double quoted pattern
  types = {foo: 'utc:"%m.%d.%Y"'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());
});

test('JSON reader should parse UTC time with format %H:%M', function() {
  var expected = function() { return [{foo: new Date(Date.UTC(1900, 0, 1, 13, 15))}]; },
      input = function() { return [{foo: '13:15'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%H:%M'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // single quoted pattern
  types = {foo: "utc:'%H:%M'"};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());

  // double quoted pattern
  types = {foo: 'utc:"%H:%M"'};
  expect(read(input(), {type:'json', parse: types})).toEqual(expected());
});

test('JSON reader should throw error if format is unrecognized', function() {
  var input = [{foo: '18.07.1990'}],
      types = {foo: 'notAFormat'};
  expect(function() { read(input, {type:'json', parse: types}); }).toThrow();
});

// CSV

var csv = toDelimitedText(data, ',');

test('CSV reader should read csv data', function() {
  expect(read(csv, {type:'csv'})).toEqual(strings);
  expect(read('', {type:'csv'})).toEqual([]);
});

test('CSV reader should parse csv fields', function() {
  expect(read(csv, {type:'csv', parse:types})).toEqual(parsed);
});

test('CSV reader should auto-parse csv fields', function() {
  expect(read(csv, {type:'csv', parse:'auto'})).toEqual(parsed);
});

// TSV

var tsv = toDelimitedText(data, '\t');

test('TSV reader should read tsv data', function() {
  expect(read(tsv, {type:'tsv'})).toEqual(strings);
  expect(read('', {type:'tsv'})).toEqual([]);
});

test('TSV reader should parse tsv fields', function() {
  expect(read(tsv, {type:'tsv', parse:types})).toEqual(parsed);
});

test('TSV reader should auto-parse tsv fields', function() {
  expect(read(tsv, {type:'tsv', parse:'auto'})).toEqual(parsed);
});

// // DSV

var psv = toDelimitedText(data, '|');

test('DSV reader should read dsv data', function() {
  expect(read(psv, {type:'dsv', delimiter:'|'})).toEqual(strings);
  expect(read('', {type:'dsv', delimiter:'|'})).toEqual([]);
});

test('DSV reader should accept header parameter', function() {
  var body = psv.slice(psv.indexOf('\n')+1);
  expect(read(body, {
    type: 'dsv',
    delimiter: '|',
    header: fields
  })).toEqual(strings);
});

test('DSV reader should parse dsv fields', function() {
  expect(read(psv, {type:'dsv', delimiter:'|', parse:types})).toEqual(parsed);
});

test('DSV reader should auto-parse dsv fields', function() {
  expect(read(psv, {type:'dsv', delimiter:'|', parse:'auto'})).toEqual(parsed);
});

// TopoJSON

var worldText = require('fs').readFileSync('./test/data/world-110m.json', 'utf8');
var world = JSON.parse(worldText);

test('TopoJSON reader should read TopoJSON mesh', function() {
  var mesh = read(worldText, {type:'topojson', mesh: 'countries'});
  var tj = topojson.mesh(world, world.objects['countries']);
  expect(JSON.stringify(tj)).toBe(JSON.stringify(mesh[0]));
});

test('TopoJSON reader should read TopoJSON feature', function() {
  var feature = read(worldText, {type:'topojson', feature: 'countries'});
  var tj = topojson.feature(world, world.objects['countries']).features;
  expect(JSON.stringify(tj)).toBe(JSON.stringify(feature));
});

test('TopoJSON reader should throw error if TopoJSON is invalid', function() {
  var data = {objects: {}};
  expect(function() { read(data, {type:'topojson', feature: 'countries'}); }).toThrow();
  expect(function() { read(data, {type:'topojson', mesh: 'countries'}); }).toThrow();
});

test('TopoJSON reader should throw error if TopoJSON parameters are missing', function() {
  expect(function() { read(worldText, {type:'topojson'}); }).toThrow();
});
