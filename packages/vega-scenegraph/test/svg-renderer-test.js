var fs = require('fs');
var loader = require('vega-loader').loader;
var vega = require('../');
var Bounds = vega.Bounds;
var Renderer = vega.SVGRenderer;

var res = __dirname + '/resources/';

var marks = JSON.parse(load('marks.json'));
for (var name in marks) { vega.sceneFromJSON(marks[name]); }

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return vega.sceneFromJSON(load(file));
}

function compensate(svg) {
  // update font style strings to compensate for JSDOM
  svg = svg.replace(/font: ([^;]+);/g, replaceFont);

  // update image href namespace to compensate for JSDOM
  svg = svg.replace(/ href=/g, ' xlink:href=');

  // correct capitalization to compensate for JSDOM
  svg = svg.replace(/clippath/g, 'clipPath');
  svg = svg.replace(/lineargradient/g, 'linearGradient');

  return svg;
}

function render(scene, w, h) {
  // clear document first
  for (var i=document.body.children.length; --i>=0;) {
    document.body.removeChild(document.body.children[i]);
  }

  // reset clip id counter
  vega.resetSVGClipId();

  // then render svg
  return compensate(new Renderer()
    .initialize(document.body, w, h)
    .render(scene)
    .svg());
}

async function renderAsync(scene, w, h) {
  // clear document first
  for (var i=document.body.children.length; --i>=0;) {
    document.body.removeChild(document.body.children[i]);
  }

  // reset clip id counter
  vega.resetSVGClipId();

  // then render svg
  var r = await new Renderer(loader({mode: 'http', baseURL: './test/resources/'}))
    .initialize(document.body, w, h)
    .renderAsync(scene);
  return compensate(r.svg());
}

// workaround for broken jsdom style parser
function replaceFont(str, font) {
  var tok = font.split(' ');
  return 'font: ' +
    tok.slice(2, -1).concat([tok[1], tok[0]]).join(' ') + ';';
}

test('SVGRenderer should support argument free constructor', function() {
  var r = new Renderer();
  expect(r.svg()).toBe(null);
});

test('SVGRenderer should behave when dom element is not provided', function() {
  var r = new Renderer().initialize(null, 100, 100, null);
  expect(r._svg).toBe(null);
  expect(r._root).toBe(null);
  expect(r.svg()).toBe(null);
  expect(r.background('blue').background()).toBe('blue');

  r.resize(200, 300);
  expect(r._width).toBe(200);
  expect(r._height).toBe(300);
});

test('SVGRenderer should render scenegraph to svg', function() {
  var scene = loadScene('scenegraph-rect.json');
  var svg = render(scene, 400, 200);
  var file = load('svg/scenegraph-rect.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support clipping and gradients', function() {
  var r = new Renderer()
    .initialize(document.body, 102, 102);

  vega.resetSVGClipId();
  var scene = loadScene('scenegraph-defs.json');
  var svg = compensate(r.render(scene).svg());
  var file = load('svg/scenegraph-defs.svg');
  expect(svg).toBe(file);

  svg = compensate(r.render(scene).svg());
  expect(svg).toBe(file);

  vega.resetSVGClipId();
  scene = loadScene('scenegraph-defs.json');
  scene.items[0].clip = false;
  scene.items[0].fill = 'red';
  svg = compensate(r.render(scene).svg());
  file = load('svg/scenegraph-defs2.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support axes, legends and sub-groups', function() {
  var scene = loadScene('scenegraph-barley.json');
  var svg = render(scene, 360, 740);
  var file = load('svg/scenegraph-barley.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support full redraw', function() {
  vega.resetSVGClipId();

  var scene = loadScene('scenegraph-rect.json');
  var r = new Renderer()
    .initialize(document.body, 400, 200)
    .background('white')
    .render(scene);

  var mark = scene.items[0].items[0].items;
  var rect = mark[1];rect.fill = 'red';rect.width *= 2;
  mark.push({
    mark:mark, x:0, y:0, width:10, height:10, fill:'purple'
  });
  r.render(scene);

  var svg = compensate(r.svg());
  var file = load('svg/scenegraph-full-redraw.svg');
  expect(svg).toBe(file);

  mark.pop();
  r.render(scene);

  svg = compensate(r.svg());
  file = load('svg/scenegraph-single-redraw.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support enter-item redraw', function() {
  vega.resetSVGClipId();

  var scene = loadScene('scenegraph-rect.json');
  var r = new Renderer()
    .initialize(document.body, 400, 200)
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
  var file = load('svg/scenegraph-enter-redraw.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support exit-item redraw', function() {
  vega.resetSVGClipId();

  var scene = loadScene('scenegraph-rect.json');
  var r = new Renderer()
    .initialize(document.body, 400, 200)
    .background('white')
    .render(scene);

  var rect = scene.items[0].items[0].items.pop();
  rect.exit = true;
  rect._svg.remove = rect._svg.remove || function() {
    this.parentNode.removeChild(this);
  };
  r.render(scene, [rect]);

  var svg = compensate(r.svg());
  var file = load('svg/scenegraph-exit-redraw.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support single-item redraw', function() {
  vega.resetSVGClipId();

  var scene = loadScene('scenegraph-rect.json');
  var r = new Renderer()
    .initialize(document.body, 400, 200)
    .background('white')
    .render(scene);

  var rect = scene.items[0].items[0].items[1];
  rect.fill = 'red';
  rect.width *= 2;
  rect.bounds.x2 = 2*rect.bounds.x2 - rect.bounds.x1;
  r.render(scene, [rect]);

  var svg = compensate(r.svg());
  var file = load('svg/scenegraph-single-redraw.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support multi-item redraw', function() {
  vega.resetSVGClipId();

  var scene = vega.sceneFromJSON(vega.sceneToJSON(marks['line-1']));
  var r = new Renderer()
    .initialize(document.body, 400, 400)
    .background('white')
    .render(scene);

  var line1 = scene.items[1];line1.y = 5;                        // update
  var line2 = scene.items.splice(2, 1)[0];line2.status = 'exit'; // exit
  var line3 = {x:400, y:200};line3.mark = scene;                 // enter
  scene.items.push(line3);

  var svg = compensate(r.render(scene, [line1, line2, line3]).svg());
  var file = load('svg/scenegraph-line-redraw.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should support enter-group redraw', function() {
  vega.resetSVGClipId();

  var scene = loadScene('scenegraph-barley.json');
  var r = new Renderer()
    .initialize(document.body, 500, 600)
    .background('white')
    .render(scene);

  var group = vega.sceneFromJSON(vega.sceneToJSON(scene.items[0]));
  group.x = 200;
  group.mark = scene;
  scene.items.push(group);

  var svg = compensate(r.render(scene, [group]).svg());
  var file = load('svg/scenegraph-enter-group-redraw.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should handle empty item sets', function() {
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
  var scene, file, svg;

  for (var i=0; i<types.length; ++i) {
    scene = {marktype:types[i], items:[]};
    file = 'svg/marks-empty-' + types[i] + '.svg';
    svg = render(scene, 500, 500);
    expect(svg).toBe(load(file));
  }
});

test('SVGRenderer should render arc mark', function() {
  var svg = render(marks.arc, 500, 500);
  var file = load('svg/marks-arc.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render horizontal area mark', function() {
  var svg = render(marks['area-h'], 500, 500);
  var file = load('svg/marks-area-h.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render vertical area mark', function() {
  var svg = render(marks['area-v'], 500, 500);
  var file = load('svg/marks-area-v.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render area mark with breaks', function() {
  var svg = render(marks['area-breaks'], 500, 500);
  var file = load('svg/marks-area-breaks.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render trail mark', function() {
  var svg = render(marks['trail'], 500, 500);
  var file = load('svg/marks-area-trail.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render group mark', function() {
  var svg = render(marks.group, 500, 500);
  var file = load('svg/marks-group.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render image mark', async function() {
  var svg = await renderAsync(marks.image, 500, 500);
  var file = load('svg/marks-image.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render line mark', function() {
  var svg = render(marks['line-1'], 500, 500);
  var file = load('svg/marks-line-1.svg');
  expect(svg).toBe(file);

  svg = render(marks['line-2'], 500, 500);
  file = load('svg/marks-line-2.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render line mark with breaks', function() {
  var svg = render(marks['line-breaks'], 500, 500);
  var file = load('svg/marks-line-breaks.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render path mark', function() {
  var svg = render(marks.path, 500, 500);
  var file = load('svg/marks-path.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render rect mark', function() {
  var svg = render(marks.rect, 500, 500);
  var file = load('svg/marks-rect.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render rule mark', function() {
  var svg = render(marks.rule, 500, 500);
  var file = load('svg/marks-rule.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render symbol mark', function() {
  var svg = render(marks.symbol, 500, 500);
  var file = load('svg/marks-symbol.svg');
  expect(svg).toBe(file);
});

test('SVGRenderer should render text mark', function() {
  var svg = render(marks.text, 500, 500);
  var file = load('svg/marks-text.svg');
  expect(svg).toBe(file);
});
