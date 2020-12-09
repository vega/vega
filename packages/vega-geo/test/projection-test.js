var tape = require('tape'),
    vega = require('vega-dataflow'),
    geo = require('../'),
    Graticule = geo.graticule,
    Projection = geo.projection;

tape('Projection transform fits parameters to GeoJSON data', t => {
  var df = new vega.Dataflow(),
      gr = df.add(Graticule),
      pr = df.add(Projection, {
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
  var df = new vega.Dataflow(),
      gr = df.add(Graticule),
      pr = df.add(Projection, {
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
