var parse = require('../').parse;

test('Parser parses Vega specs with axes', function() {
  var spec = {
    "scales": [
      {
        "name": "xscale",
        "domain": [0, 1],
        "range": [0, 500]
      }
    ],
    "axes": [
      {
        "scale": "xscale",
        "orient": "bottom"
      }
    ]
  };

  var dfs = parse(spec);

  expect(dfs.operators.length).toBe(46);
});
