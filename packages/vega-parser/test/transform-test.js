var tape = require('tape'),
    parse = require('../').parse;

tape('Parser parses Vega specs with data transforms', function(test) {
  var spec = {
    "signals": [
      { "name": "ufield", "init": "u" },
      { "name": "fields", "init": ["u", "v"] }
    ],
    "data": [
      {
        "name": "data0",
        "values": [{"u": "data0", "v": "foo"}],
        "transform": [
          { "type": "fold", "fields": [{"signal": "ufield"}, "v"] }
        ]
      },
      {
        "name": "data1",
        "values": [{"u": "data1", "v": "bar"}],
        "transform": [
          { "type": "formula", "expr": "datum.u * datum.v", "as": "z" },
          { "type": "lookup", "from": "data0", "key": {"signal": "ufield"},
            "fields": ["a", "b"], "as": ["foo", "bar"] }
        ]
      },
      {
        "name": "data2",
        "source": "data0",
        "transform": [
          { "type": "fold", "fields": {"signal": "fields"} }
        ]
      },
      {
        "name": "data3",
        "source": "data0",
        "transform": [
          { "type": "rank", "field": "v" }
        ]
      }
    ]
  };

  var dfs = parse(spec);

  test.equal(dfs.operators.length, 32);

  test.end();
});
