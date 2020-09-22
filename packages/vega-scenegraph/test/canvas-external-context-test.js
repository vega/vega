var tape = require('tape'),
    fs = require('fs'),
    {canvas} = require('vega-canvas'),
    vega = require('../'),
    Renderer = vega.CanvasRenderer,
    res = './test/resources/';

const GENERATE = require('./resources/generate-tests');

function generate(path, image) {
  if (GENERATE) fs.writeFileSync(res + path, image);
}

function load(file) {
  return fs.readFileSync(res + file, 'utf8');
}

tape('CanvasRenderer should support supplied external canvas context', t => {
  const scene = vega.sceneFromJSON(load('scenegraph-rect.json')),
        externalCanvas = canvas(400, 400),
        externalContext = externalCanvas.getContext('2d'),
        cr = new Renderer();

  externalContext.save();
  cr.initialize(null, 400, 200, [0, 0], 1.0, { externalContext })
    .render(scene);
  externalContext.restore();

  externalContext.save();
  externalContext.translate(0, 200);
  cr.initialize(null, 400, 200, [10, 10], 0.5, { externalContext })
    .render(scene);
  externalContext.restore();

  const image = externalCanvas.toBuffer();
  generate('png/external-context-rect.png', image);
  const file = load('png/external-context-rect.png');
  t.ok(image+'' == file);
  t.end();
});
