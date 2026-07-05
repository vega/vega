import tape from 'tape';
import jsdom from 'jsdom';
import {canvas} from 'vega-canvas';
import {
  SVGRenderer,
  SVGStringRenderer,
  resetSVGDefIds,
  sceneFromJSON
} from '../index.js';

const doc = (new jsdom.JSDOM()).window.document;

// a w x h solid red PNG as a data URI (loads through ResourceLoader)
function pngURI(w, h) {
  const c = canvas(w, h);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f00';
  ctx.fillRect(0, 0, w, h);
  return c.toDataURL();
}

function rectScene(fill) {
  return sceneFromJSON({
    marktype: 'rect',
    items: [
      {x: 0, y: 0, width: 20, height: 20, fill}
    ]
  });
}

// await the renderer's pending-load redraw (Renderer#_load sets _ready
// while resource loading is in flight); resolves immediately if no
// loads were requested.
function ready(r) {
  return r._ready || Promise.resolve();
}

tape('SVGStringRenderer emits an intrinsic image pattern def shell, then dims on load', t => {
  const uri = pngURI(4, 3);
  const scene = rectScene({pattern: {url: uri, background: 'white'}});

  resetSVGDefIds();
  const r = new SVGStringRenderer().initialize(null, 50, 50);
  r.render(scene);

  // (a) shell before load: def present, background painted, no image yet
  const shell = r.svg();
  t.ok(/<pattern[^>]*id="pattern_0"/.test(shell), 'def shell present before load');
  t.ok(/<path[^>]*fill="url\(#pattern_0\)"/.test(shell), 'mark references the def shell');
  t.ok(/<rect[^>]*fill="white"/.test(shell), 'background rect paints while loading');
  t.notOk(shell.includes('<image'), 'no image child before load');
  t.ok(r._ready, 'a load-triggered redraw is pending');

  ready(r).then(() => {
    // (b) after load: same def id, image child with natural dims
    const svg = r.svg();
    const m = svg.match(/<pattern[^>]*id="pattern_0"[^>]*>/);
    t.ok(m, 'def id stays stable across the load');
    t.ok(/width="4"/.test(m[0]), 'cell width = natural image width');
    t.ok(/height="3"/.test(m[0]), 'cell height = natural image height');
    t.ok(svg.includes('<image'), 'image child present after load');
    t.ok(svg.includes(`href="${uri}"`), 'image child carries the source url');
    t.ok(/<image[^>]*width="4"[^>]*height="3"/.test(svg), 'image child sized to natural dims');
    t.ok(/<rect[^>]*width="4"[^>]*height="3"[^>]*fill="white"/.test(svg),
      'background rect tightens to the tile cell');
    t.ok(/<path[^>]*fill="url\(#pattern_0\)"/.test(svg), 'mark still references the same def');
    t.end();
  });
});

tape('SVGRenderer emits intrinsic image pattern dims after load (DOM path)', t => {
  const uri = pngURI(4, 3);
  const scene = rectScene({pattern: {url: uri}});

  for (let i = doc.body.children.length; --i >= 0;) {
    doc.body.removeChild(doc.body.children[i]);
  }
  resetSVGDefIds();
  const r = new SVGRenderer().initialize(doc.body, 50, 50);
  r.render(scene);

  const shell = r.svg();
  t.ok(/<pattern[^>]*id="pattern_0"/.test(shell), 'def shell present before load');
  t.notOk(shell.includes('<image'), 'no image child before load');

  ready(r).then(() => {
    const svg = r.svg();
    t.ok(/<pattern[^>]*id="pattern_0"/.test(svg), 'def id stable across the load');
    t.ok(/<image[^>]*width="4"[^>]*height="3"/.test(svg) ||
         /<image[^>]*height="3"[^>]*width="4"/.test(svg),
      'image child sized to natural dims after load');
    t.end();
  });
});

tape('numeric tileSize image patterns preserve the natural aspect (canvas semantics)', t => {
  const uri = pngURI(4, 3); // 4:3 natural aspect
  const scene = rectScene({pattern: {url: uri, tileSize: 8}});

  resetSVGDefIds();
  const r = new SVGStringRenderer().initialize(null, 50, 50);
  r.render(scene);

  // shell: tile width known upfront, square placeholder height, no image
  const shell = r.svg();
  t.ok(/<pattern[^>]*id="pattern_0"[^>]*width="8"[^>]*height="8"/.test(shell),
    'shell cell: known width, square placeholder height');
  t.notOk(shell.includes('<image'), 'no image child before the aspect loads');
  t.ok(r._ready, 'a load-triggered redraw is pending');

  ready(r).then(() => {
    // loaded: tileSize = tile width; height = tileSize * naturalH/naturalW
    const svg = r.svg();
    t.ok(/<pattern[^>]*id="pattern_0"[^>]*width="8"[^>]*height="6"/.test(svg),
      'cell 8x6: width = tileSize, height preserves the 4:3 aspect');
    t.ok(/<image[^>]*width="8"[^>]*height="6"/.test(svg), 'image sized to the aspect-true cell');
    t.end();
  });
});

tape('failed image loads leave a bounded def shell (no throw, no image, no retry)', t => {
  // passes the loader's sanitize step but is not a decodable image
  const bogus = 'data:image/png;base64,AAAA';
  const scene = rectScene({pattern: {url: bogus, background: 'white'}});

  resetSVGDefIds();
  const r = new SVGStringRenderer().initialize(null, 50, 50);
  t.doesNotThrow(() => r.render(scene), 'render survives a bad image url');

  ready(r).then(() => {
    const svg = r.svg();
    t.ok(/<pattern[^>]*id="pattern_0"/.test(svg), 'def shell present after the failed load');
    t.ok(/<rect[^>]*fill="white"/.test(svg), 'background still paints');
    t.notOk(svg.includes('<image'), 'no image child for a failed load');

    // a subsequent render must not re-request the load (bounded)
    r.render(scene);
    t.notOk(r._ready, 'failed load is not retried on later renders');
    t.notOk(r.svg().includes('<image'), 'still a shell on later renders');
    t.end();
  });
});

tape('distinct but content-equal wrappers share one def across items', t => {
  const uri = pngURI(4, 3);
  const scene = sceneFromJSON({
    marktype: 'rect',
    items: [
      {x: 0, y: 0, width: 20, height: 20, fill: {pattern: {url: uri, tileSize: 8}}},
      {x: 30, y: 0, width: 20, height: 20, fill: {pattern: {url: uri, tileSize: 8}}}
    ]
  });

  resetSVGDefIds();
  const r = new SVGStringRenderer().initialize(null, 60, 30);
  r.render(scene);

  ready(r).then(() => {
    const svg = r.svg();
    const defs = svg.match(/<pattern[^>]*id="pattern_\d+"/g) || [];
    t.equal(defs.length, 1, 'exactly one pattern def for content-equal wrappers');
    const refs = svg.match(/fill="url\(#pattern_0\)"/g) || [];
    t.equal(refs.length, 2, 'both items reference the shared def');
    t.end();
  });
});

tape('bounds-fit image patterns contain-fit with the natural aspect after load', t => {
  const uri = pngURI(4, 3); // 4:3 natural aspect
  const scene = rectScene({pattern: {url: uri, tileSize: 'bounds'}}); // 20x20 box

  resetSVGDefIds();
  const r = new SVGStringRenderer().initialize(null, 50, 50);
  r.render(scene);

  const shell = r.svg();
  t.ok(/<pattern[^>]*patternContentUnits="objectBoundingBox"/.test(shell),
    'objectBoundingBox def shell present before load');
  t.notOk(shell.includes('<image'), 'no image child before the aspect is known');

  ready(r).then(() => {
    // contain-fit of a 4:3 tile in a square box: full width, 3/4 height,
    // vertically centered -> x=0, y=0.125, w=1, h=0.75
    const svg = r.svg();
    const m = svg.match(/<image[^>]*>/);
    t.ok(m, 'image child present after load');
    t.ok(/x="0"/.test(m[0]), 'contain fit x');
    t.ok(/y="0.125"/.test(m[0]), 'contain fit y (centered)');
    t.ok(/width="1"/.test(m[0]), 'contain fit width');
    t.ok(/height="0.75"/.test(m[0]), 'contain fit height (natural aspect)');
    t.end();
  });
});
