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

tape('intersectPath should intersect paths', t => {
  const b = new vega.Bounds(),
        p = vega.intersectPath(draw),
        s = {bounds: new vega.Bounds()};

  draw(vega.boundContext(s.bounds)); // calc item bounds

  t.ok(p(s, b.set(-11, -11,  11,  11))); // enclose
  t.ok(p(s, b.set( -1,  -1,   1,   1))); // middle
  t.ok(p(s, b.set( -8, -.1,  -7,  .1))); // left
  t.ok(p(s, b.set(  7, -.1,   8,  .1))); // right
  t.ok(p(s, b.set(-11, -11, -10, -10))); // upper-left
  t.ok(p(s, b.set( 10, -11,  11, -10))); // upper-right
  t.ok(p(s, b.set(-11,  10, -10,  11))); // lower-left
  t.ok(p(s, b.set( 10,  10,  11,  11))); // lower-right

  t.notOk(p(s, b.set( -1, -10,   1,  -5))); // middle
  t.notOk(p(s, b.set( -1,   5,   1,  10))); // middle
  t.notOk(p(s, b.set(-12, -12, -11, -11))); // upper-left
  t.notOk(p(s, b.set( 11, -12,  12, -11))); // upper-right
  t.notOk(p(s, b.set(-12,  11, -11,  12))); // lower-left
  t.notOk(p(s, b.set( 11,  11,  12,  12))); // lower-right

  t.end();
});

tape('intersectPoint should intersect point items', t => {
  const b = new vega.Bounds(),
        p = {x: 10, y: 10, size: 1000},
        q = {x: 10, size: 1000};

  // specified coordinates
  t.ok(vega.intersectPoint(p, b.set( 0,  0, 20, 20))); // enclose
  t.ok(vega.intersectPoint(p, b.set( 9,  0, 10, 20))); // horiz
  t.ok(vega.intersectPoint(p, b.set( 0,  9, 30, 10))); // vert
  t.notOk(vega.intersectPoint(p, b.set( 0,  0,  9,  9))); // upper-left
  t.notOk(vega.intersectPoint(p, b.set(11, 11, 20, 20))); // lower-right
  t.notOk(vega.intersectPoint(p, b.set(11,  0, 20,  9))); // upper-right
  t.notOk(vega.intersectPoint(p, b.set( 0, 11,  9, 20))); // lower-left

  // missing coordinates
  t.ok(vega.intersectPoint(q, b.set( 0, -5, 20, 20))); // enclose
  t.ok(vega.intersectPoint(q, b.set( 9, -5, 10,  5))); // horiz
  t.ok(vega.intersectPoint(q, b.set( 0, -5, 30,  0))); // vert
  t.notOk(vega.intersectPoint(q, b.set( 0, -5,  9, -1))); // upper-left
  t.notOk(vega.intersectPoint(q, b.set(11,  1, 20, 10))); // lower-right
  t.notOk(vega.intersectPoint(q, b.set(11, -5, 20, -1))); // upper-right
  t.notOk(vega.intersectPoint(q, b.set( 0,  1,  9, 10))); // lower-left

  t.end();
});

tape('intersectLine should intersect rule items', t => {
  const b = new vega.Bounds(),
        r = {x: 10, y: 10, x2: 50, y2: 50},
        s = {x: 10, y2: 50};

  // specified coordinates
  t.ok(vega.intersectRule(r, b.set( 0,  0, 60, 60))); // enclose
  t.ok(vega.intersectRule(r, b.set(20, 20, 30, 30))); // midline
  t.ok(vega.intersectRule(r, b.set( 0,  0, 10, 10))); // start
  t.ok(vega.intersectRule(r, b.set(50, 50, 60, 60))); // end
  t.notOk(vega.intersectRule(r, b.set( 0,  0,  9,  9))); // upper-left
  t.notOk(vega.intersectRule(r, b.set(51, 51, 60, 60))); // lower-right
  t.notOk(vega.intersectRule(r, b.set(25, 10, 50, 20))); // upper-right
  t.notOk(vega.intersectRule(r, b.set(10, 25, 20, 50))); // lower-left

  // missing coordinates
  t.ok(vega.intersectRule(s, b.set( 0,  0, 60, 60))); // enclose
  t.ok(vega.intersectRule(s, b.set( 0, 20, 30, 30))); // midline
  t.ok(vega.intersectRule(s, b.set( 0, -5, 10,  5))); // start
  t.ok(vega.intersectRule(s, b.set( 0, 50, 10, 60))); // end
  t.notOk(vega.intersectRule(s, b.set( 0,  0, -1, -1))); // upper-left
  t.notOk(vega.intersectRule(s, b.set(51, 51, 60, 60))); // lower-right
  t.notOk(vega.intersectRule(s, b.set(25, 10, 50, 20))); // upper-right
  t.notOk(vega.intersectRule(s, b.set(11, 25, 20, 50))); // lower-left

  t.end();
});

tape('intersectBoxLine should compute box/line intersection', t => {
  const b = new vega.Bounds(),
        x = 10, y = 10,
        u = 50, v = 50;

  t.ok(vega.intersectBoxLine(b.set( 0,  0, 60, 60), x, y, u, v)); // enclose
  t.ok(vega.intersectBoxLine(b.set(20, 20, 30, 30), x, y, u, v)); // midline
  t.ok(vega.intersectBoxLine(b.set( 0,  0, 10, 10), x, y, u, v)); // start
  t.ok(vega.intersectBoxLine(b.set(50, 50, 60, 60), x, y, u, v)); // end

  t.notOk(vega.intersectBoxLine(b.set( 0,  0,  9,  9), x, y, u, v)); // upper-left
  t.notOk(vega.intersectBoxLine(b.set(51, 51, 60, 60), x, y, u, v)); // lower-right
  t.notOk(vega.intersectBoxLine(b.set(25, 10, 50, 20), x, y, u, v)); // upper-right
  t.notOk(vega.intersectBoxLine(b.set(10, 25, 20, 50), x, y, u, v)); // lower-left

  t.ok(vega.intersectBoxLine(b.set(10, 10, 10, 10), x, y, u, v)); // singularity

  t.end();
});
