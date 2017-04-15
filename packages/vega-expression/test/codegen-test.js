var tape = require('tape'),
    vega = require('../');

function regexEqual(x, y) {
  return (x instanceof RegExp) && (y instanceof RegExp) &&
    (x.source === y.source) && (x.global === y.global) &&
    (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
}

tape('Evaluate expressions without white or black list', function(test) {
  var codegen = vega.codegen({
    globalvar: 'global'
  });

  function evaluate(str) {
    var value = codegen(vega.parse(str));
    var fn = Function('"use strict"; return (' + value.code + ')');
    return fn();
  }

  evaluate.fn = function(str) {
    return function() { return evaluate(str); }
  };

  // should access globals object
  var unicode = 'd\u00A9';
  global._val_ = 5;
  global[unicode] = 3.14;
  test.equal(evaluate('global._val_+1'), 6);
  test.equal(evaluate('global["'+unicode+'"]'),3.14);
  delete global._val_;
  delete global[unicode];

  // should return string input to codegen
  var value = codegen('d');
  test.equal(value.code, 'd');

  // should not allow unknown ast node type
  test.throws(function() { codegen({}); });
  test.throws(function() { codegen({type: 'foo'}); });

  test.end();
});

tape('Evaluate expressions with black list', function(test) {
  var codegen = vega.codegen({
    blacklist: ['a', 'b', 'c'],
    globalvar: 'global',
    fieldvar:  'd'
  });

  function evaluate(str) {
    var d = {a: 2, föö: 5};
    var value = codegen(vega.parse(str));
    var fn = Function('d', '"use strict";return(' + value.code + ')');
    return fn(d);
  }

  evaluate.fn = function(str) {
    return function() { return evaluate(str); }
  };

  // should not allow blacklisted ids
  test.throws(evaluate.fn('a'));
  test.throws(evaluate.fn('b'));
  test.throws(evaluate.fn('c'));

  // should allow non-blacklisted ids
  test.doesNotThrow(evaluate.fn('d'));
  test.doesNotThrow(evaluate.fn('global'));
  test.doesNotThrow(evaluate.fn('this'));

  test.end();
});

tape('Evaluate expressions with white list', function(test) {
  var codegen = vega.codegen({
    whitelist: ['datum', 'event', 'signals'],
    globalvar: 'global'
  });

  function evaluate(str) {
    var datum = {a: 2, föö: 5};
    var evt = {type: 'mousemove'};
    var value = codegen(vega.parse(str));
    if (value.globals.length > 0) {
      throw Error('Found non-whitelisted global identifier.');
    }
    var fn = Function('datum', 'event', 'signals', 'return (' + value.code + ')');
    return fn(datum, evt);
  }

  evaluate.fn = function(str) {
    return function() { return evaluate(str); }
  };

  // Simple evaluation
  // should eval simple integer expressions
  test.equal(evaluate('1'), 1);
  test.equal(evaluate('0xFF'), 255);
  test.equal(evaluate('1+1'), 2);
  test.equal(evaluate('1 + 1'), 2);
  test.equal(evaluate('1+(2+3)'), 6);
  test.equal(evaluate('3 * (2+1)'), 9);

  // should not allow octal literals
  test.throws(evaluate.fn('001'));

  // should eval simple string expressions
  test.equal(evaluate('"a"'), 'a');
  test.equal(evaluate('"\t"'), '\t');
  test.equal(evaluate('"\u00A9"'), '\u00A9');
  test.equal(evaluate('"a" + "b"'), 'ab');

  // should eval simple boolean expressions
  test.equal(evaluate('true'), true);
  test.equal(evaluate('true && false'), false);
  test.equal(evaluate('true || false'), true);

  // should eval simple combined expressions
  test.equal(evaluate('(2>3) ? 1 : 2'), 2);
  test.equal(evaluate('1 + "ab".length'), 3);

  // should eval simple regular expressions
  test.equal(regexEqual(/pattern/, evaluate('/pattern/')), true);
  test.equal(regexEqual(/[0-9]+/, evaluate('/[0-9]+/')), true);
  test.equal(regexEqual(/[0-9]+/, evaluate('/[1-9]+/')), false);
  test.equal(regexEqual(/[a-z]/gi, evaluate('/[a-z]/gi')), true);

  test.equal(regexEqual(/pattern/, evaluate('regexp("pattern")')), true);
  test.equal(regexEqual(/[0-9]+/, evaluate('regexp("[0-9]+")')), true);
  test.equal(regexEqual(/[0-9]+/, evaluate('regexp("[1-9]+")')), false);
  test.equal(regexEqual(/[a-z]/gi, evaluate('regexp("[a-z]", "gi")')), true);

  // should eval array expressions
  test.deepEqual(evaluate('[]'), []);
  test.deepEqual(evaluate('[1,2,3]'), [1,2,3]);
  test.deepEqual(evaluate('["a","b"]'), ['a','b']);

  // should eval unary expressions
  test.equal(evaluate('-3'), -3);
  test.equal(evaluate('+"4"'), 4);
  test.equal(evaluate('~~5.2'), 5);
  test.equal(evaluate('!1'), false);

  // should not allow unary update expressions
  test.throws(evaluate.fn('++1'));
  test.throws(evaluate.fn('1++'));

  // should eval constant values
  test.equal(evaluate('null'), null);
  test.equal(evaluate('E'), Math.E);
  test.equal(evaluate('PI'), Math.PI);
  test.equal(evaluate('SQRT2'), Math.SQRT2);

  // Evaluation with arguments
  // should handle data argument
  test.equal(evaluate('datum.a'), 2);
  test.equal(evaluate('datum["a"]'), 2);

  // should handle event argument
  test.equal(evaluate('event.type'), 'mousemove');

  // should handle unicode
  test.equal(evaluate('datum.föö'), 5);

  // Function evaluation
  // should eval math functions', function() {
  test.equal(evaluate('isNaN(1/0)'), isNaN(1/0));
  test.equal(evaluate('isFinite(1)'), isFinite(1));
  test.equal(evaluate('isFinite(1/0)'), isFinite(1/0));
  test.equal(evaluate('abs(-3)'), Math.abs(-3));
  test.equal(evaluate('acos(1)'), Math.acos(1));
  test.equal(evaluate('asin(1)'), Math.asin(1));
  test.equal(evaluate('atan(1)'), Math.atan(1));
  test.equal(evaluate('atan2(1,2)'), Math.atan2(1,2));
  test.equal(evaluate('ceil(0.5)'), Math.ceil(0.5));
  test.equal(evaluate('cos(1)'), Math.cos(1));
  test.equal(evaluate('exp(1)'), Math.exp(1));
  test.equal(evaluate('floor(0.5)'), Math.floor(0.5));
  test.equal(evaluate('log(2)'), Math.log(2));
  test.equal(evaluate('max(0,1)'), Math.max(0,1));
  test.equal(evaluate('min(0,1)'), Math.min(0,1));
  test.equal(evaluate('pow(2,3)'), Math.pow(2,3));
  test.equal(evaluate('round(0.5)'), Math.round(0.5));
  test.equal(evaluate('sin(1)'), Math.sin(1));
  test.equal(evaluate('sqrt(2)'), Math.sqrt(2));
  test.equal(evaluate('tan(1)'), Math.tan(1));
  for (var i=0; i<5; ++i) {
    var r = evaluate('random()');
    test.equal(r >= 0 && r <= 1, true);
  }

  // should eval clamp function
  test.equal(evaluate('clamp(5, 0, 10)'), 5);
  test.equal(evaluate('clamp(-1, 0, 10)'), 0);
  test.equal(evaluate('clamp(11, 0, 10)'), 10);
  test.throws(evaluate.fn('clamp(0,1)'));
  test.throws(evaluate.fn('clamp(0,1,2,3)'));

  // should eval string functions
  test.equal(evaluate('length("123")'), '123'.length);
  test.equal(evaluate('upper("abc")'), 'abc'.toUpperCase());
  test.equal(evaluate('lower("abc")'), 'abc'.toLowerCase());
  test.equal(evaluate('slice("123",1)'), '123'.slice(1));
  test.equal(evaluate('slice("123",-1)'), '123'.slice(-1));
  test.equal(evaluate('slice("123",0,1)'), '123'.slice(0,1));
  test.equal(evaluate('substring("123",0,1)'), '123'.substring(0,1));
  test.equal(evaluate('parseFloat("3.14")'), parseFloat('3.14'));
  test.equal(evaluate('parseInt("42")'),parseInt('42'));
  test.equal(evaluate('indexof("hello world", "l")'), 2);
  test.equal(evaluate('lastindexof("hello world", "l")'), 9);
  test.equal(evaluate('replace("hello world", /hello/, "goodbye")'), 'goodbye world');

  // should eval regular expression functions
  test.equal(evaluate('test(/ain/, "spain")'), /ain/.test('spain'));
  test.equal(evaluate('test(/ain/, "france")'), /ain/.test('france'));

  // should eval datetime functions
  var d = new Date(2001,1,1),
      u = Date.UTC(2009, 9, 1, 10);

  test.equal(Math.abs(Date.now() - evaluate('now()')) <= 5, true);
  test.equal(evaluate('+datetime(2001,1,1)'), +d);
  test.equal(evaluate('time(datetime(2001,1,1))'), +d);
  test.equal(evaluate('timezoneoffset(datetime(2001,1,1))'),d.getTimezoneOffset());

  test.equal(evaluate('day(datetime(2001,1,1))'), d.getDay());
  test.equal(evaluate('year(datetime(2001,1,1))'), d.getFullYear());
  test.equal(evaluate('month(datetime(2001,1,1))'), d.getMonth());
  test.equal(evaluate('hours(datetime(2001,1,1))'), d.getHours());
  test.equal(evaluate('minutes(datetime(2001,1,1))'), d.getMinutes());
  test.equal(evaluate('seconds(datetime(2001,1,1))'), d.getSeconds());
  test.equal(evaluate('milliseconds(datetime(2001,1,1))'), d.getMilliseconds());

  test.equal(evaluate('utcday(datetime(2001,1,1))'), d.getUTCDay());
  test.equal(evaluate('utcyear(datetime(2001,1,1))'), d.getUTCFullYear());
  test.equal(evaluate('utcmonth(datetime(2001,1,1))'), d.getUTCMonth());
  test.equal(evaluate('utchours(datetime(2001,1,1))'), d.getUTCHours());
  test.equal(evaluate('utcminutes(datetime(2001,1,1))'), d.getUTCMinutes());
  test.equal(evaluate('utcseconds(datetime(2001,1,1))'), d.getUTCSeconds());
  test.equal(evaluate('utcmilliseconds(datetime(2001,1,1))'), d.getUTCMilliseconds());

  for (var date=1; date<=7; ++date) {
    d = new Date(2001, 1, date);
    test.equal(evaluate('date(datetime(2001,1,'+date+'))'), d.getDate());
    test.equal(evaluate('utcdate(datetime(2001,1,'+date+'))'), d.getUTCDate());
  }

  test.equal(evaluate('utc(2009,9,1,10)'), u);
  test.equal(evaluate('utchours(utc(2009,9,1,10))'), new Date(u).getUTCHours());

  // should evaluate type checking functions
  test.equal(evaluate('isArray([])'), true);
  test.equal(evaluate('isArray({})'), false);
  test.equal(evaluate('isArray("a")'), false);
  test.equal(evaluate('isBoolean(true)'), true);
  test.equal(evaluate('isBoolean(false)'), true);
  test.equal(evaluate('isBoolean({})'), false);
  test.equal(evaluate('isBoolean("a")'), false);
  test.equal(evaluate('isBoolean(0)'), false);
  test.equal(evaluate('isNumber(0)'), true);
  test.equal(evaluate('isNumber(1e5)'), true);
  test.equal(evaluate('isNumber(null)'), false);
  test.equal(evaluate('isObject({})'), true);
  test.equal(evaluate('isObject([])'), true);
  test.equal(evaluate('isObject(null)'), true);
  test.equal(evaluate('isObject(0)'), false);
  test.equal(evaluate('isObject("a")'), false);
  test.equal(evaluate('isObject(true)'), false);
  test.equal(evaluate('isString("")'), true);
  test.equal(evaluate('isString("a")'), true);
  test.equal(evaluate('isString([])'), false);
  test.equal(evaluate('isString(0)'), false);
  test.equal(evaluate('isDate(datetime())'), true);
  test.equal(evaluate('isDate(now())'), false);
  test.equal(evaluate('isDate({})'), false);
  test.equal(evaluate('isDate([])'), false);
  test.equal(evaluate('isRegExp(regexp("grep+"))'), true);
  test.equal(evaluate('isRegExp(null)'), false);
  test.equal(evaluate('isRegExp("a")'), false);

  // should evaluate if statements
  test.equal(evaluate('if(datum.a > 1, 1, 2)'), 1);
  test.equal(evaluate('if(event.type === "mousedown", 1, 2)'), 2);
  test.equal(evaluate('if(datum.a > 1, if(event.type === "mousedown", 3, 4), 2)'), 4);
  test.throws(evaluate.fn('if(datum.a > 1, 1)'));
  test.throws(evaluate.fn('if(datum.a > 1, 1, 2, 3)'));

  // "if" should be isolated from surrounding expression
  test.equal(evaluate('0 * if(datum.a > 1, 1, 2)'), 0);

  // should not eval undefined functions
  test.throws(evaluate.fn('Array()'));
  test.throws(evaluate.fn('Function()'));
  test.throws(evaluate.fn('Object()'));
  test.throws(evaluate.fn('String()'));

  // Validation checks
  // should not allow nested function calls
  test.throws(evaluate.fn('d.hasOwnProperty("a")'));
  test.throws(evaluate.fn('Math.random()'));
  test.throws(evaluate.fn('Array.prototype.slice.call([])'));

  // should not allow top-level identifiers outside whitelist
  test.throws(evaluate.fn('Math'));
  test.throws(evaluate.fn('Array'));
  test.throws(evaluate.fn('String'));
  test.throws(evaluate.fn('Object'));
  test.throws(evaluate.fn('XMLHttpRequest'));
  test.throws(evaluate.fn('a'));
  test.throws(evaluate.fn('datum[Math]'));

  // should allow nested identifiers outside whitelist
  test.doesNotThrow(evaluate.fn('datum.eval'));
  test.doesNotThrow(evaluate.fn('datum.Math'));
  test.doesNotThrow(evaluate.fn('datum.a.eval'));
  test.doesNotThrow(evaluate.fn('{eval:0, Math:1}'));

  // should not allow eval
  test.throws(evaluate.fn('eval'));
  test.throws(evaluate.fn('eval()'));
  test.throws(evaluate.fn('eval("1+2")'));

  // should not allow Function constructor
  test.throws(evaluate.fn('Function("1+2")'));

  // should not allow debugger invocation
  test.throws(evaluate.fn('debugger'));

  // should not allow this reference
  test.throws(evaluate.fn('this'));

  // should not allow arguments reference
  test.throws(evaluate.fn('arguments'));

  // should not allow global variable reference
  test.throws(evaluate.fn('window'));
  test.throws(evaluate.fn('document'));
  test.throws(evaluate.fn('self'));
  test.throws(evaluate.fn('global'));

  test.end();
});
