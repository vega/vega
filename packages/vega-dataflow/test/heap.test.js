'use strict';

var assert = require('chai').assert;
var Heap = require('../src/Heap');

describe('Heap', function() {

  var cmp = function(a,b) { return a < b ? -1 : a > b ? 1 : 0; };
  var data = [1, 5, 3, 4, 2];
  var heap = new Heap(cmp);

  it('should return undefined when empty', function() {
    assert.isUndefined(heap.peek());
    assert.isUndefined(heap.pop());
  });

  it('should push', function() {
    for (var i=0; i<data.length; ++i) {
      heap.push(data[i]);
      assert.equal(heap.size(), i+1);
    }
  });

  it('should peek', function() {
    assert.equal(heap.peek(), 1);
  });

  it('should pop', function() {
    for (var i=0; i<data.length; ++i) {
      assert.equal(heap.pop(), i+1);
    }
    assert.equal(heap.size(), 0);
  });

  it('should clear', function() {
    heap.push(1);
    heap.push(2);
    heap.clear();
    assert.equal(heap.size(), 0);
  });

  it('should pushpop', function() {
    for (var i=0; i<data.length; ++i) {
      heap.push(data[i]);
    }
    var v = heap.pushpop(0);
    assert.equal(v, 0);
    assert.equal(heap.size(), data.length);

    v = heap.pushpop(6);
    assert.equal(v, 1);
    assert.equal(heap.size(), data.length);
  });

  it('should replace', function() {
    var h = new Heap(function(a,b) {
      return a.x < b.x ? -1 : a.x > b.x ? 1 : 0;
    });
    h.push({x:3});
    h.push({x:5});
    h.push({x:1});

    var v = h.replace({x:2});
    assert.equal(v.x, 1);
    assert.equal(h.size(), 3);
    assert.equal(h.peek().x, 2);

    v = h.replace({a:5, x:6});
    assert.equal(v.x, 2);
    assert.equal(h.size(), 3);
    assert.equal(h.peek().x, 3);
  });

});
