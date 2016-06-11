var tape = require('tape'),
    parse = require('../');

tape('Parser parses Vega specs', function(test) {
  var spec = {
    "signals": [
      {"name": "width", "init": 500},
      {"name": "height", "init": 300},
      {"name": "xfield", "init": "x"}
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
        "domain": {"data": "table", "field": {"signal": "xfield"}}
      },
      {
        "name": "yscale",
        "type": "linear",
        "range": [{"signal": "height"}, 0],
        "domain": {"data": "table", "field": "y"}
      }
    ]
  };

  var dfs = parse.vega(spec);

  test.equal(dfs.length, 10);
  test.deepEqual(dfs.map(function(o) { return o.type; }),
    ['Operator', 'Operator', 'Operator', 'Collect', 'Field',
     'Aggregate', 'Values', 'Scale', 'Extent', 'Scale']);

  test.end();
});
