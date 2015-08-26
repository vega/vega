'use strict';

var assert = require('chai').assert;
var Tuple = require('../src/Tuple');

describe('Tuple', function() {

  it('should ingest tuples', function() {
    var o = {a: 5}, p = {data: 3}, d;

    d = Tuple.ingest(o);
    assert.equal(d._id, 1);
    assert.equal(d.a, 5);
    assert.strictEqual(d, o);
    assert.isUndefined(d._prev);

    d = Tuple.ingest(o);
    assert.equal(d._id, 2);
    assert.isUndefined(d._prev, null);

    d = Tuple.ingest(3);
    Tuple.prev_init(d);
    Tuple.prev_update(d);
    d.data = 5;
    assert.equal(d._id, 3);
    assert.equal(d.data, 5);
    assert.isDefined(d._prev);
    assert.equal(d._prev.data, 3);
    assert.equal(d._prev._id, d._id);
  });

  it('should copy on derive', function() {
    var o = Tuple.ingest({a: 5});
    var d = Tuple.derive(o);
    assert.equal(d.a, 5);
    assert.isUndefined(d._prev);
  });

  it('should set values', function() {
    var d = Tuple.ingest({a:5});
    assert.equal(Tuple.set(d, 'a', 7), 1);
    assert.equal(d.a, 7);
    assert.isUndefined(d._prev);

    d = Tuple.ingest({a:5});
    Tuple.prev_init(d);
    Tuple.prev_update(d);
    assert.equal(Tuple.set(d, 'a', 7), 1);
    assert.equal(d.a, 7);
    assert.equal(d._prev.a, 5);

    d = Tuple.ingest(5);
    Tuple.prev_init(d);
    Tuple.prev_update(d);
    assert.equal(Tuple.set(d, 'data', 7), 1);
    assert.equal(d.data, 7);
    assert.equal(d._prev.data, 5);
    assert.equal(Tuple.set(d, 'data', 7), 0);
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
