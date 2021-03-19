var tape = require('tape'),
    vega = require('../');

function parse(str) {
  return function() {
    return JSON.parse(JSON.stringify(vega.parse(str)));
  };
}

tape('Parser should allow literal boolean expressions', t => {
  t.deepEqual(parse('true')(), {
    type: 'Literal',
    value: true,
    raw: 'true'
  });
  t.doesNotThrow(parse('false'));
  t.end();
});

tape('Parser should allow literal number expressions', t => {
  t.deepEqual(parse('3')(), {
    type: 'Literal',
    value: 3,
    raw: '3'
  });
  t.doesNotThrow(parse('3.4'));
  t.doesNotThrow(parse('3e5'));
  t.doesNotThrow(parse('3e+5'));

  t.throws(parse('0x'));
  t.throws(parse('0x0H'));
  t.throws(parse('3e+H'));
  // octal is disabled in strict mode
  t.throws(parse('012'));
  // 9 and A are not octal digits.
  t.throws(parse('09'));
  t.throws(parse('01A'));
  t.end();
});

tape('Parser should allow literal string expressions', t => {
  t.deepEqual(parse("'a'")(), {
    type: 'Literal',
    value: 'a',
    raw: "'a'"
  });
  t.doesNotThrow(parse('"b"'));
  t.doesNotThrow(parse('"escaped newline\\\r\n"'));

  t.throws(parse('"unterminated'));
  t.throws(parse('"unterminated\r\n'));
  t.end();
});

tape('Parser should allow literal regular expressions', t => {
  t.deepEqual(parse('/a/')(), {
    type: 'Literal',
    value: {},
    raw: '/a/',
    regex: { pattern: 'a', flags: ''}
  });
  // Empty regex
  t.throws(parse('//'));
  t.doesNotThrow(parse('/[0-9]+/gi'));
  t.doesNotThrow(parse('/a\\u{41}/u'));
  t.throws(parse('/a\\u{110000}/u'));

  t.doesNotThrow(parse('/a/gimuy'));

  t.throws(parse('/a/a'));
  t.throws(parse('/a/\\u0067'));
  t.throws(parse('/unterminated'));
  t.throws(parse('/unterminated\n'));
  t.throws(parse('/cannot escape newline\\\n/'));

  t.end();
});

tape('Parser should allow literal array expressions', t => {
  t.deepEqual(parse('[]')(), {
    type: 'ArrayExpression',
    elements: []
  });
  t.doesNotThrow(parse('[0,1,2]'));
  t.doesNotThrow(parse('["a","b","c"]'));
  t.deepEqual(parse('[0,,]')(), {
    type: 'ArrayExpression',
    elements: [
      {type: 'Literal', value: 0, raw: '0'},
      null
    ]
  });
  t.end();
});

tape('Parser should allow literal object expressions', t => {
  t.deepEqual(parse('{}')(), {
    type: 'ObjectExpression',
    properties: []
  });
  t.deepEqual(parse('{a:1, b:"c"}')(), {
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
        value: {type: 'Literal', value: 'c', raw: '"c"'}
      }
    ]
  });
  t.doesNotThrow(parse('{a:[0,1,2], b:[{a:1},{a:2}]}'));
  t.doesNotThrow(parse('{1:1}'));

  // disallow duplicate keys
  t.throws(parse('{a: 1, a: 2}'));
  t.throws(parse('{'));
  t.throws(parse('{01:true}'));
  t.throws(parse('{/regex/:true}'));
  t.end();
});

tape('Parser should allow unary expressions', t => {
  t.deepEqual(parse('+"1"')(), {
    type: 'UnaryExpression',
    operator: '+',
    prefix: true,
    argument: {
      type: 'Literal',
      value: '1',
      raw: '"1"'
    }
  });
  t.doesNotThrow(parse('+1'));
  t.doesNotThrow(parse('-1'));
  t.doesNotThrow(parse('~1'));
  t.doesNotThrow(parse('!1'));
  t.end();
});

tape('Parser should allow binary expressions', t => {
  t.deepEqual(parse('1+2')(), {
    type: 'BinaryExpression',
    operator: '+',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  });
  t.doesNotThrow(parse('1-2'));
  t.doesNotThrow(parse('1*2'));
  t.doesNotThrow(parse('1/2'));
  t.doesNotThrow(parse('1%2'));
  t.doesNotThrow(parse('1&2'));
  t.doesNotThrow(parse('1|2'));
  t.doesNotThrow(parse('1>>2'));
  t.doesNotThrow(parse('1<<2'));
  t.doesNotThrow(parse('1>>>2'));
  t.doesNotThrow(parse('1^2'));
  t.doesNotThrow(parse('"a"+"b"'));
  t.doesNotThrow(parse('1 in a'));
  t.end();
});

tape('Parser should allow logical expressions', t => {
  t.deepEqual(parse('1 && 2')(), {
    type: 'LogicalExpression',
    operator: '&&',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  });
  t.doesNotThrow(parse('1 || 2'));
  t.end();
});

tape('Parser should allow comparison expressions', t => {
  t.deepEqual(parse('1 < 2')(), {
    type: 'BinaryExpression',
    operator: '<',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  });
  t.doesNotThrow(parse('1 > 2'));
  t.doesNotThrow(parse('1 <= 2'));
  t.doesNotThrow(parse('1 >= 2'));
  t.doesNotThrow(parse('1 == 2'));
  t.doesNotThrow(parse('1 === 2'));
  t.doesNotThrow(parse('1 != 2'));
  t.doesNotThrow(parse('1 !== 2'));
  t.end();
});

tape('Parser should allow complex expressions', t => {
  t.doesNotThrow(parse('1 + 2 - 3 / 4 * a.a + 4 & 3'));
  t.end();
});

tape('Parser should allow ternary conditional expressions', t => {
  t.deepEqual(parse('a ? b : c')(), {
    type: 'ConditionalExpression',
    test: {type: 'Identifier', name: 'a'},
    consequent: {type: 'Identifier', name: 'b'},
    alternate: {type: 'Identifier', name: 'c'}
  });
  t.doesNotThrow(parse('1 ? 2 : 3'));
  t.end();
});

tape('Parser should allow identifier expressions', t => {
  t.deepEqual(parse('a')(), {
    type: 'Identifier',
    name: 'a'
  });
  t.doesNotThrow(parse('a3'));
  t.doesNotThrow(parse('µ'));
  t.doesNotThrow(parse('$f'));
  t.doesNotThrow(parse('_'));
  // JS identifiers can contain escape sequences!
  t.deepEqual(parse('\\u0041')(), {
    type: 'Identifier',
    name: 'A'
  });
  t.deepEqual(parse('A\\u0041')(), {
    type: 'Identifier',
    name: 'AA'
  });

  // but only \uXXXX escapes
  t.throws(parse('id\\n'));
  t.throws(parse('\\n'));
  t.throws(parse('\\x4E'));
  // And the unescaped character must be otherwise valid.
  t.throws(parse('\\u0030')); // \u0030 = '0', not allowed at start of identifier
  t.throws(parse('id\\u0020')); // \u0020 is a control character
  t.end();
});

tape('Parser should allow member expressions', t => {
  t.deepEqual(parse('a[0]')(), {
    type: 'MemberExpression',
    computed: true,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Literal', value: 0, raw: '0'}
  });
  t.deepEqual(parse('a.b')(), {
    type: 'MemberExpression',
    computed: false,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Identifier', name: 'b', member: true}
  });
  t.doesNotThrow(parse('a["b"]'));
  t.doesNotThrow(parse('a["two words"]'));
  t.deepEqual(parse('a.true')(), {
    type: 'MemberExpression',
    computed: false,
    object: {type: 'Identifier', name: 'a'},
    property: {type: 'Identifier', name: 'true', member: true}
  });
  t.doesNotThrow(parse('a.function'));
  t.doesNotThrow(parse('a.null'));

  t.throws(parse('a.+'));
  t.throws(parse('a."hello"'));
  t.end();
});

tape('Parser should allow call expressions', function(t) {
  t.deepEqual(parse('a()')(), {
    type: 'CallExpression',
    callee: {type: 'Identifier', name: 'a'},
    arguments: []
  });
  t.deepEqual(parse('a(0,1,2)')(), {
    type: 'CallExpression',
    callee: {type: 'Identifier', name: 'a'},
    arguments: [
      {type: 'Literal', value: 0, raw: '0'},
      {type: 'Literal', value: 1, raw: '1'},
      {type: 'Literal', value: 2, raw: '2'}
    ]
  });
  t.doesNotThrow(parse('A()'));
  t.doesNotThrow(parse('A(0,1,2)'));
  t.doesNotThrow(parse('foo.bar(0,1,2)'));
  t.end();
});

tape('Parser should not allow illegal identifier expressions', t => {
  t.throws(parse('3a'));
  t.throws(parse('#e'));
  t.throws(parse('@e'));
  t.end();
});

tape('Parser should not allow illegal member expressions', t => {
  t.throws(parse('a.3'));
  t.end();
});

tape('Parser should not allow single-line comments', t => {
  t.throws(parse('3 // comment'));
  t.end();
});

tape('Parser should not allow multi-line comments', t => {
  t.throws(parse('/* comment */ 3'));
  t.throws(parse('3 /* comment */'));
  t.end();
});

tape('Parser should not allow empty statements', t => {
  t.throws(parse(''));
  t.throws(parse(' '));
  t.end();
});

tape('Parser should not allow debugger statements', t => {
  t.throws(parse('debugger'));
  t.end();
});

tape('Parser should not allow continue statements', t => {
  t.throws(parse('continue'));
  t.end();
});

tape('Parser should not allow break statements', t => {
  t.throws(parse('break'));
  t.end();
});

tape('Parser should not allow reserved keywords', t => {
  // future reserved words
  t.throws(parse('class'));
  t.throws(parse('enum'));
  t.throws(parse('export'));
  t.throws(parse('extends'));
  t.throws(parse('import'));
  t.throws(parse('super'));
  // strict mode reserved words
  t.throws(parse('implements'));
  t.throws(parse('interface'));
  t.throws(parse('package'));
  t.throws(parse('private'));
  t.throws(parse('protected'));
  t.throws(parse('public'));
  t.throws(parse('static'));
  t.throws(parse('yield'));
  t.throws(parse('let'));
  t.end();
});

tape('Parser should not allow object get/set expressions', t => {
  t.throws(parse('{get b() {}}'));
  t.throws(parse('{set b(x) {}}'));
  t.end();
});

tape('Parser should not allow assignment expressions', t => {
  t.throws(parse('index = 3'));
  t.throws(parse('index += 3'));
  t.throws(parse('index -= 3'));
  t.throws(parse('index *= 3'));
  t.throws(parse('index /= 3'));
  t.throws(parse('index %= 3'));
  t.throws(parse('index >>= 1'));
  t.throws(parse('index <<= 1'));
  t.throws(parse('index >>>= 1'));
  t.throws(parse('index &= 1'));
  t.throws(parse('index |= 1'));
  t.throws(parse('index ^= 1'));
  t.end();
});

tape('Parser should not allow postfix update expressions', t => {
  t.throws(parse('index++'));
  t.throws(parse('index--'));
  t.end();
});

tape('Parser should not allow prefix update expressions', t => {
  t.throws(parse('++index'));
  t.throws(parse('--index'));
  t.end();
});

tape('Parser should not allow sequence expressions', t => {
  t.throws(parse('(3, 4)'));
  t.throws(parse('("a", 3+4)'));
  t.end();
});

tape('Parser should not allow multiple statements', t => {
  t.throws(parse('3; 4'));
  t.throws(parse('"a"; 3+4'));
  t.end();
});

tape('Parser should not allow variable statements', t => {
  t.throws(parse('var x = 4'));
  t.end();
});

tape('Parser should not allow return statements', t => {
  t.throws(parse('return 4'));
  t.end();
});

tape('Parser should not allow function declarations', t => {
  t.throws(parse('function f() {}'));
  t.throws(parse('function f() { 1 }'));
  t.throws(parse('function f() { return 1; }'));
  t.end();
});

tape('Parser should not allow function expressions', t => {
  t.throws(parse('function() {}'));
  t.throws(parse('function() { 1 }'));
  t.throws(parse('function() { return 1; }'));
  t.end();
});

tape('Parser should not allow new statements', t => {
  t.throws(parse('new Date()'));
  t.throws(parse('new Array(3)'));
  t.end();
});

tape('Parser should not allow block statements', t => {
  t.throws(parse('{3+4}'));
  t.throws(parse('{"a"}'));
  t.end();
});

tape('Parser should not allow labeled statements', t => {
  t.throws(parse('label: 3'));
  t.end();
});

tape('Parser should not allow with statements', t => {
  t.throws(parse('with({a:1,b:2}) { a }'));
  t.end();
});

tape('Parser should not allow try/catch statements', t => {
  t.throws(parse('try { 3 } catch (err) { 4 }'));
  t.throws(parse('try { undefined() } catch (err) { 4 }'));
  t.end();
});

tape('Parser should not allow if statements', t => {
  t.throws(parse('if (1<2) 4; else 5'));
  t.throws(parse('if (2<1) 4; else 5'));
  t.end();
});

tape('Parser should not allow switch statements', t => {
  t.throws(parse('switch("a") { default: 3; }'));
  t.throws(parse('switch("a") { case "a": 4; break; default: 3; }'));
  t.end();
});

tape('Parser should not allow for statements', t => {
  t.throws(parse('for (; index>5; ) { index; }'));
  t.end();
});

tape('Parser should not allow for-in statements', t => {
  t.throws(parse('for (i in self) { 3; }'));
  t.end();
});

tape('Parser should not allow while statements', t => {
  t.throws(parse('while (1 < 2) { 3; }'));
  t.throws(parse('while (1 > 2) { 3; }'));
  t.end();
});

tape('Parser should not allow do-while statements', t => {
  t.throws(parse('do { 3 } while (1 < 2)'));
  t.throws(parse('do { 3 } while (1 > 2)'));
  t.end();
});

tape('Parser should not allow octal literals or escape sequences', t => {
  // octal literals are not allowed in strict mode.
  t.throws(parse('"\\01"'));
  t.throws(parse('012'));
  t.end();
});

tape('Parser should not allow void expressions', t => {
  t.throws(parse('void(0)'));
  t.end();
});

tape('Parser should not allow delete expressions', t => {
  t.throws(parse('delete a.x'));
  t.end();
});

tape('Parser should not allow typeof expressions', t => {
  t.throws(parse('typeof "hello"'));
  t.end();
});

tape('Parser should parse escape sequences', t => {
  t.deepEqual(parse('"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"')(), {
    type: 'Literal',
    value: '\b\f\n\r\t\vz\u0023\u0041\uD87E\uDC04',
    raw: '"\\\n\\b\\f\\n\\r\\t\\v\\z\\u0023\\u{41}\\u{2F804}"'
  });
  // \0 is a special case, not an octal literal
  t.doesNotThrow(parse('"\\0"'));

  // octal literals are not allowed in strict mode
  t.throws(parse('"\\251"'));
  // malformed hex escape
  // t.throws(parse('"\\xhi"')); // TODO
  // unicode codepoint is too large
  t.throws(parse('"\\u{110000}"'));
  // malformed unicode codepoint escape
  t.throws(parse('"\\u{}"'));
  t.end();
});

tape('Parser should ignore whitespace', t => {
  const tree = {
    type: 'BinaryExpression',
    operator: '+',
    left: {type: 'Literal', value: 1, raw: '1'},
    right: {type: 'Literal', value: 2, raw: '2'}
  };
  t.deepEqual(parse('1+ 2')(), tree);
  t.deepEqual(parse('1+\n2')(), tree);
  t.deepEqual(parse('1+\t2')(), tree);
  t.deepEqual(parse('1+\v2')(), tree);
  t.deepEqual(parse('1+\uFEFF2')(), tree);
  t.deepEqual(parse('1+\r\n2')(), tree);
  t.end();
});
