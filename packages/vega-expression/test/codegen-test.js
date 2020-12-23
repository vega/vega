var tape = require('tape'),
    vega = require('../');

function regexEqual(x, y) {
  return (x instanceof RegExp) && (y instanceof RegExp) &&
    (x.source === y.source) && (x.global === y.global) &&
    (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
}

tape('Evaluate expressions without white or black list', t => {
  var codegen = vega.codegen({
    globalvar: 'global'
  });

  function evaluate(str) {
    const value = codegen(vega.parse(str));
    const fn = Function('"use strict"; return (' + value.code + ')');
    return fn();
  }

  evaluate.fn = function(str) {
    return function() { return evaluate(str); };
  };

  // should access globals object
  const unicode = 'd\u00A9';
  global._val_ = 5;
  global[unicode] = 3.14;
  t.equal(evaluate('global._val_+1'), 6);
  t.equal(evaluate('global["'+unicode+'"]'),3.14);
  delete global._val_;
  delete global[unicode];

  // should return string input to codegen
  var value = codegen('d');
  t.equal(value.code, 'd');

  // should not allow unknown ast node type
  t.throws(() => { codegen({}); });
  t.throws(() => { codegen({type: 'foo'}); });

  t.end();
});

tape('Evaluate expressions with black list', t => {
  var codegen = vega.codegen({
    forbidden: ['a', 'b', 'c'],
    globalvar: 'global',
    fieldvar:  'd'
  });

  function evaluate(str) {
    const d = {a: 2, föö: 5};
    const value = codegen(vega.parse(str));
    const fn = Function('d', '"use strict";return(' + value.code + ')');
    return fn(d);
  }

  evaluate.fn = function(str) {
    return function() { return evaluate(str); };
  };

  // should not allow forbidden ids
  t.throws(evaluate.fn('a'));
  t.throws(evaluate.fn('b'));
  t.throws(evaluate.fn('c'));

  // should allow non-forbidden ids
  t.doesNotThrow(evaluate.fn('d'));
  t.doesNotThrow(evaluate.fn('global'));

  t.end();
});

tape('Evaluate expressions with white list', t => {
  var codegen = vega.codegen({
    allowed: ['datum', 'event', 'signals'],
    globalvar: 'global'
  });

  function evaluate(str) {
    const datum = {a: 2, föö: 5};
    const evt = {type: 'mousemove'};
    const value = codegen(vega.parse(str));
    if (value.globals.length > 0) {
      throw Error('Found non-allowed global identifier.');
    }
    const fn = Function('datum', 'event', 'signals', 'return (' + value.code + ')');
    return fn(datum, evt);
  }

  evaluate.fn = function(str) {
    return function() { return evaluate(str); };
  };

  // Simple evaluation
  // should eval simple integer expressions
  t.equal(evaluate('1'), 1);
  t.equal(evaluate('0xFF'), 255);
  t.equal(evaluate('1+1'), 2);
  t.equal(evaluate('1 + 1'), 2);
  t.equal(evaluate('1+(2+3)'), 6);
  t.equal(evaluate('3 * (2+1)'), 9);

  // should not allow octal literals
  t.throws(evaluate.fn('001'));

  // should eval simple string expressions
  t.equal(evaluate('"a"'), 'a');
  t.equal(evaluate('"\t"'), '\t');
  t.equal(evaluate('"\u00A9"'), '\u00A9');
  t.equal(evaluate('"a" + "b"'), 'ab');

  // should eval simple boolean expressions
  t.equal(evaluate('true'), true);
  t.equal(evaluate('true && false'), false);
  t.equal(evaluate('true || false'), true);

  // should eval simple combined expressions
  t.equal(evaluate('(2>3) ? 1 : 2'), 2);
  t.equal(evaluate('1 + "ab".length'), 3);

  // should eval simple regular expressions
  t.equal(regexEqual(/pattern/, evaluate('/pattern/')), true);
  t.equal(regexEqual(/[0-9]+/, evaluate('/[0-9]+/')), true);
  t.equal(regexEqual(/[0-9]+/, evaluate('/[1-9]+/')), false);
  t.equal(regexEqual(/[a-z]/gi, evaluate('/[a-z]/gi')), true);

  t.equal(regexEqual(/pattern/, evaluate('regexp("pattern")')), true);
  t.equal(regexEqual(/[0-9]+/, evaluate('regexp("[0-9]+")')), true);
  t.equal(regexEqual(/[0-9]+/, evaluate('regexp("[1-9]+")')), false);
  t.equal(regexEqual(/[a-z]/gi, evaluate('regexp("[a-z]", "gi")')), true);

  // should eval array expressions
  t.deepEqual(evaluate('[]'), []);
  t.deepEqual(evaluate('[1,2,3]'), [1,2,3]);
  t.deepEqual(evaluate('["a","b"]'), ['a','b']);

  // should eval unary expressions
  t.equal(evaluate('-3'), -3);
  t.equal(evaluate('+"4"'), 4);
  t.equal(evaluate('~~5.2'), 5);
  t.equal(evaluate('!1'), false);

  // should not allow unary update expressions
  t.throws(evaluate.fn('++1'));
  t.throws(evaluate.fn('1++'));

  // should eval constant values
  t.equal(evaluate('null'), null);
  t.equal(evaluate('E'), Math.E);
  t.equal(evaluate('PI'), Math.PI);
  t.equal(evaluate('SQRT2'), Math.SQRT2);

  // Evaluation with arguments
  // should handle data argument
  t.equal(evaluate('datum.a'), 2);
  t.equal(evaluate('datum["a"]'), 2);

  // should handle event argument
  t.equal(evaluate('event.type'), 'mousemove');

  // should handle unicode
  t.equal(evaluate('datum.föö'), 5);

  // Function evaluation
  // should eval math functions', function() {
  t.equal(evaluate('isNaN(1/0)'), Number.isNaN(1/0));
  t.equal(evaluate('isNaN("1")'), Number.isNaN('1'));
  t.equal(evaluate('isFinite(1)'), Number.isFinite(1));
  t.equal(evaluate('isFinite(1/0)'), Number.isFinite(1/0));
  t.equal(evaluate('isFinite(null)'), Number.isFinite(null));
  t.equal(evaluate('isFinite("0")'), Number.isFinite('0'));
  t.equal(evaluate('abs(-3)'), Math.abs(-3));
  t.equal(evaluate('acos(1)'), Math.acos(1));
  t.equal(evaluate('asin(1)'), Math.asin(1));
  t.equal(evaluate('atan(1)'), Math.atan(1));
  t.equal(evaluate('atan2(1,2)'), Math.atan2(1,2));
  t.equal(evaluate('ceil(0.5)'), Math.ceil(0.5));
  t.equal(evaluate('cos(1)'), Math.cos(1));
  t.equal(evaluate('exp(1)'), Math.exp(1));
  t.equal(evaluate('floor(0.5)'), Math.floor(0.5));
  t.equal(evaluate('log(2)'), Math.log(2));
  t.equal(evaluate('max(0,1)'), Math.max(0,1));
  t.equal(evaluate('min(0,1)'), Math.min(0,1));
  t.equal(evaluate('pow(2,3)'), Math.pow(2,3));
  t.equal(evaluate('round(0.5)'), Math.round(0.5));
  t.equal(evaluate('sin(1)'), Math.sin(1));
  t.equal(evaluate('sqrt(2)'), Math.sqrt(2));
  t.equal(evaluate('tan(1)'), Math.tan(1));
  for (let i=0; i<5; ++i) {
    const r = evaluate('random()');
    t.equal(r >= 0 && r <= 1, true);
  }

  // should eval clamp function
  t.equal(evaluate('clamp(5, 0, 10)'), 5);
  t.equal(evaluate('clamp(-1, 0, 10)'), 0);
  t.equal(evaluate('clamp(11, 0, 10)'), 10);
  t.throws(evaluate.fn('clamp(0,1)'));
  t.throws(evaluate.fn('clamp(0,1,2,3)'));

  // should eval array functions
  t.deepEqual(evaluate('length([1, 2, 3])'), [1, 2, 3].length);

  // should eval string functions
  t.equal(evaluate('length("123")'), '123'.length);
  t.equal(evaluate('upper("abc")'), 'abc'.toUpperCase());
  t.equal(evaluate('lower("abc")'), 'abc'.toLowerCase());
  t.deepEqual(evaluate('split("1 2 3"," ")'), '1 2 3'.split(' '));
  t.equal(evaluate('substring("123",0,1)'), '123'.substring(0,1));
  t.equal(evaluate('trim(" 123 ")'), ' 123 '.trim());
  t.equal(evaluate('parseFloat("3.14")'), parseFloat('3.14'));
  t.equal(evaluate('parseInt("42")'),parseInt('42'));

  // should eval regular expression functions
  t.equal(evaluate('test(/ain/, "spain")'), /ain/.test('spain'));
  t.equal(evaluate('test(/ain/, "france")'), /ain/.test('france'));

  // should eval datetime functions
  var d = new Date(2001,1,1),
      u = Date.UTC(2009, 9, 1, 10);

  t.equal(Math.abs(Date.now() - evaluate('now()')) <= 5, true);
  t.equal(evaluate('+datetime(2001,1,1)'), +d);
  t.equal(evaluate('time(datetime(2001,1,1))'), +d);
  t.equal(evaluate('timezoneoffset(datetime(2001,1,1))'),d.getTimezoneOffset());

  t.equal(evaluate('day(datetime(2001,1,1))'), d.getDay());
  t.equal(evaluate('year(datetime(2001,1,1))'), d.getFullYear());
  t.equal(evaluate('month(datetime(2001,1,1))'), d.getMonth());
  t.equal(evaluate('hours(datetime(2001,1,1))'), d.getHours());
  t.equal(evaluate('minutes(datetime(2001,1,1))'), d.getMinutes());
  t.equal(evaluate('seconds(datetime(2001,1,1))'), d.getSeconds());
  t.equal(evaluate('milliseconds(datetime(2001,1,1))'), d.getMilliseconds());

  t.equal(evaluate('utcday(datetime(2001,1,1))'), d.getUTCDay());
  t.equal(evaluate('utcyear(datetime(2001,1,1))'), d.getUTCFullYear());
  t.equal(evaluate('utcmonth(datetime(2001,1,1))'), d.getUTCMonth());
  t.equal(evaluate('utchours(datetime(2001,1,1))'), d.getUTCHours());
  t.equal(evaluate('utcminutes(datetime(2001,1,1))'), d.getUTCMinutes());
  t.equal(evaluate('utcseconds(datetime(2001,1,1))'), d.getUTCSeconds());
  t.equal(evaluate('utcmilliseconds(datetime(2001,1,1))'), d.getUTCMilliseconds());

  for (let date=1; date<=7; ++date) {
    d = new Date(2001, 1, date);
    t.equal(evaluate('date(datetime(2001,1,'+date+'))'), d.getDate());
    t.equal(evaluate('utcdate(datetime(2001,1,'+date+'))'), d.getUTCDate());
  }

  t.equal(evaluate('utc(2009,9,1,10)'), u);
  t.equal(evaluate('utchours(utc(2009,9,1,10))'), new Date(u).getUTCHours());

  // should evaluate if statements
  t.equal(evaluate('if(datum.a > 1, 1, 2)'), 1);
  t.equal(evaluate('if(event.type === "mousedown", 1, 2)'), 2);
  t.equal(evaluate('if(datum.a > 1, if(event.type === "mousedown", 3, 4), 2)'), 4);
  t.throws(evaluate.fn('if(datum.a > 1, 1)'));
  t.throws(evaluate.fn('if(datum.a > 1, 1, 2, 3)'));

  // "if" should be isolated from surrounding expression
  t.equal(evaluate('0 * if(datum.a > 1, 1, 2)'), 0);

  // should not eval undefined functions
  t.throws(evaluate.fn('Array()'));
  t.throws(evaluate.fn('Function()'));
  t.throws(evaluate.fn('Object()'));
  t.throws(evaluate.fn('String()'));

  // Validation checks
  // should not allow nested function calls
  t.throws(evaluate.fn('d.hasOwnProperty("a")'));
  t.throws(evaluate.fn('Math.random()'));
  t.throws(evaluate.fn('Array.prototype.slice.call([])'));

  // should not allow top-level identifiers outside allowed list
  t.throws(evaluate.fn('Math'));
  t.throws(evaluate.fn('Array'));
  t.throws(evaluate.fn('String'));
  t.throws(evaluate.fn('Object'));
  t.throws(evaluate.fn('XMLHttpRequest'));
  t.throws(evaluate.fn('a'));
  t.throws(evaluate.fn('datum[Math]'));

  // should allow nested identifiers outside allowed list
  t.doesNotThrow(evaluate.fn('datum.eval'));
  t.doesNotThrow(evaluate.fn('datum.Math'));
  t.doesNotThrow(evaluate.fn('datum.a.eval'));
  t.doesNotThrow(evaluate.fn('{eval:0, Math:1}'));

  // should not allow eval
  t.throws(evaluate.fn('eval'));
  t.throws(evaluate.fn('eval()'));
  t.throws(evaluate.fn('eval("1+2")'));

  // should not allow Function constructor
  t.throws(evaluate.fn('Function("1+2")'));

  // should not allow debugger invocation
  t.throws(evaluate.fn('debugger'));

  // should not allow this reference
  t.throws(evaluate.fn('this'));

  // should not allow arguments reference
  t.throws(evaluate.fn('arguments'));

  // should not allow global variable reference
  t.throws(evaluate.fn('window'));
  t.throws(evaluate.fn('document'));
  t.throws(evaluate.fn('self'));
  t.throws(evaluate.fn('global'));

  t.end();
});
