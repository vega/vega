import tape from 'tape';
import * as vega from '../index.js';

tape('ingest wraps primitive values and dates', t => {
  const date = new Date(2020, 0, 1);
  const tuple = vega.ingest(date);
  t.notEqual(tuple, date);
  t.equal(tuple.data, date);
  t.equal(vega.ingest(5).data, 5);
  t.equal(vega.ingest('a').data, 'a');
  t.end();
});

tape('ingest keeps objects as tuples', t => {
  const object = {value: 1};
  t.equal(vega.ingest(object), object);
  t.ok(vega.tupleid(object));
  t.end();
});
