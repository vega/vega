var tape = require('tape'),
    fs = require('fs'),
    PNG = require('pngjs').PNG,
    pixelmatch = require('pixelmatch'),
    loader = require('vega-loader').loader,
    vega = require('../'),
    Bounds = vega.Bounds,
    Renderer = vega.CanvasRenderer,
    res = './test/resources/';

const GENERATE = require('./resources/generate-tests');

const marks = JSON.parse(load('marks.json', 'utf-8'));
for (const name in marks) { vega.sceneFromJSON(marks[name]); }

function generate(path, image) {
  if (GENERATE) fs.writeFileSync(res + path, image);
}

function load(file, encoding=null) {
  return fs.readFileSync(res + file, encoding);
}

function loadScene(file) {
  return vega.sceneFromJSON(load(file, 'utf-8'));
}

function comparePNGs(png1, png2) {
  const img1 = PNG.sync.read(png1);
  const img2 = PNG.sync.read(png2);

  const {width, height} = img1;

  return pixelmatch(img1.data, img2.data, null, width, height, {threshold: 0});
}

function render(scene, w, h) {
  return new Renderer()
    .initialize(null, w, h)
    .render(scene)
    .canvas()
    .toBuffer();
}

function renderAsync(scene, w, h, callback) {
  new Renderer(loader({mode: 'http', baseURL: './test/resources/'}))
    .initialize(null, w, h)
    .renderAsync(scene)
    .then(r => { callback(r.canvas().toBuffer()); })
    .catch(() => { callback(null); });
}

function clearPathCache(mark) {
  mark.items.forEach(item => {
    item.pathCache = null;
  });
  return mark;
}

tape('CanvasRenderer should support argument free constructor', t => {
  const r = new Renderer();
  t.notOk(r.canvas());
  t.notOk(r.context());
  t.end();
});

tape('CanvasRenderer should use DOM if available', t => {
  const jsdom = require('jsdom');
  global.document = (new jsdom.JSDOM()).window.document;

  const r = new Renderer().initialize(document.body, 100, 100);
  t.strictEqual(r.element(), document.body);
  t.strictEqual(r.canvas(), document.body.childNodes[0]);

  delete global.document;
  t.end();
});

tape('CanvasRenderer should render scenegraph to canvas', t => {
  const scene = loadScene('scenegraph-rect.json');
  const image = render(scene, 400, 200);
  generate('png/scenegraph-rect.png', image);
  const file = load('png/scenegraph-rect.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support clipping and gradients', t => {
  const scene = loadScene('scenegraph-defs.json');
  let image = render(scene, 102, 102);
  generate('png/scenegraph-defs.png', image);
  let file = load('png/scenegraph-defs.png');
  t.equal(comparePNGs(image, file), 0);

  const scene2 = loadScene('scenegraph-defs.json');
  scene2.items[0].clip = false;
  scene2.items[0].fill = 'red';
  image = render(scene2, 102, 102);
  generate('png/scenegraph-defs2.png', image);
  file = load('png/scenegraph-defs2.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support axes, legends and sub-groups', t => {
  const scene = loadScene('scenegraph-barley.json');
  const image = render(scene, 360, 740);
  generate('png/scenegraph-barley.png', image);
  const file = load('png/scenegraph-barley.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support full redraw', t => {
  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer()
    .initialize(null, 400, 200)
    .background('white')
    .render(scene);

  const mark = scene.items[0].items[0].items;
  const rect = mark[1]; rect.fill = 'red'; rect.width *= 2;
  mark.push({
    mark: mark, x: 0, y: 0, width: 10, height: 10, fill: 'purple',
    bounds: new Bounds().set(0, 0, 10, 10)
  });
  r.render(scene);

  let image = r.canvas().toBuffer();
  generate('png/scenegraph-full-redraw.png', image);
  let file = load('png/scenegraph-full-redraw.png');
  t.equal(comparePNGs(image, file), 0);

  mark.pop();
  r.render(scene);

  image = r.canvas().toBuffer();
  generate('png/scenegraph-single-redraw.png', image);
  file = load('png/scenegraph-single-redraw.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support enter-item redraw', t => {
  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer()
    .initialize(null, 400, 200)
    .background('white')
    .render(scene);

  const rects = scene.items[0].items[0];

  const rect1 = {x:10, y:10, width:50, height:50, fill:'red'};
  rect1.mark = rects;
  rect1.bounds = new Bounds().set(10, 10, 60, 60);
  rects.items.push(rect1);

  const rect2 = {x:70, y:10, width:50, height:50, fill:'blue'};
  rect2.mark = rects;
  rect2.bounds = new Bounds().set(70, 10, 120, 60);
  rects.items.push(rect2);

  r.dirty(rect1);
  r.dirty(rect2);
  r.render(scene);
  const image = r.canvas().toBuffer();
  generate('png/scenegraph-enter-redraw.png', image);
  const file = load('png/scenegraph-enter-redraw.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support exit-item redraw', t => {
  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer()
    .initialize(null, 400, 200)
    .background('white')
    .render(scene);

  const rect = scene.items[0].items[0].items.pop();
  rect.status = 'exit';
  r.dirty(rect);
  r.render(scene);

  const image = r.canvas().toBuffer();
  generate('png/scenegraph-exit-redraw.png', image);
  const file = load('png/scenegraph-exit-redraw.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support single-item redraw', t => {
  const scene = loadScene('scenegraph-rect.json');
  const r = new Renderer()
    .initialize(null, 400, 200)
    .background('white')
    .render(scene);

  const rect = scene.items[0].items[0].items[1];
  r.dirty(rect);
  rect.fill = 'red';
  rect.width *= 2;
  rect.bounds.x2 = 2*rect.bounds.x2 - rect.bounds.x1;
  r.dirty(rect);
  r.render(scene);

  const image = r.canvas().toBuffer();
  generate('png/scenegraph-single-redraw.png', image);
  const file = load('png/scenegraph-single-redraw.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support multi-item redraw', t => {
  const scene = vega.sceneFromJSON(vega.sceneToJSON(marks['line-1']));
  const r = new Renderer()
    .initialize(null, 400, 400)
    .background('white')
    .render(scene);

  const line1 = scene.items[1]; line1.y = 5;                        // update
  const line2 = scene.items.splice(2, 1)[0]; line2.status = 'exit'; // exit
  const line3 = {x:400, y:200}; line3.mark = scene;                 // enter
  scene.bounds.set(-1, -1, 401, 201);
  scene.items[0].pathCache = null;
  scene.items.push(line3);

  r.render(scene);
  const image = r.canvas().toBuffer();
  generate('png/scenegraph-line-redraw.png', image);
  const file = load('png/scenegraph-line-redraw.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should support enter-group redraw', t => {
  let scene = loadScene('scenegraph-barley.json');
  const r = new Renderer()
    .initialize(null, 500, 600)
    .background('white')
    .render(scene);

  const group = JSON.parse(vega.sceneToJSON(scene.items[0]));
  group.x = 200;
  scene = JSON.parse(vega.sceneToJSON(scene));
  scene.items.push(group);
  scene = vega.sceneFromJSON(scene);

  r.dirty(group);
  const image = r.render(scene).canvas().toBuffer();
  generate('png/scenegraph-enter-group-redraw.png', image);
  const file = load('png/scenegraph-enter-group-redraw.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should skip empty item sets', t => {
  const scene = {marktype:'', items:[]};
  const types = [
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
  var file = load('png/marks-empty.png'), image;

  for (let i=0; i<types.length; ++i) {
    scene.marktype = types[i];
    image = render(scene, 500, 500);
    t.equal(comparePNGs(image, file), 0);
  }
  t.end();
});

tape('CanvasRenderer should render arc mark', t => {
  const image = render(marks.arc, 500, 500);
  generate('png/marks-arc.png', image);
  const file = load('png/marks-arc.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render horizontal area mark', t => {
  let image = render(marks['area-h'], 500, 500);
  generate('png/marks-area-h.png', image);
  const file = load('png/marks-area-h.png');
  t.equal(comparePNGs(image, file), 0);

  // clear path cache and re-render
  image = render(clearPathCache(marks['area-h']), 500, 500);
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render vertical area mark', t => {
  let image = render(marks['area-v'], 500, 500);
  generate('png/marks-area-v.png', image);
  const file = load('png/marks-area-v.png');
  t.equal(comparePNGs(image, file), 0);

  // clear path cache and re-render
  image = render(clearPathCache(marks['area-v']), 500, 500);
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render area mark with breaks', t => {
  const image = render(marks['area-breaks'], 500, 500);
  generate('png/marks-area-breaks.png', image);
  const file = load('png/marks-area-breaks.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render trail mark', t => {
  const image = render(marks['trail'], 500, 500);
  generate('png/marks-area-trail.png', image);
  const file = load('png/marks-area-trail.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render group mark', t => {
  const image = render(marks.group, 500, 500);
  generate('png/marks-group.png', image);
  const file = load('png/marks-group.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render image mark', t => {
  renderAsync(marks.image, 500, 500, image => {
    generate('png/marks-image.png', image);
    const file = load('png/marks-image.png');
    t.equal(comparePNGs(image, file), 0);
    t.end();
  });
});

tape('CanvasRenderer should skip invalid image', t => {
  const scene = vega.sceneFromJSON({
    marktype: 'image',
    items: [{url: 'does_not_exist.png'}]
  });
  renderAsync(scene, 500, 500, image => {
    if (image != null) {
      generate('png/marks-empty.png', image);
      const file = load('png/marks-empty.png');
      t.equal(comparePNGs(image, file), 0);
    } else {
      t.fail('Image rendering failed');
    }
    t.end();
  });
});

tape('CanvasRenderer should render line mark', t => {
  let image = render(marks['line-1'], 500, 500);
  generate('png/marks-line-1.png', image);
  let file = load('png/marks-line-1.png');
  t.equal(comparePNGs(image, file), 0);

  image = render(marks['line-2'], 500, 500);
  generate('png/marks-line-2.png', image);
  file = load('png/marks-line-2.png');
  t.equal(comparePNGs(image, file), 0);

  // clear path cache and re-render
  image = render(clearPathCache(marks['line-2']), 500, 500);
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render line mark with breaks', t => {
  const image = render(marks['line-breaks'], 500, 500);
  generate('png/marks-line-breaks.png', image);
  const file = load('png/marks-line-breaks.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render path mark', t => {
  let image = render(marks.path, 500, 500);
  generate('png/marks-path.png', image);
  const file = load('png/marks-path.png');
  t.equal(comparePNGs(image, file), 0);

  // clear path cache and re-render
  image = render(clearPathCache(marks.path), 500, 500);
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render rect mark', t => {
  const image = render(marks.rect, 500, 500);
  generate('png/marks-rect.png', image);
  const file = load('png/marks-rect.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render rule mark', t => {
  const image = render(marks.rule, 500, 500);
  generate('png/marks-rule.png', image);
  const file = load('png/marks-rule.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render symbol mark', t => {
  const image = render(marks.symbol, 500, 500);
  generate('png/marks-symbol.png', image);
  const file = load('png/marks-symbol.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});

tape('CanvasRenderer should render text mark', t => {
  const image = render(marks.text, 500, 500);
  generate('png/marks-text.png', image);
  const file = load('png/marks-text.png');
  t.equal(comparePNGs(image, file), 0);
  t.end();
});
