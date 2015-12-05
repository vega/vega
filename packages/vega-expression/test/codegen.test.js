'use strict';

var expect = require('chai').expect;
var expr = require('../src/index');

function regexEqual(x, y) {
  return (x instanceof RegExp) && (y instanceof RegExp) &&
    (x.source === y.source) && (x.global === y.global) &&
    (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
}

describe('evaluate', function() {

  describe('without white or black list', function() {
    var codegen = expr.code();

    function evaluate(str) {
      var value = codegen(expr.parse(str));
      var fn = Function('"use strict"; return (' + value.code + ')');
      return fn();
    }

    evaluate.fn = function(str) {
      return function() { return evaluate(str); }
    };

    it('should access globals object', function() {
      var unicode = 'd\u00A9';
      global._val_ = 5;
      global[unicode] = 3.14;
      expect(evaluate('global._val_+1')).to.equal(6);
      expect(evaluate('global["'+unicode+'"]')).to.equal(3.14);
      delete global._val_;
      delete global[unicode];
    });

    it('should access globals object', function() {
      var unicode = 'd\u00A9';
      global._val_ = 5;
      global[unicode] = 3.14;
      expect(evaluate('1+global._val_')).to.equal(6);
      expect(evaluate('global["'+unicode+'"]')).to.equal(3.14);
      delete global._val_;
      delete global[unicode];
    });

    it('should return string input to codegen', function() {
      var value = codegen('d');
      expect(value.code).to.equal('d');
    });

    it('should not allow unknown ast node type', function() {
      expect(function() { codegen({}); }).to.throw();
      expect(function() { codegen({type: 'foo'}); }).to.throw();
    });
  });

  describe('with black list', function() {
    var codegen = expr.code({
      idBlackList: ['a', 'b', 'c'],
      fieldVar: 'd'
    });

    function evaluate(str) {
      var d = {a: 2, föö: 5};
      var value = codegen(expr.parse(str));
      var fn = Function('d', '"use strict"; return (' + value.code + ')');
      return fn(d);
    }

    evaluate.fn = function(str) {
      return function() { return evaluate(str); }
    };

    it('should not allow blacklisted ids', function() {
      expect(evaluate.fn('a')).to.throw();
      expect(evaluate.fn('b')).to.throw();
      expect(evaluate.fn('c')).to.throw();
    });

    it('should allow non-blacklisted ids', function() {
      expect(evaluate.fn('d')).to.not.throw();
      expect(evaluate.fn('global')).to.not.throw();
      expect(evaluate.fn('this')).to.not.throw();
    });
  });

  describe('with white list', function() {
    var codegen = expr.code({idWhiteList: ['datum', 'event', 'signals']});

    function evaluate(str) {
      var datum = {a: 2, föö: 5};
      var evt = {type: 'mousemove'};
      var value = codegen(expr.parse(str));
      if (value.globals.length > 0) {
        throw Error('Found non-whitelisted global identifier.');
      }
      var fn = Function('datum', 'event', 'signals',
        'return (' + value.code + ')');
      return fn(datum, evt);
    }

    evaluate.fn = function(str) {
      return function() { return evaluate(str); }
    };

    // Simple evaluation
    it('should eval simple integer expressions', function() {
      expect(evaluate('1')).to.equal(1);
      expect(evaluate('0xFF')).to.equal(255);
      expect(evaluate('1+1')).to.equal(2);
      expect(evaluate('1 + 1')).to.equal(2);
      expect(evaluate('1+(2+3)')).to.equal(6);
      expect(evaluate('3 * (2+1)')).to.equal(9);
    });

    it('should not allow octal literals', function() {
      expect(evaluate.fn('001')).to.throw();
    });

    it('should eval simple string expressions', function() {
      expect(evaluate('"a"')).to.equal('a');
      expect(evaluate('"\t"')).to.equal('\t');
      expect(evaluate('"\u00A9"')).to.equal('\u00A9');
      expect(evaluate('"a" + "b"')).to.equal('ab');
    });

    it('should eval simple boolean expressions', function() {
      expect(evaluate('true')).to.equal(true);
      expect(evaluate('true && false')).to.equal(false);
      expect(evaluate('true || false')).to.equal(true);
    });

    it('should eval simple combined expressions', function() {
      expect(evaluate('(2>3) ? 1 : 2')).to.equal(2);
      expect(evaluate('1 + "ab".length')).to.equal(3);
    });

    it('should eval simple regular expressions', function() {
      expect(regexEqual(/pattern/, evaluate('/pattern/'))).to.be.true;
      expect(regexEqual(/[0-9]+/, evaluate('/[0-9]+/'))).to.be.true;
      expect(regexEqual(/[0-9]+/, evaluate('/[1-9]+/'))).to.be.false;
      expect(regexEqual(/[a-z]/gi, evaluate('/[a-z]/gi'))).to.be.true;

      expect(regexEqual(/pattern/, evaluate('regexp("pattern")'))).to.be.true;
      expect(regexEqual(/[0-9]+/, evaluate('regexp("[0-9]+")'))).to.be.true;
      expect(regexEqual(/[0-9]+/, evaluate('regexp("[1-9]+")'))).to.be.false;
      expect(regexEqual(/[a-z]/gi, evaluate('regexp("[a-z]", "gi")'))).to.be.true;
    });

    it('should eval array expressions', function() {
      expect(evaluate('[]')).to.deep.equal([]);
      expect(evaluate('[1,2,3]')).to.deep.equal([1,2,3]);
      expect(evaluate('["a","b"]')).to.deep.equal(['a','b']);
    });

    it('should eval unary expressions', function() {
      expect(evaluate('-3')).to.equal(-3);
      expect(evaluate('+"4"')).to.equal(4);
      expect(evaluate('~~5.2')).to.equal(5);
      expect(evaluate('!1')).to.equal(false);
    });

    it('should not allow unary update expressions', function() {
      expect(evaluate.fn('++1')).to.throw();
      expect(evaluate.fn('1++')).to.throw();
    });

    it('should eval constant values', function() {
      expect(evaluate('null')).to.equal(null);
      expect(evaluate('E')).to.equal(Math.E);
      expect(evaluate('PI')).to.equal(Math.PI);
      expect(evaluate('SQRT2')).to.equal(Math.SQRT2);
    });

    // Evaluation with arguments
    it('should handle data argument', function() {
      expect(evaluate('datum.a')).to.equal(2);
      expect(evaluate('datum["a"]')).to.equal(2);
    });

    it('should handle event argument', function() {
      expect(evaluate('event.type')).to.equal('mousemove');
    });

    it('should handle unicode', function() {
      expect(evaluate('datum.föö')).to.equal(5);
    });


    // Function evaluation
    it('should eval math functions', function() {
      expect(evaluate('isNaN(1/0)')).to.equal(isNaN(1/0));
      expect(evaluate('isFinite(1)')).to.equal(isFinite(1));
      expect(evaluate('isFinite(1/0)')).to.equal(isFinite(1/0));
      expect(evaluate('abs(-3)')).to.equal(Math.abs(-3));
      expect(evaluate('acos(1)')).to.equal(Math.acos(1));
      expect(evaluate('asin(1)')).to.equal(Math.asin(1));
      expect(evaluate('atan(1)')).to.equal(Math.atan(1));
      expect(evaluate('atan2(1,2)')).to.equal(Math.atan2(1,2));
      expect(evaluate('ceil(0.5)')).to.equal(Math.ceil(0.5));
      expect(evaluate('cos(1)')).to.equal(Math.cos(1));
      expect(evaluate('exp(1)')).to.equal(Math.exp(1));
      expect(evaluate('floor(0.5)')).to.equal(Math.floor(0.5));
      expect(evaluate('log(2)')).to.equal(Math.log(2));
      expect(evaluate('max(0,1)')).to.equal(Math.max(0,1));
      expect(evaluate('min(0,1)')).to.equal(Math.min(0,1));
      expect(evaluate('pow(2,3)')).to.equal(Math.pow(2,3));
      expect(evaluate('round(0.5)')).to.equal(Math.round(0.5));
      expect(evaluate('sin(1)')).to.equal(Math.sin(1));
      expect(evaluate('sqrt(2)')).to.equal(Math.sqrt(2));
      expect(evaluate('tan(1)')).to.equal(Math.tan(1));
      for (var i=0; i<5; ++i) {
        var r = evaluate('random()');
        expect(r >= 0 && r <= 1).to.be.true;
      }
    });

    it('should eval clamp function', function() {
      expect(evaluate('clamp(5, 0, 10)')).to.equal(5);
      expect(evaluate('clamp(-1, 0, 10)')).to.equal(0);
      expect(evaluate('clamp(11, 0, 10)')).to.equal(10);
      expect(evaluate.fn('clamp(0,1)')).to.throw();
      expect(evaluate.fn('clamp(0,1,2,3)')).to.throw();
    });

    it('should eval string functions', function() {
      expect(evaluate('length("123")')).to.equal('123'.length);
      expect(evaluate('upper("abc")')).to.equal('abc'.toUpperCase());
      expect(evaluate('lower("abc")')).to.equal('abc'.toLowerCase());
      expect(evaluate('slice("123",1)')).to.equal('123'.slice(1));
      expect(evaluate('slice("123",-1)')).to.equal('123'.slice(-1));
      expect(evaluate('slice("123",0,1)')).to.equal('123'.slice(0,1));
      expect(evaluate('substring("123",0,1)')).to.equal('123'.substring(0,1));
      expect(evaluate('parseFloat("3.14")')).to.equal(parseFloat('3.14'));
      expect(evaluate('parseInt("42")')).to.equal(parseInt('42'));
      expect(evaluate('indexof("hello world", "l")')).to.equal(2);
      expect(evaluate('lastindexof("hello world", "l")')).to.equal(9);
      expect(evaluate('replace("hello world", /hello/, "goodbye")')).to.equal('goodbye world');
    });

    it('should eval regular expression functions', function() {
      expect(evaluate('test(/ain/, "spain")')).to.equal(/ain/.test('spain'));
      expect(evaluate('test(/ain/, "france")')).to.equal(/ain/.test('france'));
    });

    it('should eval datetime functions', function() {
      var d = new Date(2001,1,1),
          u = Date.UTC(2009, 9, 1, 10);

      expect(Math.abs(Date.now() - evaluate('now()')) <= 5).to.be.true;
      expect(evaluate('+datetime(2001,1,1)')).to.equal(+d);
      expect(evaluate('time(datetime(2001,1,1))')).to.equal(+d);
      expect(evaluate('timezoneoffset(datetime(2001,1,1))')).to.equal(d.getTimezoneOffset());

      expect(evaluate('day(datetime(2001,1,1))')).to.equal(d.getDay());
      expect(evaluate('year(datetime(2001,1,1))')).to.equal(d.getFullYear());
      expect(evaluate('month(datetime(2001,1,1))')).to.equal(d.getMonth());
      expect(evaluate('hours(datetime(2001,1,1))')).to.equal(d.getHours());
      expect(evaluate('minutes(datetime(2001,1,1))')).to.equal(d.getMinutes());
      expect(evaluate('seconds(datetime(2001,1,1))')).to.equal(d.getSeconds());
      expect(evaluate('milliseconds(datetime(2001,1,1))')).to.equal(d.getMilliseconds());

      expect(evaluate('utcday(datetime(2001,1,1))')).to.equal(d.getUTCDay());
      expect(evaluate('utcyear(datetime(2001,1,1))')).to.equal(d.getUTCFullYear());
      expect(evaluate('utcmonth(datetime(2001,1,1))')).to.equal(d.getUTCMonth());
      expect(evaluate('utchours(datetime(2001,1,1))')).to.equal(d.getUTCHours());
      expect(evaluate('utcminutes(datetime(2001,1,1))')).to.equal(d.getUTCMinutes());
      expect(evaluate('utcseconds(datetime(2001,1,1))')).to.equal(d.getUTCSeconds());
      expect(evaluate('utcmilliseconds(datetime(2001,1,1))')).to.equal(d.getUTCMilliseconds());

      for (var date=1; date<=7; ++date) {
        d = new Date(2001, 1, date);
        expect(evaluate('date(datetime(2001,1,'+date+'))')).to.equal(d.getDate());
        expect(evaluate('utcdate(datetime(2001,1,'+date+'))')).to.equal(d.getUTCDate());
      }

      expect(evaluate('utc(2009,9,1,10)')).to.equal(u);
      expect(evaluate('utchours(utc(2009,9,1,10))')).to.equal((new Date(u).getUTCHours()));
    });

    it('should evaluate if statements', function() {
      expect(evaluate('if(datum.a > 1, 1, 2)')).to.equal(1);
      expect(evaluate('if(event.type === "mousedown", 1, 2)')).to.equal(2);
      expect(evaluate('if(datum.a > 1, if(event.type === "mousedown", 3, 4), 2)')).to.equal(4);
      expect(evaluate.fn('if(datum.a > 1, 1)')).to.throw();
      expect(evaluate.fn('if(datum.a > 1, 1, 2, 3)')).to.throw();
    });

    it('should not eval undefined functions', function() {
      expect(evaluate.fn('Array()')).to.throw();
      expect(evaluate.fn('Function()')).to.throw();
      expect(evaluate.fn('Object()')).to.throw();
      expect(evaluate.fn('String()')).to.throw();
    });

    // Validation checks
    it('should not allow nested function calls', function() {
      expect(evaluate.fn('d.hasOwnProperty("a")')).to.throw();
      expect(evaluate.fn('Math.random()')).to.throw();
      expect(evaluate.fn('Array.prototype.slice.call([])')).to.throw();
    });

    it('should not allow top-level identifiers outside whitelist', function() {
      expect(evaluate.fn('Math')).to.throw();
      expect(evaluate.fn('Array')).to.throw();
      expect(evaluate.fn('String')).to.throw();
      expect(evaluate.fn('Object')).to.throw();
      expect(evaluate.fn('XMLHttpRequest')).to.throw();
      expect(evaluate.fn('a')).to.throw();
      expect(evaluate.fn('datum[Math]')).to.throw();
    });

    it('should allow nested identifiers outside whitelist', function() {
      expect(evaluate.fn('datum.eval')).to.not.throw();
      expect(evaluate.fn('datum.Math')).to.not.throw();
      expect(evaluate.fn('datum.a.eval')).to.not.throw();
      expect(evaluate.fn('{eval:0, Math:1}')).to.not.throw();
    });

    it('should not allow eval', function() {
      expect(evaluate.fn('eval')).to.throw();
      expect(evaluate.fn('eval()')).to.throw();
      expect(evaluate.fn('eval("1+2")')).to.throw();
    });

    it('should not allow Function constructor', function() {
      expect(evaluate.fn('Function("1+2")')).to.throw();
    });

    it('should not allow debugger invocation', function() {
      expect(evaluate.fn('debugger')).to.throw();
    });

    it('should not allow this reference', function() {
      expect(evaluate.fn('this')).to.throw();
    });

    it('should not allow arguments reference', function() {
      expect(evaluate.fn('arguments')).to.throw();
    });

    it('should not allow global variable reference', function() {
      expect(evaluate.fn('window')).to.throw();
      expect(evaluate.fn('document')).to.throw();
      expect(evaluate.fn('self')).to.throw();
      expect(evaluate.fn('global')).to.throw();
    });
  });

});