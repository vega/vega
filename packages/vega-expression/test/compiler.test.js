'use strict';

var expect = require('chai').expect;
var expr = require('../src/index');

describe('compiler', function() {

  var compile = expr.compiler(['d'], {
    fieldVar: 'd',
    globalVar: 'global'
  });

  it('should return compiled function', function() {
    var f = compile('d.a*d.a');
    expect(f.code).to.equal('(d.a*d.a)');
    expect(f.fields).to.deep.equal(['a']);
    expect(f.globals).to.deep.equal([]);
    expect(f.fn({a:2})).to.equal(4);
  });

});