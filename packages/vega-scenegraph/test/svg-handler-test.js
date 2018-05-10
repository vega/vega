var tape = require('tape'),
    fs = require('fs'),
    vega = require('../'),
    Renderer = vega.SVGRenderer,
    Handler = vega.SVGHandler,
    jsdom = require('jsdom'),
    doc = (new jsdom.JSDOM()).window.document;

var res = './test/resources/';

var marks = JSON.parse(load('marks.json'));
for (var name in marks) { vega.sceneFromJSON(marks[name]); }

var events = [
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
  var r = new Renderer()
    .initialize(doc.body, w, h)
    .render(scene);
  delete global.document;
  return r.element();
}

function event(name, x, y) {
  var evt = doc.createEvent('MouseEvents');
  evt.initEvent(name, false, true);
  evt.clientX = x || 0;
  evt.clientY = y || 0;
  return evt;
}

tape('SVGHandler should add/remove event callbacks', function(test) {
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

  test.equal(Object.keys(h).length, 2);
  test.equal(array(h[atype]).length, 2);
  test.equal(array(h[ctype]).length, 1);

  test.equal(object(h[atype][0]).type, atype);
  test.equal(object(h[atype][1]).type, btype);
  test.equal(object(h[ctype][0]).type, ctype);

  test.equal(object(h[atype][0]).handler, f);
  test.equal(object(h[atype][1]).handler, f);
  test.equal(object(h[ctype][0]).handler, f);

  // remove event callback by type
  handler.off(atype);

  test.equal(Object.keys(h).length, 2);
  test.equal(array(h[atype]).length, 1);
  test.equal(array(h[ctype]).length, 1);

  test.equal(object(h[atype][0]).type, btype);
  test.equal(object(h[ctype][0]).type, ctype);

  test.equal(object(h[atype][0]).handler, f);
  test.equal(object(h[ctype][0]).handler, f);

  // remove all event callbacks
  handler.off(btype, f);
  handler.off(ctype, f);

  test.equal(array(h[atype]).length, 0);
  test.equal(array(h[ctype]).length, 0);

  test.end();
});

tape('SVGHandler should handle input events', function(test) {
  var scene = loadScene('scenegraph-rect.json');
  var handler = new Handler()
    .initialize(render(scene, 400, 200))
    .scene(scene);

  test.equal(handler.scene(), scene);

  var svg = handler.canvas();
  var count = 0;
  var increment = function() { count++; };

  events.forEach(function(name) {
    handler.on(name, increment);
  });
  test.equal(handler.handlers().length, events.length);

  events.forEach(function(name) {
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
  test.equal(count, events.length + 11);

  handler.off('mousemove', {});
  test.equal(handler.handlers().length, events.length);

  handler.off('nonevent');
  test.equal(handler.handlers().length, events.length);

  events.forEach(function(name) {
    handler.off(name, increment);
  });

  test.equal(handler.handlers().length, 0);
  test.end();
});
