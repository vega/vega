import tape from 'tape';
import * as vega from '../index.js';

tape('scheme registers a single color scheme', t => {
  var name = 'rgb',
      colors = ['#f00', '#0f0', '#00f'];

  t.equal(vega.scheme(name), undefined);
  vega.scheme(name, colors);
  t.deepEqual(vega.scheme(name), colors);
  t.end();
});
