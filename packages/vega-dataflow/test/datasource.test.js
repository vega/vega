'use strict';

var assert = require('chai').assert;
var dl = require('datalib');
var Graph = require('../src/Graph');
var DataSource = require('../src/DataSource');

function datasource() {
  var g = new Graph(); g.init();
  return g.data('ds', []);
}

function tuples() {
  return [
    {a: 1, b: 'foo'},
    {a: 2, b: 'bar'},
    {a: 3, b: 'baz'}
  ];
}

describe('DataSource', function() {

  it('should support tuple insert', function() {
    var ds = datasource(),
        data = tuples();

    ds.insert(data).fire();
    assert.equal(ds.values().length, data.length);
  });

  it('should support tuple remove', function() {
    var ds = datasource(),
        data = tuples(),
        where = function(t) { return t.a > 1; },
        len = data.length - data.filter(where).length;

    ds.insert(data).fire();
    ds.remove(where).fire();
    assert.equal(ds.values().length, len);
  });

  it('should support tuple update', function() {
    var ds = datasource(),
        data = tuples(),
        where = function(t) { return t.a > 1; },
        set = function() { return 'boa'; },
        len = data.length - data.filter(where).length;

    ds.insert(data).fire();
    ds.update(where, 'b', set).fire();
    assert.equal(dl.count.distinct(ds.values(), 'b'), 2);
  });

  it('should support indices', function() {
    var ds = datasource(),
        data = tuples(),
        where = function(t) { return t.a > 1; },
        set = function() { return 'boa'; };

    // request index
    var index = ds.getIndex('b');

    // insert data
    ds.insert(data).fire();
    assert.equal(index['foo'], 1);
    assert.equal(index['bar'], 1);
    assert.equal(index['baz'], 1);

    // update data
    ds.update(where, 'b', set).fire();
    assert.equal(index['foo'], 1);
    assert.equal(index['boa'], 2);
    assert.equal(index['bar'], 0);
    assert.equal(index['baz'], 0);
  });

  it('should support indices for nested references', function() {
    var ds = datasource(),
        data = tuples();

    // add nested elements
    data.forEach(function(d, i) {
      d.sub = { num: i, prev: {num: i} };
    });

    // request index
    var index = ds.getIndex('sub.num');

    // insert data
    ds.insert(data).fire();
    assert.equal(index['0'], 1);
    assert.equal(index['1'], 1);
    assert.equal(index['2'], 1);

    // remove data
    ds.remove(function(d) { return d.sub.num > 1; }).fire();
    assert.equal(index['0'], 1);
    assert.equal(index['1'], 1);
    assert.equal(index['2'], 0);

    // update data
    ds.update(function(d) { return d.sub.num < 1; }, 'sub',
      function() { return {num: 1}; }).fire();
    assert.equal(index['0'], 0);
    assert.equal(index['1'], 2);
    assert.equal(index['2'], 0);
  });

});
