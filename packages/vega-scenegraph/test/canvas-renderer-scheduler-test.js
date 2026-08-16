// Design notes for scheduled (chunked) canvas rendering, verified below:
//
// - Chunked renders draw to an offscreen scratch canvas and blit the
//   completed frame to the visible canvas. Drawing offscreen is required
//   for correctness, not just to avoid partial frames: CanvasHandler picks
//   against the visible canvas 2d context, so an event arriving between
//   chunks would otherwise hit-test on top of the suspended draw's
//   transform/clip stack.
// - The scratch canvas is discarded (forcing a full redraw on the next
//   scheduled render) whenever it could go stale: on resize, on a direct
//   synchronous render() that bypasses it, and on an aborted render that
//   leaves it partially drawn with unbalanced context saves.
// - Item batches are sliced from visitItems(), which returns items in the
//   same order visit() draws them (non-zindex items first, then z-sorted),
//   so chunking preserves paint order.
// - Group marks recurse asynchronously via group.drawAsync; nested
//   single-path marks (line, area, trail) draw atomically since their
//   items form one canvas path.
import tape from 'tape';
import fs from 'fs';
import {PNG} from 'pngjs';
import blazediff from '@blazediff/core';
import {Bounds, CanvasRenderer as Renderer, sceneFromJSON} from '../index.js';
import './__init__.js';

const res = './test/resources/';

const marks = JSON.parse(load('marks.json', 'utf-8'));

function load(file, encoding=null) {
  return fs.readFileSync(res + file, encoding);
}

function loadScene(file) {
  return sceneFromJSON(load(file, 'utf-8'));
}

function comparePNGs(png1, png2) {
  const img1 = PNG.sync.read(png1);
  const img2 = PNG.sync.read(png2);

  const {width, height} = img1;

  return blazediff(img1.data, img2.data, null, width, height, {threshold: 0});
}

// a test scheduler that requests a yield at every opportunity,
// maximally exercising chunked rendering code paths
function testScheduler() {
  return {
    yields: 0,
    reset() {},
    shouldYield() { return true; },
    yield() {
      this.yields += 1;
      return new Promise(resolve => setTimeout(resolve, 0));
    },
    didAbort() { return false; }
  };
}

function render(scene, w, h) {
  return new Renderer()
    .initialize(null, w, h)
    .render(scene)
    .canvas()
    .toBuffer();
}

function scheduledRenderer(w, h, scheduler) {
  return new Renderer()
    .initialize(null, w, h, null, undefined, {scheduler: scheduler});
}

async function renderScheduled(scene, w, h, scheduler) {
  const r = scheduledRenderer(w, h, scheduler);
  await r.renderAsync(scene);
  return r.canvas().toBuffer();
}

tape('CanvasRenderer scheduled rendering matches synchronous rendering', async t => {
  // image marks are excluded, as they require asynchronous resource
  // loading that is exercised by the standard canvas renderer tests
  const names = Object.keys(marks).filter(name => name !== 'image');

  for (const name of names) {
    const scheduler = testScheduler(),
          sync = render(sceneFromJSON(marks[name]), 500, 500),
          chunked = await renderScheduled(
            sceneFromJSON(marks[name]), 500, 500, scheduler);

    t.equal(comparePNGs(chunked, sync), 0, 'pixel-identical: ' + name);
    t.ok(scheduler.yields > 0, 'yielded: ' + name);
  }

  t.end();
});

tape('CanvasRenderer scheduled rendering supports nested groups', async t => {
  const scheduler = testScheduler(),
        sync = render(loadScene('scenegraph-barley.json'), 360, 740),
        chunked = await renderScheduled(
          loadScene('scenegraph-barley.json'), 360, 740, scheduler);

  t.equal(comparePNGs(chunked, sync), 0);
  t.ok(scheduler.yields > 0);
  t.end();
});

tape('CanvasRenderer scheduled rendering supports clipping and gradients', async t => {
  const sync = render(loadScene('scenegraph-defs.json'), 102, 102),
        chunked = await renderScheduled(
          loadScene('scenegraph-defs.json'), 102, 102, testScheduler());

  t.equal(comparePNGs(chunked, sync), 0);
  t.end();
});

tape('CanvasRenderer scheduled rendering respects zindex order', async t => {
  const sceneZ = () => {
    const scene = loadScene('scenegraph-rect.json'),
          rects = scene.items[0].items[0];
    rects.items.forEach((item, index) => {
      if (index % 3 === 0) item.zindex = -index;
    });
    rects.zdirty = true;
    return scene;
  };

  const sync = render(sceneZ(), 400, 200),
        chunked = await renderScheduled(sceneZ(), 400, 200, testScheduler());

  t.equal(comparePNGs(chunked, sync), 0);
  t.end();
});

tape('CanvasRenderer scheduled rendering batches large item counts', async t => {
  const buildScene = () => {
    const scene = {marktype: 'rect', clip: false, interactive: false, items: []};
    for (let i = 0; i < 1000; ++i) {
      const x = (i % 40) * 10, y = Math.floor(i / 40) * 10;
      scene.items.push({
        mark: scene, x: x, y: y, width: 8, height: 8,
        fill: i % 2 ? 'steelblue' : 'firebrick',
        bounds: new Bounds().set(x, y, x + 8, y + 8)
      });
    }
    return scene;
  };

  const scheduler = testScheduler(),
        sync = render(buildScene(), 400, 250),
        chunked = await renderScheduled(buildScene(), 400, 250, scheduler);

  t.equal(comparePNGs(chunked, sync), 0);
  t.ok(scheduler.yields >= 4, 'yielded between item batches');
  t.end();
});

tape('CanvasRenderer scheduled rendering supports single-item redraw', async t => {
  const scene = loadScene('scenegraph-rect.json'),
        r = scheduledRenderer(400, 200, testScheduler()).background('white');

  await r.renderAsync(scene);

  const rect = scene.items[0].items[0].items[1];
  r.dirty(rect);
  rect.fill = 'red';
  rect.width *= 2;
  rect.bounds.x2 = 2 * rect.bounds.x2 - rect.bounds.x1;
  r.dirty(rect);
  await r.renderAsync(scene);

  const image = r.canvas().toBuffer();
  const file = load('png/scenegraph-single-redraw.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer scheduled rendering rejects upon abort and recovers', async t => {
  const reason = new Error('render cancelled');

  // a scheduler that aborts after two yields
  const aborting = {
    yields: 0,
    reset() {},
    shouldYield() { return true; },
    yield() {
      if (++this.yields > 2) throw reason;
      return new Promise(resolve => setTimeout(resolve, 0));
    },
    didAbort(error) { return error === reason; }
  };

  const scene = loadScene('scenegraph-rect.json'),
        r = scheduledRenderer(400, 200, aborting);

  try {
    await r.renderAsync(scene);
    t.fail('render did not reject upon abort');
  } catch (error) {
    t.equal(error, reason, 'rejected with the abort reason');
  }

  // subsequent renders perform a full redraw on a fresh scratch canvas
  r._scheduler = testScheduler();
  await r.renderAsync(scene);

  const sync = render(loadScene('scenegraph-rect.json'), 400, 200);
  t.equal(comparePNGs(r.canvas().toBuffer(), sync), 0);
  t.end();
});

tape('CanvasRenderer ignores scheduling with an external context', t => {
  const externalCanvas = new Renderer().initialize(null, 200, 200).canvas(),
        r = new Renderer().initialize(null, 200, 200, null, undefined, {
          externalContext: externalCanvas.getContext('2d'),
          scheduler: testScheduler()
        });

  t.equal(r._scheduler, null, 'scheduler is disabled');
  r.render(loadScene('scenegraph-rect.json'));
  t.end();
});
