var tape = require('tape'),
    vega = require('../');

tape('default projections are registered', function(test) {
  [
    'albers',
    'albersusa',
    'azimuthalequalarea',
    'azimuthalequidistant',
    'conicconformal',
    'conicequalarea',
    'conicequidistant',
    'equirectangular',
    'gnomonic',
    'identity',
    'mercator',
    'naturalEarth1',
    'orthographic',
    'stereographic',
    'transversemercator'
  ].forEach(function(name) {
    const p = vega.projection(name);
    test.notEqual(p, null);
  });

  test.end();
});

