'use strict';

var expect = require('chai').expect;
var expr = require('../src/index');
var functions = require('../src/functions');

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

  it('should eval externally-defined functions', function() {
    function inrange(val, a, b, exclusive) {
      var min = a, max = b;
      if (a > b) { min = b; max = a; }
      return exclusive ?
        (min < val && max > val) :
        (min <= val && max >= val);
    }
    function test(compile) {
      expect(compile('inrange(2, 1, 3)').fn()).to.equal(true);
      expect(compile('inrange(2, 3, 1)').fn()).to.equal(true);
      expect(compile('inrange(2, 1, 2, true)').fn()).to.equal(false);
      expect(compile('inrange(2, 1, 2, false)').fn()).to.equal(true);
    }
    var opt = {
      fieldVar: 'd',
      globalVar: 'global',
      functionDefs: function() {
        return {inrange: inrange};
      },
      functions: function(codegen) {
        var f = functions(codegen);
        f.inrange = 'this.defs.inrange';
        return f;
      }
    };
    // short-argument form
    test(expr.compiler(['d'], opt));
    // long-argument form
    test(expr.compiler(['a','b','c','d','e','f','g','h'], opt));
  });
});