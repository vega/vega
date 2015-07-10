'use strict';

var fs = require('fs');
var assert = require('chai').assert;
var Renderer = require('../src/render/canvas/CanvasRenderer');
var Handler = require('../src/render/canvas/CanvasHandler');
var initScene = require('../src/util/scene').fromJSON;
var res = './test/resources/';

var jsdom = require('jsdom').jsdom();

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return initScene(load(file));
}

function render(scene, w, h) {
  global.document = jsdom;
  var r = new Renderer()
    .initialize(jsdom.body, w, h)
    .render(scene);
  delete global.document;
  return r.element();
}

function renderAsync(scene, w, h, callback) {
  global.document = jsdom;
  var r = new Renderer({baseURL: './test/resources/'})
    .initialize(jsdom.body, w, h)
    .render(scene);
  delete global.document;
  
  function wait() {
    if (r.pendingImages() === 0) {
      callback(r.element());      
    } else {
      setTimeout(wait, 100);
    }
  }

  wait();
}

function event(name, x, y) {
  var evt = jsdom.createEvent('MouseEvents');
  evt.initEvent(name, false, true);
  evt.clientX = x || 0;
  evt.clientY = y || 0;
  evt.changedTouches = [{
    clientX: x || 0,
    clientY: y || 0
  }];
  return evt;
}

describe('canvas handler', function() {
  var marks = JSON.parse(load('marks.json'));
  for (var name in marks) { initScene(marks[name]); }

  it('should handle input events', function() {
    var scene = loadScene('scenegraph-rect.json');
    var handler = new Handler()
      .initialize(render(scene, 400, 200))
      .scene(scene);
    assert(handler.scene(), scene);

    var canvas = handler.canvas();
    var count = 0;
    var increment = function() { count++; };

    handler.events.forEach(function(name) {
      handler.on(name, increment);
    });
    assert.equal(handler.handlers().length, handler.events.length);

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

    // 9 events above + 4 triggered (mouseover, mouseout)
    assert.equal(count, handler.events.length + 13);

    handler.off('mousemove', {});
    assert.equal(handler.handlers().length, handler.events.length);

    handler.off('nonevent');
    assert.equal(handler.handlers().length, handler.events.length);

    handler.events.forEach(function(name) {
      handler.off(name, increment);
    });
    assert.equal(handler.handlers().length, 0);
  });

  it('should pick elements in scenegraph', function() {
    var scene = loadScene('scenegraph-rect.json');
    var handler = new Handler().initialize(render(scene, 400, 200));
    assert.ok(handler.pick(scene, 20, 180, 20, 180));
    assert.notOk(handler.pick(scene, 0, 0, 0, 0));
    assert.notOk(handler.pick(scene, 800, 800, 800, 800));
  });

  it('should pick arc mark', function() {
    var mark = marks.arc;
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.ok(handler.pick(mark, 270, 260, 270, 260));
    assert.notOk(handler.pick(mark, 248, 250, 248, 250));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));
  });

  it('should pick area mark', function() {
    var mark = marks['area-h'];
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.ok(handler.pick(mark, 100, 150, 100, 150));
    assert.notOk(handler.pick(mark, 100, 50, 100, 50));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));

    var mark = marks['area-v'];
    var handler = new Handler().initialize(render(mark, 500, 500));
    handler.context().pixelratio = 0.99; // for test coverage
    assert.ok(handler.pick(mark, 100, 100, 100, 100));
    assert.notOk(handler.pick(mark, 50, 50, 50, 50));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));
  });
  
  it('should pick group mark', function() {
    var mark = marks.group;
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.ok(handler.pick(mark, 300, 50, 300, 50));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));
  });

  it('should pick image mark', function(done) {
    var mark = marks.image;
    renderAsync(mark, 500, 500, function(el) {
      var handler = new Handler().initialize(el);
      assert.ok(handler.pick(mark, 250, 150, 250, 150));
      assert.notOk(handler.pick(mark, 100, 305, 100, 305));
      assert.notOk(handler.pick(mark, 800, 800, 800, 800));  
      done();    
    });
  });

  it('should pick line mark', function() {
    var mark = marks['line-2'];
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.notOk(handler.pick(mark, 100, 144, 100, 144));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));

    // fake isPointInStroke until node canvas supports it
    var g = handler.context();
    g.pixelratio = 1.1;
    g.isPointInStroke = function() { return true; };
    assert.ok(handler.pick(mark, 0, 144, 0, 144));

    mark = marks['line-1'];
    handler = new Handler().initialize(render(mark, 500, 500));
    assert.notOk(handler.pick(mark, 100, 144, 100, 144));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));

    // fake isPointInStroke until node canvas supports it
    g = handler.context();
    g.isPointInStroke = function() { return true; };
    assert.ok(handler.pick(mark, 0, 144, 0, 144));
  });
  
  it('should pick path mark', function() {
    var mark = marks.path;
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.ok(handler.pick(mark, 150, 150, 150, 150));
    assert.notOk(handler.pick(mark, 200, 300, 300, 300));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));
  });

  it('should pick rect mark', function() {
    var mark = marks.rect;
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.ok(handler.pick(mark, 50, 50, 50, 50));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));
  });
  
  it('should pick rule mark', function() {
    var mark = marks.rule;
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.notOk(handler.pick(mark, 100, 198, 100, 198));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));

    // fake isPointInStroke until node canvas supports it
    var g = handler.context();
    g.pixelratio = 1.1;
    g.isPointInStroke = function() { return true; };
    assert.ok(handler.pick(mark, 5, 0, 5, 0));
  });
  
  it('should pick symbol mark', function() {
    var mark = marks.symbol;
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.ok(handler.pick(mark, 50, 90, 50, 90));
    assert.notOk(handler.pick(mark, 155, 22, 155, 22));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));
  });
  
  it('should pick text mark', function() {
    var mark = marks.text;
    var handler = new Handler().initialize(render(mark, 500, 500));
    assert.ok(handler.pick(mark, 3, 45, 3, 45));
    assert.ok(handler.pick(mark, 140, 160, 140, 160));
    assert.notOk(handler.pick(mark, 50, 120, 50, 120));
    assert.notOk(handler.pick(mark, 800, 800, 800, 800));
  });

  it('should not pick empty marks', function() {
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
      var handler = new Handler().initialize(render(scene, 500, 500));
      assert.isNull(handler.pick(scene, 0, 0, 0, 0));
    }
  });

});