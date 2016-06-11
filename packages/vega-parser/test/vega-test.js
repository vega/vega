var tape = require('tape'),
    dataflow = require('dataflow'),
    parse = require('../');

tape("Parser parses Vega specs", function(test) {
  var spec = {
    "signals": [
      {"name": "width", "init": 500},
      {"name": "height", "init": 300}
    ],
    "data": [
      {
        "name": "table",
        "values": [
          {"x": 1,  "y": 28}, {"x": 2,  "y": 43},
          {"x": 3,  "y": 81}, {"x": 4,  "y": 19}
        ]
      }
    ],
    "scales": [
      {
        "name": "xscale",
        "type": "band",
        "range": [0, {"signal": "width"}],
        "domain": {"data": "table", "field": "x"}
      },
      {
        "name": "yscale",
        "type": "linear",
        "range": [{"signal": "height"}, 0],
        "domain": {"data": "table", "field": "y"}
      }
    ]
  };

  var df = new dataflow.Dataflow(),
      dfs = parse.vega(spec);

  var ctx = parse.dataflow(dfs, df);
  test.equal(Object.keys(ctx.operators).length, 8);

  test.end();
});
