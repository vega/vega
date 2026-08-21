import tape from 'tape';
import {JSDOM} from 'jsdom';
import {View} from '../index.js';
import {parse} from '../../vega-parser/index.js';

// a container-sized width signal, plus a counter of container:resize events
const spec = {
  padding: 0,
  height: 100,
  autosize: {type: 'fit', contains: 'padding'},
  signals: [
    {
      name: 'width',
      update: 'containerSize()[0]',
      on: [{events: 'container:resize', update: 'containerSize()[0]'}]
    },
    {
      name: 'resizes',
      value: 0,
      on: [{events: 'container:resize', update: 'resizes + 1'}]
    }
  ],
  marks: [{
    type: 'rect',
    encode: {update: {x: {value: 0}, y: {value: 0}, width: {signal: 'width'}, height: {value: 10}}}
  }]
};

function setup(width, height) {
  const dom = new JSDOM('<div id="view"></div>'),
        el = dom.window.document.querySelector('#view'),
        size = {width, height},
        observers = [];

  global.document = dom.window.document;
  global.window = dom.window;

  Object.defineProperty(el, 'clientWidth', {get: () => size.width});
  Object.defineProperty(el, 'clientHeight', {get: () => size.height});

  global.ResizeObserver = class {
    constructor(callback) {
      this.callback = callback;
      this.observed = [];
      this.disconnected = false;
      observers.push(this);
    }
    observe(el) { this.observed.push(el); }
    disconnect() { this.disconnected = true; }
  };

  return {
    el,
    size,
    observers,
    // deliver a ResizeObserver notification
    notify: () => observers[observers.length - 1].callback([]),
    teardown: () => {
      delete global.document;
      delete global.window;
      delete global.ResizeObserver;
    }
  };
}

// a container-sized height signal, for the content-sized container case
const heightSpec = Object.assign({}, spec, {
  signals: spec.signals.concat({
    name: 'height',
    update: 'containerSize()[1]',
    on: [{events: 'container:resize', update: 'containerSize()[1]'}]
  })
});

function newView(env, viewSpec) {
  const view = new View(parse(viewSpec || spec), {renderer: 'none'});
  view.initialize(env.el);
  return view;
}

function logger(warnings, errors) {
  return {
    error: message => { if (errors) errors.push(String(message)); },
    warn: message => warnings.push(String(message)),
    info() {},
    debug() {}
  };
}

// alternate dataflow runs and resize notifications, as a browser would,
// until a run leaves the container size unchanged
async function settle(env, view) {
  let last = [];
  for (let i = 0; i < 10; ++i) {
    await view.runAsync();
    if (env.size.width === last[0] && env.size.height === last[1]) return;
    last = [env.size.width, env.size.height];
    env.notify();
  }
  throw new Error('view did not settle');
}

tape('container:resize updates size signals when the container resizes', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env);

    await view.runAsync();
    t.equal(view.width(), 400, 'initial width from the container');

    env.size.width = 800;
    env.notify();
    await view.runAsync();

    t.equal(view.width(), 800, 'width signal follows the container');
    t.equal(view.signal('resizes'), 1, 'one container:resize event delivered');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container is only observed when a spec listens for resizes', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env, {width: 400, height: 100});

    await view.runAsync();

    t.equal(env.observers.length, 0, 'no observer created');
    t.equal(view._resizeObserver, null, 'no observer stored on the view');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container:resize accepts object-form event streams', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env, {
      height: 100,
      signals: [{
        name: 'resizes', value: 0,
        on: [{events: {source: 'container', type: 'resize'}, update: 'resizes + 1'}]
      }]
    });

    await view.runAsync();
    env.size.width = 800;
    env.notify();
    await view.runAsync();

    t.equal(view.signal('resizes'), 1, 'object-form stream receives events');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container:resize ignores notifications that leave the size unchanged', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env);

    await view.runAsync();

    // the observe-time notification, and any layout pass that does not
    // change the client size, dispatch nothing
    env.notify();
    env.notify();
    await view.runAsync();

    t.equal(view.signal('resizes'), 0, 'no events for unchanged sizes');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container:resize ignores zero-size notifications from hidden containers', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env);
    await view.runAsync();

    env.size.width = 0;
    env.size.height = 0;
    env.notify();
    await view.runAsync();
    t.equal(view.signal('resizes'), 0, 'no event while hidden');
    t.equal(view.width(), 400, 'width keeps the last real size');

    env.size.width = 600;
    env.size.height = 300;
    env.notify();
    await view.runAsync();
    t.equal(view.signal('resizes'), 1, 'one event on showing the container');
    t.equal(view.width(), 600, 'width follows the restored container');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container:resize does not drop a resize that lands mid-run', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env);

    await view.runAsync();

    env.size.width = 800;
    env.notify(); // queues a run for 800

    // the drag continues while that run is in flight, and then stops: the
    // second event chains onto the running dataflow rather than being lost
    env.size.width = 900;
    env.notify();

    await settle(env, view);

    t.equal(view.width(), 900, 'width signal ends at the latest container size');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container:resize settles when the container size follows the chart', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env, heightSpec);

    // a content-sized container: rendering the chart changes its own height
    view.addSignalListener('width', (_, value) => {
      env.size.height = value > 500 ? 260 : 160;
    });

    await settle(env, view);

    env.size.width = 800;
    env.notify();
    await settle(env, view);

    const resizes = view.signal('resizes');
    t.ok(resizes > 0 && resizes < 4, `converged after ${resizes} events`);
    t.equal(view.signal('height'), 260, 'height signal followed the container');

    // quiescent: nothing more happens without a genuine size change
    env.notify();
    await view.runAsync();
    t.equal(view.signal('resizes'), resizes, 'no further events once settled');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container:resize keeps up with a sustained drag', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env);

    await settle(env, view);

    // one size change per frame, as a browser delivers them during a drag
    for (let i = 1; i <= 20; ++i) {
      env.size.width = 400 + i * 20;
      env.notify();
      await view.runAsync();
    }

    t.equal(view.width(), 800, 'width tracked the whole drag');
    t.equal(view.signal('resizes'), 20, 'one event per notification');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container event listeners follow the events config', async t => {
  const env = setup(400, 300);
  try {
    const warnings = [],
          blocked = new View(parse(spec, {events: {container: false}}), {
            renderer: 'none',
            logger: logger(warnings)
          });

    blocked.initialize(env.el);
    await blocked.runAsync();
    t.equal(blocked._resizeObserver, null, 'container: false creates no observer');
    t.ok(
      warnings.includes('Blocked container resize event listener.'),
      'warns when blocked'
    );
    blocked.finalize();

    const allowed = new View(parse(spec, {events: {container: ['resize']}}), {renderer: 'none'});
    allowed.initialize(env.el);
    await allowed.runAsync();
    t.ok(allowed._resizeObserver, 'array config allowlists resize');
    allowed.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container streams registered after initialize are observed', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env, {width: 400, height: 100});
    await view.runAsync();
    t.equal(view._resizeObserver, null, 'no observer for a spec without container streams');

    const stream = view.events('container', 'resize');
    t.ok(view._resizeObserver, 'late registration inits the observer');

    env.size.width = 800;
    env.notify();
    await view.runAsync();
    t.equal(stream.value && stream.value.type, 'resize', 'late stream receives events');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container:resize rejects unsupported event types', async t => {
  const env = setup(400, 300);
  try {
    const warnings = [],
          view = new View(parse({
            height: 100,
            signals: [{
              name: 'clicks', value: 0,
              on: [{events: 'container:click', update: 'clicks + 1'}]
            }]
          }), {renderer: 'none', logger: logger(warnings)});

    view.initialize(env.el);
    await view.runAsync();

    t.deepEqual(warnings, ['Unsupported container event type: click'], 'warns once');
    t.equal(view._resizeObserver, null, 'no observer created');

    view.finalize();
  } finally {
    env.teardown();
  }
  t.end();
});

tape('container observer is disconnected on re-initialize and finalize', async t => {
  const env = setup(400, 300);
  try {
    const view = newView(env);

    await view.runAsync();
    const first = view._resizeObserver;
    t.deepEqual(first.observed, [env.el], 'observes the container element');

    view.initialize(env.el);
    const second = view._resizeObserver;
    t.ok(first.disconnected, 'previous observer disconnected on re-initialize');
    t.notEqual(second, first, 'a fresh observer is stored');

    view.finalize();
    t.ok(second.disconnected, 'observer disconnected on finalize');
    t.equal(view._resizeObserver, null, 'observer reference cleared');
  } finally {
    env.teardown();
  }
  t.end();
});
