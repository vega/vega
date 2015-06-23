'use strict';

var assert = require('chai').assert;
var ChangeSet = require('../src/ChangeSet');

describe('ChangeSet', function() {

  it('should create change sets', function() {
    var cs = ChangeSet.create();
    assert.equal(cs.add.length, 0);
    assert.equal(cs.mod.length, 0);
    assert.equal(cs.rem.length, 0);
    assert.notOk(cs.reflow);

    cs = ChangeSet.create(null, true);
    assert.equal(cs.add.length, 0);
    assert.equal(cs.mod.length, 0);
    assert.equal(cs.rem.length, 0);
    assert.ok(cs.reflow);
  });

  it('should copy change sets', function() {
    var map = {
      stamp:   [0, 123],
      sort:    [null, 'sort'],
      facet:   [null, 'facet'],
      trans:   [null, 'trans'],
      dirty:   [[], 'dirty'],
      request: [null, 'request'],
      data:    [{}, 'data'],
      signals: [{}, 'signals']
    };

    var a = ChangeSet.create(),
        b = ChangeSet.create(),
        key;

    for (key in map) {
      assert.deepEqual(a[key], map[key][0]);
      a[key] = map[key][1];
    }

    ChangeSet.copy(a, b);
    for (key in map) {
      assert.deepEqual(b[key], map[key][1]);
    }
  });

});
