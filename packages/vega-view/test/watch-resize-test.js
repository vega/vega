import tape from 'tape';
import watchResize from '../src/watchResize.js';
import finalize from '../src/finalize.js';

// a minimal stand-in for the browser ResizeObserver
function installResizeObserver() {
  const instances = [];
  class MockResizeObserver {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      this.disconnected = false;
      instances.push(this);
    }
    observe(el) { this.observed.push(el); }
    disconnect() { this.disconnected = true; }
  }
  global.ResizeObserver = MockResizeObserver;
  return instances;
}

function uninstallResizeObserver() {
  delete global.ResizeObserver;
}

function mockElement(width, height) {
  return {clientWidth: width, clientHeight: height};
}

// a minimal stand-in for a View with just what watchResize touches
function mockView(el) {
  return {
    _resizeObserver: null,
    resizeCount: 0,
    container() { return el; },
    resize() {
      this.resizeCount++;
      return {runAsync() { return Promise.resolve(); }};
    }
  };
}

tape('watchResize observes the container element', t => {
  const instances = installResizeObserver();
  const el = mockElement(100, 50);
  const view = mockView(el);

  watchResize.call(view);

  t.equal(instances.length, 1, 'one observer created');
  t.equal(view._resizeObserver, instances[0], 'observer stored on the view');
  t.deepEqual(instances[0].observed, [el], 'observes the container element');

  uninstallResizeObserver();
  t.end();
});

tape('watchResize resizes the view when the container size changes', t => {
  installResizeObserver();
  const el = mockElement(100, 50);
  const view = mockView(el);

  watchResize.call(view);

  el.clientWidth = 200;
  view._resizeObserver.callback([]);

  t.equal(view.resizeCount, 1, 'resize called once on size change');

  uninstallResizeObserver();
  t.end();
});

tape('watchResize ignores notifications that do not change the container size', t => {
  installResizeObserver();
  const el = mockElement(100, 50);
  const view = mockView(el);

  watchResize.call(view);


  view._resizeObserver.callback([]);

  t.equal(view.resizeCount, 0, 'resize not called when size is unchanged');

  uninstallResizeObserver();
  t.end();
});

tape('watchResize is not called when ResizeObserver is unavailable', t => {
  uninstallResizeObserver();
  const view = mockView(mockElement(100, 50));

  watchResize.call(view);

  t.equal(view._resizeObserver, null, 'no observer created');
  t.end();
});

tape('watchResize is not called when there is no container', t => {
  installResizeObserver();
  const view = mockView(null);

  watchResize.call(view);

  t.equal(view._resizeObserver, null, 'no observer created');

  uninstallResizeObserver();
  t.end();
});

tape('watchResize disconnects a prior observer before creating a new one', t => {
  const instances = installResizeObserver();
  const view = mockView(mockElement(100, 50));

  watchResize.call(view);
  const first = view._resizeObserver;
  watchResize.call(view);
  const second = view._resizeObserver;

  t.equal(instances.length, 2, 'two observers created across re-initialization');
  t.ok(first.disconnected, 'previous observer disconnected');
  t.notEqual(first, second, 'a fresh observer is stored');
  t.notOk(second.disconnected, 'the new observer stays connected');

  uninstallResizeObserver();
  t.end();
});


tape('finalize disconnects the resize observer', t => {
  let disconnected = false;
  const view = {
    _tooltip: null,
    _timers: [],
    _eventListeners: [],
    _handler: {handlers: () => [], off() {}},
    _resizeObserver: {disconnect() { disconnected = true; }}
  };

  finalize.call(view);

  t.ok(disconnected, 'observer disconnected on finalize');
  t.equal(view._resizeObserver, null, 'observer reference cleared');
  t.end();
});
