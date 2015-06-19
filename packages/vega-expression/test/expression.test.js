'use strict';

var expect = require('chai').expect;
var expr = require('../src/index');

describe('expression', function() {

  describe('parse', function() {
    function parse(str) { return function() { expr.parse(str); } }

    it('should allow literal boolean expressions', function() {
      expect(parse('true')).to.not.throw();
      expect(parse('false')).to.not.throw();
    });

    it('should allow literal number expressions', function() {
      expect(parse('3')).to.not.throw();
      expect(parse('3.4')).to.not.throw();
      expect(parse('3e5')).to.not.throw();
    });

    it('should allow literal string expressions', function() {
      expect(parse("'a'")).to.not.throw();
      expect(parse('"b"')).to.not.throw();
    });

    it('should allow literal regular expressions', function() {
      expect(parse('/a/')).to.not.throw();
      expect(parse('/[0-9]+/gi')).to.not.throw();
    });

    it('should allow literal array expressions', function() {
      expect(parse('[]')).to.not.throw();
      expect(parse('[0,1,2]')).to.not.throw();
      expect(parse('["a","b","c"]')).to.not.throw();
    });

    it('should allow literal object expressions', function() {
      expect(parse('{}')).to.not.throw();
      expect(parse('{a:1, b:"c"}')).to.not.throw();
      expect(parse('{a:[0,1,2], b:[{a:1},{a:2}]}')).to.not.throw();
    });

    it('should allow unary expressions', function() {
      expect(parse('+"1"')).to.not.throw();
      expect(parse('+1')).to.not.throw();
      expect(parse('-1')).to.not.throw();
      expect(parse('~1')).to.not.throw();
      expect(parse('!1')).to.not.throw();
    });

    it('should allow binary expressions', function() {
      expect(parse('1+2')).to.not.throw();
      expect(parse('1-2')).to.not.throw();
      expect(parse('1*2')).to.not.throw();
      expect(parse('1/2')).to.not.throw();
      expect(parse('1%2')).to.not.throw();
      expect(parse('1&2')).to.not.throw();
      expect(parse('1|2')).to.not.throw();
      expect(parse('1>>2')).to.not.throw();
      expect(parse('1<<2')).to.not.throw();
      expect(parse('1>>>2')).to.not.throw();
      expect(parse('1^2')).to.not.throw();
      expect(parse('"a"+"b"')).to.not.throw();
    });

    it('should allow logical expressions', function() {
      expect(parse('1 && 2')).to.not.throw();
      expect(parse('1 || 2')).to.not.throw();
    });

    it('should allow comparison expressions', function() {
      expect(parse('1 < 2')).to.not.throw();
      expect(parse('1 > 2')).to.not.throw();
      expect(parse('1 <= 2')).to.not.throw();
      expect(parse('1 >= 2')).to.not.throw();
      expect(parse('1 == 2')).to.not.throw();
      expect(parse('1 === 2')).to.not.throw();
      expect(parse('1 != 2')).to.not.throw();
      expect(parse('1 !== 2')).to.not.throw();
    });

    it('should allow ternary conditional expressions', function() {
      expect(parse('a ? b : c')).to.not.throw();
      expect(parse('1 ? 2 : 3')).to.not.throw();
    });

    it('should allow identifier expressions', function() {
      expect(parse('a')).to.not.throw();
      expect(parse('a3')).to.not.throw();
      expect(parse('µ')).to.not.throw();
      expect(parse('$f')).to.not.throw();
      expect(parse('_')).to.not.throw();
    });

    it('should allow member expressions', function() {
      expect(parse('a[0]')).to.not.throw();
      expect(parse('a.b')).to.not.throw();
      expect(parse('a["b"]')).to.not.throw();
      expect(parse('a["two words"]')).to.not.throw();
    });

    it('should allow call expressions', function() {
      expect(parse('a()')).to.not.throw();
      expect(parse('a(0,1,2)')).to.not.throw();
      expect(parse('A()')).to.not.throw();
      expect(parse('A(0,1,2)')).to.not.throw();
      expect(parse('foo.bar(0,1,2)')).to.not.throw();
    });

    it('should not allow illegal identifier expressions', function() {
      expect(parse('3a')).to.throw();
      expect(parse('#e')).to.throw();
      expect(parse('@e')).to.throw();
    });

    it('should not allow illegal member expressions', function() {
      expect(parse('a.3')).to.throw();
    });

    it('should not allow single-line comments', function() {
      expect(parse('3 // comment')).to.throw();
    });

    it('should not allow multi-line comments', function() {
      expect(parse('/* comment */ 3')).to.throw();
      expect(parse('3 /* comment */')).to.throw();
    });

    it('should not allow empty statements', function() {
      expect(parse('')).to.throw();
      expect(parse(' ')).to.throw();
    });

    it('should not allow debugger statements', function() {
      expect(parse('debugger')).to.throw();
    });

    it('should not allow continue statements', function() {
      expect(parse('continue')).to.throw();
    });

    it('should not allow break statements', function() {
      expect(parse('break')).to.throw();
    });

    it('should not allow reserved keywords', function() {
      // future reserved words
      expect(parse('class')).to.throw();
      expect(parse('enum')).to.throw();
      expect(parse('export')).to.throw();
      expect(parse('extends')).to.throw();
      expect(parse('import')).to.throw();
      expect(parse('super')).to.throw();
      // strict mode reserved words
      expect(parse('implements')).to.throw();
      expect(parse('interface')).to.throw();
      expect(parse('package')).to.throw();
      expect(parse('private')).to.throw();
      expect(parse('protected')).to.throw();
      expect(parse('public')).to.throw();
      expect(parse('static')).to.throw();
      expect(parse('yield')).to.throw();
      expect(parse('let')).to.throw();
    });

    it('should not allow object get/set expressions', function() {
      expect(parse('{get b() {}}')).to.throw();
      expect(parse('{set b(x) {}}')).to.throw();
    });

    it('should not allow assignment expressions', function() {
      expect(parse('index = 3')).to.throw();
      expect(parse('index += 3')).to.throw();
      expect(parse('index -= 3')).to.throw();
      expect(parse('index *= 3')).to.throw();
      expect(parse('index /= 3')).to.throw();
      expect(parse('index %= 3')).to.throw();
      expect(parse('index >>= 1')).to.throw();
      expect(parse('index <<= 1')).to.throw();
      expect(parse('index >>>= 1')).to.throw();
      expect(parse('index &= 1')).to.throw();
      expect(parse('index |= 1')).to.throw();
      expect(parse('index ^= 1')).to.throw();
    });

    it('should not allow postfix update expressions', function() {
      expect(parse('index++')).to.throw();
      expect(parse('index--')).to.throw();
    });

    it('should not allow prefix update expressions', function() {
      expect(parse('++index')).to.throw();
      expect(parse('--index')).to.throw();
    });

    it('should not allow sequence expressions', function() {
      expect(parse('(3, 4)')).to.throw();
      expect(parse('("a", 3+4)')).to.throw();
    });

    it('should not allow multiple statements', function() {
      expect(parse('3; 4')).to.throw();
      expect(parse('"a"; 3+4')).to.throw();
    });

    it('should not allow variable statements', function() {
      expect(parse('var x = 4')).to.throw();
    });

    it('should not allow return statements', function() {
      expect(parse('return 4')).to.throw();
    });

    it('should not allow function declarations', function() {
      expect(parse('function f() {}')).to.throw();
      expect(parse('function f() { 1 }')).to.throw();
      expect(parse('function f() { return 1; }')).to.throw();
    });

    it('should not allow function expressions', function() {
      expect(parse('function() {}')).to.throw();
      expect(parse('function() { 1 }')).to.throw();
      expect(parse('function() { return 1; }')).to.throw();
    });

    it('should not allow new statements', function() {
      expect(parse('new Date()')).to.throw();
      expect(parse('new Array(3)')).to.throw();
    });

    it('should not allow block statements', function() {
      expect(parse('{3+4}')).to.throw();
      expect(parse('{"a"}')).to.throw();
    });

    it('should not allow labeled statements', function() {
      expect(parse('label: 3')).to.throw();
    });

    it('should not allow with statements', function() {
      expect(parse('with({a:1,b:2}) { a }')).to.throw();
    });

    it('should not allow try/catch statements', function() {
      expect(parse('try { 3 } catch (err) { 4 }')).to.throw();
      expect(parse('try { undefined() } catch (err) { 4 }')).to.throw();    
    });

    it('should not allow if statements', function() {
      expect(parse('if (1<2) 4; else 5')).to.throw();
      expect(parse('if (2<1) 4; else 5')).to.throw();
    });

    it('should not allow switch statements', function() {
      expect(parse('switch("a") { default: 3; }')).to.throw();
      expect(parse('switch("a") { case "a": 4; break; default: 3; }')).to.throw();
    });

    it('should not allow for statements', function() {
      expect(parse('for (; index>5; ) { index; }')).to.throw();
    });

    it('should not allow for-in statements', function() {
      expect(parse('for (i in self) { 3; }')).to.throw();
    });

    it('should not allow while statements', function() {
      expect(parse('while (1 < 2) { 3; }')).to.throw();
      expect(parse('while (1 > 2) { 3; }')).to.throw();
    });

    it('should not allow do-while statements', function() {
      expect(parse('do { 3 } while (1 < 2)')).to.throw();
      expect(parse('do { 3 } while (1 > 2)')).to.throw();
    });
  });

  describe('evaluate', function() {

    var codegen = expr.code({idWhiteList: ['datum', 'event', 'signals']});

    function evaluate(str) {
      var datum = {a: 2, föö: 5};
      var evt = {type: 'mousemove'};
      var value = codegen(expr.parse(str));
      if (value.globals.length > 0) {
        throw Error('Found non-whitelisted global identifier.');
      }
      var fn = Function('datum', 'event', 'signals',
        '"use strict"; return (' + value.code + ')');
      return fn(datum, evt);
    }

    evaluate.fn = function(str) {
      return function() { return evaluate(str); }
    };

    function regexEqual(x, y) {
      return (x instanceof RegExp) && (y instanceof RegExp) && 
        (x.source === y.source) && (x.global === y.global) && 
        (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
    }

    // Simple evaluation
    it('should eval simple integer expressions', function() {
      expect(evaluate('1+1')).to.equal(2);
      expect(evaluate('1 + 1')).to.equal(2);
      expect(evaluate('1+(2+3)')).to.equal(6);
      expect(evaluate('3 * (2+1)')).to.equal(9);
    });

    it('should eval simple string expressions', function() {
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
    });

    it('should eval regular expression functions', function() {
      expect(evaluate('test(/ain/, "spain")')).to.equal(/ain/.test('spain'));
      expect(evaluate('test(/ain/, "france")')).to.equal(/ain/.test('france'));
    });

    it('should eval datetime functions', function() {
      var d = new Date(2001,1,1);

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