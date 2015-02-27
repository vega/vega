var vows = require('vows'),
    assert = require('assert');

var suite = vows.describe('vg.parse.template');

suite.addBatch({
  'vg.parse.template': {
    topic: require('../index.js'),
    'template': {
      'should handle zero interpolants': function(vg) {
        var f = vg.parse.template("hello");
        assert.equal("hello", f({}));
      },
      'should handle a single interpolant': function(vg) {
        var f = vg.parse.template("{{a}}");
        assert.equal("hello", f({a: "hello"}));

        f = vg.parse.template("hello {{a}}");
        assert.equal("hello there", f({a: "there"}));

        f = vg.parse.template("{{a}} there");
        assert.equal("hello there", f({a: "hello"}));
      },
      'should handle nested property interpolants': function(vg) {
        var f = vg.parse.template("hello {{a.b}}");
        assert.equal("hello there", f({a: {b:"there"}}));
      },
      'should handle multiple interpolants': function(vg) {
        var f = vg.parse.template("hello {{a}} {{b}}");
        assert.equal("hello there friend", f({a: "there", b: "friend"}));
      },
      'should handle escape characters': function(vg) {
        var f = vg.parse.template("\"{{a}}\"");
        assert.equal("\"hello\"", f({a: "hello"}));

        f = vg.parse.template("'{{a}}'");
        assert.equal("'hello'", f({a: "hello"}));
      },
      'should handle lower filter': function(vg) {
        var f = vg.parse.template("hello {{a|lower}}");
        assert.equal("hello there", f({a: "THERE"}));
      },
      'should handle upper filter': function(vg) {
        var f = vg.parse.template("hello {{a|upper}}");
        assert.equal("hello THERE", f({a: "there"}));
      },
      'should handle trim filter': function(vg) {
        var f = vg.parse.template("hello {{a|trim}}");
        assert.equal("hello there", f({a: " there "}));
      },
      'should handle left filter': function(vg) {
        var f = vg.parse.template("hello {{a|left:5}}");
        assert.equal("hello there", f({a: "there---"}));
      },
      'should handle right filter': function(vg) {
        var f = vg.parse.template("hello {{a|right:5}}");
        assert.equal("hello there", f({a: "---there"}));
      },
      'should handle mid filter': function(vg) {
        var f = vg.parse.template("hello {{a|mid:3,5}}");
        assert.equal("hello there", f({a: "---there---"}));
      },
      'should handle slice filter': function(vg) {
        var f = vg.parse.template("hello {{a|slice:3}}");
        assert.equal("hello there", f({a: "---there"}));

        f = vg.parse.template("hello {{a|slice:-5}}");
        assert.equal("hello there", f({a: "---there"}));

        f = vg.parse.template("hello {{a|slice:3,8}}");
        assert.equal("hello there", f({a: "---there---"}));

        f = vg.parse.template("hello {{a|slice:3,-3}}");
        assert.equal("hello there", f({a: "---there---"}));
      },
      'should handle truncate filter': function(vg) {
        var f = vg.parse.template("{{a|truncate:5}}");
        assert.equal("hello", f({a: "hello"}));

        f = vg.parse.template("{{a|truncate:8}}");
        assert.equal("hello...", f({a: "hello there"}));

        f = vg.parse.template("{{a|truncate:8,left}}");
        assert.equal("...there", f({a: "hello there"}));

        f = vg.parse.template("hello {{a|truncate:5}}");
        assert.equal("hello 12...", f({a: 123456}));
      },
      'should handle number filter': function(vg) {
        var f = vg.parse.template("hello {{a|number:'.3f'}}");
        assert.equal("hello 1.000", f({a: 1}));
      },
      'should handle time filter': function(vg) {
        var f = vg.parse.template("the date: {{a|time:'%Y-%m-%d'}}");
        assert.equal("the date: 2011-01-01", f({a: new Date(2011, 0, 1)}));
      },
      'should handle multiple filters': function(vg) {
        var f = vg.parse.template("{{a|lower|slice:3,-3}}");
        assert.equal("hello", f({a:"---HeLlO---"}));

        f = vg.parse.template("{{a|lower|slice:3,-3|length|number:'.1f'}}");
        assert.equal("5.0", f({a:"---HeLlO---"}));
      },
      'should handle extraneous spaces': function(vg) {
        var f = vg.parse.template("{{ a }}");
        assert.equal("hello", f({a: "hello"}));

        f = vg.parse.template("{{a | lower }}");
        assert.equal("hello", f({a: "HELLO"}));
        
        f = vg.parse.template("{{a | lower | mid : 3, 5 }}");
        assert.equal("hello", f({a: "---HELLO---"}));
      }
    }
  }
});

suite.export(module);