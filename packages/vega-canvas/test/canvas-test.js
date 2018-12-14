var tape = require('tape'),
    vega = require('../'),
    canvas = require('canvas');

tape('Canvas loader loads node canvas', function(test) {
  var c = vega.canvas(10, 20);
  test.ok(c);
  test.ok(c.getContext);
  test.equal(c.width, 10);
  test.equal(c.height, 20);
  test.equal(vega.image(), canvas.Image);

  c = vega.canvas();
  test.equal(c.width, 0);
  test.equal(c.height, 0);

  test.end();
});
