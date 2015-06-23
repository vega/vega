'use strict';

var assert = require('chai').assert;
var Node = require('../src/Node');

describe('Node', function() {

  it('should support status flags', function() {
    var n = new Node();
    assert.notOk(n.router());
    assert.notOk(n.collector());
    assert.notOk(n.revises());
    assert.notOk(n.batch());

    n.router(true);
    assert.ok(n.router());
    assert.notOk(n.collector());
    assert.notOk(n.revises());
    assert.notOk(n.batch());
/*
    n.collector(true);
    assert.ok(n.router());
    assert.ok(n.collector());
    assert.notOk(n.revises());
    assert.notOk(n.batch());

    n.revises(true);
    assert.ok(n.router());
    assert.ok(n.collector());
    assert.ok(n.revises());
    assert.ok(n.batch());

    n.batch(true);
    assert.ok(n.router());
    assert.ok(n.collector());
    assert.ok(n.revises());
    assert.ok(n.batch());

    n.router(false);
    assert.notOk(n.router());
    assert.ok(n.collector());
    assert.ok(n.revises());
    assert.ok(n.batch());

    n.collector(false);
    assert.notOk(n.router());
    assert.notOk(n.collector());
    assert.ok(n.revises());
    assert.ok(n.batch());

    n.revises(false);
    assert.notOk(n.router());
    assert.notOk(n.collector());
    assert.notOk(n.revises());
    assert.ok(n.batch());

    n.batch(false);
    assert.notOk(n.router());
    assert.notOk(n.collector());
    assert.notOk(n.revises());
    assert.notOk(n.batch());
*/
  });

});
