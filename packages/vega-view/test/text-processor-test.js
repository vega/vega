import tape from 'tape';
import {extend} from 'vega-util';
import {transforms} from 'vega-dataflow';
import * as vegaEncode from 'vega-encode';
import * as vegaTransforms from 'vega-transforms';
import * as vegaViewTransforms from 'vega-view-transforms';
import {textProcessor} from 'vega-scenegraph';
import {View} from '../index.js';
import {parse} from '../../vega-parser/index.js';

extend(transforms, vegaTransforms, vegaViewTransforms, vegaEncode);

textProcessor('view-test', text => ({
  svg: `<svg viewBox="0 -800 ${600 * text.length} 1000"><path d="M0 0H1"/></svg>`,
  width: 0.6 * text.length,
  ascent: 0.8,
  descent: 0.2
}));

function spec() {
  return {
    width: 100,
    height: 50,
    marks: [{
      type: 'text',
      encode: {enter: {
        x: {value: 10}, y: {value: 20},
        text: {value: 'x^2'},
        textProcessor: {value: 'view-test'}
      }}
    }]
  };
}

tape('View embeds processed text as images', async t => {
  const view = new View(parse(spec()), {renderer: 'none'});
  const svg = await view.toSVG();
  t.ok(svg.includes('<image'), 'image');
  t.notOk(svg.includes('d="M0 0H1"'), 'no inline elements');

  const canvas = await view.toCanvas();
  t.ok(canvas, 'canvas output');
  t.end();
});

tape('View waits for text processor resources before rendering', async t => {
  let loaded = false;
  const load = new Promise(r => setTimeout(() => { loaded = true; r(); }, 20));
  textProcessor('view-pending', text => loaded
    ? {svg: '<svg viewBox="0 -800 1000 1000"></svg>', width: 3 * text.length, ascent: 0.8, descent: 0.2}
    : load);

  const view = new View(parse({
    width: 100,
    height: 50,
    scales: [{name: 'x', domain: [0, 1], range: 'width'}],
    axes: [{scale: 'x', orient: 'bottom', title: 'ab', titleTextProcessor: 'view-pending'}]
  }), {renderer: 'none'});

  const svg = await view.toSVG();
  t.ok(loaded, 'resources loaded');
  t.ok(/aria-label="ab"[^>]*><image/.test(svg), 'title is processed');

  // processed title bounds are 66px wide: 3em x 2 characters x 11px font
  const title = findMark(view.scenegraph().root, 'axis-title').items[0];
  t.equal(title.bounds.width(), 66);
  textProcessor('view-pending', null);
  t.end();
});

function findMark(node, role) {
  if (node.role === role) return node;
  for (const child of node.items || []) {
    const found = findMark(child, role);
    if (found) return found;
  }
}
