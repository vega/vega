var tape = require('tape'),
    fs = require('fs'),
    vega = require('../'),
    Renderer = vega.CanvasRenderer,
    Handler = vega.CanvasHandler,
    jsdom = require('jsdom'),
    doc = jsdom.jsdom();

var res = './test/resources/';

var marks = JSON.parse(load('marks.json'));
for (var name in marks) { vega.fromJSON(marks[name]); }

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return vega.fromJSON(load(file));
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
  new Renderer({mode: 'http', baseURL: './test/resources/'})
    .initialize(doc.body, w, h)
    .renderAsync(scene)
    .then(function(r) { callback(r.element()); });
  delete global.document;
}

function event(name, x, y) {
  var evt = doc.createEvent('MouseEvents');
  evt.initEvent(name, false, true);
  evt.clientX = x || 0;
  evt.clientY = y || 0;
  evt.changedTouches = [{
    clientX: x || 0,
    clientY: y || 0
  }];
  return evt;
}

tape('CanvasHandler should handle input events', function(test) {
  var scene = loadScene('scenegraph-rect.json');
  var handler = new Handler()
    .initialize(render(scene, 400, 200))
    .scene(scene);

  test.equal(handler.scene(), scene);

  var canvas = handler.canvas();
  var count = 0;
  var increment = function() { count++; };

  handler.events.forEach(function(name) {
    handler.on(name, increment);
  });
  test.equal(handler.handlers().length, handler.events.length);

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
  test.equal(count, handler.events.length + 20);

  handler.off('mousemove', {});
  test.equal(handler.handlers().length, handler.events.length);

  handler.off('nonevent');
  test.equal(handler.handlers().length, handler.events.length);

  handler.events.forEach(function(name) {
    handler.off(name, increment);
  });
  test.equal(handler.handlers().length, 0);
  test.end();
});

tape('CanvasHandler should pick elements in scenegraph', function(test) {
  var scene = loadScene('scenegraph-rect.json');
  var handler = new Handler().initialize(render(scene, 400, 200));
  test.ok(handler.pick(scene, 20, 180, 20, 180));
  test.notOk(handler.pick(scene, 0, 0, 0, 0));
  test.notOk(handler.pick(scene, 800, 800, 800, 800));
  test.end();
});

tape('CanvasHandler should pick arc mark', function(test) {
  var mark = marks.arc;
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.ok(handler.pick(mark, 260, 300, 260, 300));
  test.notOk(handler.pick(mark, 248, 250, 248, 250));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));
  test.end();
});

tape('CanvasHandler should pick area mark', function(test) {
  var mark = marks['area-h'];
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.ok(handler.pick(mark, 100, 150, 100, 150));
  test.notOk(handler.pick(mark, 100, 50, 100, 50));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));

  mark = marks['area-v'];
  handler = new Handler().initialize(render(mark, 500, 500));
  handler.context().pixelratio = 0.99; // for test coverage
  test.ok(handler.pick(mark, 100, 100, 100, 100));
  test.notOk(handler.pick(mark, 50, 50, 50, 50));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));

  test.end();
});

tape('CanvasHandler should pick group mark', function(test) {
  var mark = marks.group;
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.ok(handler.pick(mark, 300, 50, 300, 50));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));
  test.end();
});

tape('CanvasHandler should pick image mark', function(test) {
  var mark = marks.image;
  renderAsync(mark, 500, 500, function(el) {
    var handler = new Handler().initialize(el);
    test.ok(handler.pick(mark, 250, 150, 250, 150));
    test.notOk(handler.pick(mark, 100, 305, 100, 305));
    test.notOk(handler.pick(mark, 800, 800, 800, 800));
    test.end();
  });
});

tape('CanvasHandler should pick line mark', function(test) {
  var mark = marks['line-2'];
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.notOk(handler.pick(mark, 100, 144, 100, 144));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));

  // fake isPointInStroke until node canvas supports it
  var g = handler.context();
  g.pixelratio = 1.1;
  g.isPointInStroke = function() { return true; };
  test.ok(handler.pick(mark, 0, 144, 0, 144));

  mark = marks['line-1'];
  handler = new Handler().initialize(render(mark, 500, 500));
  test.notOk(handler.pick(mark, 100, 144, 100, 144));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));

  // fake isPointInStroke until node canvas supports it
  g = handler.context();
  g.isPointInStroke = function() { return true; };
  test.ok(handler.pick(mark, 0, 144, 0, 144));

  test.end();
});

tape('CanvasHandler should pick path mark', function(test) {
  var mark = marks.path;
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.ok(handler.pick(mark, 150, 150, 150, 150));
  test.notOk(handler.pick(mark, 200, 300, 300, 300));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));
  test.end();
});

tape('CanvasHandler should pick rect mark', function(test) {
  var mark = marks.rect;
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.ok(handler.pick(mark, 50, 50, 50, 50));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));
  test.end();
});

tape('CanvasHandler should pick rule mark', function(test) {
  var mark = marks.rule;
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.notOk(handler.pick(mark, 100, 198, 100, 198));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));

  // fake isPointInStroke until node canvas supports it
  var g = handler.context();
  g.pixelratio = 1.1;
  g.isPointInStroke = function() { return true; };
  test.ok(handler.pick(mark, 5, 0, 5, 0));

  test.end();
});

tape('CanvasHandler should pick symbol mark', function(test) {
  var mark = marks.symbol;
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.ok(handler.pick(mark, 50, 90, 50, 90));
  test.notOk(handler.pick(mark, 155, 22, 155, 22));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));
  test.end();
});

tape('CanvasHandler should pick text mark', function(test) {
  var mark = marks.text;
  var handler = new Handler().initialize(render(mark, 500, 500));
  test.ok(handler.pick(mark, 3, 45, 3, 45));
  test.ok(handler.pick(mark, 140, 160, 140, 160));
  test.notOk(handler.pick(mark, 50, 120, 50, 120));
  test.notOk(handler.pick(mark, 800, 800, 800, 800));
  test.end();
});

tape('CanvasHandler should not pick empty marks', function(test) {
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
    test.equal(handler.pick(scene, 0, 0, 0, 0), null);
  }

  test.end();
});
