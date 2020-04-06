const tape = require('tape');
const fs = require('fs');
const loader = require('vega-loader').loader;
const vega = require('../');
const Bounds = vega.Bounds;
const Renderer = vega.SVGRenderer;
const jsdom = require('jsdom');
const doc = new jsdom.JSDOM().window.document;

const res = './test/resources/';

const marks = JSON.parse(load('marks.json'));
for (const name in marks) {
  vega.sceneFromJSON(marks[name]);
}

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
  for (let i = doc.body.children.length; --i >= 0; ) {
    doc.body.removeChild(doc.body.children[i]);
  }

  // reset clip id counter
  vega.resetSVGClipId();

  // then render svg
  return compensate(new Renderer().initialize(doc.body, w, h).render(scene).svg());
}

function renderAsync(scene, w, h, callback) {
  // clear document first
  for (let i = doc.body.children.length; --i >= 0; ) {
    doc.body.removeChild(doc.body.children[i]);
  }

  // reset clip id counter
  vega.resetSVGClipId();

  // then render svg
  new Renderer(loader({mode: 'http', baseURL: './test/resources/'}))
    .initialize(doc.body, w, h)
    .renderAsync(scene)
    .then(function (r) {
      callback(compensate(r.svg()));
    });
}

// workaround for broken jsdom style parser
function replaceFont(str, font) {
  const tok = font.split(' ');
  return 'font: ' + tok.slice(2, -1).concat([tok[1], tok[0]]).join(' ') + ';';
}

tape('SVGRenderer should support argument free constructor', function (t) {
  const r = new Renderer();
  t.equal(r.svg(), null);
  t.end();
});

tape('SVGRenderer should behave when dom element is not provided', function (t) {
  const r = new Renderer().initialize(null, 100, 100, null);
  t.equal(r._svg, null);
  t.equal(r._root, null);
  t.equal(r.svg(), null);
  t.equal(r.background('blue').background(), 'blue');

  r.resize(200, 300);
  t.equal(r._width, 200);
  t.equal(r._height, 300);
  t.end();
});

tape('SVGRenderer should render scenegraph to svg', function (t) {
  const scene = loadScene('scenegraph-rect.json');
  const svg = render(scene, 400, 200);
  const file = load('svg/scenegraph-rect.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support clipping and gradients', function (t) {
  const r = new Renderer().initialize(doc.body, 102, 102);

  vega.resetSVGClipId();
  let scene = loadScene('scenegraph-defs.json');
  let svg = compensate(r.render(scene).svg());
  let file = load('svg/scenegraph-defs.svg');
  t.equal(svg, file);

  svg = compensate(r.render(scene).svg());
  t.equal(svg, file);

  vega.resetSVGClipId();
  scene = loadScene('scenegraph-defs.json');
  scene.items[0].clip = false;
  scene.items[0].fill = 'red';
  svg = compensate(r.render(scene).svg());
  file = load('svg/scenegraph-defs2.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support axes, legends and sub-groups', function (t) {
  const scene = loadScene('scenegraph-barley.json');
  const svg = render(scene, 360, 740);
  const file = load('svg/scenegraph-barley.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support full redraw', function (t) {
  vega.resetSVGClipId();

  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer().initialize(doc.body, 400, 200).background('white').render(scene);

  const mark = scene.items[0].items[0].items;
  const rect = mark[1];
  rect.fill = 'red';
  rect.width *= 2;
  mark.push({
    mark: mark,
    x: 0,
    y: 0,
    width: 10,
    height: 10,
    fill: 'purple'
  });
  r.render(scene);

  let svg = compensate(r.svg());
  let file = load('svg/scenegraph-full-redraw.svg');
  t.equal(svg, file);

  mark.pop();
  r.render(scene);

  svg = compensate(r.svg());
  file = load('svg/scenegraph-single-redraw.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support enter-item redraw', function (t) {
  vega.resetSVGClipId();

  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer().initialize(doc.body, 400, 200).background('white').render(scene);

  const rects = scene.items[0].items[0];
  const rect1 = {x: 10, y: 10, width: 50, height: 50, fill: 'red'};
  rect1.mark = rects;
  rect1.bounds = new Bounds().set(10, 10, 60, 60);
  rects.items.push(rect1);

  const rect2 = {x: 70, y: 10, width: 50, height: 50, fill: 'blue'};
  rect2.mark = rects;
  rect2.bounds = new Bounds().set(70, 10, 120, 60);
  rects.items.push(rect2);

  const svg = compensate(r.render(scene, [rect1, rect2]).svg());
  const file = load('svg/scenegraph-enter-redraw.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support exit-item redraw', function (t) {
  vega.resetSVGClipId();

  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer().initialize(doc.body, 400, 200).background('white').render(scene);

  const rect = scene.items[0].items[0].items.pop();
  rect.exit = true;
  rect._svg.remove =
    rect._svg.remove ||
    function () {
      this.parentNode.removeChild(this);
    };
  r.render(scene, [rect]);

  const svg = compensate(r.svg());
  const file = load('svg/scenegraph-exit-redraw.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support single-item redraw', function (t) {
  vega.resetSVGClipId();

  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer().initialize(doc.body, 400, 200).background('white').render(scene);

  const rect = scene.items[0].items[0].items[1];
  rect.fill = 'red';
  rect.width *= 2;
  rect.bounds.x2 = 2 * rect.bounds.x2 - rect.bounds.x1;
  r.render(scene, [rect]);

  const svg = compensate(r.svg());
  const file = load('svg/scenegraph-single-redraw.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support multi-item redraw', function (t) {
  vega.resetSVGClipId();

  const scene = vega.sceneFromJSON(vega.sceneToJSON(marks['line-1']));
  const r = new Renderer().initialize(doc.body, 400, 400).background('white').render(scene);

  const line1 = scene.items[1];
  line1.y = 5; // update
  const line2 = scene.items.splice(2, 1)[0];
  line2.status = 'exit'; // exit
  const line3 = {x: 400, y: 200};
  line3.mark = scene; // enter
  scene.items.push(line3);

  const svg = compensate(r.render(scene, [line1, line2, line3]).svg());
  const file = load('svg/scenegraph-line-redraw.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should support enter-group redraw', function (t) {
  vega.resetSVGClipId();

  const scene = loadScene('scenegraph-barley.json');
  const r = new Renderer().initialize(doc.body, 500, 600).background('white').render(scene);

  const group = vega.sceneFromJSON(vega.sceneToJSON(scene.items[0]));
  group.x = 200;
  group.mark = scene;
  scene.items.push(group);

  const svg = compensate(r.render(scene, [group]).svg());
  const file = load('svg/scenegraph-enter-group-redraw.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should handle empty item sets', function (t) {
  const types = ['arc', 'area', 'group', 'image', 'line', 'path', 'rect', 'rule', 'symbol', 'text'];
  let scene;
  let file;
  let svg;

  for (let i = 0; i < types.length; ++i) {
    scene = {marktype: types[i], items: []};
    file = 'svg/marks-empty-' + types[i] + '.svg';
    svg = render(scene, 500, 500);
    t.equal(svg, load(file));
  }
  t.end();
});

tape('SVGRenderer should render arc mark', function (t) {
  const svg = render(marks.arc, 500, 500);
  const file = load('svg/marks-arc.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render horizontal area mark', function (t) {
  const svg = render(marks['area-h'], 500, 500);
  const file = load('svg/marks-area-h.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render vertical area mark', function (t) {
  const svg = render(marks['area-v'], 500, 500);
  const file = load('svg/marks-area-v.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render area mark with breaks', function (t) {
  const svg = render(marks['area-breaks'], 500, 500);
  const file = load('svg/marks-area-breaks.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render trail mark', function (t) {
  const svg = render(marks['trail'], 500, 500);
  const file = load('svg/marks-area-trail.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render group mark', function (t) {
  const svg = render(marks.group, 500, 500);
  const file = load('svg/marks-group.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render image mark', function (t) {
  renderAsync(marks.image, 500, 500, function (svg) {
    const file = load('svg/marks-image.svg');
    t.equal(svg, file);
    t.end();
  });
});

tape('SVGRenderer should render line mark', function (t) {
  let svg = render(marks['line-1'], 500, 500);
  let file = load('svg/marks-line-1.svg');
  t.equal(svg, file);

  svg = render(marks['line-2'], 500, 500);
  file = load('svg/marks-line-2.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render line mark with breaks', function (t) {
  const svg = render(marks['line-breaks'], 500, 500);
  const file = load('svg/marks-line-breaks.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render path mark', function (t) {
  const svg = render(marks.path, 500, 500);
  const file = load('svg/marks-path.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render rect mark', function (t) {
  const svg = render(marks.rect, 500, 500);
  const file = load('svg/marks-rect.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render rule mark', function (t) {
  const svg = render(marks.rule, 500, 500);
  const file = load('svg/marks-rule.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render symbol mark', function (t) {
  const svg = render(marks.symbol, 500, 500);
  const file = load('svg/marks-symbol.svg');
  t.equal(svg, file);
  t.end();
});

tape('SVGRenderer should render text mark', function (t) {
  const svg = render(marks.text, 500, 500);
  const file = load('svg/marks-text.svg');
  t.equal(svg, file);
  t.end();
});
