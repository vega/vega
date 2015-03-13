var vows = require('vows'),
    assert = require('assert');

var suite = vows.describe('vg.expression');

function regexEqual(x, y) {
  return (x instanceof RegExp) && (y instanceof RegExp) && 
    (x.source === y.source) && (x.global === y.global) && 
    (x.ignoreCase === y.ignoreCase) && (x.multiline === y.multiline);
}


suite.addBatch({
  'vg.expression': {
    topic: require('../index.js'),
    'parse': {
      topic: function(vg) {
        return function(expr) {
          return function() { return vg.expression.parse(expr); };
        };
      },
      'should allow literal boolean expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("true"));
        assert.doesNotThrow(parsefn("false"));
      },
      'should allow literal number expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("3"));
        assert.doesNotThrow(parsefn("3.4"));
        assert.doesNotThrow(parsefn("3e5"));
      },
      'should allow literal string expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("'a'"));
        assert.doesNotThrow(parsefn('"b"'));
      },
      'should allow literal regular expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("/a/"));
        assert.doesNotThrow(parsefn("/[0-9]+/gi"));
      },
      'should allow literal array expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("[]"));
        assert.doesNotThrow(parsefn("[0,1,2]"));
        assert.doesNotThrow(parsefn("['a','b','c']"));
      },
      'should allow literal object expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("{}"));
        assert.doesNotThrow(parsefn("{a:1, b:'c'}"));
        assert.doesNotThrow(parsefn("{a:[0,1,2], b:[{a:1},{a:2}]}"));
      },
      'should allow unary expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("+'1'"));
        assert.doesNotThrow(parsefn("+1"));
        assert.doesNotThrow(parsefn("-1"));
        assert.doesNotThrow(parsefn("~1"));
        assert.doesNotThrow(parsefn("!1"));
      },
      'should allow binary expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("1+2"));
        assert.doesNotThrow(parsefn("1-2"));
        assert.doesNotThrow(parsefn("1*2"));
        assert.doesNotThrow(parsefn("1/2"));
        assert.doesNotThrow(parsefn("1%2"));
        assert.doesNotThrow(parsefn("1&2"));
        assert.doesNotThrow(parsefn("1|2"));
        assert.doesNotThrow(parsefn("1>>2"));
        assert.doesNotThrow(parsefn("1<<2"));
        assert.doesNotThrow(parsefn("1>>>2"));
        assert.doesNotThrow(parsefn("1^2"));
        assert.doesNotThrow(parsefn("'a'+'b'"));
      },
      'should allow logical expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("1 && 2"));
        assert.doesNotThrow(parsefn("1 || 2"));
      },
      'should allow comparison expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("1 < 2"));
        assert.doesNotThrow(parsefn("1 > 2"));
        assert.doesNotThrow(parsefn("1 <= 2"));
        assert.doesNotThrow(parsefn("1 >= 2"));
        assert.doesNotThrow(parsefn("1 == 2"));
        assert.doesNotThrow(parsefn("1 === 2"));
        assert.doesNotThrow(parsefn("1 != 2"));
        assert.doesNotThrow(parsefn("1 !== 2"));
      },
      'should allow ternary conditional expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("a ? b : c"));
        assert.doesNotThrow(parsefn("1 ? 2 : 3"));
      },
      'should allow identifier expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("a"));
        assert.doesNotThrow(parsefn("a3"));
        assert.doesNotThrow(parsefn("µ"));
        assert.doesNotThrow(parsefn("$f"));
        assert.doesNotThrow(parsefn("_"));
      },
      'should allow member expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("a[0]"));
        assert.doesNotThrow(parsefn("a.b"));
        assert.doesNotThrow(parsefn("a['b']"));
        assert.doesNotThrow(parsefn("a['two words']"));
      },
      'should allow call expressions': function(parsefn) {
        assert.doesNotThrow(parsefn("a()"));
        assert.doesNotThrow(parsefn("a(0,1,2)"));
        assert.doesNotThrow(parsefn("A()"));
        assert.doesNotThrow(parsefn("A(0,1,2)"));
        assert.doesNotThrow(parsefn("foo.bar(0,1,2)"));
      },
      'should not allow illegal identifier expressions': function(parsefn) {
        assert.throws(parsefn("3a"));
        assert.throws(parsefn("#e"));
        assert.throws(parsefn("@e"));
      },
      'should not allow illegal member expressions': function(parsefn) {
        assert.throws(parsefn("a.3"));
      },
      'should not allow single-line comments': function(parsefn) {
        assert.throws(parsefn("3 // comment"));
      },
      'should not allow multi-line comments': function(parsefn) {
        assert.throws(parsefn("/* comment */ 3"));
        assert.throws(parsefn("3 /* comment */"));
      },
      'should not allow empty statements': function(parsefn) {
        assert.throws(parsefn(""));
        assert.throws(parsefn(" "));
      },
      'should not allow debugger statements': function(parsefn) {
        assert.throws(parsefn("debugger"));
      },
      'should not allow continue statements': function(parsefn) {
        assert.throws(parsefn("continue"));
      },
      'should not allow break statements': function(parsefn) {
        assert.throws(parsefn("break"));
      },
      'should not allow reserved keywords': function(parsefn) {
        // future reserved words
        assert.throws(parsefn("class"));
        assert.throws(parsefn("enum"));
        assert.throws(parsefn("export"));
        assert.throws(parsefn("extends"));
        assert.throws(parsefn("import"));
        assert.throws(parsefn("super"));
        // strict mode reserved words
        assert.throws(parsefn("implements"));
        assert.throws(parsefn("interface"));
        assert.throws(parsefn("package"));
        assert.throws(parsefn("private"));
        assert.throws(parsefn("protected"));
        assert.throws(parsefn("public"));
        assert.throws(parsefn("static"));
        assert.throws(parsefn("yield"));
        assert.throws(parsefn("let"));
      },
      'should not allow object get/set expressions': function(parsefn) {
        assert.throws(parsefn("{get b() {}}"));
        assert.throws(parsefn("{set b(x) {}}"));
      },
      'should not allow assignment expressions': function(parsefn) {
        assert.throws(parsefn("index = 3"));
        assert.throws(parsefn("index += 3"));
        assert.throws(parsefn("index -= 3"));
        assert.throws(parsefn("index *= 3"));
        assert.throws(parsefn("index /= 3"));
        assert.throws(parsefn("index %= 3"));
        assert.throws(parsefn("index >>= 1"));
        assert.throws(parsefn("index <<= 1"));
        assert.throws(parsefn("index >>>= 1"));
        assert.throws(parsefn("index &= 1"));
        assert.throws(parsefn("index |= 1"));
        assert.throws(parsefn("index ^= 1"));
      },
      'should not allow postfix update expressions': function(parsefn) {
        assert.throws(parsefn("index++"));
        assert.throws(parsefn("index--"));
      },
      'should not allow prefix update expressions': function(parsefn) {
        assert.throws(parsefn("++index"));
        assert.throws(parsefn("--index"));
      },
      'should not allow sequence expressions': function(parsefn) {
        assert.throws(parsefn("(3, 4)"));
        assert.throws(parsefn("('a', 3+4)"));
      },
      'should not allow multiple statements': function(parsefn) {
        assert.throws(parsefn("3; 4"));
        assert.throws(parsefn("'a'; 3+4"));
      },
      'should not allow variable statements': function(parsefn) {
        assert.throws(parsefn("var x = 4"));
      },
      'should not allow return statements': function(parsefn) {
        assert.throws(parsefn("return 4"));
      },
      'should not allow function declarations': function(parsefn) {
        assert.throws(parsefn("function f() {}"));
        assert.throws(parsefn("function f() { 1 }"));
        assert.throws(parsefn("function f() { return 1; }"));
      },
      'should not allow function expressions': function(parsefn) {
        assert.throws(parsefn("function() {}"));
        assert.throws(parsefn("function() { 1 }"));
        assert.throws(parsefn("function() { return 1; }"));
      },
      'should not allow new statements': function(parsefn) {
        assert.throws(parsefn("new Date()"));
        assert.throws(parsefn("new Array(3)"));
      },
      'should not allow block statements': function(parsefn) {
        assert.throws(parsefn("{3+4}"));
        assert.throws(parsefn("{'a'}"));
      },
      'should not allow labeled statements': function(parsefn) {
        assert.throws(parsefn("label: 3"));
      },
      'should not allow with statements': function(parsefn) {
        assert.throws(parsefn("with({a:1,b:2}) { a }"));
      },
      'should not allow try/catch statements': function(parsefn) {
        assert.throws(parsefn("try { 3 } catch (err) { 4 }"));
        assert.throws(parsefn("try { undefined() } catch (err) { 4 }"));    
      },
      'should not allow if statements': function(parsefn) {
        assert.throws(parsefn("if (1<2) 4; else 5"));
        assert.throws(parsefn("if (2<1) 4; else 5"));
      },
      'should not allow switch statements': function(parsefn) {
        assert.throws(parsefn("switch('a') { default: 3; }"));
        assert.throws(parsefn("switch('a') { case 'a': 4; break; default: 3; }"));
      },
      'should not allow for statements': function(parsefn) {
        assert.throws(parsefn("for (; index>5; ) { index; }"));
      },
      'should not allow for-in statements': function(parsefn) {
        assert.throws(parsefn("for (i in self) { 3; }"));
      },
      'should not allow while statements': function(parsefn) {
        assert.throws(parsefn("while (1 < 2) { 3; }"));
        assert.throws(parsefn("while (1 > 2) { 3; }"));
      },
      'should not allow do-while statements': function(parsefn) {
        assert.throws(parsefn("do { 3 } while (1 < 2)"));
        assert.throws(parsefn("do { 3 } while (1 > 2)"));
      }
    },

    'evaluate': {
      topic: function(vg) {
        var parse = vg.expression.parse;
        var codegen = vg.expression.code({
          idWhiteList: ['d', 'index', 'data']
        });

        function evaluate(expr) {
          var index = 1;
          var data = [
            {a : 3, föö : 4},
            {a : 2, föö : 5}
          ];
          var code = codegen(parse(expr));
          var fn = Function("d", "index", "data",
            '"use strict"; return (' + code + ')');
          return fn(data[index], index, data);
        }
        evaluate.fn = function(expr) {
          return function() { return evaluate(expr); };
        };
        return evaluate;
      },

      // Simple evaluation
      'should eval simple integer expressions': function(evaluate) {
        assert.equal(2, evaluate('1+1'));
        assert.equal(2, evaluate('1 + 1'));
        assert.equal(6, evaluate('1+(2+3)'));
        assert.equal(9, evaluate('3 * (2+1)'));
      },
      'should eval simple string expressions': function(evaluate) {
        assert.equal("ab", evaluate('"a" + "b"'));
      },
      'should eval simple boolean expressions': function(evaluate) {
        assert.equal(true, evaluate('true'));
        assert.equal(false, evaluate('true && false'));
        assert.equal(true, evaluate('true || false'));
      },
      'should eval simple combined expressions': function(evaluate) {
        assert.equal(2, evaluate('(2>3) ? 1 : 2'));
        assert.equal(3, evaluate('1 + "ab".length'));
      },
      'should eval simple regular expressions': function(evaluate) {
        assert.isTrue(regexEqual(/pattern/, evaluate('/pattern/')));
        assert.isTrue(regexEqual(/[0-9]+/, evaluate('/[0-9]+/')));
        assert.isFalse(regexEqual(/[0-9]+/, evaluate('/[1-9]+/')));
        assert.isTrue(regexEqual(/[a-z]/gi, evaluate('/[a-z]/gi')));
      },

      // Evaluation with arguments
      'should handle data argument': function(evaluate) {
        assert.equal(2, evaluate('d.a'));
        assert.equal(2, evaluate('d["a"]'));
      },
      'should handle integer argument': function(evaluate) {
        assert.equal(1, evaluate('index'));
      },
      'should handle array argument': function(evaluate) {
        assert.equal(3, evaluate('data[0].a'));
        assert.equal(3, evaluate('data[0]["a"]'));
      },
      'should handle unicode': function(evaluate) {
        assert.equal(5, evaluate('d.föö'));
      },

      // Function evaluation
      'should eval math functions': function(evaluate) {
        assert.equal(isNaN(1/0), evaluate('isNaN(1/0)'));
        assert.equal(isFinite(1), evaluate('isFinite(1)'));
        assert.equal(isFinite(1/0), evaluate('isFinite(1/0)'));
        assert.equal(Math.abs(-3), evaluate('abs(-3)'));
        assert.equal(Math.acos(1), evaluate('acos(1)'));
        assert.equal(Math.asin(1), evaluate('asin(1)'));
        assert.equal(Math.atan(1), evaluate('atan(1)'));
        assert.equal(Math.atan2(1,2), evaluate('atan2(1,2)'));
        assert.equal(Math.ceil(0.5), evaluate('ceil(0.5)'));
        assert.equal(Math.cos(1), evaluate('cos(1)'));
        assert.equal(Math.exp(1), evaluate('exp(1)'));
        assert.equal(Math.floor(0.5), evaluate('floor(0.5)'));
        assert.equal(Math.log(2), evaluate('log(2)'));
        assert.equal(Math.max(0,1), evaluate('max(0,1)'));
        assert.equal(Math.min(0,1), evaluate('min(0,1)'));
        assert.equal(Math.pow(2,3), evaluate('pow(2,3)'));
        assert.equal(Math.round(0.5), evaluate('round(0.5)'));
        assert.equal(Math.sin(1), evaluate('sin(1)'));
        assert.equal(Math.sqrt(2), evaluate('sqrt(2)'));
        assert.equal(Math.tan(1), evaluate('tan(1)'));
        for (var i=0; i<5; ++i) {
          var r = evaluate('random()');
          assert.isTrue(r >= 0 && r <= 1);
        }
      },
      'should eval string functions': function(evaluate) {
        assert.equal("123".length, evaluate('length("123")'));
        assert.equal("abc".toUpperCase(), evaluate('upper("abc")'));
        assert.equal("abc".toLowerCase(), evaluate('lower("abc")'));
        assert.equal("123".slice(1), evaluate('slice("123",1)'));
        assert.equal("123".slice(-1), evaluate('slice("123",-1)'));
        assert.equal("123".slice(0,1), evaluate('slice("123",0,1)'));
        assert.equal("123".substring(0,1), evaluate('substring("123",0,1)'));
        assert.equal(parseFloat("3.14"), evaluate('parseFloat("3.14")'));
        assert.equal(parseInt("42"), evaluate('parseInt("42")'));
      },
      'should eval regular expression functions': function(evaluate) {
        assert.equal(/ain/.test("spain"), evaluate('test(/ain/, "spain")'));
        assert.equal(/ain/.test("france"), evaluate('test(/ain/, "france")'));
      },
      'should eval datetime functions': function(evaluate) {
        var d = new Date(2001,1,1);

        assert.isTrue(Math.abs(Date.now() - evaluate('now()')) <= 5);
        assert.equal(+d, evaluate('+datetime(2001,1,1)'));
        assert.equal(+d, evaluate('time(datetime(2001,1,1))'));
        assert.equal(d.getTimezoneOffset(), evaluate('timezoneoffset(datetime(2001,1,1))'));
        
        assert.equal(d.getFullYear(), evaluate('year(datetime(2001,1,1))'));
        assert.equal(d.getMonth(), evaluate('month(datetime(2001,1,1))'));
        assert.equal(d.getHours(), evaluate('hours(datetime(2001,1,1))'));
        assert.equal(d.getMinutes(), evaluate('minutes(datetime(2001,1,1))'));
        assert.equal(d.getSeconds(), evaluate('seconds(datetime(2001,1,1))'));  
        assert.equal(d.getMilliseconds(), evaluate('milliseconds(datetime(2001,1,1))'));
        
        assert.equal(d.getUTCFullYear(), evaluate('utcyear(datetime(2001,1,1))'));
        assert.equal(d.getUTCMonth(), evaluate('utcmonth(datetime(2001,1,1))'));
        assert.equal(d.getUTCHours(), evaluate('utchours(datetime(2001,1,1))'));
        assert.equal(d.getUTCMinutes(), evaluate('utcminutes(datetime(2001,1,1))'));
        assert.equal(d.getUTCSeconds(), evaluate('utcseconds(datetime(2001,1,1))'));  
        assert.equal(d.getUTCMilliseconds(), evaluate('utcmilliseconds(datetime(2001,1,1))'));
      
        for (var date=1; date<=7; ++date) {
          d = new Date(2001, 1, date);
          assert.equal(d.getDate(), evaluate('date(datetime(2001,1,'+date+'))'));
          assert.equal(d.getUTCDate(), evaluate('utcdate(datetime(2001,1,'+date+'))'));
        }
      },
      'should not eval undefined functions': function(evaluate) {
        assert.throws(evaluate.fn('Array()'));
        assert.throws(evaluate.fn('Function()'));
        assert.throws(evaluate.fn('Object()'));
        assert.throws(evaluate.fn('String()'));
      },

      // Validation checks
      'should not allow nested function calls': function(evaluate) {
        assert.throws(evaluate.fn('d.hasOwnProperty("a")'));
        assert.throws(evaluate.fn('Math.random()'));
        assert.throws(evaluate.fn('Array.prototype.slice.call([])'));
      },
      'should not allow top-level identifiers outside whitelist': function(evaluate) {
        assert.throws(evaluate.fn('Math'));
        assert.throws(evaluate.fn('Array'));
        assert.throws(evaluate.fn('String'));
        assert.throws(evaluate.fn('Object'));
        assert.throws(evaluate.fn('XMLHttpRequest'));
        assert.throws(evaluate.fn('a'));
        assert.throws(evaluate.fn('d[Math]'));
        assert.throws(evaluate.fn('sqrt(+Math)'));
      },
      'should allow nested identifiers outside whitelist': function(evaluate) {
        assert.doesNotThrow(evaluate.fn('d.eval'));
        assert.doesNotThrow(evaluate.fn('d.Math'));
        assert.doesNotThrow(evaluate.fn('d.a.eval'));
        assert.doesNotThrow(evaluate.fn('{eval:0, Math:1}'));
      },
      'should not allow eval': function(evaluate) {
        assert.throws(evaluate.fn('eval'));
        assert.throws(evaluate.fn('eval()'));
        assert.throws(evaluate.fn('eval("1+2")'));
      },
      'should not allow Function constructor': function(evaluate) {
        assert.throws(evaluate.fn('Function("1+2")'));
      },
      'should not allow debugger invocation': function(evaluate) {
        assert.throws(evaluate.fn('debugger'));
      },
      'should not allow this reference': function(evaluate) {
        assert.throws(evaluate.fn('this'));
      },
      'should not allow arguments reference': function(evaluate) {
        assert.throws(evaluate.fn('arguments'));
      },
      'should not allow global variable reference': function(evaluate) {
        assert.throws(evaluate.fn('window'));
        assert.throws(evaluate.fn('document'));
        assert.throws(evaluate.fn('self'));
        assert.throws(evaluate.fn('global'));
      }
    }
  }
});

suite.export(module);