import tape from 'tape';
import { parse } from '../index.js';

tape('Parser parses Vega specs with axes', t => {
  const spec = {
    'scales': [
      {
        'name': 'xscale',
        'domain': [0, 1],
        'range': [0, 500]
      }
    ],
    'axes': [
      {
        'scale': 'xscale',
        'orient': 'bottom'
      }
    ]
  };

  const dfs = parse(spec);

  t.equal(dfs.operators.length, 47);

  t.end();
});
