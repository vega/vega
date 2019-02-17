var tape = require('tape'),
    vega = require('../');

function draw(context) {
  context.beginPath();
  context.moveTo(  0,   0);
  context.lineTo(-10, -10);
  context.lineTo(-10,  10);
  context.lineTo( 10, -10);
  context.lineTo( 10,  10);
  context.closePath();
}

tape('intersectPath should intersect paths', function(test) {
  const b = new vega.Bounds(),
        p = vega.intersectPath(draw),
        s = {bounds: new vega.Bounds()};

  draw(vega.boundContext(s.bounds)); // calc item bounds

  test.ok(p(s, b.set(-11, -11,  11,  11))); // enclose
  test.ok(p(s, b.set( -1,  -1,   1,   1))); // middle
  test.ok(p(s, b.set( -8, -.1,  -7,  .1))); // left
  test.ok(p(s, b.set(  7, -.1,   8,  .1))); // right
  test.ok(p(s, b.set(-11, -11, -10, -10))); // upper-left
  test.ok(p(s, b.set( 10, -11,  11, -10))); // upper-right
  test.ok(p(s, b.set(-11,  10, -10,  11))); // lower-left
  test.ok(p(s, b.set( 10,  10,  11,  11))); // lower-right

  test.notOk(p(s, b.set( -1, -10,   1,  -5))); // middle
  test.notOk(p(s, b.set( -1,   5,   1,  10))); // middle
  test.notOk(p(s, b.set(-12, -12, -11, -11))); // upper-left
  test.notOk(p(s, b.set( 11, -12,  12, -11))); // upper-right
  test.notOk(p(s, b.set(-12,  11, -11,  12))); // lower-left
  test.notOk(p(s, b.set( 11,  11,  12,  12))); // lower-right

  test.end();
});

tape('intersectPoint should intersect point items', function(test) {
  const b = new vega.Bounds(),
        p = {x: 10, y: 10, size: 1000},
        q = {x: 10, size: 1000};

  // specified coordinates
  test.ok(vega.intersectPoint(p, b.set( 0,  0, 20, 20))); // enclose
  test.ok(vega.intersectPoint(p, b.set( 9,  0, 10, 20))); // horiz
  test.ok(vega.intersectPoint(p, b.set( 0,  9, 30, 10))); // vert
  test.notOk(vega.intersectPoint(p, b.set( 0,  0,  9,  9))); // upper-left
  test.notOk(vega.intersectPoint(p, b.set(11, 11, 20, 20))); // lower-right
  test.notOk(vega.intersectPoint(p, b.set(11,  0, 20,  9))); // upper-right
  test.notOk(vega.intersectPoint(p, b.set( 0, 11,  9, 20))); // lower-left

  // missing coordinates
  test.ok(vega.intersectPoint(q, b.set( 0, -5, 20, 20))); // enclose
  test.ok(vega.intersectPoint(q, b.set( 9, -5, 10,  5))); // horiz
  test.ok(vega.intersectPoint(q, b.set( 0, -5, 30,  0))); // vert
  test.notOk(vega.intersectPoint(q, b.set( 0, -5,  9, -1))); // upper-left
  test.notOk(vega.intersectPoint(q, b.set(11,  1, 20, 10))); // lower-right
  test.notOk(vega.intersectPoint(q, b.set(11, -5, 20, -1))); // upper-right
  test.notOk(vega.intersectPoint(q, b.set( 0,  1,  9, 10))); // lower-left

  test.end();
});

tape('intersectLine should intersect rule items', function(test) {
  const b = new vega.Bounds(),
        r = {x: 10, y: 10, x2: 50, y2: 50},
        s = {x: 10, y2: 50};

  // specified coordinates
  test.ok(vega.intersectRule(r, b.set( 0,  0, 60, 60))); // enclose
  test.ok(vega.intersectRule(r, b.set(20, 20, 30, 30))); // midline
  test.ok(vega.intersectRule(r, b.set( 0,  0, 10, 10))); // start
  test.ok(vega.intersectRule(r, b.set(50, 50, 60, 60))); // end
  test.notOk(vega.intersectRule(r, b.set( 0,  0,  9,  9))); // upper-left
  test.notOk(vega.intersectRule(r, b.set(51, 51, 60, 60))); // lower-right
  test.notOk(vega.intersectRule(r, b.set(25, 10, 50, 20))); // upper-right
  test.notOk(vega.intersectRule(r, b.set(10, 25, 20, 50))); // lower-left

  // missing coordinates
  test.ok(vega.intersectRule(s, b.set( 0,  0, 60, 60))); // enclose
  test.ok(vega.intersectRule(s, b.set( 0, 20, 30, 30))); // midline
  test.ok(vega.intersectRule(s, b.set( 0, -5, 10,  5))); // start
  test.ok(vega.intersectRule(s, b.set( 0, 50, 10, 60))); // end
  test.notOk(vega.intersectRule(s, b.set( 0,  0, -1, -1))); // upper-left
  test.notOk(vega.intersectRule(s, b.set(51, 51, 60, 60))); // lower-right
  test.notOk(vega.intersectRule(s, b.set(25, 10, 50, 20))); // upper-right
  test.notOk(vega.intersectRule(s, b.set(11, 25, 20, 50))); // lower-left

  test.end();
});

tape('intersectBoxLine should compute box/line intersection', function(test) {
  const b = new vega.Bounds(),
        x = 10, y = 10,
        u = 50, v = 50;

  test.ok(vega.intersectBoxLine(b.set( 0,  0, 60, 60), x, y, u, v)); // enclose
  test.ok(vega.intersectBoxLine(b.set(20, 20, 30, 30), x, y, u, v)); // midline
  test.ok(vega.intersectBoxLine(b.set( 0,  0, 10, 10), x, y, u, v)); // start
  test.ok(vega.intersectBoxLine(b.set(50, 50, 60, 60), x, y, u, v)); // end

  test.notOk(vega.intersectBoxLine(b.set( 0,  0,  9,  9), x, y, u, v)); // upper-left
  test.notOk(vega.intersectBoxLine(b.set(51, 51, 60, 60), x, y, u, v)); // lower-right
  test.notOk(vega.intersectBoxLine(b.set(25, 10, 50, 20), x, y, u, v)); // upper-right
  test.notOk(vega.intersectBoxLine(b.set(10, 25, 20, 50), x, y, u, v)); // lower-left

  test.ok(vega.intersectBoxLine(b.set(10, 10, 10, 10), x, y, u, v)); // singularity

  test.end();
});
