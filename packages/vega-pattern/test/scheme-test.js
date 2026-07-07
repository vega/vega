import tape from 'tape';
import {isPattern, monochromeScheme, normalizePatternSpec, patternScheme} from '../build/index.js';

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

tape('monochromeScheme mixes solid greys with valid pattern wrappers', t => {
  t.ok(Array.isArray(monochromeScheme) && monochromeScheme.length >= 8, 'at least 8 entries');

  const solids = monochromeScheme.filter(e => typeof e === 'string');
  const wrappers = monochromeScheme.filter(e => isPattern(e));
  t.equal(solids.length + wrappers.length, monochromeScheme.length, 'every entry is a solid or a pattern');
  t.ok(solids.length >= 3, 'multiple solid entries (value is the strongest monochrome channel)');
  t.ok(wrappers.length >= 4, 'multiple pattern entries');

  for (const c of solids) {
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(c);
    t.ok(m && m[1] === m[2] && m[2] === m[3], `solid ${c} is a grey (r = g = b)`);
    t.ok(parseInt(m[1], 16) < 0xe6, `solid ${c} is visible on a white background without a stroke`);
  }
  wrappers.forEach((p, i) => t.ok(normalizePatternSpec(p), `pattern entry ${i} normalizes`));

  t.equal(monochromeScheme[0], '#000000', 'leads with solid black (maximum ink)');
  for (let i = 1; i < monochromeScheme.length; ++i) {
    const a = typeof monochromeScheme[i - 1] === 'string';
    const b = typeof monochromeScheme[i] === 'string';
    t.notOk(a && b, `entries ${i - 1}/${i} are not adjacent solids (flat greys are confusable)`);
  }
  t.end();
});

tape('monochromeScheme maps to an exact, pinned sequence', t => {
  t.deepEqual(
    monochromeScheme.map(e => typeof e === 'string' ? e : e.pattern.name),
    [
      '#000000', 'circles', '#666666', 'crosshatch', '#cccccc',
      'diagonal-stripe', '#999999', 'squares', 'waves', 'crosses'
    ],
    'entries appear in the documented order'
  );
  t.end();
});
