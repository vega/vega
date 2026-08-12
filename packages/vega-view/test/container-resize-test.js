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
        observers = [],
        frames = [];

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

  global.requestAnimationFrame = callback => frames.push(callback);

  return {
    el,
    size,
    observers,
    frames,
    // deliver a ResizeObserver notification
    notify: () => observers[observers.length - 1].callback([]),
    // invoke pending animation frame callbacks
    flush: () => frames.splice(0, frames.length).forEach(callback => callback()),
    teardown: () => {
      delete global.document;
      delete global.window;
      delete global.ResizeObserver;
      delete global.requestAnimationFrame;
    }
  };
}

function newView(env, viewSpec) {
  const view = new View(parse(viewSpec || spec), {renderer: 'none'});
  view.initialize(env.el);
  return view;
}

tape('container:resize updates size signals when the container resizes', async t => {
  const env = setup(400, 300),
        view = newView(env);

  await view.runAsync();
  t.equal(view.width(), 400, 'initial width from the container');

  env.size.width = 800;
  env.notify();
  env.flush();
  await view.runAsync();

  t.equal(view.width(), 800, 'width signal follows the container');
  t.equal(view.signal('resizes'), 1, 'one container:resize event delivered');

  view.finalize();
  env.teardown();
  t.end();
});

tape('container is only observed when a spec listens for resizes', async t => {
  const env = setup(400, 300),
        view = newView(env, {width: 400, height: 100});

  await view.runAsync();

  t.equal(env.observers.length, 0, 'no observer created');
  t.equal(view._resizeObserver, null, 'no observer stored on the view');

  view.finalize();
  env.teardown();
  t.end();
});

tape('container:resize coalesces notifications into a single event', async t => {
  const env = setup(400, 300),
        view = newView(env);

  await view.runAsync();

  env.size.width = 500;
  env.notify();
  env.size.width = 600;
  env.notify();
  env.size.width = 700;
  env.notify();

  t.equal(env.frames.length, 1, 'one animation frame requested');

  env.flush();
  await view.runAsync();

  t.equal(view.signal('resizes'), 1, 'one event delivered for three notifications');
  t.equal(view.width(), 700, 'width signal reflects the latest container size');

  view.finalize();
  env.teardown();
  t.end();
});

tape('container:resize ignores size changes caused by its own run', async t => {
  const env = setup(400, 300),
        view = newView(env);

  await view.runAsync();

  env.size.width = 800;
  env.notify();
  env.flush();

  // a content-sized container re-measures while the view is re-rendering
  env.size.height = 500;
  env.notify();
  t.equal(env.frames.length, 0, 'no frame requested while the view is running');

  await view.runAsync();
  await Promise.resolve();

  env.notify();
  env.flush();
  await view.runAsync();

  t.equal(view.signal('resizes'), 1, 'the induced size change did not trigger a second event');

  view.finalize();
  env.teardown();
  t.end();
});

tape('container:resize is a no-op without ResizeObserver or a container', async t => {
  const env = setup(400, 300);
  delete global.ResizeObserver;

  const unsupported = newView(env);
  await unsupported.runAsync();
  t.equal(unsupported._resizeObserver, null, 'no observer without ResizeObserver support');
  unsupported.finalize();

  const headless = new View(parse(spec), {renderer: 'none'});
  await headless.runAsync();
  t.equal(headless._resizeObserver, null, 'no observer without a container element');
  headless.finalize();

  env.teardown();
  t.end();
});

tape('container:resize rejects unsupported event types', async t => {
  const env = setup(400, 300),
        warnings = [],
        view = new View(parse({
          height: 100,
          signals: [{
            name: 'clicks', value: 0,
            on: [{events: 'container:click', update: 'clicks + 1'}]
          }]
        }), {
          renderer: 'none',
          logger: {
            error() {}, warn: message => warnings.push(message), info() {}, debug() {}
          }
        });

  view.initialize(env.el);
  await view.runAsync();

  t.deepEqual(warnings, ['Unsupported container event type: click'], 'warns once');
  t.equal(view._resizeObserver, null, 'no observer created');

  view.finalize();
  env.teardown();
  t.end();
});

tape('container observer is disconnected on re-initialize and finalize', async t => {
  const env = setup(400, 300),
        view = newView(env);

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

  env.teardown();
  t.end();
});
