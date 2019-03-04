var util = require('vega-util'), vega = require('vega-dataflow'), transforms = require('vega-transforms'), runtime = require('../');

test('Parser parses expressions', function() {
  var values = [
    {"x": 1,  "y": 28},
    {"x": 2,  "y": 43},
    {"x": 3,  "y": 81},
    {"x": 4,  "y": 19}
  ];

  var spec = {operators: [
    {id:0, type:'Operator', value: 50},
    {id:1, type:'Operator', update: '2 * _.foo', params: {foo:{$ref:0}}},
    {id:2, type:'Collect',  value: {$ingest: values}},
    {id:3, type:'Formula', params: {
      expr: {
        $expr: 'datum.x * datum.y',
        $fields: ['x', 'y']
      },
      as: 'z',
      pulse: {$ref: 2}
    }},
    {id:4, type:'Filter', params: {
      expr: {
        $expr: 'datum.z > _.bar',
        $fields: ['z'],
        $params: {bar: {$ref:1}}
      },
      pulse: {$ref: 3}
    }},
    {id:5, type:'Collect', params: {pulse: {$ref:4}}}
  ]};

  var df  = new vega.Dataflow(),
      ctx = runtime.parse(spec, runtime.context(df, transforms)),
      ops = ctx.nodes,
      ids = Object.keys(ops),
      z = util.field('z');

  expect(ids.length).toBe(spec.operators.length);

  df.run();
  expect(ids.reduce(function(sum, id) {
    return sum + +(ops[id].stamp === df.stamp());
  }, 0)).toBe(spec.operators.length);

  expect(typeof ops[1]._update).toBe('function');
  expect(ops[1].value).toBe(100);

  expect(ops[2].value.map(z)).toEqual([28, 86, 243, 76]);
  expect(ops[5].value.map(z)).toEqual([243]);
});
