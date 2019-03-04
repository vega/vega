var parse = require('../').parse;

test('Parser parses Vega specs with marks', function() {
  var spec = {
    "signals": [
      { "name": "color", "value": "steelblue" }
    ],
    "data": [
      {
        "name": "table",
        "values": [{"x": 0.5}]
      }
    ],
    "scales": [
      {
        "name": "xscale",
        "domain": [0, 1],
        "range": [0, 500]
      }
    ],
    "marks": [
      {
        "type": "rect",
        "from": {"data": "table"},
        "key": "k",
        "sort": {"field": ["x", "y"]},
        "encode": {
          "enter": {
            "fill": {"signal": "color"},
            "height": {"field": {"parent": "h"}},
            "y": {"value": 0},
            "x1": {"scale": "xscale", "value": 0}
          },
          "update": {
            "x2": {"scale": "xscale", "field": "x"}
          }
        }
      }
    ]
  };

  var dfs = parse(spec);

  expect(dfs.operators.length).toBe(25);
});
