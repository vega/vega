'use strict';

var dl = require('datalib');
var fs = require('fs');
var assert = require('chai').assert;
var jsdom = require('jsdom');
var doc = jsdom.jsdom();

var SVGUtil = require('../src/util/svg');
var Renderer = require('../src/render/svg/SVGRenderer');
var initScene = require('../src/util/scene').fromJSON;
var res = './test/resources/';

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return initScene(load(file));
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
  for (var name in marks) { initScene(marks[name]); }

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
    var scene = loadScene('scenegraph-defs.json');
    var svg = render(scene, 102, 102);
    var test = load('svg/scenegraph-defs.svg');
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
    var scene = marks['line-1'];
    var r = new Renderer()
      .initialize(doc.body, 400, 400)
      .background('white')
      .render(scene);

    var line = scene.items[1];
    var prev = line.y;
    line.y = 5;
    r.render(scene, [line]);
    var svg = compensate(r.svg());
    line.y = prev;
    var test = load('svg/scenegraph-line-redraw.svg');
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

