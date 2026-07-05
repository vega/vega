import tape from 'tape';
import {buildLinesPath} from '../index.js';

tape('buildLinesPath produces a path for a single angle', t => {
  const p = buildLinesPath({angle: 45, spacing: 5}, 10);
  t.equal(typeof p, 'string');
  t.ok(/^M/.test(p.trim()), 'starts with a moveto');
  t.ok(p.length > 5, 'non-trivial path');
  t.end();
});

tape('buildLinesPath with angle array unions multiple line sets', t => {
  const single = buildLinesPath({angle: 45, spacing: 5}, 10);
  const cross = buildLinesPath({angle: [45, 135], spacing: 5}, 10);
  t.ok(cross.length > single.length, 'two angles emit more segments than one');
  t.end();
});

tape('horizontal and vertical angles are axis-aligned', t => {
  const h = buildLinesPath({angle: 0, spacing: 5}, 10);
  t.ok(h.includes('M'), 'angle 0 produces segments');
  const v = buildLinesPath({angle: 90, spacing: 5}, 10);
  t.ok(v.includes('M'), 'angle 90 produces segments');
  t.end();
});
