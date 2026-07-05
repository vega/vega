import tape from 'tape';
import {normalizePatternSpec, patternScheme} from '../index.js';

tape('patternScheme is an ordered array of valid pattern wrappers', t => {
  t.ok(Array.isArray(patternScheme) && patternScheme.length >= 8, 'at least 8 entries');
  patternScheme.forEach((p, i) => t.ok(normalizePatternSpec(p), `entry ${i} normalizes`));
  t.end();
});
