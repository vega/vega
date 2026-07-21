import tape from 'tape';
import jsdom from 'jsdom';
import * as vega from '../index.js';

// Minimal spec; we only care about View wiring, not rendered output.
const runtime = vega.parse({width: 200, height: 200});

// Stub ResizeObserver and record instances so we can assert on them.
function installResizeObserver() {
  const instances = [];
  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      this.disconnected = false;
      instances.push(this);
    }
    observe(el) { this.observed.push(el); }
    disconnect() { this.disconnected = true; }
  };
  return instances;
}

function setup() {
  global.document = (new jsdom.JSDOM()).window.document;
  return global.document.createElement('div');
}

function teardown() {
  delete global.document;
  delete global.ResizeObserver;
}

tape('View observes its container for resizes by default', t => {
  const instances = installResizeObserver();
  const el = setup();

  const view = new vega.View(runtime, {container: el, renderer: 'svg'});

  t.equal(instances.length, 1, 'a ResizeObserver was created');
  t.ok(view._resizeObserver, 'observer stored on the view');
  t.deepEqual(instances[0].observed, [view.container()], 'observes the container');

  view.finalize();
  t.ok(instances[0].disconnected, 'finalize disconnects the observer');
  t.equal(view._resizeObserver, null, 'observer reference cleared on finalize');

  teardown();
  t.end();
});

tape('View falls back gracefully when ResizeObserver is unavailable', t => {
  const el = setup(); // note: no ResizeObserver installed

  const view = new vega.View(runtime, {container: el, renderer: 'svg'});

  t.equal(view._resizeObserver, null, 'no observer created without ResizeObserver support');

  view.finalize();
  teardown();
  t.end();
});

tape('View re-initialization does not leak observers', t => {
  const instances = installResizeObserver();
  const el = setup();

  const view = new vega.View(runtime, {container: el, renderer: 'svg'});
  const first = view._resizeObserver;

  // re-initialize onto the same container (e.g. renderer change)
  view.initialize(el);
  const second = view._resizeObserver;

  t.equal(instances.length, 2, 'a new observer created on re-initialization');
  t.ok(first.disconnected, 'the previous observer was disconnected');
  t.notEqual(first, second, 'a fresh observer is stored');

  view.finalize();
  teardown();
  t.end();
});
