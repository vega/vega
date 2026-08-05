import tape from 'tape';
import { contrast, luminance } from '../index.js';

tape('luminance calculation extremes', t => {
  t.equal(luminance('#000000'), 0);
  t.equal(luminance('#FFFFFF'), 1);
  t.end();
});

tape('contrast calculation extremes', t => {
  t.equal(contrast('black', 'white'), 21);
  t.equal(contrast('black', 'black'), 1);
  t.end();
});
