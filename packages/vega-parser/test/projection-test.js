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

tape('Parser parses Vega specs with projection', function(t) {
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

  t.equal(dfs.operators.length, 14);
  t.equal(dfs.operators[9].type, 'projection');
  t.equal(dfs.operators[9].params.fit, geojson);

  t.end();
});
