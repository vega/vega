import tape from 'tape';
import { parse } from '../index.js';

tape('Parser parses Vega specs with scales', t => {
  const spec = {
    'width': 500,
    'height': 300,
    'signals': [
      {'name': 'yfield', 'value': 'y'},
      {'name': 'sortop', 'value': 'median'},
      {'name': 'order', 'value': 'ascending'},
      {'name': 'niceCount', 'value': '3'}
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
        'nice': {'signal': 'niceCount'},
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

  t.equal(dfs.operators.length, 29);
  t.deepEqual(dfs.operators.map(o => o.type),
    ['operator', 'operator', 'operator', 'operator', 'operator',
     'operator', 'operator', 'operator', 'operator', 'operator',
     'operator', 'collect', 'encode', 'sieve',
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

tape('Parser parses multi-domain scales with signal values', t => {
  const spec = {
    'signals': [
      {'name': 'lo', 'value': 2},
      {'name': 'hi', 'value': 8}
    ],
    'data': [
      {'name': 'table', 'values': [{'x': 0}, {'x': 5}]}
    ],
    'scales': [
      {
        'name': 'xscale',
        'type': 'linear',
        'range': [0, 1],
        'domain': {
          'fields': [
            [{'signal': 'lo'}, {'signal': 'hi'}],
            {'data': 'table', 'field': 'x'}
          ]
        }
      }
    ]
  };

  const dfs = parse(spec);
  const setdata = dfs.operators.filter(o => o.update && o.update.code.includes('setdata'));

  t.equal(setdata.length, 1);
  t.ok(/^this\.setdata\("(_:vega:_\d+)",\[_\["\$lo"\],_\["\$hi"\]\]\)$/.test(setdata[0].update.code));
  t.deepEqual(Object.keys(setdata[0].params), ['$lo', '$hi']);

  const name = setdata[0].update.code.match(/"(_:vega:_\d+)"/)[1];
  const coll = dfs.operators.find(o => o.data && o.data[name]);

  t.equal(coll.value, undefined);
  t.equal(coll.params.input.$ref, setdata[0].id);

  t.end();
});

tape('Parser parses multi-domain scales with literal values', t => {
  const spec = {
    'data': [
      {'name': 'table', 'values': [{'x': 0}, {'x': 5}]}
    ],
    'scales': [
      {
        'name': 'xscale',
        'type': 'linear',
        'range': [0, 1],
        'domain': {
          'fields': [
            [2, 8],
            {'data': 'table', 'field': 'x'}
          ]
        }
      }
    ]
  };

  const dfs = parse(spec);

  t.equal(dfs.operators.filter(o => o.update && o.update.code.includes('setdata')).length, 0);
  t.deepEqual(
    dfs.operators.filter(o => o.value && o.value.$ingest).map(o => o.value.$ingest),
    [[{'x': 0}, {'x': 5}], [2, 8]]
  );

  t.end();
});
