import tape from 'tape';
import {Dataflow, changeset} from 'vega-dataflow';
import {collect as Collect, density as Density} from '../index.js';

tape('Density keeps its output as the pulse source when nothing changes', t => {
  var df = new Dataflow(),
      col = df.add(Collect),
      den = df.add(Density, {
        distribution: {function: 'normal'},
        extent: [-1, 1],
        steps: 10,
        pulse: col
      });

  df.pulse(col, changeset().insert([{v:1}])).run();
  const n = den.value.length;
  df.pulse(col, changeset()).run();
  t.equal(den.pulse.source, den.value);
  t.equal(den.pulse.source.length, n);

  t.end();
});
