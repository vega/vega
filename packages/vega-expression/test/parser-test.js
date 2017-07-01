var tape = require('tape'),
    vega = require('../');

function parse(str) {
  return function() {
    return JSON.parse(JSON.stringify(vega.parse(str)));
  };
}

tape('Parser should allow literal boolean expressions', function(test) {
  test.deepEqual(parse('true')(), {
    type: 'Literal',
    value: true,
    raw: 'true'
  });
  test.doesNotThrow(parse('false'));
  test.end();
});

tape('Parser should allow literal number expressions', function(test) {
  test.deepEqual(parse('3')(), {
    type: 'Literal',
    value: 3,
    raw: '3'
  });
  test.doesNotThrow(parse('3.4'));
  test.doesNotThrow(parse('3e5'));
  test.doesNotThrow(parse('3e+5'));

  test.throws(parse('0x'));
  test.throws(parse('0x0H'));
  test.throws(parse('3e+H'));
  // octal is disabled in strict mode
  test.throws(parse('012'));
  // 9 and A are not octal digits.
  test.throws(parse('09'));
  test.throws(parse('01A'));
  test.end();
});

tape('Parser should allow literal string expressions', function(test) {
  test.deepEqual(parse("'a'")(), {
    type: 'Literal',
    value: 'a',
    raw: "'a'"
  });
  test.doesNotThrow(parse('"b"'));
  test.doesNotThrow(parse('"escaped newline\\\r\n"'));

  test.throws(parse('"unterminated'));
  test.throws(parse('"unterminated\r\n'));
  test.end();
});

tape('Parser should allow literal regular expressions', function(test) {
  test.deepEqual(parse('/a/')(), {
    type: 'Literal',
    value: {},
    raw: '/a/',
    regex: { pattern: 'a', flags: ''}
  });
  // Empty regex
  test.deepEqual(parse('//')(), {
    type: 'Literal',
    value: {},
    raw: '/(?:)/',
    regex: { pattern: '', flags: ''}
  });
  test.doesNotThrow(parse('/[0-9]+/gi'));
  test.doesNotThrow(parse('/a\\u{41}/u'));
  test.throws(parse('/a\\u{110000}/u'));

  test.doesNotThrow(parse('/a/gimuy'));

  // test.throws(parse('/a/a')); // TODO
  test.throws(parse('/a/\\u0067'));
  test.throws(parse('/unterminated'));
  test.throws(parse('/unterminated\n'));
  test.throws(parse('/cannot escape newline\\\n/'));

  test.end();
});

tape('Parser should allow literal array expressions', function(test) {
  test.deepEqual(parse('[]')(), {
    type: 'ArrayExpression',
    elements: []
  });
  test.doesNotThrow(parse('[0,1,2]'));
  test.doesNotThrow(parse('["a","b","c"]'));
  test.deepEqual(parse('[0,,]')(), {
    type: 'ArrayExpression',
    elements: [
      {type: 'Literal', value: 0, raw: '0'},
      null
    ]
  });
  test.end();
});

tape('Parser should allow literal object expressions', function(test) {
  test.deepEqual(parse('{}')(), {
    type: 'ObjectExpression',
    properties: []
  });
  test.deepEqual(parse('{a:1, b:"c"}')(), {
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
  test.doesNotThrow(parse('{a:[0,1,2], b:[{a:1},{a:2}]}'));
  test.doesNotThrow(parse('{1:1}'));

  // disallow duplicate keys
  test.throws(parse('{a: 1, a: 2}'));
  test.throws(parse('{'));
  test.throws(parse('{01:true}'));
  test.throws(parse('{/regex/:true}'));
  test.end();
});

tape('Parser should allow unary expressions', function(test) {
  test.deepEqual(parse('+"1"')(), {
    type: 'UnaryExpression',
    operator: '+',
    prefix: true,
    argument: {
      type: 'Literal',
      value: '1',
      raw: '"1"'
    }
  });
  test.doesNotThrow(parse('+1'));
  test.doesNotThrow(parse('-1'));
  test.doesNotThrow(parse('~1'));
  test.doesNotThrow(parse('!1'));
  test.end();
});

tape('Parser should allow binary expressions', function(test) {
  test.deepEqual(parse('1+2')(), {
    type: 'BinaryExpression',
    operator: '+',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  });
  test.doesNotThrow(parse('1-2'));
  test.doesNotThrow(parse('1*2'));
  test.doesNotThrow(parse('1/2'));
  test.doesNotThrow(parse('1%2'));
  test.doesNotThrow(parse('1&2'));
  test.doesNotThrow(parse('1|2'));
  test.doesNotThrow(parse('1>>2'));
  test.doesNotThrow(parse('1<<2'));
  test.doesNotThrow(parse('1>>>2'));
  test.doesNotThrow(parse('1^2'));
  test.doesNotThrow(parse('"a"+"b"'));
  test.doesNotThrow(parse('1 in a'));
  test.end();
});

tape('Parser should allow logical expressions', function(test) {
  test.deepEqual(parse('1 && 2')(), {
    type: 'LogicalExpression',
    operator: '&&',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  });
  test.doesNotThrow(parse('1 || 2'));
  test.end();
});

tape('Parser should allow comparison expressions', function(test) {
  test.deepEqual(parse('1 < 2')(), {
    type: 'BinaryExpression',
    operator: '<',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  })
  test.doesNotThrow(parse('1 > 2'));
  test.doesNotThrow(parse('1 <= 2'));
  test.doesNotThrow(parse('1 >= 2'));
  test.doesNotThrow(parse('1 == 2'));
  test.doesNotThrow(parse('1 === 2'));
  test.doesNotThrow(parse('1 != 2'));
  test.doesNotThrow(parse('1 !== 2'));
  test.end();
});

tape('Parser should allow complex expressions', function(test) {
  test.doesNotThrow(parse('1 + 2 - 3 / 4 * a.a + 4 & 3'));
  test.end();
});

tape('Parser should allow ternary conditional expressions', function(test) {
  test.deepEqual(parse('a ? b : c')(), {
    type: 'ConditionalExpression',
    test: {type: 'Identifier', name: 'a'},
    consequent: {type: 'Identifier', name: 'b'},
    alternate: {type: 'Identifier', name: 'c'}
  });
  test.doesNotThrow(parse('1 ? 2 : 3'));
  test.end();
});

tape('Parser should allow identifier expressions', function(test) {
  test.deepEqual(parse('a')(), {
    type: 'Identifier',
    name: 'a'
  });
  test.doesNotThrow(parse('a3'));
  test.doesNotThrow(parse('µ'));
  test.doesNotThrow(parse('$f'));
  test.doesNotThrow(parse('_'));
  // JS identifiers can contain escape sequences!
  test.deepEqual(parse('\\u0041')(), {
    type: 'Identifier',
    name: 'A'
  });
  test.deepEqual(parse('A\\u0041')(), {
    type: 'Identifier',
    name: 'AA'
  });

  // but only \uXXXX escapes
  test.throws(parse('id\\n'));
  test.throws(parse('\\n'));
  test.throws(parse('\\x4E'));
  // And the unescaped character must be otherwise valid.
  test.throws(parse('\\u0030')); // \u0030 = '0', not allowed at start of identifier
  test.throws(parse('id\\u0020')); // \u0020 is a control character
  test.end();
});

tape('Parser should allow member expressions', function(test) {
  test.deepEqual(parse('a[0]')(), {
    type: 'MemberExpression',
    computed: true,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Literal', value: 0, raw: '0'}
  });
  test.deepEqual(parse('a.b')(), {
    type: 'MemberExpression',
    computed: false,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Identifier', name: 'b', member: true}
  })
  test.doesNotThrow(parse('a["b"]'));
  test.doesNotThrow(parse('a["two words"]'));
  test.deepEqual(parse('a.true')(), {
    type: 'MemberExpression',
    computed: false,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Identifier', name: 'true', member: true}
  })
  test.doesNotThrow(parse('a.function'));
  test.doesNotThrow(parse('a.null'));

  test.throws(parse('a.+'));
  test.throws(parse('a."hello"'));
  test.end();
});

tape('Parser should allow call expressions', function(test) {
  test.deepEqual(parse('a()')(), {
    type: 'CallExpression',
    callee: {type: 'Identifier', name: 'a'},
    arguments: []
  });
  test.deepEqual(parse('a(0,1,2)')(), {
    type: 'CallExpression',
    callee: {type: 'Identifier', name: 'a'},
    arguments: [
      {type: 'Literal', value: 0, raw: '0'},
      {type: 'Literal', value: 1, raw: '1'},
      {type: 'Literal', value: 2, raw: '2'}
    ]
  })
  test.doesNotThrow(parse('A()'));
  test.doesNotThrow(parse('A(0,1,2)'));
  test.doesNotThrow(parse('foo.bar(0,1,2)'));
  test.end();
});

tape('Parser should not allow illegal identifier expressions', function(test) {
  test.throws(parse('3a'));
  test.throws(parse('#e'));
  test.throws(parse('@e'));
  test.end();
});

tape('Parser should not allow illegal member expressions', function(test) {
  test.throws(parse('a.3'));
  test.end();
});

tape('Parser should not allow single-line comments', function(test) {
  test.throws(parse('3 // comment'));
  test.end();
});

tape('Parser should not allow multi-line comments', function(test) {
  test.throws(parse('/* comment */ 3'));
  test.throws(parse('3 /* comment */'));
  test.end();
});

tape('Parser should not allow empty statements', function(test) {
  test.throws(parse(''));
  test.throws(parse(' '));
  test.end();
});

tape('Parser should not allow debugger statements', function(test) {
  test.throws(parse('debugger'));
  test.end();
});

tape('Parser should not allow continue statements', function(test) {
  test.throws(parse('continue'));
  test.end();
});

tape('Parser should not allow break statements', function(test) {
  test.throws(parse('break'));
  test.end();
});

tape('Parser should not allow reserved keywords', function(test) {
  // future reserved words
  test.throws(parse('class'));
  test.throws(parse('enum'));
  test.throws(parse('export'));
  test.throws(parse('extends'));
  test.throws(parse('import'));
  test.throws(parse('super'));
  // strict mode reserved words
  test.throws(parse('implements'));
  test.throws(parse('interface'));
  test.throws(parse('package'));
  test.throws(parse('private'));
  test.throws(parse('protected'));
  test.throws(parse('public'));
  test.throws(parse('static'));
  test.throws(parse('yield'));
  test.throws(parse('let'));
  test.end();
});

tape('Parser should not allow object get/set expressions', function(test) {
  test.throws(parse('{get b() {}}'));
  test.throws(parse('{set b(x) {}}'));
  test.end();
});

tape('Parser should not allow assignment expressions', function(test) {
  test.throws(parse('index = 3'));
  test.throws(parse('index += 3'));
  test.throws(parse('index -= 3'));
  test.throws(parse('index *= 3'));
  test.throws(parse('index /= 3'));
  test.throws(parse('index %= 3'));
  test.throws(parse('index >>= 1'));
  test.throws(parse('index <<= 1'));
  test.throws(parse('index >>>= 1'));
  test.throws(parse('index &= 1'));
  test.throws(parse('index |= 1'));
  test.throws(parse('index ^= 1'));
  test.end();
});

tape('Parser should not allow postfix update expressions', function(test) {
  test.throws(parse('index++'));
  test.throws(parse('index--'));
  test.end();
});

tape('Parser should not allow prefix update expressions', function(test) {
  test.throws(parse('++index'));
  test.throws(parse('--index'));
  test.end();
});

tape('Parser should not allow sequence expressions', function(test) {
  test.throws(parse('(3, 4)'));
  test.throws(parse('("a", 3+4)'));
  test.end();
});

tape('Parser should not allow multiple statements', function(test) {
  test.throws(parse('3; 4'));
  test.throws(parse('"a"; 3+4'));
  test.end();
});

tape('Parser should not allow variable statements', function(test) {
  test.throws(parse('var x = 4'));
  test.end();
});

tape('Parser should not allow return statements', function(test) {
  test.throws(parse('return 4'));
  test.end();
});

tape('Parser should not allow function declarations', function(test) {
  test.throws(parse('function f() {}'));
  test.throws(parse('function f() { 1 }'));
  test.throws(parse('function f() { return 1; }'));
  test.end();
});

tape('Parser should not allow function expressions', function(test) {
  test.throws(parse('function() {}'));
  test.throws(parse('function() { 1 }'));
  test.throws(parse('function() { return 1; }'));
  test.end();
});

tape('Parser should not allow new statements', function(test) {
  test.throws(parse('new Date()'));
  test.throws(parse('new Array(3)'));
  test.end();
});

tape('Parser should not allow block statements', function(test) {
  test.throws(parse('{3+4}'));
  test.throws(parse('{"a"}'));
  test.end();
});

tape('Parser should not allow labeled statements', function(test) {
  test.throws(parse('label: 3'));
  test.end();
});

tape('Parser should not allow with statements', function(test) {
  test.throws(parse('with({a:1,b:2}) { a }'));
  test.end();
});

tape('Parser should not allow try/catch statements', function(test) {
  test.throws(parse('try { 3 } catch (err) { 4 }'));
  test.throws(parse('try { undefined() } catch (err) { 4 }'));
  test.end();
});

tape('Parser should not allow if statements', function(test) {
  test.throws(parse('if (1<2) 4; else 5'));
  test.throws(parse('if (2<1) 4; else 5'));
  test.end();
});

tape('Parser should not allow switch statements', function(test) {
  test.throws(parse('switch("a") { default: 3; }'));
  test.throws(parse('switch("a") { case "a": 4; break; default: 3; }'));
  test.end();
});

tape('Parser should not allow for statements', function(test) {
  test.throws(parse('for (; index>5; ) { index; }'));
  test.end();
});

tape('Parser should not allow for-in statements', function(test) {
  test.throws(parse('for (i in self) { 3; }'));
  test.end();
});

tape('Parser should not allow while statements', function(test) {
  test.throws(parse('while (1 < 2) { 3; }'));
  test.throws(parse('while (1 > 2) { 3; }'));
  test.end();
});

tape('Parser should not allow do-while statements', function(test) {
  test.throws(parse('do { 3 } while (1 < 2)'));
  test.throws(parse('do { 3 } while (1 > 2)'));
  test.end();
});

tape('Parser should not allow octal literals or escape sequences', function(test) {
  // octal literals are not allowed in strict mode.
  test.throws(parse('"\\01"'));
  test.throws(parse('012'));
  test.end();
});

tape('Parser should not allow void expressions', function(test) {
  test.throws(parse('void(0)'));
  test.end();
});

tape('Parser should not allow delete expressions', function(test) {
  test.throws(parse('delete a.x'));
  test.end();
});

tape('Parser should not allow typeof expressions', function(test) {
  test.throws(parse('typeof "hello"'));
  test.end();
});

tape('Parser should parse escape sequences', function(test) {
  test.deepEqual(parse('"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"')(), {
    type: 'Literal',
    value: '\b\f\n\r\t\vz\u0023\u0041\uD87E\uDC04',
    raw: '"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"'
  });
  // \0 is a special case, not an octal literal
  test.doesNotThrow(parse('"\\0"'));

  // octal literals are not allowed in strict mode
  test.throws(parse('"\\251"'));
  // malformed hex escape
  // test.throws(parse('"\\xhi"')); // TODO
  // unicode codepoint is too large
  test.throws(parse('"\\u{110000}"'));
  // malformed unicode codepoint escape
  test.throws(parse('"\\u{}"'));
  test.end();
});

tape('Parser should ignore whitespace', function(test) {
  var tree = {
    type: "BinaryExpression",
    operator: "+",
    left: {type: "Literal", value: 1, raw: "1"},
    right: {type: "Literal", value: 2, raw: "2"}
  };
  test.deepEqual(parse('1+ 2')(), tree);
  test.deepEqual(parse('1+\n2')(), tree);
  test.deepEqual(parse('1+\t2')(), tree);
  test.deepEqual(parse('1+\v2')(), tree);
  test.deepEqual(parse('1+\uFEFF2')(), tree);
  test.deepEqual(parse('1+\r\n2')(), tree);
  test.end();
});
