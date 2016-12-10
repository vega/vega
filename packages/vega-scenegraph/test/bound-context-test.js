var tape = require('tape'),
    vega = require('../'),
    Bounds = vega.Bounds,
    boundContext = vega.boundContext,
    EPSILON = 1e-10;

function boundEqual(b, array) {
  return Math.abs(b.x1 - array[0]) < EPSILON
      && Math.abs(b.y1 - array[1]) < EPSILON
      && Math.abs(b.x2 - array[2]) < EPSILON
      && Math.abs(b.y2 - array[3]) < EPSILON;
}

tape('boundContext should bound arc segments', function(test) {
  var x = 0,
      y = 0,
      r = 1,
      rh = Math.SQRT1_2,
      tau = 2 * Math.PI,
      rotate = tau / 8,
      b = new Bounds();

  var angles = [
    {
      angle:  0,
      bounds: [1, 0, 1, 0],
      rotate: [rh, rh, rh, rh]
    },
    {
      angle:  0.25 * tau,
      bounds: [0, 0, 1, 1],
      rotate: [-rh, rh, rh, 1]
    },
    {
      angle:  0.50 * tau,
      bounds: [-1, 0, 1, 1],
      rotate: [-1, -rh, rh, 1]
    },
    {
      angle:  0.75 * tau,
      bounds: [-1, -1, 1, 1],
      rotate: [-1, -1, rh, 1]
    },
    {
      angle:  tau,
      bounds: [-1, -1, 1, 1],
      rotate: [-1, -1, 1, 1]
    }
  ];

  angles.forEach(function(_) {
    boundContext(b.clear()).arc(x, y, r, 0, _.angle, false);
    test.ok(boundEqual(b, _.bounds), 'bound-cw: ' + _.angle);

    boundContext(b.clear()).arc(x, y, r, _.angle, 0, true);
    test.ok(boundEqual(b, _.bounds), 'bound-ccw: ' + _.angle);

    boundContext(b.clear()).arc(x, y, r, rotate, rotate + _.angle, false);
    test.ok(boundEqual(b, _.rotate), 'rotate-cw: ' + _.angle);

    boundContext(b.clear()).arc(x, y, r, rotate + _.angle, rotate, true);
    test.ok(boundEqual(b, _.rotate), 'rotate-ccw: ' + _.angle);
  });

  test.end();
});
