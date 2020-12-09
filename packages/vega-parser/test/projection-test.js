var tape = require('tape'),
    parse = require('../').parse;

const geojson = {
  'type': 'FeatureCollection',
  'features': [
    {
      'type': 'Feature',
      'properties': {},
      'geometry': {
        'type': 'Point',
        'coordinates': [
          8.547449111938477,
          47.365222618998935
        ]
      }
    }
  ]
};

tape('Parser parses Vega specs with projection', t => {
  const spec = {
    'projections': [
        {
          'name': 'projection',
          'type': 'mercator',
          'fit':  geojson,
          'size': [200, 200]
        }
    ]
  };

  const dfs = parse(spec);

  t.equal(dfs.operators.length, 15);
  t.equal(dfs.operators[10].type, 'projection');
  t.equal(dfs.operators[10].params.fit, geojson);

  t.end();
});
