'use strict';

var assert = require('chai').assert;
var Bounds = require('../src/util/Bounds');

describe('bounds', function() {

  it('should support constuctor without arguments', function() {
    var b = new Bounds();
    assert.strictEqual(b.x1, +Number.MAX_VALUE);
    assert.strictEqual(b.y1, +Number.MAX_VALUE);
    assert.strictEqual(b.x2, -Number.MAX_VALUE);
    assert.strictEqual(b.y2, -Number.MAX_VALUE);
  });

  it('should support constructor with bounds argument', function() {
    var b = new Bounds((new Bounds()).set(1,1,2,2));
    assert.strictEqual(b.x1, 1);
    assert.strictEqual(b.y1, 1);
    assert.strictEqual(b.x2, 2);
    assert.strictEqual(b.y2, 2);
  });

  it('should support clone', function() {
    var a = (new Bounds()).set(1,1,2,2);
    var b = a.clone();
    assert.notEqual(a, b);
    assert.strictEqual(b.x1, 1);
    assert.strictEqual(b.y1, 1);
    assert.strictEqual(b.x2, 2);
    assert.strictEqual(b.y2, 2);
    
  });

  it('should support set', function() {
    var b = (new Bounds()).set(1,1,2,2);
    assert.strictEqual(b.x1, 1);
    assert.strictEqual(b.y1, 1);
    assert.strictEqual(b.x2, 2);
    assert.strictEqual(b.y2, 2);
  });

  it('should support add point', function() {
    var b = (new Bounds()).add(1,1).add(2,2);
    assert.strictEqual(b.x1, 1);
    assert.strictEqual(b.y1, 1);
    assert.strictEqual(b.x2, 2);
    assert.strictEqual(b.y2, 2);
  });

  it('should support expand', function() {
    var b = (new Bounds()).add(1,1).add(2,2).expand(1);
    assert.strictEqual(b.x1, 0);
    assert.strictEqual(b.y1, 0);
    assert.strictEqual(b.x2, 3);
    assert.strictEqual(b.y2, 3);
  });

  it('should support round', function() {
    var b = (new Bounds()).add(0.5, 0.5).add(1.5, 1.5).round();
    assert.strictEqual(b.x1, 0);
    assert.strictEqual(b.y1, 0);
    assert.strictEqual(b.x2, 2);
    assert.strictEqual(b.y2, 2);
  });

  it('should support translate', function() {
    var b = (new Bounds()).set(1,1,2,2).translate(2,3);
    assert.strictEqual(b.x1, 3);
    assert.strictEqual(b.y1, 4);
    assert.strictEqual(b.x2, 4);
    assert.strictEqual(b.y2, 5);
  });

  it('should support rotate', function() {
    var b = (new Bounds()).set(0,0,2,2).rotate(Math.PI, 0, 0);
    assert.closeTo(b.x1, -2, 1e-10);
    assert.closeTo(b.y1, -2, 1e-10);
    assert.closeTo(b.x2, 0, 1e-10);
    assert.closeTo(b.y2, 0, 1e-10);
  });

  it('should support union', function() {
    var b = (new Bounds()).set(1,1,3,3).union((new Bounds()).set(2,2,5,5));
    assert.strictEqual(b.x1, 1);
    assert.strictEqual(b.y1, 1);
    assert.strictEqual(b.x2, 5);
    assert.strictEqual(b.y2, 5);
  });

  it('should support encloses', function() {
    var a = (new Bounds()).set(1,1,3,3),
        b = (new Bounds()).set(2,2,5,5),
        c = (new Bounds()).set(3,3,4,4);
    assert.isFalse(a.encloses(b));
    assert.isFalse(a.encloses(c));
    assert.isFalse(b.encloses(a));
    assert.isTrue(b.encloses(c));
    assert.isFalse(c.encloses(a));
    assert.isFalse(c.encloses(b));
  });

  it('should support intersects', function() {
    var a = (new Bounds()).set(1,1,3,3),
        b = (new Bounds()).set(2,2,5,5),
        c = (new Bounds()).set(4,4,5,5);
    assert.isTrue(a.intersects(b));
    assert.isFalse(a.intersects(c));
    assert.isTrue(b.intersects(a));
    assert.isTrue(b.intersects(c));
    assert.isFalse(c.intersects(a));
    assert.isTrue(c.intersects(b));
  });

  it('should support contains', function() {
    var b = (new Bounds()).set(1,1,3,3);
    assert.isFalse(b.contains(0,0));
    assert.isTrue(b.contains(1,1));
    assert.isTrue(b.contains(2,2));
    assert.isTrue(b.contains(3,3));
    assert.isFalse(b.contains(4,4));
  });

  it('should support width', function() {
    var b = (new Bounds()).set(1,1,3,5);
    assert.strictEqual(b.width(), 2);
  });

  it('should support height', function() {
    var b = (new Bounds()).set(1,1,3,5);
    assert.strictEqual(b.height(), 4);
  });

});