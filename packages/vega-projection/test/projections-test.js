import tape from 'tape';
import * as vega from '../index.js';

tape('default projections are registered', t => {
  [
    'albers',
    'albersusa',
    'azimuthalequalarea',
    'azimuthalequidistant',
    'conicconformal',
    'conicequalarea',
    'conicequidistant',
    'equalearth',
    'equirectangular',
    'gnomonic',
    'identity',
    'mercator',
    'naturalearth1',
    'orthographic',
    'stereographic',
    'transversemercator'
  ].forEach(name => {
    const p = vega.projection(name);
    t.notEqual(p, null);
  });

  t.end();
});

tape('projection types are case-insensitive', t => {
  t.equal(vega.projection('equalEarth'), vega.projection('equalearth'));
  t.equal(vega.projection('NaturalEarth1'), vega.projection('naturalearth1'));
  t.notEqual(vega.projection('equalEarth'), null);
  t.end();
});
