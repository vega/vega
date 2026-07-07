import tape from 'tape';
import * as vega from '../index.js';
import {isPattern} from 'vega-pattern';

tape('patterns scheme is registered with vega-scale', t => {
  const s = vega.scheme('patterns');
  t.ok(Array.isArray(s) && s.length >= 8, 'scheme has at least 8 entries');
  t.ok(isPattern(s[0]), 'first entry is a valid pattern');
  t.end();
});

tape('monochrome scheme is registered with vega-scale', t => {
  const s = vega.scheme('monochrome');
  t.ok(Array.isArray(s) && s.length >= 8, 'scheme has at least 8 entries');
  t.equal(s[0], '#000000', 'first entry is solid black');
  t.ok(s.some(isPattern), 'scheme includes pattern entries');
  t.ok(s.some(e => typeof e === 'string'), 'scheme includes solid color entries');
  t.end();
});

tape('monochrome scheme resolves through an ordinal scale end-to-end', async t => {
  const spec = {
    width: 100, height: 100,
    data: [{name: 'table', values: [{c: 'a'}, {c: 'b'}]}],
    scales: [{
      name: 'color', type: 'ordinal',
      domain: {data: 'table', field: 'c'},
      range: {scheme: 'monochrome'}
    }]
  };
  const view = new vega.View(vega.parse(spec), {renderer: 'none'});
  await view.runAsync();
  const s = view.scale('color');
  t.equal(s('a'), '#000000', 'first category maps to solid black');
  t.ok(isPattern(s('b')), 'second category maps to a pattern wrapper');
  t.end();
});
