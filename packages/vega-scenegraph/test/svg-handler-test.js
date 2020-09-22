var tape = require('tape'),
    fs = require('fs'),
    vega = require('../'),
    Renderer = vega.SVGRenderer,
    Handler = vega.SVGHandler,
    jsdom = require('jsdom'),
    doc = (new jsdom.JSDOM()).window.document;

const res = './test/resources/';

const marks = JSON.parse(load('marks.json'));
for (const name in marks) { vega.sceneFromJSON(marks[name]); }

const events = [
  'keydown',
  'keypress',
  'keyup',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
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
  return vega.sceneFromJSON(load(file));
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
  const evt = doc.createEvent('MouseEvents');
  evt.initEvent(name, false, true);
  evt.clientX = x || 0;
  evt.clientY = y || 0;
  return evt;
}

tape('SVGHandler should add/remove event callbacks', t => {
  var array = function(_) { return _ || []; },
      object = function(_) { return _ || {}; },
      handler = new Handler(),
      h = handler._handlers,
      f = function() {},
      atype = 'click',
      btype = 'click.foo',
      ctype = 'mouseover';

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

  svg.dispatchEvent(event('mousemove', 0, 0));
  svg.dispatchEvent(event('mousemove', 50, 150));
  svg.dispatchEvent(event('mousedown', 50, 150));
  svg.dispatchEvent(event('mouseup', 50, 150));
  svg.dispatchEvent(event('click', 50, 150));
  svg.dispatchEvent(event('mousemove', 50, 151));
  svg.dispatchEvent(event('mousemove', 50, 1));
  svg.dispatchEvent(event('mouseout', 1, 1));
  svg.dispatchEvent(event('dragover', 50, 151));
  svg.dispatchEvent(event('dragover', 50, 1));
  svg.dispatchEvent(event('dragleave', 1, 1));

  // 11 events above + no sub-events from JSDOM
  t.equal(count, events.length + 11);

  handler.off('mousemove', {});
  t.equal(handler.handlers().length, events.length);

  handler.off('nonevent');
  t.equal(handler.handlers().length, events.length);

  events.forEach(name => {
    handler.off(name, increment);
  });

  t.equal(handler.handlers().length, 0);
  t.end();
});
