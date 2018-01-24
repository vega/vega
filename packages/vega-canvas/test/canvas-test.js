var tape = require('tape'),
    vega = require('../'),
    canvas = require('canvas'),
    canvasPre = require('canvas-prebuilt');

tape('Canvas loader loads node canvas', function(test) {
  var c = vega.canvas(10, 20);
  test.ok(c);
  test.ok(c.getContext);
  test.equal(c.width, 10);
  test.equal(c.height, 20);
  test.equal(vega.image(), canvas.Image);
  test.notEqual(vega.image(), canvasPre.Image);

  c = vega.canvas();
  test.equal(c.width, 0);
  test.equal(c.height, 0);

  test.end();
});

tape('Canvas loader loads node canvas-prebuilt', function(test) {
  // mask canvas module
  require.cache[require.resolve('canvas')] = 1;

  // reload vega-canvas module
  delete require.cache[require.resolve('../')];
  vega = require('../');

  var c = vega.canvas(10, 20);
  test.ok(c);
  test.ok(c.getContext);
  test.equal(c.width, 10);
  test.equal(c.height, 20);
  test.equal(vega.image(), canvasPre.Image);
  test.notEqual(vega.image(), canvas.Image);
  test.end();
});