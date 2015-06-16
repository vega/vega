'use strict';

var fs = require('fs');
var assert = require('chai').assert;
var Bounds = require('../src/util/Bounds');
var Renderer = require('../src/render/canvas/CanvasRenderer');
var Util = require('../src/util/scene');
var res = './test/resources/';

var GENERATE = require('./resources/generate-tests');

function generate(path, image) {
  if (GENERATE) fs.writeFileSync(res + path, image);
}

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return Util.fromJSON(load(file));
}

function render(scene, w, h) {
  return new Renderer()
    .initialize(null, w, h)
    .render(scene)
    .canvas()
    .toBuffer();
}

function renderAsync(scene, w, h, callback) {
  var r = new Renderer({baseURL: './test/resources/'})
    .initialize(null, w, h)
    .render(scene);
  
  function wait() {
    if (r.pendingImages() === 0) {
      callback(r.canvas().toBuffer());      
    } else {
      setTimeout(wait, 100);
    }
  }

  wait();
}

function clearPathCache(mark) {
  mark.items.forEach(function(item) {
    item.pathCache = null;
  });
  return mark;
}

describe('canvas renderer', function() {
  var marks = JSON.parse(load('marks.json'));
  for (var name in marks) { Util.fromJSON(marks[name]); }

  it('should support argument free constructor', function() {
    var r = new Renderer();
    assert.equal(r.canvas(), null);
    assert.equal(r.context(), null);
  });

  it('should use DOM if available', function() {
    var jsdom = require('jsdom').jsdom();
    global.document = jsdom;

    var r = new Renderer().initialize(document.body, 100, 100);
    assert.strictEqual(r.element(), document.body);
    assert.strictEqual(r.canvas(), document.body.childNodes[0]);
    
    delete global.document;
  });

  it('should render scenegraph to canvas', function() {
    var scene = loadScene('scenegraph-rect.json');
    var image = render(scene, 400, 200);
    generate('png/scenegraph-rect.png', image);
    var test = load('png/scenegraph-rect.png');
    assert.equal(image, test);
  });

  it('should support clipping and gradients', function() {
    var scene = loadScene('scenegraph-defs.json');
    var image = render(scene, 102, 102);
    generate('png/scenegraph-defs.png', image);
    var test = load('png/scenegraph-defs.png');
    assert.equal(image, test);

    var scene2 = loadScene('scenegraph-defs.json');
    scene2.items[0].clip = false;
    scene2.items[0].fill = 'red';
    image = render(scene2, 102, 102);
    generate('png/scenegraph-defs2.png', image);
    test = load('png/scenegraph-defs2.png');
    assert.equal(image, test);
  });

  it('should support axes, legends and sub-groups', function() {
    var scene = loadScene('scenegraph-barley.json');
    var image = render(scene, 360, 740);
    generate('png/scenegraph-barley.png', image);
    var test = load('png/scenegraph-barley.png');
    assert.equal(image, test);
  });

  it('should support full redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(null, 400, 200)
      .background('white')
      .render(scene);

    var mark = scene.items[0].items[0].items;
    var rect = mark[1]; rect.fill = 'red'; rect.width *= 2;
    mark.push({
      mark:mark, x:0, y:0, width:10, height:10, fill:'purple'
    });
    r.render(scene);

    var image = r.canvas().toBuffer();
    generate('png/scenegraph-full-redraw.png', image);
    var test = load('png/scenegraph-full-redraw.png');
    assert.equal(image, test);

    mark.pop();
    r.render(scene);

    image = r.canvas().toBuffer();
    generate('png/scenegraph-single-redraw.png', image);
    test = load('png/scenegraph-single-redraw.png');
    assert.equal(image, test);
  });

  it('should support enter-item redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(null, 400, 200)
      .background('white')
      .render(scene);

    var rects = scene.items[0].items[0];

    var rect1 = {x:10, y:10, width:50, height:50, fill:'red'};
    rect1.mark = rects;
    rect1.bounds = new Bounds().set(10, 10, 60, 60);
    rects.items.push(rect1);

    var rect2 = {x:70, y:10, width:50, height:50, fill:'blue'};
    rect2.mark = rects;
    rect2.bounds = new Bounds().set(70, 10, 120, 60);
    rects.items.push(rect2);

    r.render(scene, [rect1, rect2]);
    var image = r.canvas().toBuffer();
    generate('png/scenegraph-enter-redraw.png', image);
    var test = load('png/scenegraph-enter-redraw.png');
    assert.equal(image, test);
  });

  it('should support exit-item redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(null, 400, 200)
      .background('white')
      .render(scene);
  
    var rect = scene.items[0].items[0].items.pop();
    rect.status = 'exit';
    r.render(scene, [rect]);
  
    var image = r.canvas().toBuffer();
    generate('png/scenegraph-exit-redraw.png', image);
    var test = load('png/scenegraph-exit-redraw.png');
    assert.equal(image, test);
  });
  
  it('should support single-item redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(null, 400, 200)
      .background('white')
      .render(scene);

    var rect = scene.items[0].items[0].items[1];
    rect.fill = 'red';
    rect.width *= 2;
    rect.bounds.x2 = 2*rect.bounds.x2 - rect.bounds.x1;
    r.render(scene, [rect]);

    var image = r.canvas().toBuffer();
    generate('png/scenegraph-single-redraw.png', image);
    var test = load('png/scenegraph-single-redraw.png');
    assert.equal(image, test);
  });

  it('should support multi-item redraw', function() {
    var scene = Util.fromJSON(Util.toJSON(marks['line-1']));
    var r = new Renderer()
      .initialize(null, 400, 400)
      .background('white')
      .render(scene);

    var line1 = scene.items[1]; line1.y = 5;                        // update
    var line2 = scene.items.splice(2, 1)[0]; line2.status = 'exit'; // exit
    var line3 = {x:400, y:200}; line3.mark = scene;                 // enter
    scene.items.push(line3);

    r.render(scene, [line1, line2, line3]);
    var image = r.canvas().toBuffer();
    generate('png/scenegraph-line-redraw.png', image);
    var test = load('png/scenegraph-line-redraw.png');
    assert.equal(image, test);
  });

  it('should support enter-group redraw', function() {
    var scene = loadScene('scenegraph-barley.json');
    var r = new Renderer()
      .initialize(null, 500, 600)
      .background('white')
      .render(scene);

    var group = JSON.parse(Util.toJSON(scene.items[0]));
    group.x = 200;
    scene = JSON.parse(Util.toJSON(scene));
    scene.items.push(group);
    scene = Util.fromJSON(scene);

    var image = r.render(scene, [group]).canvas().toBuffer();
    generate('png/scenegraph-enter-group-redraw.png', image);
    var test = load('png/scenegraph-enter-group-redraw.png');
    assert.equal(image, test);
  });

  it('should skip empty item sets', function() {
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
    var test = load('png/marks-empty.png'), image;
    
    for (var i=0; i<types.length; ++i) {
      scene.marktype = types[i];
      image = render(scene, 500, 500);
      assert.equal(image, test);
    }
  });

  it('should render arc mark', function() {
    var image = render(marks.arc, 500, 500);
    generate('png/marks-arc.png', image);
    var test = load('png/marks-arc.png');
    assert.equal(image, test);
  });

  it('should render horizontal area mark', function() {
    var image = render(marks['area-h'], 500, 500);
    generate('png/marks-area-h.png', image);
    var test = load('png/marks-area-h.png');
    assert.equal(image, test);

    // clear path cache and re-render
    image = render(clearPathCache(marks['area-h']), 500, 500);
    assert.equal(image, test);
  });

  it('should render vertical area mark', function() {
    var image = render(marks['area-v'], 500, 500);
    generate('png/marks-area-v.png', image);
    var test = load('png/marks-area-v.png');
    assert.equal(image, test);

    // clear path cache and re-render
    image = render(clearPathCache(marks['area-v']), 500, 500);
    assert.equal(image, test);
  });

  it('should render group mark', function() {
    var image = render(marks.group, 500, 500);
    generate('png/marks-group.png', image);
    var test = load('png/marks-group.png');
    assert.equal(image, test);
  });

  it('should render image mark', function(done) {
    renderAsync(marks.image, 500, 500, function(image) {
      generate('png/marks-image.png', image);
      var test = load('png/marks-image.png');
      assert.equal(image, test);
      done();        
    });
  });

  it('should skip invalid image', function() {
    var scene = Util.fromJSON({
      marktype: 'image',
      items: [{url: 'does_not_exist.png'}]
    });
    var image = render(scene, 500, 500);
    generate('png/marks-empty.png', image);
    var test = load('png/marks-empty.png');
    assert.equal(image, test);
  });

  it('should render line mark', function() {
    var image = render(marks['line-1'], 500, 500);
    generate('png/marks-line-1.png', image);
    var test = load('png/marks-line-1.png');
    assert.equal(image, test);

    image = render(marks['line-2'], 500, 500);
    generate('png/marks-line-2.png', image);
    test = load('png/marks-line-2.png');
    assert.equal(image, test);

    // clear path cache and re-render
    image = render(clearPathCache(marks['line-2']), 500, 500);
    assert.equal(image, test);
  });

  it('should render path mark', function() {
    var image = render(marks.path, 500, 500);
    generate('png/marks-path.png', image);
    var test = load('png/marks-path.png');
    assert.equal(image, test);

    // clear path cache and re-render
    image = render(clearPathCache(marks.path), 500, 500);
    assert.equal(image, test);
  });

  it('should render rect mark', function() {
    var image = render(marks.rect, 500, 500);
    generate('png/marks-rect.png', image);
    var test = load('png/marks-rect.png');
    assert.equal(image, test);
  });

  it('should render rule mark', function() {
    var image = render(marks.rule, 500, 500);
    generate('png/marks-rule.png', image);
    var test = load('png/marks-rule.png');
    assert.equal(image, test);
  });

  it('should render symbol mark', function() {
    var image = render(marks.symbol, 500, 500);
    generate('png/marks-symbol.png', image);
    var test = load('png/marks-symbol.png');
    assert.equal(image, test);
  });

  it('should render text mark', function() {
    var image = render(marks.text, 500, 500);
    generate('png/marks-text.png', image);
    var test = load('png/marks-text.png');
    assert.equal(image, test);
  });

});