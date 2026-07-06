import fs from 'fs';
import tape from 'tape';
import * as vega from '../index.js';
import {isPattern} from 'vega-pattern';

const spec = JSON.parse(
  fs.readFileSync(process.cwd() + '/test/specs-valid/pattern-scale-redundant.vg.json', 'utf8')
);

async function makeView() {
  const view = new vega.View(vega.parse(spec), {renderer: 'none'}).finalize();
  await view.runAsync();
  return view;
}

function findRectItems(node, out = []) {
  if (node.marktype === 'rect') out.push(...node.items);
  (node.items || []).forEach(child => findRectItems(child, out));
  return out;
}

tape('redundant pattern+color scale spec parses and runs without error', async t => {
  const view = await makeView();
  const bars = findRectItems(view.scenegraph().root);

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

tape('toCanvas: the redundant-encoded chart renders visible ink', async t => {
  const view = await makeView();
  const canvas = await view.toCanvas();
  const ctx = canvas.getContext('2d');
  const {data, width, height} = ctx.getImageData(0, 0, canvas.width, canvas.height);

  let ink = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0 && !(data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255)) ink++;
  }
  t.ok(ink > 0, `canvas (${width}x${height}) contains non-background ink`);
  t.end();
});
