import tape from 'tape';
import * as vega from '../index.js';

// pattern() composing two ordinal scales -- texture from one field,
// foreground color from another -- must emit per-item pattern defs
// without mutating the shared scale range wrappers.
const spec = {
  width: 100, height: 60, padding: 0,
  data: [{name: 'table', values: [
    {cat: 'a', region: 'x'},
    {cat: 'b', region: 'y'}
  ]}],
  scales: [
    {name: 'tex', type: 'ordinal', domain: {data: 'table', field: 'cat'},
     range: [{pattern: {name: 'diagonal-stripe'}}, {pattern: {name: 'crosshatch'}}]},
    {name: 'col', type: 'ordinal', domain: {data: 'table', field: 'region'},
     range: ['#ff0000', '#0000ff']},
    {name: 'x', type: 'band', domain: {data: 'table', field: 'cat'}, range: 'width'}
  ],
  marks: [{
    type: 'rect',
    from: {data: 'table'},
    encode: {enter: {
      x: {scale: 'x', field: 'cat'},
      width: {scale: 'x', band: 1},
      y: {value: 0},
      height: {value: 60},
      fill: {signal: "pattern(scale('tex', datum.cat), {foreground: scale('col', datum.region)})"}
    }}
  }]
};

tape('pattern() composes texture and color scales end to end', async t => {
  const view = new vega.View(vega.parse(spec), {renderer: 'none'});
  const svg = await view.toSVG();
  const defs = svg.match(/<pattern /g) || [];
  t.ok(defs.length >= 2, 'one def per texture/foreground combination');
  t.ok(svg.includes('#ff0000'), 'first foreground present in defs');
  t.ok(svg.includes('#0000ff'), 'second foreground present in defs');
  t.ok(/fill="url\(#pattern_\d+\)"/.test(svg), 'marks reference pattern defs');
  t.deepEqual(spec.scales[0].range[0], {pattern: {name: 'diagonal-stripe'}},
    'scale range wrapper not mutated');
  t.end();
});
