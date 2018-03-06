var tape = require('tape'),
    parse = require('../').parse;

var geojson = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "Point",
        "coordinates": [
          8.547449111938477,
          47.365222618998935
        ]
      }
    }
  ]
};

tape('Parser parses Vega specs with projection', function(test) {
  var spec = {
    "projections": [
        {
          "name": "projection",
          "type": "mercator",
          "fit":  geojson,
          "size": [200, 200]
        }
    ]
  };

  var dfs = parse(spec);

  test.equal(dfs.operators.length, 13);
  test.equal(dfs.operators[8].type, 'projection');
  test.equal(dfs.operators[8].params.fit, geojson);

  test.end();
});