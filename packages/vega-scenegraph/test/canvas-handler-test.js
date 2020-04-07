var tape = require('tape'),
    fs = require('fs'),
    vega = require('../'),
    loader = require('vega-loader').loader,
    Renderer = vega.CanvasRenderer,
    Handler = vega.CanvasHandler,
    jsdom = require('jsdom'),
    win = (new jsdom.JSDOM()).window,
    doc = win.document;

var res = './test/resources/';

var marks = JSON.parse(load('marks.json'));
for (var name in marks) { vega.sceneFromJSON(marks[name]); }

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

function renderAsync(scene, w, h, callback) {
  global.document = doc;
  new Renderer(loader({mode: 'http', baseURL: './test/resources/'}))
    .initialize(doc.body, w, h)
    .renderAsync(scene)
    .then(function(r) { callback(r.element()); });
  delete global.document;
}

function event(name, x, y) {
  var evt = new win.MouseEvent(name, {clientX: x, clientY: y});
  evt.changedTouches = [{
    clientX: x || 0,
    clientY: y || 0
  }];
  return evt;
}

tape('CanvasHandler should add/remove event callbacks', function(t) {
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

tape('CanvasHandler should handle input events', function(t) {
  var scene = loadScene('scenegraph-rect.json');
  var handler = new Handler()
    .initialize(render(scene, 400, 200))
    .scene(scene);

  t.equal(handler.scene(), scene);

  var canvas = handler.canvas();
  var count = 0;
  var increment = function() { count++; };

  handler.events.forEach(function(name) {
    handler.on(name, increment);
  });
  t.equal(handler.handlers().length, handler.events.length);

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
  t.equal(count, handler.events.length + 20);

  handler.off('mousemove', {});
  t.equal(handler.handlers().length, handler.events.length);

  handler.off('nonevent');
  t.equal(handler.handlers().length, handler.events.length);

  handler.events.forEach(function(name) {
    handler.off(name, increment);
  });
  t.equal(handler.handlers().length, 0);
  t.end();
});

tape('CanvasHandler should pick elements in scenegraph', function(t) {
  var scene = loadScene('scenegraph-rect.json');
  var handler = new Handler().initialize(render(scene, 400, 200));
  t.ok(handler.pick(scene, 20, 180, 20, 180));
  t.notOk(handler.pick(scene, 0, 0, 0, 0));
  t.notOk(handler.pick(scene, 800, 800, 800, 800));
  t.end();
});

tape('CanvasHandler should pick arc mark', function(t) {
  var mark = marks.arc;
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.ok(handler.pick(mark, 260, 300, 260, 300));
  t.notOk(handler.pick(mark, 248, 250, 248, 250));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));
  t.end();
});

tape('CanvasHandler should pick area mark', function(t) {
  var mark = marks['area-h'];
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.ok(handler.pick(mark, 100, 150, 100, 150));
  t.notOk(handler.pick(mark, 100, 50, 100, 50));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));

  mark = marks['area-v'];
  handler = new Handler().initialize(render(mark, 500, 500));
  handler.context().pixelRatio = 0.99; // for test coverage
  t.ok(handler.pick(mark, 100, 100, 100, 100));
  t.notOk(handler.pick(mark, 50, 50, 50, 50));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));

  t.end();
});

tape('CanvasHandler should pick group mark', function(t) {
  var mark = {
    'marktype': 'group',
    'name': 'class-name',
    'items': [
      {'x':5, 'y':5, 'width':100, 'height':56, 'fill':'steelblue', 'clip':true, 'items':[]}
    ]
  };
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.ok(handler.pick(mark, 50, 50, 50, 50));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));
  t.end();
});

tape('CanvasHandler should pick image mark', function(t) {
  var mark = marks.image;
  renderAsync(mark, 500, 500, function(el) {
    var handler = new Handler().initialize(el);
    t.ok(handler.pick(mark, 250, 150, 250, 150));
    t.notOk(handler.pick(mark, 100, 305, 100, 305));
    t.notOk(handler.pick(mark, 800, 800, 800, 800));
    t.end();
  });
});

tape('CanvasHandler should pick line mark', function(t) {
  var mark = marks['line-2'];
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.notOk(handler.pick(mark, 100, 144, 100, 144));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));

  // fake isPointInStroke until node canvas supports it
  var g = handler.context();
  g.pixelRatio = 1.1;
  g.isPointInStroke = function() { return true; };
  t.ok(handler.pick(mark, 0, 144, 0, 144));

  mark = marks['line-1'];
  handler = new Handler().initialize(render(mark, 500, 500));
  t.notOk(handler.pick(mark, 100, 144, 100, 144));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));

  // fake isPointInStroke until node canvas supports it
  g = handler.context();
  g.isPointInStroke = function() { return true; };
  t.ok(handler.pick(mark, 0, 144, 0, 144));

  t.end();
});

tape('CanvasHandler should pick path mark', function(t) {
  var mark = marks.path;
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.ok(handler.pick(mark, 150, 150, 150, 150));
  t.notOk(handler.pick(mark, 200, 300, 300, 300));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));
  t.end();
});

tape('CanvasHandler should pick rect mark', function(t) {
  var mark = marks.rect;
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.ok(handler.pick(mark, 50, 50, 50, 50));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));
  t.end();
});

tape('CanvasHandler should pick rule mark', function(t) {
  var mark = marks.rule;
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.notOk(handler.pick(mark, 100, 198, 100, 198));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));

  // fake isPointInStroke until node canvas supports it
  var g = handler.context();
  g.pixelRatio = 1.1;
  g.isPointInStroke = function() { return true; };
  t.ok(handler.pick(mark, 5, 0, 5, 0));

  t.end();
});

tape('CanvasHandler should pick symbol mark', function(t) {
  var mark = marks.symbol;
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.ok(handler.pick(mark, 50, 90, 50, 90));
  t.notOk(handler.pick(mark, 155, 22, 155, 22));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));
  t.end();
});

tape('CanvasHandler should pick text mark', function(t) {
  var mark = marks.text;
  var handler = new Handler().initialize(render(mark, 500, 500));
  t.ok(handler.pick(mark, 3, 45, 3, 45));
  t.ok(handler.pick(mark, 140, 160, 140, 160));
  t.ok(handler.pick(mark, 49, 120, 49, 120));
  t.notOk(handler.pick(mark, 52, 120, 52, 120));
  t.notOk(handler.pick(mark, 800, 800, 800, 800));
  t.end();
});

tape('CanvasHandler should not pick empty marks', function(t) {
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
    t.equal(handler.pick(scene, 0, 0, 0, 0), null);
  }

  t.end();
});
