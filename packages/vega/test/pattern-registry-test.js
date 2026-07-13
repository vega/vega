import tape from 'tape';
import * as vega from '../index.js';
import {isPattern} from 'vega-pattern';
import {absoluteBounds, countInk, findByMarktype} from './util.js';

// Registry-extensibility test: pattern() is a low-level registration
// accessor re-exported from vega-pattern via the vega package, symmetric
// with vega-scale's scheme(name, def) -- calling pattern(name, def) once
// registers a new named pattern that any spec can subsequently reference
// as {pattern: {name, ...}}, exactly like a built-in. Spec JSON has no way
// to call this accessor itself, so the registration step lives here, in
// JS, while the spec below only ever references the resulting name.
const CUSTOM_NAME = 'test-registry-diamonds';

vega.pattern(CUSTOM_NAME, {
  shape: 'M5,0 L10,5 L5,10 L0,5 Z',
  tileSize: 10,
  background: 'transparent',
  stroke: '#000',
  strokeWidth: 1
});

const spec = {
  $schema: 'https://vega.github.io/schema/vega/v6.json',
  width: 80,
  height: 80,
  padding: 5,
  marks: [
    {
      type: 'rect',
      encode: {
        enter: {
          x: {value: 10}, y: {value: 10},
          width: {value: 60}, height: {value: 60},
          stroke: {value: '#333'},
          fill: {value: {pattern: {name: CUSTOM_NAME, foreground: 'darkred'}}}
        }
      }
    }
  ]
};

async function makeView() {
  const view = new vega.View(vega.parse(spec), {renderer: 'none'}).finalize();
  await view.runAsync();
  return view;
}

tape('pattern(name, def) registers a custom named pattern usable like a built-in', async t => {
  t.ok(vega.pattern(CUSTOM_NAME), 'custom pattern is retrievable from the registry after registration');

  const view = await makeView();
  const bars = findByMarktype(view.scenegraph().root, 'rect');
  t.equal(bars.length, 1, 'one rect mark');
  t.ok(isPattern(bars[0].fill), 'rect is filled with a pattern wrapper');
  t.equal(bars[0].fill.pattern.name, CUSTOM_NAME, 'wrapper references the custom-registered name');
  t.end();
});

tape('toCanvas: a spec referencing a custom-registered pattern renders visible ink', async t => {
  const view = await makeView();
  const canvas = await view.toCanvas();
  const ctx = canvas.getContext('2d');

  const bars = findByMarktype(view.scenegraph().root, 'rect');
  const b = absoluteBounds(view, bars[0]);
  const ink = countInk(ctx, b.x1, b.y1, b.x2, b.y2);
  t.ok(ink > 0, 'custom pattern fill region contains ink');
  t.end();
});
