import tape from 'tape';
import jsdom from 'jsdom';
import {
  SVGRenderer,
  SVGStringRenderer,
  resetSVGDefIds,
  sceneFromJSON
} from '../index.js';

const doc = (new jsdom.JSDOM()).window.document;

function rectScene(fill) {
  return sceneFromJSON({
    marktype: 'rect',
    items: [
      {x: 0, y: 0, width: 20, height: 20, fill}
    ]
  });
}

function tworectScene(fill) {
  return sceneFromJSON({
    marktype: 'rect',
    items: [
      {x: 0, y: 0, width: 20, height: 20, fill},
      {x: 30, y: 0, width: 20, height: 20, fill}
    ]
  });
}

function textScene(fill, x, y) {
  return sceneFromJSON({
    marktype: 'text',
    items: [
      {x, y, text: 'hi', fill}
    ]
  });
}

function renderSVG(scene, w, h) {
  for (let i = doc.body.children.length; --i >= 0;) {
    doc.body.removeChild(doc.body.children[i]);
  }
  resetSVGDefIds();
  return new SVGRenderer()
    .initialize(doc.body, w, h)
    .render(scene)
    .svg();
}

function renderSVGString(scene, w, h) {
  resetSVGDefIds();
  return new SVGStringRenderer()
    .initialize(null, w, h)
    .render(scene)
    .svg();
}

const crosshatch = () => ({pattern: {name: 'crosshatch'}});
const circles = () => ({pattern: {name: 'circles'}});

tape('SVGRenderer emits a pattern def and references it from fill', t => {
  const svg = renderSVG(rectScene(crosshatch()), 50, 50);
  t.ok(/<pattern[^>]*id="pattern_0"/.test(svg), 'pattern def with id pattern_0 present');
  t.ok(/<pattern[^>]*patternUnits="userSpaceOnUse"/.test(svg), 'userSpaceOnUse pattern');
  // rect marks render as <path> elements in vega-scenegraph
  t.ok(/<path[^>]*fill="url\(#pattern_0\)"/.test(svg), 'rect mark path references the pattern def');
  t.end();
});

tape('SVGRenderer shares one pattern def across items with the same wrapper', t => {
  const fill = crosshatch();
  const svg = renderSVG(tworectScene(fill), 50, 50);
  const matches = svg.match(/<pattern[^>]*id="pattern_\d+"/g) || [];
  t.equal(matches.length, 1, 'exactly one pattern def emitted');
  const refs = svg.match(/fill="url\(#pattern_0\)"/g) || [];
  t.equal(refs.length, 2, 'both rects reference the shared def');
  t.end();
});

tape('SVGRenderer garbage-collects stale pattern defs on re-render', t => {
  const r = new SVGRenderer().initialize(doc.body, 50, 50);
  resetSVGDefIds();

  const scene = rectScene(crosshatch());
  r.render(scene);
  let svg = r.svg();
  t.ok(/id="pattern_0"/.test(svg), 'initial crosshatch def present');

  // swap the fill's wrapper contents (new pattern content -> new def)
  scene.items[0].fill = circles();
  scene.items[0].dirty = 0; // force restyle path to re-evaluate fill
  r.render(scene);
  svg = r.svg();

  const patternCount = (svg.match(/<pattern[^>]*id=/g) || []).length;
  t.equal(patternCount, 1, 'only the current def remains after re-render');
  t.ok(/fill="url\(#pattern_\d+\)"/.test(svg), 'rect references a pattern def');
  t.notOk(/circles.{0,40}crosshatch|crosshatch.{0,200}circles/.test(svg), 'sanity: single def, no duplication artifact');
  t.end();
});

tape('SVGRenderer origin:mark pattern defs on text items carry no per-item anchor', t => {
  const wrapper = {pattern: {name: 'crosshatch', origin: 'mark'}};
  const svg = renderSVG(textScene(wrapper, 100, 150), 200, 200);
  const m = svg.match(/<pattern[^>]*id="pattern_0"[^>]*>/);
  t.ok(m, 'pattern def emitted for text item');
  const tag = m[0];
  t.ok(!/ x="(?!0")[^"]/.test(tag) , 'no non-zero x anchor attribute');
  t.ok(!/ y="(?!0")[^"]/.test(tag) , 'no non-zero y anchor attribute');
  t.end();
});

tape('SVGRenderer emits no pattern defs for solid-fill-only scenes', t => {
  const svg = renderSVG(rectScene('steelblue'), 50, 50);
  t.notOk(/<pattern/.test(svg), 'no pattern element leaked into output');
  t.end();
});

tape('SVGStringRenderer emits a pattern def and references it from fill', t => {
  const svg = renderSVGString(rectScene(crosshatch()), 50, 50);
  t.ok(/<pattern[^>]*id="pattern_0"/.test(svg), 'pattern def with id pattern_0 present');
  // rect marks render as <path> elements in vega-scenegraph
  t.ok(/<path[^>]*fill="url\(#pattern_0\)"/.test(svg), 'rect mark path references the pattern def');
  t.end();
});

tape('SVGStringRenderer emits no pattern defs for solid-fill-only scenes', t => {
  const svg = renderSVGString(rectScene('steelblue'), 50, 50);
  t.notOk(/<pattern/.test(svg), 'no pattern element leaked into output');
  t.end();
});
