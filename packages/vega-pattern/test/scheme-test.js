import tape from 'tape';
import {normalizePatternSpec, patternScheme} from '../build/index.js';

tape('patternScheme is an ordered array of valid pattern wrappers', t => {
  t.ok(Array.isArray(patternScheme) && patternScheme.length >= 8, 'at least 8 entries');
  patternScheme.forEach((p, i) => t.ok(normalizePatternSpec(p), `entry ${i} normalizes`));
  t.end();
});

tape('patternScheme maps to an exact, pinned pattern name sequence', t => {
  t.deepEqual(
    patternScheme.map(p => p.pattern.name),
    [
      'diagonal-stripe', 'circles', 'crosshatch', 'vertical-stripe',
      'squares', 'horizontal-stripe', 'crosses', 'grid', 'caps', 'waves'
    ],
    'pattern names appear in the documented order'
  );
  t.end();
});
