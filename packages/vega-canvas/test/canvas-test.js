var vega = require('../'), canvas = require('canvas');

test('Canvas loader loads node canvas', function() {
  var c = vega.canvas(10, 20);
  expect(c).toBeTruthy();
  expect(c.getContext).toBeTruthy();
  expect(c.width).toBe(10);
  expect(c.height).toBe(20);
  expect(vega.image()).toBe(canvas.Image);

  c = vega.canvas();
  expect(c.width).toBe(0);
  expect(c.height).toBe(0);
});
