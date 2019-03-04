var vega = require('../');

function parse(str) {
  return function() {
    return JSON.parse(JSON.stringify(vega.parse(str)));
  };
}

test('Parser should allow literal boolean expressions', function() {
  expect(parse('true')()).toEqual({
    type: 'Literal',
    value: true,
    raw: 'true'
  });
  expect(parse('false')).not.toThrow();
});

test('Parser should allow literal number expressions', function() {
  expect(parse('3')()).toEqual({
    type: 'Literal',
    value: 3,
    raw: '3'
  });
  expect(parse('3.4')).not.toThrow();
  expect(parse('3e5')).not.toThrow();
  expect(parse('3e+5')).not.toThrow();

  expect(parse('0x')).toThrow();
  expect(parse('0x0H')).toThrow();
  expect(parse('3e+H')).toThrow();
  // octal is disabled in strict mode
  expect(parse('012')).toThrow();
  // 9 and A are not octal digits.
  expect(parse('09')).toThrow();
  expect(parse('01A')).toThrow();
});

test('Parser should allow literal string expressions', function() {
  expect(parse("'a'")()).toEqual({
    type: 'Literal',
    value: 'a',
    raw: "'a'"
  });
  expect(parse('"b"')).not.toThrow();
  expect(parse('"escaped newline\\\r\n"')).not.toThrow();

  expect(parse('"unterminated')).toThrow();
  expect(parse('"unterminated\r\n')).toThrow();
});

test('Parser should allow literal regular expressions', function() {
  expect(parse('/a/')()).toEqual({
    type: 'Literal',
    value: {},
    raw: '/a/',
    regex: { pattern: 'a', flags: ''}
  });
  // Empty regex
  expect(parse('//')()).toEqual({
    type: 'Literal',
    value: {},
    raw: '/(?:)/',
    regex: { pattern: '', flags: ''}
  });
  expect(parse('/[0-9]+/gi')).not.toThrow();
  expect(parse('/a\\u{41}/u')).not.toThrow();
  expect(parse('/a\\u{110000}/u')).toThrow();

  expect(parse('/a/gimuy')).not.toThrow();

  // t.throws(parse('/a/a')); // TODO
  expect(parse('/a/\\u0067')).toThrow();
  expect(parse('/unterminated')).toThrow();
  expect(parse('/unterminated\n')).toThrow();
  expect(parse('/cannot escape newline\\\n/')).toThrow();
});

test('Parser should allow literal array expressions', function() {
  expect(parse('[]')()).toEqual({
    type: 'ArrayExpression',
    elements: []
  });
  expect(parse('[0,1,2]')).not.toThrow();
  expect(parse('["a","b","c"]')).not.toThrow();
  expect(parse('[0,,]')()).toEqual({
    type: 'ArrayExpression',
    elements: [
      {type: 'Literal', value: 0, raw: '0'},
      null
    ]
  });
});

test('Parser should allow literal object expressions', function() {
  expect(parse('{}')()).toEqual({
    type: 'ObjectExpression',
    properties: []
  });
  expect(parse('{a:1, b:"c"}')()).toEqual({
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
  expect(parse('{a:[0,1,2], b:[{a:1},{a:2}]}')).not.toThrow();
  expect(parse('{1:1}')).not.toThrow();

  // disallow duplicate keys
  expect(parse('{a: 1, a: 2}')).toThrow();
  expect(parse('{')).toThrow();
  expect(parse('{01:true}')).toThrow();
  expect(parse('{/regex/:true}')).toThrow();
});

test('Parser should allow unary expressions', function() {
  expect(parse('+"1"')()).toEqual({
    type: 'UnaryExpression',
    operator: '+',
    prefix: true,
    argument: {
      type: 'Literal',
      value: '1',
      raw: '"1"'
    }
  });
  expect(parse('+1')).not.toThrow();
  expect(parse('-1')).not.toThrow();
  expect(parse('~1')).not.toThrow();
  expect(parse('!1')).not.toThrow();
});

test('Parser should allow binary expressions', function() {
  expect(parse('1+2')()).toEqual({
    type: 'BinaryExpression',
    operator: '+',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  });
  expect(parse('1-2')).not.toThrow();
  expect(parse('1*2')).not.toThrow();
  expect(parse('1/2')).not.toThrow();
  expect(parse('1%2')).not.toThrow();
  expect(parse('1&2')).not.toThrow();
  expect(parse('1|2')).not.toThrow();
  expect(parse('1>>2')).not.toThrow();
  expect(parse('1<<2')).not.toThrow();
  expect(parse('1>>>2')).not.toThrow();
  expect(parse('1^2')).not.toThrow();
  expect(parse('"a"+"b"')).not.toThrow();
  expect(parse('1 in a')).not.toThrow();
});

test('Parser should allow logical expressions', function() {
  expect(parse('1 && 2')()).toEqual({
    type: 'LogicalExpression',
    operator: '&&',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  });
  expect(parse('1 || 2')).not.toThrow();
});

test('Parser should allow comparison expressions', function() {
  expect(parse('1 < 2')()).toEqual({
    type: 'BinaryExpression',
    operator: '<',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  })
  expect(parse('1 > 2')).not.toThrow();
  expect(parse('1 <= 2')).not.toThrow();
  expect(parse('1 >= 2')).not.toThrow();
  expect(parse('1 == 2')).not.toThrow();
  expect(parse('1 === 2')).not.toThrow();
  expect(parse('1 != 2')).not.toThrow();
  expect(parse('1 !== 2')).not.toThrow();
});

test('Parser should allow complex expressions', function() {
  expect(parse('1 + 2 - 3 / 4 * a.a + 4 & 3')).not.toThrow();
});

test('Parser should allow ternary conditional expressions', function() {
  expect(parse('a ? b : c')()).toEqual({
    type: 'ConditionalExpression',
    test: {type: 'Identifier', name: 'a'},
    consequent: {type: 'Identifier', name: 'b'},
    alternate: {type: 'Identifier', name: 'c'}
  });
  expect(parse('1 ? 2 : 3')).not.toThrow();
});

test('Parser should allow identifier expressions', function() {
  expect(parse('a')()).toEqual({
    type: 'Identifier',
    name: 'a'
  });
  expect(parse('a3')).not.toThrow();
  expect(parse('µ')).not.toThrow();
  expect(parse('$f')).not.toThrow();
  expect(parse('_')).not.toThrow();
  // JS identifiers can contain escape sequences!
  expect(parse('\\u0041')()).toEqual({
    type: 'Identifier',
    name: 'A'
  });
  expect(parse('A\\u0041')()).toEqual({
    type: 'Identifier',
    name: 'AA'
  });

  // but only \uXXXX escapes
  expect(parse('id\\n')).toThrow();
  expect(parse('\\n')).toThrow();
  expect(parse('\\x4E')).toThrow();
  // And the unescaped character must be otherwise valid.
  expect(parse('\\u0030')).toThrow(); // \u0030 = '0', not allowed at start of identifier
  expect(parse('id\\u0020')).toThrow(); // \u0020 is a control character
});

test('Parser should allow member expressions', function() {
  expect(parse('a[0]')()).toEqual({
    type: 'MemberExpression',
    computed: true,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Literal', value: 0, raw: '0'}
  });
  expect(parse('a.b')()).toEqual({
    type: 'MemberExpression',
    computed: false,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Identifier', name: 'b', member: true}
  })
  expect(parse('a["b"]')).not.toThrow();
  expect(parse('a["two words"]')).not.toThrow();
  expect(parse('a.true')()).toEqual({
    type: 'MemberExpression',
    computed: false,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Identifier', name: 'true', member: true}
  })
  expect(parse('a.function')).not.toThrow();
  expect(parse('a.null')).not.toThrow();

  expect(parse('a.+')).toThrow();
  expect(parse('a."hello"')).toThrow();
});

test('Parser should allow call expressions', function() {
  expect(parse('a()')()).toEqual({
    type: 'CallExpression',
    callee: {type: 'Identifier', name: 'a'},
    arguments: []
  });
  expect(parse('a(0,1,2)')()).toEqual({
    type: 'CallExpression',
    callee: {type: 'Identifier', name: 'a'},
    arguments: [
      {type: 'Literal', value: 0, raw: '0'},
      {type: 'Literal', value: 1, raw: '1'},
      {type: 'Literal', value: 2, raw: '2'}
    ]
  })
  expect(parse('A()')).not.toThrow();
  expect(parse('A(0,1,2)')).not.toThrow();
  expect(parse('foo.bar(0,1,2)')).not.toThrow();
});

test('Parser should not allow illegal identifier expressions', function() {
  expect(parse('3a')).toThrow();
  expect(parse('#e')).toThrow();
  expect(parse('@e')).toThrow();
});

test('Parser should not allow illegal member expressions', function() {
  expect(parse('a.3')).toThrow();
});

test('Parser should not allow single-line comments', function() {
  expect(parse('3 // comment')).toThrow();
});

test('Parser should not allow multi-line comments', function() {
  expect(parse('/* comment */ 3')).toThrow();
  expect(parse('3 /* comment */')).toThrow();
});

test('Parser should not allow empty statements', function() {
  expect(parse('')).toThrow();
  expect(parse(' ')).toThrow();
});

test('Parser should not allow debugger statements', function() {
  expect(parse('debugger')).toThrow();
});

test('Parser should not allow continue statements', function() {
  expect(parse('continue')).toThrow();
});

test('Parser should not allow break statements', function() {
  expect(parse('break')).toThrow();
});

test('Parser should not allow reserved keywords', function() {
  // future reserved words
  expect(parse('class')).toThrow();
  expect(parse('enum')).toThrow();
  expect(parse('export')).toThrow();
  expect(parse('extends')).toThrow();
  expect(parse('import')).toThrow();
  expect(parse('super')).toThrow();
  // strict mode reserved words
  expect(parse('implements')).toThrow();
  expect(parse('interface')).toThrow();
  expect(parse('package')).toThrow();
  expect(parse('private')).toThrow();
  expect(parse('protected')).toThrow();
  expect(parse('public')).toThrow();
  expect(parse('static')).toThrow();
  expect(parse('yield')).toThrow();
  expect(parse('let')).toThrow();
});

test('Parser should not allow object get/set expressions', function() {
  expect(parse('{get b() {}}')).toThrow();
  expect(parse('{set b(x) {}}')).toThrow();
});

test('Parser should not allow assignment expressions', function() {
  expect(parse('index = 3')).toThrow();
  expect(parse('index += 3')).toThrow();
  expect(parse('index -= 3')).toThrow();
  expect(parse('index *= 3')).toThrow();
  expect(parse('index /= 3')).toThrow();
  expect(parse('index %= 3')).toThrow();
  expect(parse('index >>= 1')).toThrow();
  expect(parse('index <<= 1')).toThrow();
  expect(parse('index >>>= 1')).toThrow();
  expect(parse('index &= 1')).toThrow();
  expect(parse('index |= 1')).toThrow();
  expect(parse('index ^= 1')).toThrow();
});

test('Parser should not allow postfix update expressions', function() {
  expect(parse('index++')).toThrow();
  expect(parse('index--')).toThrow();
});

test('Parser should not allow prefix update expressions', function() {
  expect(parse('++index')).toThrow();
  expect(parse('--index')).toThrow();
});

test('Parser should not allow sequence expressions', function() {
  expect(parse('(3, 4)')).toThrow();
  expect(parse('("a", 3+4)')).toThrow();
});

test('Parser should not allow multiple statements', function() {
  expect(parse('3; 4')).toThrow();
  expect(parse('"a"; 3+4')).toThrow();
});

test('Parser should not allow variable statements', function() {
  expect(parse('var x = 4')).toThrow();
});

test('Parser should not allow return statements', function() {
  expect(parse('return 4')).toThrow();
});

test('Parser should not allow function declarations', function() {
  expect(parse('function f() {}')).toThrow();
  expect(parse('function f() { 1 }')).toThrow();
  expect(parse('function f() { return 1; }')).toThrow();
});

test('Parser should not allow function expressions', function() {
  expect(parse('function() {}')).toThrow();
  expect(parse('function() { 1 }')).toThrow();
  expect(parse('function() { return 1; }')).toThrow();
});

test('Parser should not allow new statements', function() {
  expect(parse('new Date()')).toThrow();
  expect(parse('new Array(3)')).toThrow();
});

test('Parser should not allow block statements', function() {
  expect(parse('{3+4}')).toThrow();
  expect(parse('{"a"}')).toThrow();
});

test('Parser should not allow labeled statements', function() {
  expect(parse('label: 3')).toThrow();
});

test('Parser should not allow with statements', function() {
  expect(parse('with({a:1,b:2}) { a }')).toThrow();
});

test('Parser should not allow try/catch statements', function() {
  expect(parse('try { 3 } catch (err) { 4 }')).toThrow();
  expect(parse('try { undefined() } catch (err) { 4 }')).toThrow();
});

test('Parser should not allow if statements', function() {
  expect(parse('if (1<2) 4; else 5')).toThrow();
  expect(parse('if (2<1) 4; else 5')).toThrow();
});

test('Parser should not allow switch statements', function() {
  expect(parse('switch("a") { default: 3; }')).toThrow();
  expect(parse('switch("a") { case "a": 4; break; default: 3; }')).toThrow();
});

test('Parser should not allow for statements', function() {
  expect(parse('for (; index>5; ) { index; }')).toThrow();
});

test('Parser should not allow for-in statements', function() {
  expect(parse('for (i in self) { 3; }')).toThrow();
});

test('Parser should not allow while statements', function() {
  expect(parse('while (1 < 2) { 3; }')).toThrow();
  expect(parse('while (1 > 2) { 3; }')).toThrow();
});

test('Parser should not allow do-while statements', function() {
  expect(parse('do { 3 } while (1 < 2)')).toThrow();
  expect(parse('do { 3 } while (1 > 2)')).toThrow();
});

test('Parser should not allow octal literals or escape sequences', function() {
  // octal literals are not allowed in strict mode.
  expect(parse('"\\01"')).toThrow();
  expect(parse('012')).toThrow();
});

test('Parser should not allow void expressions', function() {
  expect(parse('void(0)')).toThrow();
});

test('Parser should not allow delete expressions', function() {
  expect(parse('delete a.x')).toThrow();
});

test('Parser should not allow typeof expressions', function() {
  expect(parse('typeof "hello"')).toThrow();
});

test('Parser should parse escape sequences', function() {
  expect(parse('"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"')()).toEqual({
    type: 'Literal',
    value: '\b\f\n\r\t\vz\u0023\u0041\uD87E\uDC04',
    raw: '"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"'
  });
  // \0 is a special case, not an octal literal
  expect(parse('"\\0"')).not.toThrow();

  // octal literals are not allowed in strict mode
  expect(parse('"\\251"')).toThrow();
  // malformed hex escape
  // t.throws(parse('"\\xhi"')); // TODO
  // unicode codepoint is too large
  expect(parse('"\\u{110000}"')).toThrow();
  // malformed unicode codepoint escape
  expect(parse('"\\u{}"')).toThrow();
});

test('Parser should ignore whitespace', function() {
  var tree = {
    type: "BinaryExpression",
    operator: "+",
    left: {type: "Literal", value: 1, raw: "1"},
    right: {type: "Literal", value: 2, raw: "2"}
  };
  expect(parse('1+ 2')()).toEqual(tree);
  expect(parse('1+\n2')()).toEqual(tree);
  expect(parse('1+\t2')()).toEqual(tree);
  expect(parse('1+\v2')()).toEqual(tree);
  expect(parse('1+\uFEFF2')()).toEqual(tree);
  expect(parse('1+\r\n2')()).toEqual(tree);
});
