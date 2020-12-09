var tape = require('tape'),
    util = require('vega-util'),
    vega = require('vega-dataflow'),
    transforms = util.extend({}, require('vega-transforms'), require('vega-encode')),
    runtime = require('../');

tape('Parser parses dataflow specs', t => {
  const values = [
    {'x': 1,  'y': 28},
    {'x': 2,  'y': 43},
    {'x': 3,  'y': 81},
    {'x': 4,  'y': 19},
    {'x': 4,  'y': 20}
  ];
  const spec = {operators: [
    {id:0, type:'Operator', value:500},
    {id:1, type:'Operator', value:300},
    {id:2, type:'Collect',  value:{$ingest: values}},
    {id:3, type:'Aggregate', params:{groupby:{$field:'x'}, pulse:{$ref:2}}},
    {id:4, type:'Collect',  params:{pulse:{$ref:3}}},
    {id:5, type:'Values', params:{field:{$field:'x'}, pulse:{$ref:4}}},
    {id:6, type:'Scale', params:{type:'band', range:[0,{$ref:0}], zero:false, domain:{$ref:5}}},
    {id:7, type:'Extent', params:{field:{$field:'y'}, pulse:{$ref:2}}},
    {id:8, type:'Scale', params:{type:'linear', range:[{$ref:1},0], zero:false, domain:{$ref:7}}}
  ]};

  var df  = new vega.Dataflow(),
      ctx = runtime.context(df, transforms).parse(spec),
      ops = ctx.nodes,
      ids = Object.keys(ops);

  t.equal(Object.keys(ctx.fn).length, 2);
  t.equal(ids.length, spec.operators.length);

  df.run();

  t.equal(ids.reduce((sum, id) => sum + +(ops[id].stamp === df.stamp()), 0), spec.operators.length);

  t.equal(ops[0].value, 500);

  t.equal(ops[1].value, 300);

  t.equal(ops[2].value.length, values.length);

  t.equal(Object.keys(ops[3].value).length, 4);

  t.deepEqual(ops[4].value.length, 4);

  t.deepEqual(ops[5].value, [1, 2, 3, 4]);

  const sx = ops[6].value;
  t.deepEqual(sx.domain(), [1, 2, 3, 4]);
  t.deepEqual(sx.range(), [0, 500]);

  t.deepEqual(ops[7].value, [19, 81]);

  const sy = ops[8].value;
  t.deepEqual(sy.domain(), [19, 81]);
  t.deepEqual(sy.range(), [300, 0]);

  t.end();
});
