var tape = require('tape'),
  fs = require('fs'),
  vega = require('../'),
  Renderer = vega.CanvasRenderer,
  res = './test/resources/';

const { createCanvas } = require('canvas');

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

function loadScene(file) {
  return vega.sceneFromJSON(load(file));
}

const GENERATE = require('./resources/generate-tests');

function generate(path, image) {
  if (GENERATE) fs.writeFileSync(res + path, image);
}

tape('CanvasRenderer should render scenegraph to supplied canvas context', function(t) {
  const scene = loadScene('scenegraph-rect.json');

  const canvas = createCanvas(400, 400);
  const myContext = canvas.getContext('2d');

  myContext.save();
  
  new Renderer()
    .initialize(null, 400, 200, [0, 0], 1.0, { intoContext: myContext })
    .render(scene);

  myContext.restore();
  myContext.translate(0, 200);

  new Renderer()
    .initialize(null, 400, 200, [0, 0], 1.0, { intoContext: myContext })
    .render(scene);
  
  const image = canvas.toBuffer();
  generate('png/own-context-rect.png', image);
  var file = load('png/own-context-rect.png');
  t.ok(image+'' == file);
  t.end();
});