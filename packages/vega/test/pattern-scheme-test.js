import tape from 'tape';
import * as vega from '../index.js';
import {isPattern} from 'vega-pattern';

tape('patterns scheme is registered with vega-scale', t => {
  const s = vega.scheme('patterns');
  t.ok(Array.isArray(s) && s.length >= 8, 'scheme has at least 8 entries');
  t.ok(isPattern(s[0]), 'first entry is a valid pattern');
  t.end();
});
