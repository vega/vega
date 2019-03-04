var Bounds = require('../').Bounds;

test('Bounds should support constuctor without arguments', function() {
  var b = new Bounds();
  expect(b.x1).toBe(+Number.MAX_VALUE);
  expect(b.y1).toBe(+Number.MAX_VALUE);
  expect(b.x2).toBe(-Number.MAX_VALUE);
  expect(b.y2).toBe(-Number.MAX_VALUE);
});

test('Bounds should support constructor with bounds argument', function() {
  var b = new Bounds((new Bounds()).set(1,1,2,2));
  expect(b.x1).toBe(1);
  expect(b.y1).toBe(1);
  expect(b.x2).toBe(2);
  expect(b.y2).toBe(2);
});

test('Bounds should support clone', function() {
  var a = (new Bounds()).set(1,1,2,2);
  var b = a.clone();
  expect(a).not.toBe(b);
  expect(b.x1).toBe(1);
  expect(b.y1).toBe(1);
  expect(b.x2).toBe(2);
  expect(b.y2).toBe(2);
});

test('Bounds should support set', function() {
  var b = (new Bounds()).set(1,1,2,2);
  expect(b.x1).toBe(1);
  expect(b.y1).toBe(1);
  expect(b.x2).toBe(2);
  expect(b.y2).toBe(2);
});

test('Bounds should support add point', function() {
  var b = (new Bounds()).add(1,1).add(2,2);
  expect(b.x1).toBe(1);
  expect(b.y1).toBe(1);
  expect(b.x2).toBe(2);
  expect(b.y2).toBe(2);
});

test('Bounds should support expand', function() {
  var b = (new Bounds()).add(1,1).add(2,2).expand(1);
  expect(b.x1).toBe(0);
  expect(b.y1).toBe(0);
  expect(b.x2).toBe(3);
  expect(b.y2).toBe(3);
});

test('Bounds should support round', function() {
  var b = (new Bounds()).add(0.5, 0.5).add(1.5, 1.5).round();
  expect(b.x1).toBe(0);
  expect(b.y1).toBe(0);
  expect(b.x2).toBe(2);
  expect(b.y2).toBe(2);
});

test('Bounds should support translate', function() {
  var b = (new Bounds()).set(1,1,2,2).translate(2,3);
  expect(b.x1).toBe(3);
  expect(b.y1).toBe(4);
  expect(b.x2).toBe(4);
  expect(b.y2).toBe(5);
});

test('Bounds should support rotate', function() {
  var b = (new Bounds()).set(0,0,2,2).rotate(Math.PI, 0, 0);
  expect(Math.abs(b.x1 - -2) < 1e-10).toBeTruthy();
  expect(Math.abs(b.y1 - -2) < 1e-10).toBeTruthy();
  expect(Math.abs(b.x2 - 0) < 1e-10).toBeTruthy();
  expect(Math.abs(b.y2 - 0) < 1e-10).toBeTruthy();
});

test('Bounds should support union', function() {
  var b = (new Bounds()).set(1,1,3,3).union((new Bounds()).set(2,2,5,5));
  expect(b.x1).toBe(1);
  expect(b.y1).toBe(1);
  expect(b.x2).toBe(5);
  expect(b.y2).toBe(5);
});

test('Bounds should support encloses', function() {
  var a = (new Bounds()).set(1,1,3,3),
      b = (new Bounds()).set(2,2,5,5),
      c = (new Bounds()).set(3,3,4,4);
  expect(a.encloses(b)).toBeFalsy();
  expect(a.encloses(c)).toBeFalsy();
  expect(b.encloses(a)).toBeFalsy();
  expect(b.encloses(c)).toBeTruthy();
  expect(c.encloses(a)).toBeFalsy();
  expect(c.encloses(b)).toBeFalsy();
});

test('Bounds should support intersects', function() {
  var a = (new Bounds()).set(1,1,3,3),
      b = (new Bounds()).set(2,2,5,5),
      c = (new Bounds()).set(4,4,5,5);
  expect(a.intersects(b)).toBeTruthy();
  expect(a.intersects(c)).toBeFalsy();
  expect(b.intersects(a)).toBeTruthy();
  expect(b.intersects(c)).toBeTruthy();
  expect(c.intersects(a)).toBeFalsy();
  expect(c.intersects(b)).toBeTruthy();
});

test('Bounds should support alignsWith', function() {
  var a = (new Bounds()).set(1,1,5,5),
      b = (new Bounds()).set(1,2,8,4),
      c = (new Bounds()).set(5,5,8,8);
  expect(a.alignsWith(b)).toBeTruthy();
  expect(b.alignsWith(a)).toBeTruthy();
  expect(a.alignsWith(c)).toBeFalsy();
  expect(c.alignsWith(a)).toBeFalsy();
  expect(b.alignsWith(c)).toBeTruthy();
  expect(c.alignsWith(b)).toBeTruthy();
});

test('Bounds should support contains', function() {
  var b = (new Bounds()).set(1,1,3,3);
  expect(b.contains(0,0)).toBeFalsy();
  expect(b.contains(1,1)).toBeTruthy();
  expect(b.contains(2,2)).toBeTruthy();
  expect(b.contains(3,3)).toBeTruthy();
  expect(b.contains(4,4)).toBeFalsy();
});

test('Bounds should support width', function() {
  var b = (new Bounds()).set(1,1,3,5);
  expect(b.width()).toBe(2);
});

test('Bounds should support height', function() {
  var b = (new Bounds()).set(1,1,3,5);
  expect(b.height()).toBe(4);
});
