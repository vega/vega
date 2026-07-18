import tape from 'tape';
import functions from '../src/functions.js';

tape('Date', t => {
  t.equal(functions.datetime(2025).getDate(), new Date(2025, 0, 1, 0, 0, 0, 0).getDate());
  t.equal(functions.datetime('2005-08-01T00:00:00').getDate(), new Date(2025, 8, 1, 0, 0, 0, 0).getDate());
  t.end();
});
