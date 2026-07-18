import tape from 'tape';
import fs from 'fs';
import {SVGHandler as Handler, SVGRenderer as Renderer, sceneFromJSON} from '../index.js';
import {JSDOM} from 'jsdom';

const dom = new JSDOM();
const doc = dom.window.document;
const res = './test/resources/';

const marks = JSON.parse(load('marks.json'));
for (const name in marks) { sceneFromJSON(marks[name]); }

const events = [
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'pointerdown',
  'pointerup',
  'pointermove',
  'pointerout',
  'pointerover',
  'dragover',
  'dragenter',
  'dragleave',
  'click',
  'dblclick',
  'wheel',
  'mousewheel',
  'touchstart',
  'touchmove',
  'touchend'
];

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return sceneFromJSON(load(file));
}

function render(scene, w, h) {
  global.document = doc;
  const r = new Renderer()
    .initialize(doc.body, w, h)
    .render(scene);
  delete global.document;
  return r.element();
}

function event(name, x, y) {
  return new dom.window.MouseEvent(name, {
    clientX: x || 0,
    clientY: y || 0,
    bubbles: true,
    cancelable: true
  });
}

tape('SVGHandler should add/remove event callbacks', t => {
  var array = function(_) { return _ || []; },
      object = function(_) { return _ || {}; },
      handler = new Handler(),
      h = handler._handlers,
      f = function() {},
      atype = 'click',
      btype = 'click.foo',
      ctype = 'pointerover';

  // add event callbacks
  handler.on(atype, f);
  handler.on(btype, f);
  handler.on(ctype, f);

  t.equal(Object.keys(h).length, 2);
  t.equal(array(h[atype]).length, 2);
  t.equal(array(h[ctype]).length, 1);

  t.equal(object(h[atype][0]).type, atype);
  t.equal(object(h[atype][1]).type, btype);
  t.equal(object(h[ctype][0]).type, ctype);

  t.equal(object(h[atype][0]).handler, f);
  t.equal(object(h[atype][1]).handler, f);
  t.equal(object(h[ctype][0]).handler, f);

  // remove event callback by type
  handler.off(atype);

  t.equal(Object.keys(h).length, 2);
  t.equal(array(h[atype]).length, 1);
  t.equal(array(h[ctype]).length, 1);

  t.equal(object(h[atype][0]).type, btype);
  t.equal(object(h[ctype][0]).type, ctype);

  t.equal(object(h[atype][0]).handler, f);
  t.equal(object(h[ctype][0]).handler, f);

  // remove all event callbacks
  handler.off(btype, f);
  handler.off(ctype, f);

  t.equal(array(h[atype]).length, 0);
  t.equal(array(h[ctype]).length, 0);

  t.end();
});

tape('SVGHandler should handle input events', t => {
  const scene = loadScene('scenegraph-rect.json');
  const handler = new Handler()
    .initialize(render(scene, 400, 200))
    .scene(scene);

  t.equal(handler.scene(), scene);

  const svg = handler.canvas();
  let count = 0;
  const increment = function() { count++; };

  events.forEach(name => {
    handler.on(name, increment);
  });
  t.equal(handler.handlers().length, events.length);

  events.forEach(name => {
    svg.dispatchEvent(event(name));
  });

  svg.dispatchEvent(event('pointermove', 0, 0));
  svg.dispatchEvent(event('pointermove', 50, 150));
  svg.dispatchEvent(event('pointerdown', 50, 150));
  svg.dispatchEvent(event('pointerup', 50, 150));
  svg.dispatchEvent(event('click', 50, 150));
  svg.dispatchEvent(event('pointermove', 50, 151));
  svg.dispatchEvent(event('pointermove', 50, 1));
  svg.dispatchEvent(event('pointerout', 1, 1));
  svg.dispatchEvent(event('dragover', 50, 151));
  svg.dispatchEvent(event('dragover', 50, 1));
  svg.dispatchEvent(event('dragleave', 1, 1));

  // 11 events above + no sub-events from JSDOM
  t.equal(count, events.length + 11);

  handler.off('pointermove', {});
  t.equal(handler.handlers().length, events.length);

  handler.off('nonevent');
  t.equal(handler.handlers().length, events.length);

  events.forEach(name => {
    handler.off(name, increment);
  });

  t.equal(handler.handlers().length, 0);
  t.end();
});
