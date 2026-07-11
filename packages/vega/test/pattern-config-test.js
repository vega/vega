import tape from 'tape';
import * as vega from '../index.js';

// Pattern fills supplied through config — named style blocks and
// mark-type config blocks — must flow through vega-parser's encode
// defaults exactly like plain colors (the defaults wrap config values
// verbatim as {value: ...} entries). Generic config.mark is NOT covered:
// the default config's per-mark-type blocks (e.g. rect.fill) outrank it
// by longstanding precedence, for colors and patterns alike.

const WRAPPER = {pattern: {name: 'diagonal-stripe', foreground: '#4c78a8'}};

function bareRect(style) {
  return {
    width: 120, height: 80, padding: 5,
    marks: [{
      type: 'rect',
      ...(style ? {style: [style]} : {}),
      encode: {enter: {
        x: {value: 10}, y: {value: 10},
        width: {value: 100}, height: {value: 60}
      }}
    }]
  };
}

async function renderSVG(spec, config) {
  const view = new vega.View(vega.parse(spec, config), {renderer: 'none'});
  return view.toSVG();
}

tape('config.style pattern fills resolve to pattern defs', async t => {
  const svg = await renderSVG(bareRect('patterned'), {style: {patterned: {fill: WRAPPER}}});
  t.ok(/<pattern /.test(svg), 'a pattern def is emitted');
  t.ok(/fill="url\(#pattern_\d+\)"/.test(svg), 'the styled mark references the def');
  t.end();
});

tape('mark-type config pattern fills resolve to pattern defs', async t => {
  const svg = await renderSVG(bareRect(), {rect: {fill: WRAPPER}});
  t.ok(/<pattern /.test(svg), 'a pattern def is emitted');
  t.ok(/fill="url\(#pattern_\d+\)"/.test(svg), 'the mark references the def');
  t.end();
});
