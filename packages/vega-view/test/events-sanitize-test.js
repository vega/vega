import tape from 'tape';
import {events, initializeEventConfig} from '../src/events.js';

function createStubView() {
  return {
    _eventConfig: initializeEventConfig({}),
    _eventListeners: [],
    _renderer: {canvas: () => null},
    _origin: [0, 0],
    _viewWidth: 0,
    _viewHeight: 0,
    dataflow: {},
    padding() {
      return {top: 0, right: 0, bottom: 0, left: 0};
    },
    runAsync(_, fn) {
      fn();
    },
    addEventListener(type, handler) {
      (this._listeners || (this._listeners = {}))[type] = handler;
    },
    preventDefault() {
      return false;
    },
    warn() {},
    timer() {},
    tooltip() {
      return () => {};
    }
  };
}

tape('events sanitize DOM event objects', t => {
  const view = createStubView();
  const stream = events.call(view, 'view', 'click');

  let received;
  stream.targets().add({
    receive(evt) {
      received = evt;
    }
  });

  const doc = {defaultView: {}};
  const parent = {ownerDocument: doc, nodeType: 1};
  const target = {
    ownerDocument: doc,
    parentNode: parent,
    parentElement: parent,
    nodeType: 1
  };
  const related = {ownerDocument: doc, nodeType: 1};

  const rawEvent = {
    type: 'click',
    view: {},
    path: [target, parent],
    composedPath() {
      return [target, parent];
    },
    deepPath() {
      return [target, parent];
    },
    srcElement: target,
    sourceEvent: {foo: 'bar'},
    originalTarget: target,
    target,
    relatedTarget: related,
    metaKey: true,
    preventDefault() {},
    stopPropagation() {}
  };

  t.ok(view._listeners && view._listeners.click, 'event listener registered');
  view._listeners.click(rawEvent);

  t.ok(received, 'event delivered to stream');
  t.equal(received.view, undefined, 'view property removed');
  t.deepEqual(received.composedPath(), [], 'composedPath cleared');
  t.deepEqual(received.deepPath(), [], 'deepPath cleared');
  t.equal(received.srcElement, undefined, 'srcElement removed');
  t.equal(received.sourceEvent, undefined, 'sourceEvent removed');
  t.equal(received.originalTarget, undefined, 'originalTarget removed');
  t.equal(received.path, undefined, 'path removed');
  t.equal(received.target.ownerDocument, undefined, 'target ownerDocument hidden');
  t.equal(
    received.target.parentNode.ownerDocument,
    undefined,
    'parent nodes sanitized'
  );
  t.equal(
    received.relatedTarget.ownerDocument,
    undefined,
    'relatedTarget sanitized'
  );
  t.ok(received.metaKey, 'benign properties preserved');
  t.equal(typeof received.vega.view, 'function', 'vega helper still available');

  t.end();
});
