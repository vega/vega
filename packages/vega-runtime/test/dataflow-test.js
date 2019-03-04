var util = require('vega-util'), vega = require('vega-dataflow'), transforms = util.extend({}, require('vega-transforms'), require('vega-encode')), runtime = require('../');

test('Parser parses dataflow specs', function() {
  var values = [
    {"x": 1,  "y": 28},
    {"x": 2,  "y": 43},
    {"x": 3,  "y": 81},
    {"x": 4,  "y": 19},
    {"x": 4,  "y": 20}
  ];
  var spec = {operators: [
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
      ctx = runtime.parse(spec, runtime.context(df, transforms)),
      ops = ctx.nodes,
      ids = Object.keys(ops);

  expect(Object.keys(ctx.fn).length).toBe(2);
  expect(ids.length).toBe(spec.operators.length);

  df.run();

  expect(ids.reduce(function(sum, id) {
    return sum + +(ops[id].stamp === df.stamp());
  }, 0)).toBe(spec.operators.length);

  expect(ops[0].value).toBe(500);

  expect(ops[1].value).toBe(300);

  expect(ops[2].value.length).toBe(values.length);

  expect(Object.keys(ops[3].value).length).toBe(4);

  expect(ops[4].value.length).toEqual(4);

  expect(ops[5].value).toEqual([1, 2, 3, 4]);

  var sx = ops[6].value;
  expect(sx.domain()).toEqual([1, 2, 3, 4]);
  expect(sx.range()).toEqual([0, 500]);

  expect(ops[7].value).toEqual([19, 81]);

  var sy = ops[8].value;
  expect(sy.domain()).toEqual([19, 81]);
  expect(sy.range()).toEqual([300, 0]);
});
