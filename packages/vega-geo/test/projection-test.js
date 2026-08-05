import tape from 'tape';
import { Dataflow } from 'vega-dataflow';
import { graticule as Graticule, projection as Projection } from '../index.js';

tape('Projection transform fits parameters to GeoJSON data', t => {
  var df = new Dataflow(),
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
  var df = new Dataflow(),
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
