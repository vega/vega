import tape from 'tape';
import {Dataflow} from 'vega-dataflow';
import {multiextent as MultiExtent} from '../index.js';

tape('MultiExtent combines extents', t => {
  var df = new Dataflow(),
      e = df.add([10, 50]),
      m = df.add(MultiExtent, {extents: [
        [-5, 0], [0, 20], e
      ]});

  t.equal(m.value, null);

  df.run();
  t.deepEqual(m.value, [-5, 50]);

  df.update(e, [0, 1]).run();
  t.deepEqual(m.value, [-5, 20]);

  t.end();
});
