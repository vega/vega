'use strict';

var assert = require('chai').assert;
var Handler = require('../src/render/Handler');
var res = './test/resources/';

function padding(l,t,r,b) {
  return {left: l, top: t, right: r, bottom: b};
}

describe('base handler', function() {

  it('should support argument free constructor', function() {
    var h = new Handler();
    assert.equal(h._active, null);
    assert.isObject(h._handlers);
  });

  it('should initialize', function() {
    var el = {};
    var obj = {};
    var model = {};
    var pad = padding(1, 1, 1, 1);
    var h = new Handler();
    var s = h.initialize(el, pad, obj);
    assert.strictEqual(s, h);
    assert.strictEqual(h._el, el);
    assert.strictEqual(h._obj, obj);
    assert.deepEqual(h._padding, pad);

    h.initialize(el, pad);
    assert.strictEqual(h._obj, null);
    assert.isUndefined(h.on());
    assert.isUndefined(h.off());
  });

  it('should parse event names', function() {
    var h = new Handler();
    assert.strictEqual(h.eventName('touchstart'), 'touchstart');
    assert.strictEqual(h.eventName('click.foo'), 'click');
  });

  it('should return array of handlers', function() {
    var obj = {}
    var h = new Handler();
    assert.deepEqual(h.handlers(), []);
    h._handlers = {'click':[obj]};
    h = h.handlers();
    assert.equal(h && h.length, 1);
    assert.strictEqual(h[0], obj);
  });

  it('should set model', function() {
    var m = {};
    var h = new Handler().model(m);
    assert.strictEqual(h.model(), m);
  });

});