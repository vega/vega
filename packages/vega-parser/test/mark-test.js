var tape = require('tape'),
    parse = require('../').parse;

tape('Parser parses Vega specs with marks', t => {
  const spec = {
    'signals': [
      { 'name': 'color', 'value': 'steelblue' }
    ],
    'data': [
      {
        'name': 'table',
        'values': [{'x': 0.5}]
      }
    ],
    'scales': [
      {
        'name': 'xscale',
        'domain': [0, 1],
        'range': [0, 500]
      }
    ],
    'marks': [
      {
        'type': 'rect',
        'from': {'data': 'table'},
        'key': 'k',
        'sort': {'field': ['x', 'y']},
        'encode': {
          'enter': {
            'fill': {'signal': 'color'},
            'height': {'field': {'parent': 'h'}},
            'y': {'value': 0},
            'x1': {'scale': 'xscale', 'value': 0}
          },
          'update': {
            'x2': {'scale': 'xscale', 'field': 'x'}
          }
        }
      }
    ]
  };

  const dfs = parse(spec);

  t.equal(dfs.operators.length, 26);

  t.end();
});
