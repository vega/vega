import fs from 'fs';
import tape from 'tape';
import * as vega from '../index.js';
import {isPattern} from 'vega-pattern';
import {absoluteBounds, countInk, findByMarktype} from './util.js';

const spec = JSON.parse(
  fs.readFileSync(process.cwd() + '/test/specs-valid/pattern-scale-redundant.vg.json', 'utf8')
);

async function makeView() {
  const view = new vega.View(vega.parse(spec), {renderer: 'none'}).finalize();
  await view.runAsync();
  return view;
}

tape('redundant pattern+color scale spec parses and runs without error', async t => {
  const view = await makeView();
  const bars = findByMarktype(view.scenegraph().root, 'rect');

  t.equal(bars.length, 5, 'five bars, one per category');
  t.ok(bars.every(b => isPattern(b.fill)), 'every bar is filled with a pattern wrapper');

  const foregrounds = new Set(bars.map(b => b.fill.pattern.foreground));
  const names = new Set(bars.map(b => b.fill.pattern.name));
  t.equal(foregrounds.size, 5, 'each bar carries a distinct foreground color (color varies)');
  t.equal(names.size, 5, 'each bar carries a distinct pattern name (pattern shape varies)');
  t.end();
});

tape('toSVG: every bar references a distinct pattern def; legend adds further distinct swatch defs', async t => {
  const view = await makeView();
  const svg = await view.toSVG();

  const rectGroup = svg.match(/<g class="mark-rect role-mark"[^]*?<\/g>/);
  t.ok(rectGroup, 'chart rect mark group found in SVG output');

  const barFillIds = [...rectGroup[0].matchAll(/fill="url\(#([^)]+)\)"/g)].map(m => m[1]);
  t.equal(barFillIds.length, 5, 'all five bars are pattern-filled');
  t.equal(new Set(barFillIds).size, 5, 'the five bars reference five DISTINCT pattern defs');

  // total distinct pattern defs must be at least the bar count -- the
  // legend contributes additional (swatch-fit) defs on top of these.
  const allDefIds = new Set([...svg.matchAll(/<pattern id="([^"]+)"/g)].map(m => m[1]));
  t.ok(allDefIds.size >= barFillIds.length,
    `total pattern def count (${allDefIds.size}) is at least the bar/category count (${barFillIds.length})`);

  // the legend's own symbol swatches must reference defs beyond the bars'
  // own userSpaceOnUse set (fit:'swatch' guarantees separate defs).
  const legendSymbolGroups = [...svg.matchAll(/<g class="mark-symbol role-legend-symbol"[^>]*>([^]*?)<\/g>/g)];
  t.equal(legendSymbolGroups.length, 5, 'legend renders one symbol per category');
  const legendFillIds = legendSymbolGroups
    .map(m => m[1].match(/fill="url\(#([^)]+)\)"/))
    .filter(Boolean)
    .map(m => m[1]);
  t.equal(legendFillIds.length, 5, 'all five legend symbols are pattern-filled');
  const overlap = legendFillIds.filter(id => barFillIds.includes(id));
  t.equal(overlap.length, 0, 'legend swatch defs are distinct from bar mark defs');

  t.end();
});

tape('toCanvas: each bar renders visible ink in its own region', async t => {
  const view = await makeView();
  const canvas = await view.toCanvas();
  const ctx = canvas.getContext('2d');

  const bars = findByMarktype(view.scenegraph().root, 'rect');
  t.equal(bars.length, 5, 'five bars, one per category');
  bars.forEach((item, i) => {
    const b = absoluteBounds(view, item);
    const ink = countInk(ctx, b.x1, b.y1, b.x2, b.y2);
    t.ok(ink > 0, `bar ${i} region contains ink`);
  });

  t.end();
});
