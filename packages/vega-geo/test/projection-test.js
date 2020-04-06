const tape = require('tape');
const vega = require('vega-dataflow');
const geo = require('../');
const Graticule = geo.graticule;
const Projection = geo.projection;

tape('Projection transform fits parameters to GeoJSON data', function (t) {
  const df = new vega.Dataflow();
  const gr = df.add(Graticule);
  const pr = df.add(Projection, {
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

tape('Projection transform handles fit input with null data', function (t) {
  const df = new vega.Dataflow();
  const gr = df.add(Graticule);
  const pr = df.add(Projection, {
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
