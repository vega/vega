'use strict';

var expect = require('chai').expect;
var expr = require('../src/index');

describe('parser', function() {
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