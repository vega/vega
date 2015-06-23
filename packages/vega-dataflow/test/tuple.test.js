'use strict';

var assert = require('chai').assert;
var Tuple = require('../src/Tuple');
var SENTINEL = require('../src/Sentinel');

describe('Tuple', function() {

  it('should ingest tuples', function() {
    var o = {a: 5}, p = {data: 3}, d;

    d = Tuple.ingest(o);
    assert.equal(d._id, 1);
    assert.equal(d.a, 5)
    assert.strictEqual(d, o);
    assert.notOk(Tuple.has_prev(d));
    assert.isUndefined(d._prev);

    d = Tuple.ingest(o, null);
    assert.equal(d._id, 2);
    assert.notOk(Tuple.has_prev(d));
    assert.strictEqual(d._prev, SENTINEL);

    d = Tuple.ingest(5, p);
    assert.equal(d._id, 3);
    assert.equal(d.data, 5);
    assert.ok(Tuple.has_prev(d));
    assert.strictEqual(d._prev, p);
    assert.equal(d._prev.data, 3);
  });

  it('should derive inheriting tuples', function() {
    var o = {a: 5};
    var d = Tuple.derive(o);
    assert.equal(d.a, 5);
    assert.strictEqual(d.__proto__, o);
  });

  it('should set values', function() {
    var d = Tuple.ingest({a:5});
    assert.isTrue(Tuple.set(d, 'a', 7));
    assert.equal(d.a, 7);
    assert.notOk(Tuple.has_prev(d));

    d = Tuple.ingest({a:5}, null);
    assert.isTrue(Tuple.set(d, 'a', 7));
    assert.equal(d.a, 7);
    assert.equal(d._prev.a, 5);

    d = Tuple.ingest(5, {data: 3});
    assert.isTrue(Tuple.set(d, 'data', 7));
    assert.equal(d.data, 7);
    assert.equal(d._prev.data, 5);
    assert.isFalse(Tuple.set(d, 'data', 7));
  });

  it('should reset tuple ids', function() {
    assert.notEqual(Tuple.ingest({a:5})._id, 1);
    Tuple.reset();
    assert.equal(Tuple.ingest({a:5})._id, 1);
  });

  it('should build id maps', function() {
    var list = [{_id:1}, {_id:5}, {_id:3}];
    var map = Tuple.idMap(list);
    for (var i=0; i<6; ++i) {
      if (i % 2) {
        assert.ok(map[i]);
      } else {
        assert.notOk(map[i]);
      }
    }
  });

  it('should perform id filtering', function() {
    var all = [1,2,3,4,5,6].map(function(x) { return {_id:x}; });
    var rem = [all[0], all[2], all[4]];
    var out = Tuple.idFilter(all, rem);
    assert.equal(out.length, 3);
    assert.strictEqual(out[0], all[1]);
    assert.strictEqual(out[1], all[3]);
    assert.strictEqual(out[2], all[5]);
  });

});
