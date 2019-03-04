var vega = require('../');

function draw(context) {
  context.beginPath();
  context.moveTo(  0,   0);
  context.lineTo(-10, -10);
  context.lineTo(-10,  10);
  context.lineTo( 10, -10);
  context.lineTo( 10,  10);
  context.closePath();
}

test('intersectPath should intersect paths', function() {
  const b = new vega.Bounds(),
        p = vega.intersectPath(draw),
        s = {bounds: new vega.Bounds()};

  draw(vega.boundContext(s.bounds)); // calc item bounds

  expect(p(s, b.set(-11, -11,  11,  11))).toBeTruthy(); // enclose
  expect(p(s, b.set( -1,  -1,   1,   1))).toBeTruthy(); // middle
  expect(p(s, b.set( -8, -.1,  -7,  .1))).toBeTruthy(); // left
  expect(p(s, b.set(  7, -.1,   8,  .1))).toBeTruthy(); // right
  expect(p(s, b.set(-11, -11, -10, -10))).toBeTruthy(); // upper-left
  expect(p(s, b.set( 10, -11,  11, -10))).toBeTruthy(); // upper-right
  expect(p(s, b.set(-11,  10, -10,  11))).toBeTruthy(); // lower-left
  expect(p(s, b.set( 10,  10,  11,  11))).toBeTruthy(); // lower-right

  expect(p(s, b.set( -1, -10,   1,  -5))).toBeFalsy(); // middle
  expect(p(s, b.set( -1,   5,   1,  10))).toBeFalsy(); // middle
  expect(p(s, b.set(-12, -12, -11, -11))).toBeFalsy(); // upper-left
  expect(p(s, b.set( 11, -12,  12, -11))).toBeFalsy(); // upper-right
  expect(p(s, b.set(-12,  11, -11,  12))).toBeFalsy(); // lower-left
  expect(p(s, b.set( 11,  11,  12,  12))).toBeFalsy(); // lower-right
});

test('intersectPoint should intersect point items', function() {
  const b = new vega.Bounds(),
        p = {x: 10, y: 10, size: 1000},
        q = {x: 10, size: 1000};

  // specified coordinates
  expect(vega.intersectPoint(p, b.set( 0,  0, 20, 20))).toBeTruthy(); // enclose
  expect(vega.intersectPoint(p, b.set( 9,  0, 10, 20))).toBeTruthy(); // horiz
  expect(vega.intersectPoint(p, b.set( 0,  9, 30, 10))).toBeTruthy(); // vert
  expect(vega.intersectPoint(p, b.set( 0,  0,  9,  9))).toBeFalsy(); // upper-left
  expect(vega.intersectPoint(p, b.set(11, 11, 20, 20))).toBeFalsy(); // lower-right
  expect(vega.intersectPoint(p, b.set(11,  0, 20,  9))).toBeFalsy(); // upper-right
  expect(vega.intersectPoint(p, b.set( 0, 11,  9, 20))).toBeFalsy(); // lower-left

  // missing coordinates
  expect(vega.intersectPoint(q, b.set( 0, -5, 20, 20))).toBeTruthy(); // enclose
  expect(vega.intersectPoint(q, b.set( 9, -5, 10,  5))).toBeTruthy(); // horiz
  expect(vega.intersectPoint(q, b.set( 0, -5, 30,  0))).toBeTruthy(); // vert
  expect(vega.intersectPoint(q, b.set( 0, -5,  9, -1))).toBeFalsy(); // upper-left
  expect(vega.intersectPoint(q, b.set(11,  1, 20, 10))).toBeFalsy(); // lower-right
  expect(vega.intersectPoint(q, b.set(11, -5, 20, -1))).toBeFalsy(); // upper-right
  expect(vega.intersectPoint(q, b.set( 0,  1,  9, 10))).toBeFalsy(); // lower-left
});

test('intersectLine should intersect rule items', function() {
  const b = new vega.Bounds(),
        r = {x: 10, y: 10, x2: 50, y2: 50},
        s = {x: 10, y2: 50};

  // specified coordinates
  expect(vega.intersectRule(r, b.set( 0,  0, 60, 60))).toBeTruthy(); // enclose
  expect(vega.intersectRule(r, b.set(20, 20, 30, 30))).toBeTruthy(); // midline
  expect(vega.intersectRule(r, b.set( 0,  0, 10, 10))).toBeTruthy(); // start
  expect(vega.intersectRule(r, b.set(50, 50, 60, 60))).toBeTruthy(); // end
  expect(vega.intersectRule(r, b.set( 0,  0,  9,  9))).toBeFalsy(); // upper-left
  expect(vega.intersectRule(r, b.set(51, 51, 60, 60))).toBeFalsy(); // lower-right
  expect(vega.intersectRule(r, b.set(25, 10, 50, 20))).toBeFalsy(); // upper-right
  expect(vega.intersectRule(r, b.set(10, 25, 20, 50))).toBeFalsy(); // lower-left

  // missing coordinates
  expect(vega.intersectRule(s, b.set( 0,  0, 60, 60))).toBeTruthy(); // enclose
  expect(vega.intersectRule(s, b.set( 0, 20, 30, 30))).toBeTruthy(); // midline
  expect(vega.intersectRule(s, b.set( 0, -5, 10,  5))).toBeTruthy(); // start
  expect(vega.intersectRule(s, b.set( 0, 50, 10, 60))).toBeTruthy(); // end
  expect(vega.intersectRule(s, b.set( 0,  0, -1, -1))).toBeFalsy(); // upper-left
  expect(vega.intersectRule(s, b.set(51, 51, 60, 60))).toBeFalsy(); // lower-right
  expect(vega.intersectRule(s, b.set(25, 10, 50, 20))).toBeFalsy(); // upper-right
  expect(vega.intersectRule(s, b.set(11, 25, 20, 50))).toBeFalsy(); // lower-left
});

test('intersectBoxLine should compute box/line intersection', function() {
  const b = new vega.Bounds(),
        x = 10, y = 10,
        u = 50, v = 50;

  expect(vega.intersectBoxLine(b.set( 0,  0, 60, 60), x, y, u, v)).toBeTruthy(); // enclose
  expect(vega.intersectBoxLine(b.set(20, 20, 30, 30), x, y, u, v)).toBeTruthy(); // midline
  expect(vega.intersectBoxLine(b.set( 0,  0, 10, 10), x, y, u, v)).toBeTruthy(); // start
  expect(vega.intersectBoxLine(b.set(50, 50, 60, 60), x, y, u, v)).toBeTruthy(); // end

  expect(vega.intersectBoxLine(b.set( 0,  0,  9,  9), x, y, u, v)).toBeFalsy(); // upper-left
  expect(vega.intersectBoxLine(b.set(51, 51, 60, 60), x, y, u, v)).toBeFalsy(); // lower-right
  expect(vega.intersectBoxLine(b.set(25, 10, 50, 20), x, y, u, v)).toBeFalsy(); // upper-right
  expect(vega.intersectBoxLine(b.set(10, 25, 20, 50), x, y, u, v)).toBeFalsy(); // lower-left

  expect(vega.intersectBoxLine(b.set(10, 10, 10, 10), x, y, u, v)).toBeTruthy(); // singularity
});
