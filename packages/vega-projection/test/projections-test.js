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
    'equirectangular',
    'gnomonic',
    'identity',
    'mercator',
    'naturalEarth1',
    'orthographic',
    'stereographic',
    'transversemercator'
  ].forEach(name => {
    const p = vega.projection(name);
    t.notEqual(p, null);
  });

  t.end();
});
