import tape from 'tape';
import { Dataflow } from 'vega-dataflow';
import * as encode from '../index.js';

function entries(domain, params) {
  var df = new Dataflow();
  df.warn = () => {};
  var s = df.add(encode.scale, {type: 'ordinal', domain: domain, range: ['x']});
  var op = df.add(encode.legendentries, {scale: s, ...params});
  df.run();
  return op.value;
}

tape('LegendEntries exposes remaining count on symbol limit item', t => {
  var items = entries(['a', 'b', 'c', 'd', 'e'], {type: 'symbol', limit: 3});

  t.equal(items.length, 3);
  t.equal(items[0].remaining, undefined);
  t.equal(items[1].remaining, undefined);
  t.equal(items[2].remaining, 3);
  t.equal(items[2].label, '…3 entries');
  t.equal(items[2].value, 'c');
  t.end();
});

tape('LegendEntries omits remaining when under symbol limit', t => {
  var items = entries(['a', 'b'], {type: 'symbol', limit: 3});

  t.equal(items.length, 2);
  t.ok(items.every(d => d.remaining === undefined));
  t.end();
});
