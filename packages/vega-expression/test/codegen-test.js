var vega = require('../');

function regexEqual(x, y) {
  return (x instanceof RegExp) && (y instanceof RegExp) &&
    (x.source === y.source) && (x.global === y.global) &&
    (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
}

test('Evaluate expressions without white or black list', function() {
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
  expect(evaluate('global._val_+1')).toBe(6);
  expect(evaluate('global["'+unicode+'"]')).toBe(3.14);
  delete global._val_;
  delete global[unicode];

  // should return string input to codegen
  var value = codegen('d');
  expect(value.code).toBe('d');

  // should not allow unknown ast node type
  expect(function() { codegen({}); }).toThrow();
  expect(function() { codegen({type: 'foo'}); }).toThrow();
});

test('Evaluate expressions with black list', function() {
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
  expect(evaluate.fn('a')).toThrow();
  expect(evaluate.fn('b')).toThrow();
  expect(evaluate.fn('c')).toThrow();

  // should allow non-blacklisted ids
  expect(evaluate.fn('d')).not.toThrow();
  expect(evaluate.fn('global')).not.toThrow();
  expect(evaluate.fn('this')).not.toThrow();
});

test('Evaluate expressions with white list', function() {
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
  expect(evaluate('1')).toBe(1);
  expect(evaluate('0xFF')).toBe(255);
  expect(evaluate('1+1')).toBe(2);
  expect(evaluate('1 + 1')).toBe(2);
  expect(evaluate('1+(2+3)')).toBe(6);
  expect(evaluate('3 * (2+1)')).toBe(9);

  // should not allow octal literals
  expect(evaluate.fn('001')).toThrow();

  // should eval simple string expressions
  expect(evaluate('"a"')).toBe('a');
  expect(evaluate('"\t"')).toBe('\t');
  expect(evaluate('"\u00A9"')).toBe('\u00A9');
  expect(evaluate('"a" + "b"')).toBe('ab');

  // should eval simple boolean expressions
  expect(evaluate('true')).toBe(true);
  expect(evaluate('true && false')).toBe(false);
  expect(evaluate('true || false')).toBe(true);

  // should eval simple combined expressions
  expect(evaluate('(2>3) ? 1 : 2')).toBe(2);
  expect(evaluate('1 + "ab".length')).toBe(3);

  // should eval simple regular expressions
  expect(regexEqual(/pattern/, evaluate('/pattern/'))).toBe(true);
  expect(regexEqual(/[0-9]+/, evaluate('/[0-9]+/'))).toBe(true);
  expect(regexEqual(/[0-9]+/, evaluate('/[1-9]+/'))).toBe(false);
  expect(regexEqual(/[a-z]/gi, evaluate('/[a-z]/gi'))).toBe(true);

  expect(regexEqual(/pattern/, evaluate('regexp("pattern")'))).toBe(true);
  expect(regexEqual(/[0-9]+/, evaluate('regexp("[0-9]+")'))).toBe(true);
  expect(regexEqual(/[0-9]+/, evaluate('regexp("[1-9]+")'))).toBe(false);
  expect(regexEqual(/[a-z]/gi, evaluate('regexp("[a-z]", "gi")'))).toBe(true);

  // should eval array expressions
  expect(evaluate('[]')).toEqual([]);
  expect(evaluate('[1,2,3]')).toEqual([1,2,3]);
  expect(evaluate('["a","b"]')).toEqual(['a','b']);

  // should eval unary expressions
  expect(evaluate('-3')).toBe(-3);
  expect(evaluate('+"4"')).toBe(4);
  expect(evaluate('~~5.2')).toBe(5);
  expect(evaluate('!1')).toBe(false);

  // should not allow unary update expressions
  expect(evaluate.fn('++1')).toThrow();
  expect(evaluate.fn('1++')).toThrow();

  // should eval constant values
  expect(evaluate('null')).toBe(null);
  expect(evaluate('E')).toBe(Math.E);
  expect(evaluate('PI')).toBe(Math.PI);
  expect(evaluate('SQRT2')).toBe(Math.SQRT2);

  // Evaluation with arguments
  // should handle data argument
  expect(evaluate('datum.a')).toBe(2);
  expect(evaluate('datum["a"]')).toBe(2);

  // should handle event argument
  expect(evaluate('event.type')).toBe('mousemove');

  // should handle unicode
  expect(evaluate('datum.föö')).toBe(5);

  // Function evaluation
  // should eval math functions', function() {
  expect(evaluate('isNaN(1/0)')).toBe(isNaN(1/0));
  expect(evaluate('isFinite(1)')).toBe(isFinite(1));
  expect(evaluate('isFinite(1/0)')).toBe(isFinite(1/0));
  expect(evaluate('abs(-3)')).toBe(Math.abs(-3));
  expect(evaluate('acos(1)')).toBe(Math.acos(1));
  expect(evaluate('asin(1)')).toBe(Math.asin(1));
  expect(evaluate('atan(1)')).toBe(Math.atan(1));
  expect(evaluate('atan2(1,2)')).toBe(Math.atan2(1,2));
  expect(evaluate('ceil(0.5)')).toBe(Math.ceil(0.5));
  expect(evaluate('cos(1)')).toBe(Math.cos(1));
  expect(evaluate('exp(1)')).toBe(Math.exp(1));
  expect(evaluate('floor(0.5)')).toBe(Math.floor(0.5));
  expect(evaluate('log(2)')).toBe(Math.log(2));
  expect(evaluate('max(0,1)')).toBe(Math.max(0,1));
  expect(evaluate('min(0,1)')).toBe(Math.min(0,1));
  expect(evaluate('pow(2,3)')).toBe(Math.pow(2,3));
  expect(evaluate('round(0.5)')).toBe(Math.round(0.5));
  expect(evaluate('sin(1)')).toBe(Math.sin(1));
  expect(evaluate('sqrt(2)')).toBe(Math.sqrt(2));
  expect(evaluate('tan(1)')).toBe(Math.tan(1));
  for (var i=0; i<5; ++i) {
    var r = evaluate('random()');
    expect(r >= 0 && r <= 1).toBe(true);
  }

  // should eval clamp function
  expect(evaluate('clamp(5, 0, 10)')).toBe(5);
  expect(evaluate('clamp(-1, 0, 10)')).toBe(0);
  expect(evaluate('clamp(11, 0, 10)')).toBe(10);
  expect(evaluate.fn('clamp(0,1)')).toThrow();
  expect(evaluate.fn('clamp(0,1,2,3)')).toThrow();

  // should eval string functions
  expect(evaluate('length("123")')).toBe('123'.length);
  expect(evaluate('upper("abc")')).toBe('abc'.toUpperCase());
  expect(evaluate('lower("abc")')).toBe('abc'.toLowerCase());
  expect(evaluate('slice("123",1)')).toBe('123'.slice(1));
  expect(evaluate('slice("123",-1)')).toBe('123'.slice(-1));
  expect(evaluate('slice("123",0,1)')).toBe('123'.slice(0,1));
  expect(evaluate('split("1 2 3"," ")')).toEqual('1 2 3'.split(' '));
  expect(evaluate('substring("123",0,1)')).toBe('123'.substring(0,1));
  expect(evaluate('parseFloat("3.14")')).toBe(parseFloat('3.14'));
  expect(evaluate('parseInt("42")')).toBe(parseInt('42'));
  expect(evaluate('indexof("hello world", "l")')).toBe(2);
  expect(evaluate('lastindexof("hello world", "l")')).toBe(9);
  expect(evaluate('replace("hello world", /hello/, "goodbye")')).toBe('goodbye world');

  // should eval regular expression functions
  expect(evaluate('test(/ain/, "spain")')).toBe(/ain/.test('spain'));
  expect(evaluate('test(/ain/, "france")')).toBe(/ain/.test('france'));

  // should eval datetime functions
  var d = new Date(2001,1,1),
      u = Date.UTC(2009, 9, 1, 10);

  expect(Math.abs(Date.now() - evaluate('now()')) <= 5).toBe(true);
  expect(evaluate('+datetime(2001,1,1)')).toBe(+d);
  expect(evaluate('time(datetime(2001,1,1))')).toBe(+d);
  expect(evaluate('timezoneoffset(datetime(2001,1,1))')).toBe(d.getTimezoneOffset());

  expect(evaluate('day(datetime(2001,1,1))')).toBe(d.getDay());
  expect(evaluate('year(datetime(2001,1,1))')).toBe(d.getFullYear());
  expect(evaluate('month(datetime(2001,1,1))')).toBe(d.getMonth());
  expect(evaluate('hours(datetime(2001,1,1))')).toBe(d.getHours());
  expect(evaluate('minutes(datetime(2001,1,1))')).toBe(d.getMinutes());
  expect(evaluate('seconds(datetime(2001,1,1))')).toBe(d.getSeconds());
  expect(evaluate('milliseconds(datetime(2001,1,1))')).toBe(d.getMilliseconds());

  expect(evaluate('utcday(datetime(2001,1,1))')).toBe(d.getUTCDay());
  expect(evaluate('utcyear(datetime(2001,1,1))')).toBe(d.getUTCFullYear());
  expect(evaluate('utcmonth(datetime(2001,1,1))')).toBe(d.getUTCMonth());
  expect(evaluate('utchours(datetime(2001,1,1))')).toBe(d.getUTCHours());
  expect(evaluate('utcminutes(datetime(2001,1,1))')).toBe(d.getUTCMinutes());
  expect(evaluate('utcseconds(datetime(2001,1,1))')).toBe(d.getUTCSeconds());
  expect(evaluate('utcmilliseconds(datetime(2001,1,1))')).toBe(d.getUTCMilliseconds());

  for (var date=1; date<=7; ++date) {
    d = new Date(2001, 1, date);
    expect(evaluate('date(datetime(2001,1,'+date+'))')).toBe(d.getDate());
    expect(evaluate('utcdate(datetime(2001,1,'+date+'))')).toBe(d.getUTCDate());
  }

  expect(evaluate('utc(2009,9,1,10)')).toBe(u);
  expect(evaluate('utchours(utc(2009,9,1,10))')).toBe(new Date(u).getUTCHours());

  // should evaluate if statements
  expect(evaluate('if(datum.a > 1, 1, 2)')).toBe(1);
  expect(evaluate('if(event.type === "mousedown", 1, 2)')).toBe(2);
  expect(evaluate('if(datum.a > 1, if(event.type === "mousedown", 3, 4), 2)')).toBe(4);
  expect(evaluate.fn('if(datum.a > 1, 1)')).toThrow();
  expect(evaluate.fn('if(datum.a > 1, 1, 2, 3)')).toThrow();

  // "if" should be isolated from surrounding expression
  expect(evaluate('0 * if(datum.a > 1, 1, 2)')).toBe(0);

  // should not eval undefined functions
  expect(evaluate.fn('Array()')).toThrow();
  expect(evaluate.fn('Function()')).toThrow();
  expect(evaluate.fn('Object()')).toThrow();
  expect(evaluate.fn('String()')).toThrow();

  // Validation checks
  // should not allow nested function calls
  expect(evaluate.fn('d.hasOwnProperty("a")')).toThrow();
  expect(evaluate.fn('Math.random()')).toThrow();
  expect(evaluate.fn('Array.prototype.slice.call([])')).toThrow();

  // should not allow top-level identifiers outside whitelist
  expect(evaluate.fn('Math')).toThrow();
  expect(evaluate.fn('Array')).toThrow();
  expect(evaluate.fn('String')).toThrow();
  expect(evaluate.fn('Object')).toThrow();
  expect(evaluate.fn('XMLHttpRequest')).toThrow();
  expect(evaluate.fn('a')).toThrow();
  expect(evaluate.fn('datum[Math]')).toThrow();

  // should allow nested identifiers outside whitelist
  expect(evaluate.fn('datum.eval')).not.toThrow();
  expect(evaluate.fn('datum.Math')).not.toThrow();
  expect(evaluate.fn('datum.a.eval')).not.toThrow();
  expect(evaluate.fn('{eval:0, Math:1}')).not.toThrow();

  // should not allow eval
  expect(evaluate.fn('eval')).toThrow();
  expect(evaluate.fn('eval()')).toThrow();
  expect(evaluate.fn('eval("1+2")')).toThrow();

  // should not allow Function constructor
  expect(evaluate.fn('Function("1+2")')).toThrow();

  // should not allow debugger invocation
  expect(evaluate.fn('debugger')).toThrow();

  // should not allow this reference
  expect(evaluate.fn('this')).toThrow();

  // should not allow arguments reference
  expect(evaluate.fn('arguments')).toThrow();

  // should not allow global variable reference
  expect(evaluate.fn('window')).toThrow();
  expect(evaluate.fn('document')).toThrow();
  expect(evaluate.fn('self')).toThrow();
  expect(evaluate.fn('global')).toThrow();
});
