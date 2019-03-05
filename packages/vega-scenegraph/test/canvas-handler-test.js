var fs = require('fs');
var vega = require('../');
var loader = require('vega-loader').loader;
var Renderer = vega.CanvasRenderer;
var Handler = vega.CanvasHandler;

var res = __dirname + '/resources/';

var marks = JSON.parse(load('marks.json'));
for (var name in marks) { vega.sceneFromJSON(marks[name]); }

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return vega.sceneFromJSON(load(file));
}

function render(scene, w, h) {
  global.document = document;
  var r = new Renderer()
    .initialize(document.body, w, h)
    .render(scene);
  delete global.document;
  return r.element();
}

function renderAsync(scene, w, h, callback) {
  global.document = document;
  new Renderer(loader({mode: 'http', baseURL: './test/resources/'}))
    .initialize(document.body, w, h)
    .renderAsync(scene)
    .then(function(r) { callback(r.element()); });
  delete global.document;
}

function event(name, x, y) {
  var evt = new window.MouseEvent(name, {clientX: x, clientY: y});
  evt.changedTouches = [{
    clientX: x || 0,
    clientY: y || 0
  }];
  return evt;
}

test('CanvasHandler should add/remove event callbacks', function() {
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

  expect(Object.keys(h).length).toBe(2);
  expect(array(h[atype]).length).toBe(2);
  expect(array(h[ctype]).length).toBe(1);

  expect(object(h[atype][0]).type).toBe(atype);
  expect(object(h[atype][1]).type).toBe(btype);
  expect(object(h[ctype][0]).type).toBe(ctype);

  expect(object(h[atype][0]).handler).toBe(f);
  expect(object(h[atype][1]).handler).toBe(f);
  expect(object(h[ctype][0]).handler).toBe(f);

  // remove event callback by type
  handler.off(atype);

  expect(Object.keys(h).length).toBe(2);
  expect(array(h[atype]).length).toBe(1);
  expect(array(h[ctype]).length).toBe(1);

  expect(object(h[atype][0]).type).toBe(btype);
  expect(object(h[ctype][0]).type).toBe(ctype);

  expect(object(h[atype][0]).handler).toBe(f);
  expect(object(h[ctype][0]).handler).toBe(f);

  // remove all event callbacks
  handler.off(btype, f);
  handler.off(ctype, f);

  expect(array(h[atype]).length).toBe(0);
  expect(array(h[ctype]).length).toBe(0);
});

test('CanvasHandler should handle input events', function() {
  var scene = loadScene('scenegraph-rect.json');
  var handler = new Handler()
    .initialize(render(scene, 400, 200))
    .scene(scene);

  expect(handler.scene()).toBe(scene);

  var canvas = handler.canvas();
  var count = 0;
  var increment = function() { count++; };

  handler.events.forEach(function(name) {
    handler.on(name, increment);
  });
  expect(handler.handlers().length).toBe(handler.events.length);

  handler.events.forEach(function(name) {
    canvas.dispatchEvent(event(name));
  });

  handler.DOMMouseScroll(event('mousewheel'));
  canvas.dispatchEvent(event('mousemove', 0, 0));
  canvas.dispatchEvent(event('mousemove', 50, 150));
  canvas.dispatchEvent(event('mousedown', 50, 150));
  canvas.dispatchEvent(event('mouseup', 50, 150));
  canvas.dispatchEvent(event('click', 50, 150));
  canvas.dispatchEvent(event('mousemove', 50, 151));
  canvas.dispatchEvent(event('mousemove', 50, 1));
  canvas.dispatchEvent(event('mouseout', 1, 1));
  canvas.dispatchEvent(event('dragover', 50, 151));
  canvas.dispatchEvent(event('dragover', 50, 1));
  canvas.dispatchEvent(event('dragleave', 1, 1));

  // 12 events above + 8 triggered:
  //   2*(mouseover, mouseout) + 2*(dragenter, dragleave)
  expect(count).toBe(handler.events.length + 20);

  handler.off('mousemove', {});
  expect(handler.handlers().length).toBe(handler.events.length);

  handler.off('nonevent');
  expect(handler.handlers().length).toBe(handler.events.length);

  handler.events.forEach(function(name) {
    handler.off(name, increment);
  });
  expect(handler.handlers().length).toBe(0);
});

test('CanvasHandler should pick elements in scenegraph', function() {
  var scene = loadScene('scenegraph-rect.json');
  var handler = new Handler().initialize(render(scene, 400, 200));
  expect(handler.pick(scene, 20, 180, 20, 180)).toBeTruthy();
  expect(handler.pick(scene, 0, 0, 0, 0)).toBeFalsy();
  expect(handler.pick(scene, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should pick arc mark', function() {
  var mark = marks.arc;
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 260, 300, 260, 300)).toBeTruthy();
  expect(handler.pick(mark, 248, 250, 248, 250)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should pick area mark', function() {
  var mark = marks['area-h'];
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 100, 150, 100, 150)).toBeTruthy();
  expect(handler.pick(mark, 100, 50, 100, 50)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();

  mark = marks['area-v'];
  handler = new Handler().initialize(render(mark, 500, 500));
  handler.context().pixelRatio = 0.99; // for test coverage
  expect(handler.pick(mark, 100, 100, 100, 100)).toBeTruthy();
  expect(handler.pick(mark, 50, 50, 50, 50)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should pick group mark', function() {
  var mark = {
    "marktype": "group",
    "name": "class-name",
    "items": [
      {"x":5, "y":5, "width":100, "height":56, "fill":"steelblue", "clip":true, "items":[]}
    ]
  };
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 50, 50, 50, 50)).toBeTruthy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should pick image mark', function(done) {
  var mark = marks.image;
  renderAsync(mark, 500, 500, function(el) {
    var handler = new Handler().initialize(el);
    expect(handler.pick(mark, 250, 150, 250, 150)).toBeTruthy();
    expect(handler.pick(mark, 100, 305, 100, 305)).toBeFalsy();
    expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
    done();
  });
});

test('CanvasHandler should pick line mark', function() {
  var mark = marks['line-2'];
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 100, 144, 100, 144)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();

  // fake isPointInStroke until node canvas supports it
  var g = handler.context();
  g.pixelRatio = 1.1;
  g.isPointInStroke = function() { return true; };
  expect(handler.pick(mark, 0, 144, 0, 144)).toBeTruthy();

  mark = marks['line-1'];
  handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 100, 144, 100, 144)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();

  // fake isPointInStroke until node canvas supports it
  g = handler.context();
  g.isPointInStroke = function() { return true; };
  expect(handler.pick(mark, 0, 144, 0, 144)).toBeTruthy();
});

test('CanvasHandler should pick path mark', function() {
  var mark = marks.path;
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 150, 150, 150, 150)).toBeTruthy();
  expect(handler.pick(mark, 200, 300, 300, 300)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should pick rect mark', function() {
  var mark = marks.rect;
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 50, 50, 50, 50)).toBeTruthy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should pick rule mark', function() {
  var mark = marks.rule;
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 100, 198, 100, 198)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();

  // fake isPointInStroke until node canvas supports it
  var g = handler.context();
  g.pixelRatio = 1.1;
  g.isPointInStroke = function() { return true; };
  expect(handler.pick(mark, 5, 0, 5, 0)).toBeTruthy();
});

test('CanvasHandler should pick symbol mark', function() {
  var mark = marks.symbol;
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 50, 90, 50, 90)).toBeTruthy();
  expect(handler.pick(mark, 155, 22, 155, 22)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should pick text mark', function() {
  var mark = marks.text;
  var handler = new Handler().initialize(render(mark, 500, 500));
  expect(handler.pick(mark, 3, 45, 3, 45)).toBeTruthy();
  expect(handler.pick(mark, 140, 160, 140, 160)).toBeTruthy();
  expect(handler.pick(mark, 49, 120, 49, 120)).toBeTruthy();
  expect(handler.pick(mark, 52, 120, 52, 120)).toBeFalsy();
  expect(handler.pick(mark, 800, 800, 800, 800)).toBeFalsy();
});

test('CanvasHandler should not pick empty marks', function() {
  var scene = {marktype:'', items:[]};
  var types = [
    'arc',
    'area',
    'group',
    'image',
    'line',
    'path',
    'rect',
    'rule',
    'symbol',
    'text'
  ];
  var handler, i;

  for (i=0; i<types.length; ++i) {
    scene.marktype = types[i];
    handler = new Handler().initialize(render(scene, 500, 500));
    expect(handler.pick(scene, 0, 0, 0, 0)).toBe(null);
  }
});
