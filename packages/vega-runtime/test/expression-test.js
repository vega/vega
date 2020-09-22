var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    transforms = require('vega-transforms'),
    runtime = require('../');

tape('Parser parses expressions', t => {
  const values = [
    {'x': 1,  'y': 28},
    {'x': 2,  'y': 43},
    {'x': 3,  'y': 81},
    {'x': 4,  'y': 19}
  ];

  const spec = {operators: [
    {id:0, type:'Operator', value: 50},
    {id:1, type:'Operator', update: {code: '2 * _.foo'}, params: {foo:{$ref:0}}},
    {id:2, type:'Collect',  value: {$ingest: values}},
    {id:3, type:'Formula', params: {
      expr: {
        $expr: {code: 'datum.x * datum.y'},
        $fields: ['x', 'y']
      },
      as: 'z',
      pulse: {$ref: 2}
    }},
    {id:4, type:'Filter', params: {
      expr: {
        $expr: {code: 'datum.z > _.bar'},
        $fields: ['z'],
        $params: {bar: {$ref:1}}
      },
      pulse: {$ref: 3}
    }},
    {id:5, type:'Collect', params: {pulse: {$ref:4}}}
  ]};

  var df  = new vega.Dataflow(),
      ctx = runtime.context(df, transforms).parse(spec),
      ops = ctx.nodes,
      ids = Object.keys(ops),
      z = util.field('z');

  t.equal(ids.length, spec.operators.length);

  df.run();
  t.equal(ids.reduce((sum, id) => sum + +(ops[id].stamp === df.stamp()), 0), spec.operators.length);

  t.equal(typeof ops[1]._update, 'function');
  t.equal(ops[1].value, 100);

  t.deepEqual(ops[2].value.map(z), [28, 86, 243, 76]);
  t.deepEqual(ops[5].value.map(z), [243]);

  t.end();
});
