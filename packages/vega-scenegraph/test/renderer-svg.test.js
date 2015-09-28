'use strict';

var dl = require('datalib');
var fs = require('fs');
var assert = require('chai').assert;
var jsdom = require('jsdom');
var doc = jsdom.jsdom();

var SVGUtil = require('../src/util/svg');
var Bounds = require('../src/util/Bounds');
var Renderer = require('../src/render/svg/SVGRenderer');
var Util = require('../src/util/scene');
var res = './test/resources/';

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return Util.fromJSON(load(file));
}

function compensate(svg) {
  // update font style strings to compensate for JSDOM
  svg = svg.replace(/font: ([^;]+);/g, replaceFont);

  // update image href namespace to compensate for JSDOM
  svg = svg.replace(/image href=/g, 'image xlink:href=');

  // correct capitalization to compensate for JSDOM
  svg = svg.replace(/clippath/g, 'clipPath');
  svg = svg.replace(/lineargradient/g, 'linearGradient');

  return svg;
}

function render(scene, w, h) {
  // clear document first
  for (var i=doc.body.children.length; --i>=0;) {
    doc.body.removeChild(doc.body.children[i]);
  }
  // then render svg
  return compensate(new Renderer()
    .initialize(doc.body, w, h)
    .render(scene)
    .svg());
}

// workaround for broken jsdom style parser
function replaceFont(str, font) {
  var tok = font.split(' ');
  return 'font: ' +
    tok.slice(2, -1).concat([tok[1], tok[0]]).join(' ') + ';';
}

describe('svg renderer', function() {
  var marks = JSON.parse(load('marks.json'));
  for (var name in marks) { Util.fromJSON(marks[name]); }

  it('should support argument free constructor', function() {
    var r = new Renderer();
    assert.equal(r.svg(), null);
  });

  it('should behave when dom element is not provided', function() {
    var r = new Renderer().initialize(null, 100, 100, null);
    assert.equal(r._svg, null);
    assert.equal(r._root, null);
    assert.equal(r.svg(), null);
    assert.equal(r.background('blue').background(), 'blue');

    r.resize(200, 300);
    assert.equal(r._width, 200);
    assert.equal(r._height, 300);
  });

  it('should render scenegraph to svg', function() {
    var scene = loadScene('scenegraph-rect.json');
    var svg = render(scene, 400, 200);
    var test = load('svg/scenegraph-rect.svg');
    assert.equal(svg, test);
  });

  it('should support clipping and gradients', function() {
    var r = new Renderer()
      .initialize(doc.body, 102, 102);

    var scene = loadScene('scenegraph-defs.json');
    var svg = compensate(r.render(scene).svg());
    var test = load('svg/scenegraph-defs.svg');
    assert.equal(svg, test);

    svg = compensate(r.render(scene).svg());
    assert.equal(svg, test);

    var scene2 = loadScene('scenegraph-defs.json');
    scene2.items[0].clip = false;
    scene2.items[0].fill = 'red';
    svg = compensate(r.render(scene2).svg());
    test = load('svg/scenegraph-defs2.svg');
    assert.equal(svg, test);
  });

  it('should support axes, legends and sub-groups', function() {
    var scene = loadScene('scenegraph-barley.json');
    var svg = render(scene, 360, 740);
    var test = load('svg/scenegraph-barley.svg');
    assert.equal(svg, test);
  });

  it('should support full redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(doc.body, 400, 200)
      .background('white')
      .render(scene);

    var mark = scene.items[0].items[0].items;
    var rect = mark[1]; rect.fill = 'red'; rect.width *= 2;
    mark.push({
      mark:mark, x:0, y:0, width:10, height:10, fill:'purple'
    });
    r.render(scene);
  
    var svg = compensate(r.svg());
    var test = load('svg/scenegraph-full-redraw.svg');
    assert.equal(svg, test);

    mark.pop();
    r.render(scene);

    svg = compensate(r.svg());
    test = load('svg/scenegraph-single-redraw.svg');
    assert.equal(svg, test);
  });

  it('should support enter-item redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(doc.body, 400, 200)
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

    var svg = compensate(r.render(scene, [rect1, rect2]).svg());
    var test = load('svg/scenegraph-enter-redraw.svg');
    assert.equal(svg, test);
  });

  it('should support exit-item redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(doc.body, 400, 200)
      .background('white')
      .render(scene);
  
    var rect = scene.items[0].items[0].items.pop();
    rect.status = 'exit';
    r.render(scene, [rect]);
  
    var svg = compensate(r.svg());
    var test = load('svg/scenegraph-exit-redraw.svg');
    assert.equal(svg, test);
  });

  it('should support single-item redraw', function() {
    var scene = loadScene('scenegraph-rect.json');
    var r = new Renderer()
      .initialize(doc.body, 400, 200)
      .background('white')
      .render(scene);
  
    var rect = scene.items[0].items[0].items[1];
    rect.fill = 'red';
    rect.width *= 2;
    rect.bounds.x2 = 2*rect.bounds.x2 - rect.bounds.x1;
    r.render(scene, [rect]);
  
    var svg = compensate(r.svg());
    var test = load('svg/scenegraph-single-redraw.svg');
    assert.equal(svg, test);
  });

  it('should support multi-item redraw', function() {
    var scene = Util.fromJSON(Util.toJSON(marks['line-1']));
    var r = new Renderer()
      .initialize(doc.body, 400, 400)
      .background('white')
      .render(scene);

    var line1 = scene.items[1]; line1.y = 5;                        // update
    var line2 = scene.items.splice(2, 1)[0]; line2.status = 'exit'; // exit
    var line3 = {x:400, y:200}; line3.mark = scene;                 // enter
    scene.items.push(line3);

    var svg = compensate(r.render(scene, [line1, line2, line3]).svg());
    var test = load('svg/scenegraph-line-redraw.svg');
    assert.equal(svg, test);
  });

  it('should support enter-group redraw', function() {
    var scene = loadScene('scenegraph-barley.json');
    var r = new Renderer()
      .initialize(doc.body, 500, 600)
      .background('white')
      .render(scene);

    var group = Util.fromJSON(Util.toJSON(scene.items[0]));
    group.x = 200;
    group.mark = scene;
    scene.items.push(group);

    var svg = compensate(r.render(scene, [group]).svg());
    var test = load('svg/scenegraph-enter-group-redraw.svg');
    assert.equal(svg, test);
  });

  it('should handle empty item sets', function() {
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
    var test, svg;

    for (var i=0; i<types.length; ++i) {
      scene.marktype = types[i];
      test = 'svg/marks-empty-' + types[i] + '.svg';
      svg = render(scene, 500, 500);
      assert.equal(svg, load(test));
    }
  });

  it('should render arc mark', function() {
    var svg = render(marks.arc, 500, 500);
    var test = load('svg/marks-arc.svg');
    assert.equal(svg, test);
  });

  it('should render horizontal area mark', function() {
    var svg = render(marks['area-h'], 500, 500);
    var test = load('svg/marks-area-h.svg');
    assert.equal(svg, test);
  });

  it('should render vertical area mark', function() {
    var svg = render(marks['area-v'], 500, 500);
    var test = load('svg/marks-area-v.svg');
    assert.equal(svg, test);
  });

  it('should render group mark', function() {
    var svg = render(marks.group, 500, 500);
    var test = load('svg/marks-group.svg');
    assert.equal(svg, test);
  });

  it('should render image mark', function() {
    var svg = render(marks.image, 500, 500);
    var test = load('svg/marks-image.svg');
    assert.equal(svg, test);
  });

  it('should render line mark', function() {
    var svg = render(marks['line-1'], 500, 500);
    var test = load('svg/marks-line-1.svg');
    assert.equal(svg, test);
  
    svg = render(marks['line-2'], 500, 500);
    test = load('svg/marks-line-2.svg');
    assert.equal(svg, test);
  });

  it('should render path mark', function() {
    var svg = render(marks.path, 500, 500);
    var test = load('svg/marks-path.svg');
    assert.equal(svg, test);
  });

  it('should render rect mark', function() {
    var svg = render(marks.rect, 500, 500);
    var test = load('svg/marks-rect.svg');
    assert.equal(svg, test);
  });

  it('should render rule mark', function() {
    var svg = render(marks.rule, 500, 500);
    var test = load('svg/marks-rule.svg');
    assert.equal(svg, test);
  });

  it('should render symbol mark', function() {
    var svg = render(marks.symbol, 500, 500);
    var test = load('svg/marks-symbol.svg');
    assert.equal(svg, test);
  });

  it('should render text mark', function() {
    var svg = render(marks.text, 500, 500);
    var test = load('svg/marks-text.svg');
    assert.equal(svg, test);
  });

});

