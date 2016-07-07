var tape = require('tape'),
    Bounds = require('../').Bounds;

tape('Bounds should support constuctor without arguments', function(test) {
  var b = new Bounds();
  test.equal(b.x1, +Number.MAX_VALUE);
  test.equal(b.y1, +Number.MAX_VALUE);
  test.equal(b.x2, -Number.MAX_VALUE);
  test.equal(b.y2, -Number.MAX_VALUE);
  test.end();
});

tape('Bounds should support constructor with bounds argument', function(test) {
  var b = new Bounds((new Bounds()).set(1,1,2,2));
  test.equal(b.x1, 1);
  test.equal(b.y1, 1);
  test.equal(b.x2, 2);
  test.equal(b.y2, 2);
  test.end();
});

tape('Bounds should support clone', function(test) {
  var a = (new Bounds()).set(1,1,2,2);
  var b = a.clone();
  test.notEqual(a, b);
  test.equal(b.x1, 1);
  test.equal(b.y1, 1);
  test.equal(b.x2, 2);
  test.equal(b.y2, 2);
  test.end();
});

tape('Bounds should support set', function(test) {
  var b = (new Bounds()).set(1,1,2,2);
  test.equal(b.x1, 1);
  test.equal(b.y1, 1);
  test.equal(b.x2, 2);
  test.equal(b.y2, 2);
  test.end();
});

tape('Bounds should support add point', function(test) {
  var b = (new Bounds()).add(1,1).add(2,2);
  test.equal(b.x1, 1);
  test.equal(b.y1, 1);
  test.equal(b.x2, 2);
  test.equal(b.y2, 2);
  test.end();
});

tape('Bounds should support expand', function(test) {
  var b = (new Bounds()).add(1,1).add(2,2).expand(1);
  test.equal(b.x1, 0);
  test.equal(b.y1, 0);
  test.equal(b.x2, 3);
  test.equal(b.y2, 3);
  test.end();
});

tape('Bounds should support round', function(test) {
  var b = (new Bounds()).add(0.5, 0.5).add(1.5, 1.5).round();
  test.equal(b.x1, 0);
  test.equal(b.y1, 0);
  test.equal(b.x2, 2);
  test.equal(b.y2, 2);
  test.end();
});

tape('Bounds should support translate', function(test) {
  var b = (new Bounds()).set(1,1,2,2).translate(2,3);
  test.equal(b.x1, 3);
  test.equal(b.y1, 4);
  test.equal(b.x2, 4);
  test.equal(b.y2, 5);
  test.end();
});

tape('Bounds should support rotate', function(test) {
  var b = (new Bounds()).set(0,0,2,2).rotate(Math.PI, 0, 0);
  test.true(Math.abs(b.x1 - -2) < 1e-10);
  test.true(Math.abs(b.y1 - -2) < 1e-10);
  test.true(Math.abs(b.x2 - 0) < 1e-10);
  test.true(Math.abs(b.y2 - 0) < 1e-10);
  test.end();
});

tape('Bounds should support union', function(test) {
  var b = (new Bounds()).set(1,1,3,3).union((new Bounds()).set(2,2,5,5));
  test.equal(b.x1, 1);
  test.equal(b.y1, 1);
  test.equal(b.x2, 5);
  test.equal(b.y2, 5);
  test.end();
});

tape('Bounds should support encloses', function(test) {
  var a = (new Bounds()).set(1,1,3,3),
      b = (new Bounds()).set(2,2,5,5),
      c = (new Bounds()).set(3,3,4,4);
  test.false(a.encloses(b));
  test.false(a.encloses(c));
  test.false(b.encloses(a));
  test.true(b.encloses(c));
  test.false(c.encloses(a));
  test.false(c.encloses(b));
  test.end();
});

tape('Bounds should support intersects', function(test) {
  var a = (new Bounds()).set(1,1,3,3),
      b = (new Bounds()).set(2,2,5,5),
      c = (new Bounds()).set(4,4,5,5);
  test.true(a.intersects(b));
  test.false(a.intersects(c));
  test.true(b.intersects(a));
  test.true(b.intersects(c));
  test.false(c.intersects(a));
  test.true(c.intersects(b));
  test.end();
});

tape('Bounds should support alignsWith', function(test) {
  var a = (new Bounds()).set(1,1,5,5),
      b = (new Bounds()).set(1,2,8,4),
      c = (new Bounds()).set(5,5,8,8);
  test.true(a.alignsWith(b));
  test.true(b.alignsWith(a));
  test.false(a.alignsWith(c));
  test.false(c.alignsWith(a));
  test.true(b.alignsWith(c));
  test.true(c.alignsWith(b));
  test.end();
});

tape('Bounds should support contains', function(test) {
  var b = (new Bounds()).set(1,1,3,3);
  test.false(b.contains(0,0));
  test.true(b.contains(1,1));
  test.true(b.contains(2,2));
  test.true(b.contains(3,3));
  test.false(b.contains(4,4));
  test.end();
});

tape('Bounds should support width', function(test) {
  var b = (new Bounds()).set(1,1,3,5);
  test.equal(b.width(), 2);
  test.end();
});

tape('Bounds should support height', function(test) {
  var b = (new Bounds()).set(1,1,3,5);
  test.equal(b.height(), 4);
  test.end();
});
