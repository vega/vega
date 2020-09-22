var tape = require('tape'),
    vega = require('vega-dataflow'),
    transforms = require('vega-transforms'),
    runtime = require('../');

tape('Parser parses faceted dataflow specs', t => {
  const values = [
    {'k': 'a', 'x': 1,  'y': 28},
    {'k': 'b', 'x': 2,  'y': 43},
    {'k': 'a', 'x': 3,  'y': 81},
    {'k': 'b', 'x': 4,  'y': 19}
  ];

  const spec = {operators: [
    {id:0, type:'Collect', value:{$ingest: values}},
    {id:1, type:'Facet', params:{
      key: {$field: 'k'},
      subflow: {
        $subflow: {
          operators: [
            {id:2, type:'Collect'},
            {id:3, type:'Extent', params:{field:{$field:'y'}, pulse:{$ref:2}}},
            {id:4, type:'Facet', params:{
              key: {$field:'x'},
              subflow: {
                $subflow: {
                  operators: [{id:5, type:'Collect'}]
                }
              },
              pulse: {$ref:2}
            }}
          ]
        }
      },
      pulse: {$ref:0}
    }}
  ]};

  const len0 = 3; // number of operators in 1st subflow (ignore Subflow op)
  const len1 = 1; // number of operators in 2nd subflow (ignore Subflow op)
  const nkey = 2; // number of facet keys per level
  const size = 2; // number of tuples per facet in 1st subflow

  // ----

  var df  = new vega.Dataflow(),
      ctx = runtime.context(df, transforms).parse(spec),
      ops = ctx.nodes;

  t.equal(Object.keys(ops).length, spec.operators.length);

  // test that all subflow operators were created and run
  df.run();
  t.equal(
    count(ctx, df.stamp()),
    spec.operators.length + nkey * (len0 + nkey * len1)
  );

  // test that subflows contain correct values
  var subflows = ops[1].value,
      collectA = subflows.a._targets[0],
      collectB = subflows.b._targets[0],
      extentA = collectA._targets[0],
      extentB = collectB._targets[0];

  t.equal(collectA.value.length, size);
  t.deepEqual(extentA.value, [28, 81]);

  t.equal(collectB.value.length, size);
  t.deepEqual(extentB.value, [19, 43]);

  t.end();
});

function count(ctx, stamp) {
  var sum = 0, ops = ctx.nodes;

  Object.keys(ops).forEach(key => {
    if (ops[key].stamp === stamp) ++sum;
  });

  (ctx.subcontext || []).forEach(sub => {
    sum += count(sub, stamp);
  });

  return sum;
}
