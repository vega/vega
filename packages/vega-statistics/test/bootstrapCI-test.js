import tape from 'tape';
import { bootstrapCI } from '../index.js';

tape('bootstrapCI returns array of undefined for empty data', t => {
  const ci = bootstrapCI([], 1000, 0.05);
  t.deepEqual(ci, [undefined, undefined]);
  t.end();
});
