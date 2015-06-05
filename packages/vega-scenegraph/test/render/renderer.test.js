'use strict';
var assert = require('chai').assert;
var Renderer = require('../../src/render/Renderer');
var res = './test/resources/';

function padding(l,t,r,b) {
  return {left: l, top: t, right: r, bottom: b};
}

describe('base renderer', function() {

  it('should support argument free constructor', function() {
    var r = new Renderer();
    assert.equal(r._ctx, null);
    assert.equal(r._bgcolor, null);
  });

  it('should initialize', function() {
    var ctx = {};
    var pad = padding(1, 1, 1, 1);
    var r = new Renderer();
    var s = r.initialize(ctx, 1, 2, pad);
    assert.strictEqual(s, r);
    assert.strictEqual(r._ctx, ctx);
    assert.strictEqual(r._width, 1);
    assert.strictEqual(r._height, 2);
    assert.deepEqual(r._padding, pad);
  });

  it('should resize', function() {
    var pad = padding(10, 10, 10, 10);
    var r = new Renderer();
    var s = r.resize(100, 200, pad);
    assert.strictEqual(s, r);
    assert.strictEqual(r._width, 100);
    assert.strictEqual(r._height, 200);
    assert.deepEqual(r._padding, pad);
  });

  it('should set background color', function() {
    var r = new Renderer();
    var s = r.background('steelblue');
    assert.strictEqual(s, r);    
    assert.strictEqual(r._bgcolor, 'steelblue');
  });
  
  it('should use zero-padding if none is provided', function() {
    var r = new Renderer().resize(100, 200, null);
    assert.deepEqual(r._padding, padding(0, 0, 0, 0));
  });

  it('should return self from render method', function() {
    var r = new Renderer();
    var s = r.render();
    assert.strictEqual(s, r);
  });
});