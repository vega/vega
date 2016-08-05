var tape = require('tape'),
    vega = require('vega-dataflow'),
    runtime = require('../');

tape('Parser parses expressions', function(test) {
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
    {id:3, type:'Apply', params: {
      apply: {
        $expr: 'datum.x * datum.y',
        $fields: ['x', 'y']
      },
      as: 'z',
      pulse: {$ref: 2}
    }},
    {id:4, type:'Filter', params: {
      test: {
        $expr: 'datum.z > _.bar',
        $fields: ['z'],
        $params: {bar: {$ref:1}}
      },
      pulse: {$ref: 3}
    }},
    {id:5, type:'Collect', params: {pulse: {$ref:4}}}
  ]};

  var df  = new vega.Dataflow(),
      ctx = runtime.parse(spec, runtime.context(df, vega.transforms)),
      ops = ctx.nodes,
      z = vega.field('z');

  test.equal(Object.keys(ops).length, spec.operators.length);
  test.equal(df.run(), spec.operators.length);

  test.equal(typeof ops[1]._update, 'function');
  test.equal(ops[1].value, 100);

  test.deepEqual(ops[2].value.map(z), [28, 86, 243, 76]);
  test.deepEqual(ops[5].value.map(z), [243]);

  test.end();
});
