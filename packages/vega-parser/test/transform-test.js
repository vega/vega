import tape from 'tape';
import {extend} from '@omni-co/vega-util';
import * as vega from '@omni-co/vega-dataflow';
import { parse } from '../index.js';
import { aggrField } from '../src/util.js';
import * as vegaTransforms from '@omni-co/vega-transforms';

extend(vega.transforms, vegaTransforms);

tape('Parser parses Vega specs with data transforms', t => {
  const spec = {
    'signals': [
      { 'name': 'ufield', 'value': 'u' },
      { 'name': 'fields', 'value': ['u', 'v'] }
    ],
    'data': [
      {
        'name': 'data0',
        'values': [{'u': 'data0', 'v': 'foo'}],
        'transform': [
          { 'type': 'fold', 'fields': [{'signal': 'ufield'}, 'v'] }
        ]
      },
      {
        'name': 'data1',
        'values': [{'u': 'data1', 'v': 'bar'}],
        'transform': [
          { 'type': 'formula', 'expr': 'datum.u * datum.v', 'as': 'z' },
          { 'type': 'lookup', 'from': 'data0', 'key': {'signal': 'ufield'},
            'fields': ['a', 'b'], 'as': ['foo', 'bar'] }
        ]
      },
      {
        'name': 'data2',
        'source': 'data0',
        'transform': [
          { 'type': 'fold', 'fields': {'signal': 'fields'} }
        ]
      },
      {
        'name': 'data3',
        'source': 'data0',
        'transform': [
          { 'type': 'window', 'ops': ['rank'], 'sort': {'field': 'v'} }
        ]
      }
    ]
  };

  const dfs = parse(spec);

  t.equal(dfs.operators.length, 33);

  t.end();
});

tape('Parser replaces non-alphanumeric characters with underscores in aggregated fields', t => {
  // example data: [{ a: { b: 1 }, 'c.d': 1, 'e.f': { g: 1, 'h.i': 1} }]
  t.deepEqual(aggrField('sum', 'a.b'), 'sum_a_b');
  t.deepEqual(aggrField('mean', 'c\\.d'), 'mean_c_d');
  t.deepEqual(aggrField('max', '[c.d]'), 'max_c_d');
  t.deepEqual(aggrField('min', 'e\\.f.g'), 'min_e_f_g'); 
  t.deepEqual(aggrField('min', "e\\.f['g']"), 'min_e_f_g'); 
  t.deepEqual(aggrField('min', "[e.f]['g']"), 'min_e_f_g'); 
  t.deepEqual(aggrField('min', '[e.f][h.i]'), 'min_e_f_h_i'); 
  t.deepEqual(aggrField('min', 'e\\.f.h\\.i'), 'min_e_f_h_i'); 
  t.deepEqual(aggrField('min', 'e\\.f[h.i]'), 'min_e_f_h_i'); 
  t.end();
});
