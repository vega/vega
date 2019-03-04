var parse = require('../').parse;

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

test('Parser parses Vega specs with projection', function() {
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

  expect(dfs.operators.length).toBe(14);
  expect(dfs.operators[9].type).toBe('projection');
  expect(dfs.operators[9].params.fit).toBe(geojson);
});
