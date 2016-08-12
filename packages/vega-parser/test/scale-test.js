var tape = require('tape'),
    parse = require('../').parse;

tape('Parser parses Vega specs with scales', function(test) {
  var spec = {
    "width": 500,
    "height": 300,
    "signals": [
      {"name": "yfield", "init": "y"},
      {"name": "sortop", "init": "median"},
      {"name": "order", "init": "ascending"}
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
        "domain": {
          "data": "table",
          "field": "x",
          "sort": {
            "op":    {"signal": "sortop"},
            "field": {"signal": "yfield"},
            "order": {"signal": "order"}
          }
        }
      },
      {
        "name": "yscale",
        "type": "linear",
        "range": [{"signal": "height"}, 0],
        "domain": {"data": "table", "field": {"signal": "yfield"}},
        "nice": true,
        "zero": true
      },
      {
        "name": "sscale",
        "type": "sqrt",
        "range": [1, 100],
        "domain": [0, {"signal": "width"}],
        "domainMax": 1000
      }
    ]
  };

  var dfs = parse(spec);

  test.equal(dfs.operators.length, 25);
  test.deepEqual(dfs.operators.map(function(o) { return o.type; }),
    ['Operator', 'Operator', 'Operator',
     'Operator', 'Operator', 'Operator', 'Operator',
     'Collect', 'Encode', 'ViewLayout', 'Sieve',
     'Collect', 'Sieve',
     'Field', 'Aggregate', 'Collect', 'Compare', 'Values', 'Scale',
     'Extent', 'Scale', 'Scale',
     'Bound', 'Render', 'Sieve' ]);

  test.end();
});

tape('Parser parses Vega specs with multi-domain scales', function(test) {
  var spec = {
    "data": [
      {
        "name": "table",
        "values": [
          {"x": 1,  "y": 6}, {"x": 2,  "y": 7},
          {"x": 3,  "y": 8}, {"x": 4,  "y": 5}
        ]
      }
    ],
    "scales": [
      {
        "name": "ofield",
        "type": "band",
        "range": [0, 1],
        "domain": {
          "data": "table",
          "fields": ["x", "y"],
          "sort": {
            "order": "descending"
          }
        }
      },
      {
        "name": "odomain",
        "type": "band",
        "range": [0, 1],
        "domain": {
          "fields": [
            {"data": "table", "field": "x"},
            {"data": "table", "field": "y"}
          ],
          "sort": {
            "op": "count",
            "order": "descending"
          }
        }
      },
      {
        "name": "qfield",
        "type": "linear",
        "range": [0, 1],
        "domain": {"data": "table", "fields": ["x", "y"]}
      },
      {
        "name": "qdomain",
        "type": "linear",
        "range": [0, 1],
        "domain": {
          "fields": [
            {"data": "table", "field": "x"},
            {"data": "table", "field": "y"}
          ]
        }
      }
    ]
  };

  var dfs = parse(spec);

  test.equal(dfs.operators.length, 31);
  test.deepEqual(dfs.operators.map(function(o) { return o.type; }),
    ['Operator', 'Operator', 'Operator', 'Operator',
     'Collect', 'Encode', 'ViewLayout', 'Sieve',
     'Collect', 'Sieve', 'Aggregate', 'Collect', 'Aggregate', 'Collect',
     'Aggregate', 'Collect', 'Values', 'Scale',
     'Aggregate', 'Collect', 'Values', 'Scale',
     'Extent', 'Extent', 'MultiExtent', 'Scale', 'MultiExtent', 'Scale',
     'Bound', 'Render', 'Sieve']);

  test.end();
});

