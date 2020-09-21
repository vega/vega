var tape = require('tape'),
    vega = require('vega-dataflow'),
    geo = require('../'),
    Graticule = geo.graticule,
    Projection = geo.projection;

var earthquakes = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [-118.6671667, 34.4945, 26.49]}
    },
    {
      type: 'Feature',
      geometry: {type: 'Point', coordinates: [-118.0873333, 34.12, 9.72]}
    }
  ]
};

tape('Projection transform auto fits parameters to GeoJSON data', t => {
  var df = new vega.Dataflow(),
      pr = df.add(Projection, {
        type: 'orthographic',
        fit: earthquakes
      });

  df.run();

  var proj = pr.value;
  t.equal(Math.round(proj.scale()), 250);
  t.equal(Math.round(proj.translate()[0]), 480);
  t.equal(Math.round(proj.translate()[1]), 250);
  t.equal(+proj.rotate()[0].toFixed(2), 118.38);
  t.equal(+proj.rotate()[1].toFixed(2), -34.31);

  t.end();
});

tape('Projection transform allows overriding rotation when auto fitting parameters to GeoJSON data', t => {
  var df = new vega.Dataflow(),
      pr = df.add(Projection, {
        type: 'orthographic',
        fit: earthquakes,
        rotate: [0, 0]
      });

  df.run();

  var proj = pr.value;
  t.equal(Math.round(proj.scale()), 250);
  t.equal(Math.round(proj.translate()[0]), 480);
  t.equal(Math.round(proj.translate()[1]), 250);
  t.equal(+proj.rotate()[0].toFixed(2), 0);
  t.equal(+proj.rotate()[1].toFixed(2), 0);

  t.end();
});

tape('Projection transform auto fits parameters with graticlue and sphere GeoJSON data', t => {
  var df = new vega.Dataflow(),
      gr = df.add(Graticule),
      pr = df.add(Projection, {
        type: 'orthographic',
        size: [500, 500],
        fit: [gr, {type: 'Sphere'}]
      });

  df.run();

  var proj = pr.value;
  t.equal(Math.round(proj.scale()), 250);
  t.equal(Math.round(proj.translate()[0]), 250);
  t.equal(Math.round(proj.translate()[1]), 250);
  t.equal(+proj.rotate()[0].toFixed(2), 14.15);
  t.equal(+proj.rotate()[1].toFixed(2), -90);

  t.end();
});

tape('Projection transform auto fits parameters with null data', t => {
  var df = new vega.Dataflow(),
      gr = df.add(Graticule),
      pr = df.add(Projection, {
        type: 'orthographic',
        size: [500, 500],
        fit: [[null], gr, {type: 'Sphere'}]
      });

  df.run();

  var proj = pr.value;
  t.equal(Math.round(proj.scale()), 250);
  t.equal(Math.round(proj.translate()[0]), 250);
  t.equal(Math.round(proj.translate()[1]), 250);
  t.equal(+proj.rotate()[0].toFixed(2), 14.15);
  t.equal(+proj.rotate()[1].toFixed(2), -90);

  t.end();
});
