var tape = require('tape');
var vega = require('vega-dataflow');
var geo = require('../');
var Graticule = geo.graticule;
var Projection = geo.projection;

tape('Projection transform fits parameters to GeoJSON data', t => {
  var df = new vega.Dataflow();
  var gr = df.add(Graticule);

  var pr = df.add(Projection, {
    type: 'orthographic',
    size: [500, 500],
    fit: [gr, {type: 'Sphere'}]
  });

  df.run();

  const proj = pr.value;
  t.equal(proj.scale(), 250);
  t.equal(Math.round(proj.translate()[0]), 250);
  t.equal(Math.round(proj.translate()[1]), 250);

  t.end();
});

tape('Projection transform handles fit input with null data', t => {
  var df = new vega.Dataflow();
  var gr = df.add(Graticule);

  var pr = df.add(Projection, {
    type: 'orthographic',
    size: [500, 500],
    fit: [[null], gr, {type: 'Sphere'}]
  });

  df.run();

  const proj = pr.value;
  t.equal(proj.scale(), 250);
  t.equal(Math.round(proj.translate()[0]), 250);
  t.equal(Math.round(proj.translate()[1]), 250);

  t.end();
});
