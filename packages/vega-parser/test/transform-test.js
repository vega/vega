var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    parse = require('../').parse;

util.extend(vega.transforms, require('vega-transforms'));

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
