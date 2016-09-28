var tape = require('tape'),
    fs = require('fs'),
    loader = require('vega-loader').loader,
    vega = require('../'),
    Bounds = vega.Bounds,
    Renderer = vega.SVGStringRenderer;

var res = './test/resources/';
var GENERATE = require('./resources/generate-tests');

var marks = JSON.parse(load('marks.json'));
for (var name in marks) { vega.fromJSON(marks[name]); }

function generate(path, str) {
  if (GENERATE) fs.writeFileSync(res + path, str);
}

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return vega.fromJSON(load(file));
}

function render(scene, w, h) {
  return new Renderer()
    .initialize(null, w, h)
    .render(scene)
    .svg();
}

function renderAsync(scene, w, h, callback) {
  new Renderer(loader({mode: 'http', baseURL: './test/resources/'}))
    .initialize(null, w, h)
    .renderAsync(scene)
    .then(function(r) { callback(r.svg()); });
}

tape('SVGStringRenderer should build empty group for item-less area mark', function(test) {
  var r = new Renderer();
  var str = r.reset().mark({marktype: 'area', items:[]});
  generate('svg/marks-itemless-area.svg', str);
  var file = load('svg/marks-itemless-area.svg');
  test.equal(str, file);
  test.end();
});

tape('SVGStringRenderer should build empty group for item-less line mark', function(test) {
  var r = new Renderer();
  var str = r.reset().mark({marktype: 'line', items:[]});
  generate('svg/marks-itemless-line.svg', str);
  var file = load('svg/marks-itemless-line.svg');
  test.equal(str, file);
  test.end();
});

tape('SVGStringRenderer should render scenegraph to SVG string', function(test) {
  var scene = loadScene('scenegraph-rect.json');
  var str = render(scene, 400, 200);
  generate('svg/scenegraph-rect.svg', str);
  var file = load('svg/scenegraph-rect.svg');
  test.equal(str, file);
  test.end();
});

tape('SVGStringRenderer should support clipping and gradients', function(test) {
  var scene = loadScene('scenegraph-defs.json');
  var str = render(scene, 102, 102);
  generate('svg/scenegraph-defs.svg', str);
  var file = load('svg/scenegraph-defs.svg');
  test.equal(str, file);

  var scene2 = loadScene('scenegraph-defs.json');
  delete scene2.items[0].clip;
  scene2.items[0].fill = 'red';
  str = render(scene2, 102, 102);
  generate('svg/scenegraph-defs2.svg', str);
  file = load('svg/scenegraph-defs2.svg');
  test.equal(str, file);

  test.end();
});

tape('SVGStringRenderer should support axes, legends and sub-groups', function(test) {
  var scene = loadScene('scenegraph-barley.json');
  var str = render(scene, 360, 740);
  generate('svg/scenegraph-barley.svg', str);
  var file = load('svg/scenegraph-barley.svg');
  test.equal(str, file);
  test.end();
});

tape('SVGStringRenderer should support full redraw', function(test) {
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

  var str = r.svg();
  generate('svg/scenegraph-full-redraw.svg', str);
  var file = load('svg/scenegraph-full-redraw.svg');
  test.equal(str, file);

  mark.pop();
  r.render(scene);

  str = r.svg();
  generate('svg/scenegraph-single-redraw.svg', str);
  file = load('svg/scenegraph-single-redraw.svg');
  test.equal(str, file);

  test.end();
});

tape('SVGStringRenderer should support enter-item redraw', function(test) {
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

  var str = r.render(scene, [rect1, rect2]).svg();
  generate('svg/scenegraph-enter-redraw.svg', str);
  var file = load('svg/scenegraph-enter-redraw.svg');
  test.equal(str, file);

  test.end();
});

tape('SVGStringRenderer should support exit-item redraw', function(test) {
  var scene = loadScene('scenegraph-rect.json');
  var r = new Renderer()
    .initialize(null, 400, 200)
    .background('white')
    .render(scene);

  var rect = scene.items[0].items[0].items.pop();
  rect.status = 'exit';
  r.render(scene, [rect]);

  var str = r.svg();
  generate('svg/scenegraph-exit-redraw.svg', str);
  var file = load('svg/scenegraph-exit-redraw.svg');
  test.equal(str, file);

  test.end();
});

tape('SVGStringRenderer should support single-item redraw', function(test) {
  var scene = loadScene('scenegraph-rect.json');
  var r = new Renderer()
    .initialize(null, 400, 200)
    .background('white')
    .render(scene);

  var rect = scene.items[0].items[0].items[1];
  rect.fill = 'red';
  rect.width *= 2;
  r.render(scene, [rect]);

  var str = r.svg();
  generate('svg/scenegraph-single-redraw.svg', str);
  var file = load('svg/scenegraph-single-redraw.svg');
  test.equal(str, file);

  test.end();
});

tape('SVGStringRenderer should support multi-item redraw', function(test) {
  var scene = vega.fromJSON(vega.toJSON(marks['line-1']));
  var r = new Renderer()
    .initialize(null, 400, 400)
    .background('white')
    .render(scene);

  var line1 = scene.items[1]; line1.y = 5;                        // update
  var line2 = scene.items.splice(2, 1)[0]; line2.status = 'exit'; // exit
  var line3 = {x:400, y:200}; line3.mark = scene;                 // enter
  scene.items.push(line3);

  var str = r.render(scene, [line1, line2, line3]).svg();
  generate('svg/scenegraph-line-redraw.svg', str);
  var file = load('svg/scenegraph-line-redraw.svg');
  test.equal(str, file);

  test.end();
});

tape('SVGStringRenderer should support enter-group redraw', function(test) {
  var scene = loadScene('scenegraph-barley.json');
  var r = new Renderer()
    .initialize(null, 500, 600)
    .background('white')
    .render(scene);

  var group = vega.fromJSON(vega.toJSON(scene.items[0]));
  group.x = 200;
  group.mark = scene;
  scene.items.push(group);

  var str = r.render(scene, [group]).svg();
  generate('svg/scenegraph-enter-group-redraw.svg', str);
  var file = load('svg/scenegraph-enter-group-redraw.svg');
  test.equal(str, file);

  test.end();
});

tape('SVGStringRenderer should handle empty item sets', function(test) {
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
  var file, str;

  for (var i=0; i<types.length; ++i) {
    scene.marktype = types[i];
    file = 'svg/marks-empty-' + types[i] + '.svg';
    str = render(scene, 500, 500);
    generate(file, str);
    test.equal(str, load(file));
  }

  test.end();
});

tape('SVGStringRenderer should render arc mark', function(test) {
  var svg = render(marks.arc, 500, 500);
  generate('svg/marks-arc.svg', svg);
  var file = load('svg/marks-arc.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render horizontal area mark', function(test) {
  var svg = render(marks['area-h'], 500, 500);
  generate('svg/marks-area-h.svg', svg);
  var file = load('svg/marks-area-h.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render vertical area mark', function(test) {
  var svg = render(marks['area-v'], 500, 500);
  generate('svg/marks-area-v.svg', svg);
  var file = load('svg/marks-area-v.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render area mark with breaks', function(test) {
  var svg = render(marks['area-breaks'], 500, 500);
  generate('svg/marks-area-breaks.svg', svg);
  var file = load('svg/marks-area-breaks.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render trail area mark', function(test) {
  var svg = render(marks['area-trail'], 500, 500);
  generate('svg/marks-area-trail.svg', svg);
  var file = load('svg/marks-area-trail.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render group mark', function(test) {
  var svg = render(marks.group, 500, 500);
  generate('svg/marks-group.svg', svg);
  var file = load('svg/marks-group.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render image mark', function(test) {
  renderAsync(marks.image, 500, 500, function(svg) {
    generate('svg/marks-image.svg', svg);
    var file = load('svg/marks-image.svg');
    test.equal(svg, file);
    test.end();
  });
});

tape('SVGStringRenderer should render line mark', function(test) {
  var svg = render(marks['line-1'], 500, 500);
  generate('svg/marks-line-1.svg', svg);
  var file = load('svg/marks-line-1.svg');
  test.equal(svg, file);

  svg = render(marks['line-2'], 500, 500);
  generate('svg/marks-line-2.svg', svg);
  file = load('svg/marks-line-2.svg');
  test.equal(svg, file);

  test.end();
});

tape('SVGStringRenderer should render line mark with breaks', function(test) {
  var svg = render(marks['line-breaks'], 500, 500);
  generate('svg/marks-line-breaks.svg', svg);
  var file = load('svg/marks-line-breaks.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render path mark', function(test) {
  var svg = render(marks.path, 500, 500);
  generate('svg/marks-path.svg', svg);
  var file = load('svg/marks-path.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render rect mark', function(test) {
  var svg = render(marks.rect, 500, 500);
  generate('svg/marks-rect.svg', svg);
  var file = load('svg/marks-rect.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render rule mark', function(test) {
  var svg = render(marks.rule, 500, 500);
  generate('svg/marks-rule.svg', svg);
  var file = load('svg/marks-rule.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render symbol mark', function(test) {
  var svg = render(marks.symbol, 500, 500);
  generate('svg/marks-symbol.svg', svg);
  var file = load('svg/marks-symbol.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGStringRenderer should render text mark', function(test) {
  var svg = render(marks.text, 500, 500);
  generate('svg/marks-text.svg', svg);
  var file = load('svg/marks-text.svg');
  test.equal(svg, file);
  test.end();
});
