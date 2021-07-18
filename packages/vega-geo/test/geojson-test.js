var tape = require('tape');
var vega = require('vega-dataflow');
var util = require('vega-util');
var GeoJSON = require('../').geojson;
var Collect = require('vega-transforms').collect;

function geodata() {
  return [
    {lon: 0, lat: 1, geo: {type: 'Feature', id: 0}},
    {lon: 2, lat: 3, geo: {type: 'Feature', id: 1}},
    {lon: 4, lat: 5, geo: {type: 'Feature', id: 2}}
  ];
}

tape('GeoJSON transform consolidates lon/lat data', t => {
  const data = geodata();

  var df = new vega.Dataflow();
  var lon = util.field('lon');
  var lat = util.field('lat');
  var col = df.add(Collect);
  var gj = df.add(GeoJSON, {fields: [lon, lat], pulse: col});

  df.pulse(col, df.changeset().insert([data[0], data[1]])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[[0,1],[2,3]]}}]}');

  df.pulse(col, df.changeset().insert(data[2])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[[0,1],[2,3],[4,5]]}}]}');

  df.pulse(col, df.changeset().remove(data[0])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[[2,3],[4,5]]}}]}');

  t.end();
});

tape('GeoJSON transform consolidates geojson data', t => {
  const data = geodata();

  var df = new vega.Dataflow();
  var geo = util.field('geo');
  var col = df.add(Collect);
  var gj = df.add(GeoJSON, {geojson: geo, pulse: col});

  df.pulse(col, df.changeset().insert([data[0], data[1]])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","id":0},{"type":"Feature","id":1}]}');

  df.pulse(col, df.changeset().insert(data[2])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","id":0},{"type":"Feature","id":1},{"type":"Feature","id":2}]}');

  df.pulse(col, df.changeset().remove(data[0])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","id":1},{"type":"Feature","id":2}]}');

  t.end();
});

tape('GeoJSON transform consolidates both lon/lat and geojson data', t => {
  const data = geodata();

  var df = new vega.Dataflow();
  var lon = util.field('lon');
  var lat = util.field('lat');
  var geo = util.field('geo');
  var col = df.add(Collect);
  var gj = df.add(GeoJSON, {fields: [lon, lat], geojson: geo, pulse: col});

  df.pulse(col, df.changeset().insert([data[0], data[1]])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","id":0},{"type":"Feature","id":1},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[[0,1],[2,3]]}}]}');

  df.pulse(col, df.changeset().insert(data[2])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","id":0},{"type":"Feature","id":1},{"type":"Feature","id":2},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[[0,1],[2,3],[4,5]]}}]}');

  df.pulse(col, df.changeset().remove(data[0])).run();
  t.equal(JSON.stringify(gj.value),
    '{"type":"FeatureCollection","features":[{"type":"Feature","id":1},{"type":"Feature","id":2},{"type":"Feature","geometry":{"type":"MultiPoint","coordinates":[[2,3],[4,5]]}}]}');

  t.end();
});
