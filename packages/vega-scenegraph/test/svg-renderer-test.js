var tape = require('tape'),
    fs = require('fs'),
    loader = require('vega-loader').loader,
    vega = require('../'),
    Bounds = vega.Bounds,
    Renderer = vega.SVGRenderer,
    jsdom = require('jsdom'),
    doc = (new jsdom.JSDOM()).window.document;

var res = './test/resources/';

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
  for (var i=doc.body.children.length; --i>=0;) {
    doc.body.removeChild(doc.body.children[i]);
  }

  // reset clip id counter
  vega.resetSVGClipId();

  // then render svg
  return compensate(new Renderer()
    .initialize(doc.body, w, h)
    .render(scene)
    .svg());
}

function renderAsync(scene, w, h, callback) {
  // clear document first
  for (var i=doc.body.children.length; --i>=0;) {
    doc.body.removeChild(doc.body.children[i]);
  }

  // reset clip id counter
  vega.resetSVGClipId();

  // then render svg
  new Renderer(loader({mode: 'http', baseURL: './test/resources/'}))
    .initialize(doc.body, w, h)
    .renderAsync(scene)
    .then(function(r) { callback(compensate(r.svg())); });
}

// workaround for broken jsdom style parser
function replaceFont(str, font) {
  var tok = font.split(' ');
  return 'font: ' +
    tok.slice(2, -1).concat([tok[1], tok[0]]).join(' ') + ';';
}

tape('SVGRenderer should support argument free constructor', function(test) {
  var r = new Renderer();
  test.equal(r.svg(), null);
  test.end();
});

tape('SVGRenderer should behave when dom element is not provided', function(test) {
  var r = new Renderer().initialize(null, 100, 100, null);
  test.equal(r._svg, null);
  test.equal(r._root, null);
  test.equal(r.svg(), null);
  test.equal(r.background('blue').background(), 'blue');

  r.resize(200, 300);
  test.equal(r._width, 200);
  test.equal(r._height, 300);
  test.end();
});

tape('SVGRenderer should render scenegraph to svg', function(test) {
  var scene = loadScene('scenegraph-rect.json');
  var svg = render(scene, 400, 200);
  var file = load('svg/scenegraph-rect.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support clipping and gradients', function(test) {
  var r = new Renderer()
    .initialize(doc.body, 102, 102);

  vega.resetSVGClipId();
  var scene = loadScene('scenegraph-defs.json');
  var svg = compensate(r.render(scene).svg());
  var file = load('svg/scenegraph-defs.svg');
  test.equal(svg, file);

  svg = compensate(r.render(scene).svg());
  test.equal(svg, file);

  vega.resetSVGClipId();
  scene = loadScene('scenegraph-defs.json');
  scene.items[0].clip = false;
  scene.items[0].fill = 'red';
  svg = compensate(r.render(scene).svg());
  file = load('svg/scenegraph-defs2.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support axes, legends and sub-groups', function(test) {
  var scene = loadScene('scenegraph-barley.json');
  var svg = render(scene, 360, 740);
  var file = load('svg/scenegraph-barley.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support full redraw', function(test) {
  vega.resetSVGClipId();

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
  var file = load('svg/scenegraph-full-redraw.svg');
  test.equal(svg, file);

  mark.pop();
  r.render(scene);

  svg = compensate(r.svg());
  file = load('svg/scenegraph-single-redraw.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support enter-item redraw', function(test) {
  vega.resetSVGClipId();

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
  var file = load('svg/scenegraph-enter-redraw.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support exit-item redraw', function(test) {
  vega.resetSVGClipId();

  var scene = loadScene('scenegraph-rect.json');
  var r = new Renderer()
    .initialize(doc.body, 400, 200)
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
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support single-item redraw', function(test) {
  vega.resetSVGClipId();

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
  var file = load('svg/scenegraph-single-redraw.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support multi-item redraw', function(test) {
  vega.resetSVGClipId();

  var scene = vega.sceneFromJSON(vega.sceneToJSON(marks['line-1']));
  var r = new Renderer()
    .initialize(doc.body, 400, 400)
    .background('white')
    .render(scene);

  var line1 = scene.items[1]; line1.y = 5;                        // update
  var line2 = scene.items.splice(2, 1)[0]; line2.status = 'exit'; // exit
  var line3 = {x:400, y:200}; line3.mark = scene;                 // enter
  scene.items.push(line3);

  var svg = compensate(r.render(scene, [line1, line2, line3]).svg());
  var file = load('svg/scenegraph-line-redraw.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should support enter-group redraw', function(test) {
  vega.resetSVGClipId();

  var scene = loadScene('scenegraph-barley.json');
  var r = new Renderer()
    .initialize(doc.body, 500, 600)
    .background('white')
    .render(scene);

  var group = vega.sceneFromJSON(vega.sceneToJSON(scene.items[0]));
  group.x = 200;
  group.mark = scene;
  scene.items.push(group);

  var svg = compensate(r.render(scene, [group]).svg());
  var file = load('svg/scenegraph-enter-group-redraw.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should handle empty item sets', function(test) {
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
  var file, svg;

  for (var i=0; i<types.length; ++i) {
    scene.marktype = types[i];
    file = 'svg/marks-empty-' + types[i] + '.svg';
    svg = render(scene, 500, 500);
    test.equal(svg, load(file));
  }
  test.end();
});

tape('SVGRenderer should render arc mark', function(test) {
  var svg = render(marks.arc, 500, 500);
  var file = load('svg/marks-arc.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render horizontal area mark', function(test) {
  var svg = render(marks['area-h'], 500, 500);
  var file = load('svg/marks-area-h.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render vertical area mark', function(test) {
  var svg = render(marks['area-v'], 500, 500);
  var file = load('svg/marks-area-v.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render area mark with breaks', function(test) {
  var svg = render(marks['area-breaks'], 500, 500);
  var file = load('svg/marks-area-breaks.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render trail mark', function(test) {
  var svg = render(marks['trail'], 500, 500);
  var file = load('svg/marks-area-trail.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render group mark', function(test) {
  var svg = render(marks.group, 500, 500);
  var file = load('svg/marks-group.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render image mark', function(test) {
  renderAsync(marks.image, 500, 500, function(svg) {
    var file = load('svg/marks-image.svg');
    test.equal(svg, file);
    test.end();
  });
});

tape('SVGRenderer should render line mark', function(test) {
  var svg = render(marks['line-1'], 500, 500);
  var file = load('svg/marks-line-1.svg');
  test.equal(svg, file);

  svg = render(marks['line-2'], 500, 500);
  file = load('svg/marks-line-2.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render line mark with breaks', function(test) {
  var svg = render(marks['line-breaks'], 500, 500);
  var file = load('svg/marks-line-breaks.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render path mark', function(test) {
  var svg = render(marks.path, 500, 500);
  var file = load('svg/marks-path.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render rect mark', function(test) {
  var svg = render(marks.rect, 500, 500);
  var file = load('svg/marks-rect.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render rule mark', function(test) {
  var svg = render(marks.rule, 500, 500);
  var file = load('svg/marks-rule.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render symbol mark', function(test) {
  var svg = render(marks.symbol, 500, 500);
  var file = load('svg/marks-symbol.svg');
  test.equal(svg, file);
  test.end();
});

tape('SVGRenderer should render text mark', function(test) {
  var svg = render(marks.text, 500, 500);
  var file = load('svg/marks-text.svg');
  test.equal(svg, file);
  test.end();
});
