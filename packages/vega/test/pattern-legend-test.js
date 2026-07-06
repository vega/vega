import fs from 'fs';
import tape from 'tape';
import * as vega from '../index.js';
import {isPattern} from 'vega-pattern';
import {absoluteBounds, countInk, findByRole, findByMarktype} from './util.js';

const spec = JSON.parse(
  fs.readFileSync(process.cwd() + '/test/specs-valid/pattern-legend.vg.json', 'utf8')
);

async function makeView() {
  const view = new vega.View(vega.parse(spec), {renderer: 'none'}).finalize();
  await view.runAsync();
  return view;
}

tape('pattern legend spec parses and runs without error', async t => {
  const view = await makeView();
  t.ok(view.scenegraph(), 'scenegraph produced');

  const symbols = findByRole(view.scenegraph().root, 'legend-symbol');
  t.equal(symbols.length, 3, 'legend produced one symbol per domain value');

  const patterned = symbols.filter(s => isPattern(s.fill));
  t.equal(patterned.length, 2, 'two of the three legend symbols carry a pattern-wrapper fill');
  t.end();
});

tape('toSVG: legend symbols reference swatch-fit defs distinct from the chart marks\' defs', async t => {
  const view = await makeView();
  const svg = await view.toSVG();

  // catalog every <pattern> def by id -> patternUnits/patternContentUnits
  const defs = {};
  for (const m of svg.matchAll(/<pattern id="([^"]+)"([^>]*)>/g)) {
    defs[m[1]] = m[2];
  }
  const swatchIds = Object.keys(defs).filter(id => /patternUnits="objectBoundingBox"/.test(defs[id]));
  const markIds = Object.keys(defs).filter(id => /patternUnits="userSpaceOnUse"/.test(defs[id]));

  t.ok(swatchIds.length >= 2, 'at least 2 legend-swatch (objectBoundingBox) defs exist');
  t.ok(markIds.length >= 2, 'at least 2 chart-mark (userSpaceOnUse) defs exist');
  swatchIds.forEach(id => {
    t.ok(/patternContentUnits="objectBoundingBox"/.test(defs[id]), `swatch def #${id} also declares patternContentUnits=objectBoundingBox`);
  });

  // the chart's <rect> marks (role-mark) must reference only the
  // userSpaceOnUse defs -- never a swatch def.
  const rectGroup = svg.match(/<g class="mark-rect role-mark"[^]*?<\/g>/);
  t.ok(rectGroup, 'chart rect mark group found in SVG output');
  const rectFillIds = [...rectGroup[0].matchAll(/fill="url\(#([^)]+)\)"/g)].map(m => m[1]);
  t.equal(rectFillIds.length, 2, 'two of the three bars are pattern-filled');
  rectFillIds.forEach(id => {
    t.ok(markIds.includes(id), `bar fill ${id} is a userSpaceOnUse mark def`);
    t.notOk(swatchIds.includes(id), `bar fill ${id} is not a swatch def`);
  });

  // the legend's symbol items (role-legend-symbol) must reference only the
  // swatch defs -- never a plain mark def.
  const legendSymbolGroups = [...svg.matchAll(/<g class="mark-symbol role-legend-symbol"[^>]*>([^]*?)<\/g>/g)];
  t.equal(legendSymbolGroups.length, 3, 'legend renders one symbol group per domain value');
  const legendFillIds = legendSymbolGroups
    .map(m => m[1].match(/fill="url\(#([^)]+)\)"/))
    .filter(Boolean)
    .map(m => m[1]);
  t.equal(legendFillIds.length, 2, 'two legend symbols are pattern-filled');
  legendFillIds.forEach(id => {
    t.ok(swatchIds.includes(id), `legend swatch fill ${id} is an objectBoundingBox swatch def`);
    t.notOk(markIds.includes(id), `legend swatch fill ${id} does not reuse a chart-mark def`);
  });

  // swatch and mark def id sets must never intersect -- the fit:'swatch'
  // slot in patternKey guarantees legend and chart never share a def.
  const overlap = swatchIds.filter(id => markIds.includes(id));
  t.equal(overlap.length, 0, 'swatch defs and mark defs are entirely disjoint');

  t.end();
});

tape('toCanvas: both the chart bars and the legend swatches render ink', async t => {
  const view = await makeView();
  const canvas = await view.toCanvas();
  const ctx = canvas.getContext('2d');

  const rectItems = findByMarktype(view.scenegraph().root, 'rect');

  t.equal(rectItems.length, 3, 'three bars in the chart');
  rectItems.forEach((item, i) => {
    const b = absoluteBounds(view, item);
    const ink = countInk(ctx, b.x1, b.y1, b.x2, b.y2);
    t.ok(ink > 0, `bar ${i} region contains ink`);
  });

  const symbols = findByRole(view.scenegraph().root, 'legend-symbol');
  t.equal(symbols.length, 3, 'three legend symbols');
  symbols.forEach((item, i) => {
    const b = absoluteBounds(view, item);
    const ink = countInk(ctx, b.x1, b.y1, b.x2, b.y2);
    t.ok(ink > 0, `legend symbol ${i} region contains ink`);
  });

  t.end();
});
