var tape = require('tape'),
    parse = require('../').parse;

tape('Parser parses Vega specs with scales', t => {
  const spec = {
    'width': 500,
    'height': 300,
    'signals': [
      {'name': 'yfield', 'value': 'y'},
      {'name': 'sortop', 'value': 'median'},
      {'name': 'order', 'value': 'ascending'}
    ],
    'data': [
      {
        'name': 'table',
        'values': [
          {'x': 1,  'y': 28}, {'x': 2,  'y': 43},
          {'x': 3,  'y': 81}, {'x': 4,  'y': 19}
        ]
      }
    ],
    'scales': [
      {
        'name': 'xscale',
        'type': 'band',
        'range': [0, {'signal': 'width'}],
        'domain': {
          'data': 'table',
          'field': 'x',
          'sort': {
            'op':    {'signal': 'sortop'},
            'field': {'signal': 'yfield'},
            'order': {'signal': 'order'}
          }
        }
      },
      {
        'name': 'yscale',
        'type': 'linear',
        'range': [{'signal': 'height'}, 0],
        'domain': {'data': 'table', 'field': {'signal': 'yfield'}},
        'nice': true,
        'zero': true
      },
      {
        'name': 'sscale',
        'type': 'sqrt',
        'range': [1, 100],
        'domain': [0, {'signal': 'width'}],
        'domainMax': 1000
      }
    ]
  };

  const dfs = parse(spec);

  t.equal(dfs.operators.length, 28);
  t.deepEqual(dfs.operators.map(o => o.type),
    ['operator', 'operator', 'operator', 'operator', 'operator',
     'operator', 'operator', 'operator', 'operator', 'operator',
     'collect', 'encode', 'sieve',
     'scale', 'scale', 'scale',
     'collect', 'sieve',
     'field', 'aggregate', 'collect', 'compare', 'values',
     'extent', 'viewlayout', 'bound', 'render', 'sieve']);

  t.end();
});

tape('Parser parses Vega specs with multi-domain scales', t => {
  const spec = {
    'data': [
      {
        'name': 'table',
        'values': [
          {'x': 1,  'y': 6}, {'x': 2,  'y': 7},
          {'x': 3,  'y': 8}, {'x': 4,  'y': 5}
        ]
      }
    ],
    'scales': [
      {
        'name': 'ofield',
        'type': 'band',
        'range': [0, 1],
        'domain': {
          'data': 'table',
          'fields': ['x', 'y'],
          'sort': {
            'order': 'descending'
          }
        }
      },
      {
        'name': 'odomain',
        'type': 'band',
        'range': [0, 1],
        'domain': {
          'fields': [
            {'data': 'table', 'field': 'x'},
            {'data': 'table', 'field': 'y'}
          ],
          'sort': {
            'op': 'count',
            'order': 'descending'
          }
        }
      },
      {
        'name': 'qfield',
        'type': 'linear',
        'range': [0, 1],
        'domain': {'data': 'table', 'fields': ['x', 'y']}
      },
      {
        'name': 'qdomain',
        'type': 'linear',
        'range': [0, 1],
        'domain': {
          'fields': [
            {'data': 'table', 'field': 'x'},
            {'data': 'table', 'field': 'y'}
          ]
        }
      }
    ]
  };

  const dfs = parse(spec);

  t.equal(dfs.operators.length, 34);
  t.deepEqual(dfs.operators.map(o => o.type),
    ['operator', 'operator', 'operator', 'operator',
     'operator', 'operator', 'operator',
     'collect', 'encode', 'sieve',
     'scale', 'scale', 'scale', 'scale',
     'collect', 'sieve', 'aggregate', 'collect', 'aggregate', 'collect',
     'aggregate', 'collect', 'values',
     'aggregate', 'collect', 'values',
     'extent', 'extent', 'multiextent', 'multiextent',
     'viewlayout', 'bound', 'render', 'sieve']);

  t.end();
});

