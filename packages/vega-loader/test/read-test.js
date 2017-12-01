var tape = require('tape'),
    topojson = require('topojson-client'),
    vega = require('../'),
    read = vega.read;

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

tape('JSON reader should read json data', function(test) {
  test.deepEqual(read(json), data);
  test.deepEqual(read(json, {type:'json'}), data);
  test.end();
});

tape('JSON reader should parse json fields', function(test) {
  test.deepEqual(read(data, {type:'json', parse: types}), parsed);
  test.deepEqual(read(json, {type:'json', parse: types}), parsed);
  test.end();
});

tape('JSON reader should auto-parse json fields', function(test) {
  test.deepEqual(read(data, {type:'json', parse:'auto'}), parsed);
  test.deepEqual(read(json, {type:'json', parse:'auto'}), parsed);
  test.end();
});

tape('JSON reader should read json from property', function(test) {
  var json = JSON.stringify({foo: data});
  test.deepEqual(read(json, {type:'json', property:'foo'}), data);
  test.end();
});

tape('JSON reader should parse date with format %d.%m.%Y', function(test) {
  var expected = function() { return [{foo: new Date(1990, 6, 18)}]; },
      input = function() { return [{foo: '18.07.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%d.%m.%Y'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "date:'%d.%m.%Y'"};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'date:"%d.%m.%Y"'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  test.end();
});

tape('JSON reader should parse date with format %m.%d.%Y', function(test) {
  var expected = function() { return [{foo: new Date(1990, 6, 18)}]; },
      input = function() { return [{foo: '07.18.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%m.%d.%Y'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "date:'%m.%d.%Y'"};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'date:"%m.%d.%Y"'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  test.end();
});

tape('JSON reader should parse time with format %H:%M', function(test) {
  var expected = function() { return [{foo: new Date(1900, 0, 1, 13, 15)}]; },
      input = function() { return [{foo: '13:15'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%H:%M'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "date:'%H:%M'"};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'date:"%H:%M"'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  test.end();
});

tape('JSON reader should parse date with custom parse function', function(test) {
  var expected = [{foo: new Date(2000, 1, 1)}],
      input = [{foo: '18.07.1990'}],
      types = {foo: 'date:custom'};

  function dateParse() {
    return function() { return new Date(2000, 1, 1); }
  }

  test.deepEqual(read(input, {type:'json', parse: types}, dateParse), expected);
  test.end();
});

tape('JSON reader should parse UTC date with format %d.%m.%Y', function(test) {
  var expected = function() { return [{foo: new Date(Date.UTC(1990, 6, 18))}]; },
      input = function() { return [{foo: '18.07.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%d.%m.%Y'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "utc:'%d.%m.%Y'"};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'utc:"%d.%m.%Y"'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  test.end();
});

tape('JSON reader should parse UTC date with format %m.%d.%Y', function(test) {
  var expected = function() { return [{foo: new Date(Date.UTC(1990, 6, 18))}]; },
      input = function() { return [{foo: '07.18.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%m.%d.%Y'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "utc:'%m.%d.%Y'"};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'utc:"%m.%d.%Y"'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  test.end();
});

tape('JSON reader should parse UTC time with format %H:%M', function(test) {
  var expected = function() { return [{foo: new Date(Date.UTC(1900, 0, 1, 13, 15))}]; },
      input = function() { return [{foo: '13:15'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%H:%M'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "utc:'%H:%M'"};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'utc:"%H:%M"'};
  test.deepEqual(read(input(), {type:'json', parse: types}), expected());

  test.end();
});

tape('JSON reader should throw error if format is unrecognized', function(test) {
  var input = [{foo: '18.07.1990'}],
      types = {foo: 'notAFormat'};
  test.throws(function() { read(input, {type:'json', parse: types}); });
  test.end();
});

// CSV

var csv = toDelimitedText(data, ',');

tape('CSV reader should read csv data', function(test) {
  test.deepEqual(read(csv, {type:'csv'}), strings);
  test.deepEqual(read('', {type:'csv'}), []);
  test.end();
});

tape('CSV reader should parse csv fields', function(test) {
  test.deepEqual(read(csv, {type:'csv', parse:types}), parsed);
  test.end();
});

tape('CSV reader should auto-parse csv fields', function(test) {
  test.deepEqual(read(csv, {type:'csv', parse:'auto'}), parsed);
  test.end();
});

// TSV

var tsv = toDelimitedText(data, '\t');

tape('TSV reader should read tsv data', function(test) {
  test.deepEqual(read(tsv, {type:'tsv'}), strings);
  test.deepEqual(read('', {type:'tsv'}), []);
  test.end();
});

tape('TSV reader should parse tsv fields', function(test) {
  test.deepEqual(read(tsv, {type:'tsv', parse:types}), parsed);
  test.end();
});

tape('TSV reader should auto-parse tsv fields', function(test) {
  test.deepEqual(read(tsv, {type:'tsv', parse:'auto'}), parsed);
  test.end();
});

// // DSV

var psv = toDelimitedText(data, '|');

tape('DSV reader should read dsv data', function(test) {
  test.deepEqual(read(psv, {type:'dsv', delimiter:'|'}), strings);
  test.deepEqual(read('', {type:'dsv', delimiter:'|'}), []);
  test.end();
});

tape('DSV reader should accept header parameter', function(test) {
  var body = psv.slice(psv.indexOf('\n')+1);
  test.deepEqual(read(body, {
    type: 'dsv',
    delimiter: '|',
    header: fields
  }), strings);
  test.end();
});

tape('DSV reader should parse dsv fields', function(test) {
  test.deepEqual(read(psv, {type:'dsv', delimiter:'|', parse:types}), parsed);
  test.end();
});

tape('DSV reader should auto-parse dsv fields', function(test) {
  test.deepEqual(read(psv, {type:'dsv', delimiter:'|', parse:'auto'}), parsed);
  test.end();
});

// TopoJSON

var worldText = require('fs').readFileSync('./test/data/world-110m.json', 'utf8');
var world = JSON.parse(worldText);

tape('TopoJSON reader should read TopoJSON mesh', function(test) {
  var mesh = read(worldText, {type:'topojson', mesh: 'countries'});
  var tj = topojson.mesh(world, world.objects['countries']);
  test.equal(JSON.stringify(tj), JSON.stringify(mesh[0]));
  test.end();
});

tape('TopoJSON reader should read TopoJSON feature', function(test) {
  var feature = read(worldText, {type:'topojson', feature: 'countries'});
  var tj = topojson.feature(world, world.objects['countries']).features;
  test.equal(JSON.stringify(tj), JSON.stringify(feature));
  test.end();
});

tape('TopoJSON reader should throw error if TopoJSON is invalid', function(test) {
  var data = {objects: {}};
  test.throws(function() { read(data, {type:'topojson', feature: 'countries'}); });
  test.throws(function() { read(data, {type:'topojson', mesh: 'countries'}); });
  test.end();
});

tape('TopoJSON reader should throw error if TopoJSON parameters are missing', function(test) {
  test.throws(function() { read(worldText, {type:'topojson'}); });
  test.end();
});
