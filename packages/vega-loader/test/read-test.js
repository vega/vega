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

tape('JSON reader should read json data', function(t) {
  t.deepEqual(read(json), data);
  t.deepEqual(read(json, {type:'json'}), data);
  t.end();
});

tape('JSON reader should parse json fields', function(t) {
  t.deepEqual(read(data, {type:'json', parse: types}), parsed);
  t.deepEqual(read(json, {type:'json', parse: types}), parsed);
  t.end();
});

tape('JSON reader should auto-parse json fields', function(t) {
  t.deepEqual(read(data, {type:'json', parse:'auto'}), parsed);
  t.deepEqual(read(json, {type:'json', parse:'auto'}), parsed);
  t.end();
});

tape('JSON reader should read json from property', function(t) {
  var json = JSON.stringify({foo: data});
  t.deepEqual(read(json, {type:'json', property:'foo'}), data);
  t.end();
});

tape('JSON reader should parse date with format %d.%m.%Y', function(t) {
  var expected = function() { return [{foo: new Date(1990, 6, 18)}]; },
      input = function() { return [{foo: '18.07.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%d.%m.%Y'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "date:'%d.%m.%Y'"};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'date:"%d.%m.%Y"'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  t.end();
});

tape('JSON reader should parse date with format %m.%d.%Y', function(t) {
  var expected = function() { return [{foo: new Date(1990, 6, 18)}]; },
      input = function() { return [{foo: '07.18.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%m.%d.%Y'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "date:'%m.%d.%Y'"};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'date:"%m.%d.%Y"'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  t.end();
});

tape('JSON reader should parse time with format %H:%M', function(t) {
  var expected = function() { return [{foo: new Date(1900, 0, 1, 13, 15)}]; },
      input = function() { return [{foo: '13:15'}]; },
      types;

  // unquoted pattern
  types = {foo: 'date:%H:%M'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "date:'%H:%M'"};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'date:"%H:%M"'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  t.end();
});

tape('JSON reader should parse date with custom parse function', function(t) {
  var expected = [{foo: new Date(2000, 1, 1)}],
      input = [{foo: '18.07.1990'}],
      types = {foo: 'date:custom'};

  function dateParse() {
    return function() { return new Date(2000, 1, 1); }
  }

  t.deepEqual(read(input, {type:'json', parse: types}, dateParse), expected);
  t.end();
});

tape('JSON reader should parse UTC date with format %d.%m.%Y', function(t) {
  var expected = function() { return [{foo: new Date(Date.UTC(1990, 6, 18))}]; },
      input = function() { return [{foo: '18.07.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%d.%m.%Y'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "utc:'%d.%m.%Y'"};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'utc:"%d.%m.%Y"'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  t.end();
});

tape('JSON reader should parse UTC date with format %m.%d.%Y', function(t) {
  var expected = function() { return [{foo: new Date(Date.UTC(1990, 6, 18))}]; },
      input = function() { return [{foo: '07.18.1990'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%m.%d.%Y'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "utc:'%m.%d.%Y'"};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'utc:"%m.%d.%Y"'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  t.end();
});

tape('JSON reader should parse UTC time with format %H:%M', function(t) {
  var expected = function() { return [{foo: new Date(Date.UTC(1900, 0, 1, 13, 15))}]; },
      input = function() { return [{foo: '13:15'}]; },
      types;

  // unquoted pattern
  types = {foo: 'utc:%H:%M'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // single quoted pattern
  types = {foo: "utc:'%H:%M'"};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  // double quoted pattern
  types = {foo: 'utc:"%H:%M"'};
  t.deepEqual(read(input(), {type:'json', parse: types}), expected());

  t.end();
});

tape('JSON reader should throw error if format is unrecognized', function(t) {
  var input = [{foo: '18.07.1990'}],
      types = {foo: 'notAFormat'};
  t.throws(function() { read(input, {type:'json', parse: types}); });
  t.end();
});

// CSV

var csv = toDelimitedText(data, ',');

tape('CSV reader should read csv data', function(t) {
  t.deepEqual(read(csv, {type:'csv'}), strings);
  t.deepEqual(read('', {type:'csv'}), []);
  t.end();
});

tape('CSV reader should parse csv fields', function(t) {
  t.deepEqual(read(csv, {type:'csv', parse:types}), parsed);
  t.end();
});

tape('CSV reader should auto-parse csv fields', function(t) {
  t.deepEqual(read(csv, {type:'csv', parse:'auto'}), parsed);
  t.end();
});

// TSV

var tsv = toDelimitedText(data, '\t');

tape('TSV reader should read tsv data', function(t) {
  t.deepEqual(read(tsv, {type:'tsv'}), strings);
  t.deepEqual(read('', {type:'tsv'}), []);
  t.end();
});

tape('TSV reader should parse tsv fields', function(t) {
  t.deepEqual(read(tsv, {type:'tsv', parse:types}), parsed);
  t.end();
});

tape('TSV reader should auto-parse tsv fields', function(t) {
  t.deepEqual(read(tsv, {type:'tsv', parse:'auto'}), parsed);
  t.end();
});

// // DSV

var psv = toDelimitedText(data, '|');

tape('DSV reader should read dsv data', function(t) {
  t.deepEqual(read(psv, {type:'dsv', delimiter:'|'}), strings);
  t.deepEqual(read('', {type:'dsv', delimiter:'|'}), []);
  t.end();
});

tape('DSV reader should accept header parameter', function(t) {
  var body = psv.slice(psv.indexOf('\n')+1);
  t.deepEqual(read(body, {
    type: 'dsv',
    delimiter: '|',
    header: fields
  }), strings);
  t.end();
});

tape('DSV reader should parse dsv fields', function(t) {
  t.deepEqual(read(psv, {type:'dsv', delimiter:'|', parse:types}), parsed);
  t.end();
});

tape('DSV reader should auto-parse dsv fields', function(t) {
  t.deepEqual(read(psv, {type:'dsv', delimiter:'|', parse:'auto'}), parsed);
  t.end();
});

// TopoJSON

var worldText = require('fs').readFileSync('./test/data/world-110m.json', 'utf8');
var world = JSON.parse(worldText);

tape('TopoJSON reader should read TopoJSON mesh', function(t) {
  var mesh = read(worldText, {type:'topojson', mesh: 'countries'});
  var tj = topojson.mesh(world, world.objects['countries']);
  t.equal(JSON.stringify(tj), JSON.stringify(mesh[0]));
  t.end();
});

tape('TopoJSON reader should read TopoJSON mesh interior', function(t) {
  var mesh = read(worldText, {type:'topojson', mesh: 'countries', filter: 'interior'});
  var tj = topojson.mesh(world, world.objects['countries'], (a, b) => a !== b);
  t.equal(JSON.stringify(tj), JSON.stringify(mesh[0]));
  t.end();
});

tape('TopoJSON reader should read TopoJSON mesh exterior', function(t) {
  var mesh = read(worldText, {type:'topojson', mesh: 'countries', filter: 'exterior'});
  var tj = topojson.mesh(world, world.objects['countries'], (a, b) => a === b);
  t.equal(JSON.stringify(tj), JSON.stringify(mesh[0]));
  t.end();
});

tape('TopoJSON reader should read TopoJSON feature', function(t) {
  var feature = read(worldText, {type:'topojson', feature: 'countries'});
  var tj = topojson.feature(world, world.objects['countries']).features;
  t.equal(JSON.stringify(tj), JSON.stringify(feature));
  t.end();
});

tape('TopoJSON reader should throw error if TopoJSON is invalid', function(t) {
  var data = {objects: {}};
  t.throws(function() { read(data, {type:'topojson', feature: 'countries'}); });
  t.throws(function() { read(data, {type:'topojson', mesh: 'countries'}); });
  t.end();
});

tape('TopoJSON reader should throw error if TopoJSON parameters are missing', function(t) {
  t.throws(function() { read(worldText, {type:'topojson'}); });
  t.end();
});
