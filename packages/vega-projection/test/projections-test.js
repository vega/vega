var tape = require('tape'),
    vega = require('../');

tape('default projections are registered', function(t) {
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
    t.notEqual(p, null);
  });

  t.end();
});

