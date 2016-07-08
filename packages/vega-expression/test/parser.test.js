'use strict';

var expect = require('chai').expect;
var expr = require('../src/index');

require('chai').config.truncateThreshold = 0; // disable truncating

describe('parser', function() {
  function parse(str) { return function() { return JSON.parse(JSON.stringify(expr.parse(str).body[0].expression)); } }

  it('should allow literal boolean expressions', function() {
    expect(parse('true')()).to.eql({
      type: 'Literal',
      value: true,
      raw: 'true'
    });
    expect(parse('false')).to.not.throw();
  });

  it('should allow literal number expressions', function() {
    expect(parse('3')()).to.eql({
      type: 'Literal',
      value: 3,
      raw: '3'
    });
    expect(parse('3.4')).to.not.throw();
    expect(parse('3e5')).to.not.throw();
    expect(parse('3e+5')).to.not.throw();

    expect(parse('0x')).to.throw();
    expect(parse('0x0H')).to.throw();
    expect(parse('3e+H')).to.throw();
    // octal is disabled in strict mode
    expect(parse('012')).to.throw();
    // 9 and A are not octal digits.
    expect(parse('09')).to.throw();
    expect(parse('01A')).to.throw();
  });

  it('should allow literal string expressions', function() {
    expect(parse("'a'")()).to.eql({
      type: 'Literal',
      value: 'a',
      raw: "'a'"
    });
    expect(parse('"b"')).to.not.throw();
    expect(parse('"escaped newline\\\r\n"')).to.not.throw();

    expect(parse('"unterminated')).to.throw();
    expect(parse('"unterminated\r\n')).to.throw();
  });

  it('should allow literal regular expressions', function() {
    expect(parse('/a/')()).to.eql({
      type: 'Literal',
      value: {},
      raw: '/a/',
      regex: { pattern: 'a', flags: ''}
    });
    expect(parse('/[0-9]+/gi')).to.not.throw();
    expect(parse('/a\\u{41}/u')).to.not.throw();
    expect(parse('/a\\u{110000}/u')).to.throw();

    expect(parse('/a/gimuy')).to.not.throw();

    expect(parse('/a/a')).to.throw();
    expect(parse('/a/\\u0067')).to.throw();
    expect(parse('/unterminated')).to.throw();
    expect(parse('/unterminated\n')).to.throw();
    expect(parse('/cannot escape newline\\\n/')).to.throw();
  });

  it('should allow literal array expressions', function() {
    expect(parse('[]')()).to.eql({
      type: 'ArrayExpression',
      elements: []
    });
    expect(parse('[0,1,2]')).to.not.throw();
    expect(parse('["a","b","c"]')).to.not.throw();
    expect(parse('[0,,]')()).to.eql({
      type: 'ArrayExpression',
      elements: [
        {type: 'Literal', value: 0, raw: '0'}, null,
      ]
    })
  });

  it('should allow literal object expressions', function() {
    expect(parse('{}')()).to.eql({
      type: 'ObjectExpression',
      properties: []
    });
    expect(parse('{a:1, b:"c"}')()).to.eql({
      type: 'ObjectExpression',
      properties: [
        {
          type: 'Property',
          kind: 'init',
          key: {type: 'Identifier', name: 'a'},
          value: {type: 'Literal', value: 1, raw: '1'}
        },
        {
          type: 'Property',
          kind: 'init',
          key: {type: 'Identifier', name: 'b'},
          value: {type: 'Literal', value: "c", raw: '"c"'}
        }
      ]
    });
    expect(parse('{a:[0,1,2], b:[{a:1},{a:2}]}')).to.not.throw();
    expect(parse('{1:1}')).to.not.throw();

    // disallow duplicate keys
    expect(parse('{a: 1, a: 2}')).to.throw();
    expect(parse('{')).to.throw();
    expect(parse('{01:true}')).to.throw();
    expect(parse('{/regex/:true}')).to.throw();
  });

  it('should allow unary expressions', function() {
    expect(parse('+"1"')()).to.eql({
      type: 'UnaryExpression',
      operator: '+',
      prefix: true,
      argument: {
        type: 'Literal',
        value: '1',
        raw: '"1"'
      }
    });
    expect(parse('+1')).to.not.throw();
    expect(parse('-1')).to.not.throw();
    expect(parse('~1')).to.not.throw();
    expect(parse('!1')).to.not.throw();
  });

  it('should allow binary expressions', function() {
    expect(parse('1+2')()).to.eql({
      type: 'BinaryExpression',
      operator: '+',
      left: {type: 'Literal', value: 1, raw: '1'},
      right: {type: 'Literal', value: 2, raw: '2'}
    })
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
    expect(parse('1 in a')).to.not.throw();
  });

  it('should allow logical expressions', function() {
    expect(parse('1 && 2')()).to.eql({
      type: 'LogicalExpression',
      operator: '&&',
      left: {type: 'Literal', value: 1, raw: '1'},
      right: {type: 'Literal', value: 2, raw: '2'}
    })
    expect(parse('1 || 2')).to.not.throw();
  });

  it('should allow comparison expressions', function() {
    expect(parse('1 < 2')()).to.eql({
      type: 'BinaryExpression',
      operator: '<',
      left: {type: 'Literal', value: 1, raw: '1'},
      right: {type: 'Literal', value: 2, raw: '2'}
    })
    expect(parse('1 > 2')).to.not.throw();
    expect(parse('1 <= 2')).to.not.throw();
    expect(parse('1 >= 2')).to.not.throw();
    expect(parse('1 == 2')).to.not.throw();
    expect(parse('1 === 2')).to.not.throw();
    expect(parse('1 != 2')).to.not.throw();
    expect(parse('1 !== 2')).to.not.throw();
  });

  it('should allow complex expressions', function() {
    expect(parse('1 + 2 - 3 / 4 * a.a + 4 & 3')).to.not.throw();
  });

  it('should allow ternary conditional expressions', function() {
    expect(parse('a ? b : c')()).to.eql({
      type: 'ConditionalExpression',
      test: {type: 'Identifier', name: 'a'},
      consequent: {type: 'Identifier', name: 'b'},
      alternate: {type: 'Identifier', name: 'c'}
    });
    expect(parse('1 ? 2 : 3')).to.not.throw();
  });

  it('should allow identifier expressions', function() {
    expect(parse('a')()).to.eql({
      type: 'Identifier',
      name: 'a'
    });
    expect(parse('a3')).to.not.throw();
    expect(parse('µ')).to.not.throw();
    expect(parse('$f')).to.not.throw();
    expect(parse('_')).to.not.throw();
    // JS identifiers can contain escape sequences!
    expect(parse('\\u0041')()).to.eql({
      type: 'Identifier',
      name: 'A'
    });
    expect(parse('A\\u0041')()).to.eql({
      type: 'Identifier',
      name: 'AA'
    });

    // but only \uXXXX escapes
    expect(parse('id\\n')).to.throw();
    expect(parse('\\n')).to.throw();
    // And the unescaped character must be otherwise valid.
    expect(parse('\\u0030')).to.throw(); // \u0030 = '0'
    expect(parse('id\\u0020')).to.throw();
  });

  it('should allow member expressions', function() {
    expect(parse('a[0]')()).to.eql({
      type: 'MemberExpression',
      computed: true,
      object: {type: 'Identifier', name: 'a'},
      property: {type: 'Literal', value: 0, raw: '0'}
    });
    expect(parse('a.b')()).to.eql({
      type: 'MemberExpression',
      computed: false,
      object: {type: 'Identifier', name: 'a'},
      property: {type: 'Identifier', name: 'b'}
    })
    expect(parse('a["b"]')).to.not.throw();
    expect(parse('a["two words"]')).to.not.throw();
    expect(parse('a.true')()).to.eql({
      type: 'MemberExpression',
      computed: false,
      object: {type: 'Identifier', name: 'a'},
      property: {type: 'Identifier', name: 'true'}
    })
    expect(parse('a.function')).to.not.throw();
    expect(parse('a.null')).to.not.throw();

    expect(parse('a.+')).to.throw();
    expect(parse('a."hello"')).to.throw();
  });

  it('should allow call expressions', function() {
    expect(parse('a()')()).to.eql({
      type: 'CallExpression',
      callee: {type: 'Identifier', name: 'a'},
      arguments: []
    });
    expect(parse('a(0,1,2)')()).to.eql({
      type: 'CallExpression',
      callee: {type: 'Identifier', name: 'a'},
      arguments: [
        {type: 'Literal', value: 0, raw: '0'},
        {type: 'Literal', value: 1, raw: '1'},
        {type: 'Literal', value: 2, raw: '2'}
      ]
    })
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

  it('should not allow octal literals or escape sequences', function() {
    // octal literals are not allowed in strict mode.
    expect(parse('"\\01"')).to.throw();
    expect(parse('012')).to.throw();
  });

  it('should not allow void expressions', function() {
    expect(parse('void(0)')).to.throw();
  });

  it('should not allow delete expressions', function() {
    expect(parse('delete a.x')).to.throw();
  });

  it('should not allow typeof expressions', function() {
    expect(parse('typeof "hello"')).to.throw();
  });

  it('should parse escape sequences', function() {
    expect(parse('"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"')()).to.eql({
      type: 'Literal',
      value: '\b\f\n\r\t\vz\u0023\u0041\uD87E\uDC04',
      raw: '"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"'
    });
    // \0 is a special case, not an octal literal
    expect(parse('"\\0"')).to.not.throw();
    // octal literals are not allowed in strict mode
    expect(parse('"\\251"')).to.throw();
    // malformed hex escape
    expect(parse('"\\xhi"')).to.throw();
    // unicode codepoint is too large
    expect(parse('"\\u{110000}"')).to.throw();
    // malformed unicode codepoint escape
    expect(parse('"\\u{}"')).to.throw();
  });

  it('should ignore whitespace', function() {
    var tree = {
      type: "BinaryExpression",
      operator: "+",
      left: {type: "Literal", value: 1, raw: "1"},
      right: {type: "Literal", value: 2, raw: "2"},
    };
    expect(parse('1+ 2')()).to.eql(tree);
    expect(parse('1+\n2')()).to.eql(tree);
    expect(parse('1+\t2')()).to.eql(tree);
    expect(parse('1+\v2')()).to.eql(tree);
    expect(parse('1+\uFEFF2')()).to.eql(tree);
    expect(parse('1+\r\n2')()).to.eql(tree);
  });
});
