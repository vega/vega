var dl = require('datalib'),
    expect = require('chai').expect,
    events = require('./');

describe('Event Selector', function() {
  var eventTypes = ["mousedown", "mouseup", "click", "dblclick", "wheel", "mousewheel",
    "mousemove", "mouseout", "mouseover", "mouseenter",
    "touchstart", "touchmove", "touchend",
    "keydown", "keypress", "keyup"],
    rand = dl.random.integer(0, eventTypes.length);

  function parse(text) { return events.parse(text); }

  parse.fn = function(text) {
    return function() { return events.parse(text); };
  };

  it('should parse DOM event types', function() {
    eventTypes.forEach(function(t) {
      expect(parse(t)).to.deep.equal([{ event: t }]);
    });
  });

  describe('Element Selector', function() {
    var evt;
    function e() { return ":"+(evt = eventTypes[rand()]); }

    it('should parse names', function() {
      function n(event, name) { return [{ event: event, name: name }]; }

      expect(parse("@cells"+e())).to.deep.equal(n(evt, "cells"));
      expect(parse("@interactor_mark"+e())).to.deep.equal(n(evt, "interactor_mark"));
      expect(parse("@rect1"+e())).to.deep.equal(n(evt, "rect1"));
      expect(parse("@myM4rk"+e())).to.deep.equal(n(evt, "myM4rk"));
      expect(parse("@symbol_mark"+e())).to.deep.equal(n(evt, "symbol_mark"));
      expect(parse("@symbol-mark"+e())).to.deep.equal(n(evt, "symbol-mark"));

      expect(parse.fn("@justaname")).to.throw();
      expect(parse.fn("@myM4rk:")).to.throw();
      expect(parse.fn("@named_mark:signalName")).to.throw();
      expect(parse.fn("@symbol-mark:foo:"+e())).to.throw();
      expect(parse.fn("@symbol-mark, "+e())).to.throw();
      expect(parse.fn("@(symbol-mark):"+e())).to.throw();
      expect(parse.fn("(@symbol-mark):"+e())).to.throw();
      expect(parse.fn("(@symbol-mark:)"+e())).to.throw();
      expect(parse.fn("@[symbol-mark]:"+e())).to.throw();
      expect(parse.fn("[@symbol-mark]:"+e())).to.throw();
      expect(parse.fn("[@symbol-mark:]"+e())).to.throw();
    });

    it('should parse mark types', function() {
      var markTypes = ["rect", "symbol", "path", "arc", "area",
        "line", "rule", "image", "text", "group"];

      function m(event, mark) { return [{ event: event, mark: mark }]; }

      markTypes.forEach(function(t) {
        expect(parse(t+""+e())).to.deep.equal(m(evt, t));
      });

      expect(parse("rect")).to.not.have.property("name");
      expect(parse.fn("symbol:")).to.throw();
      expect(parse.fn("path:signalName")).to.throw();
      expect(parse.fn("text:foo:"+e())).to.throw();
      expect(parse.fn("(group):"+e())).to.throw();
      expect(parse.fn("(rule:)"+e())).to.throw();
      // expect(parse.fn("[image]:"+e())).to.throw(); // Matches CSS selector rule
      expect(parse.fn("[arc:]"+e())).to.throw();
      expect(parse.fn("(rect,group):"+e())).to.throw();
    });

    it('should parse external targets', function() {
      function t(event, target) { return [{ event: evt, target: target }]; }

      expect(parse("body"+e())).to.deep.equal(t(e, "body"));
      expect(parse(".class"+e())).to.deep.equal(t(e, ".class"));
      expect(parse("#id"+e())).to.deep.equal(t(e, "#id"));

      expect(parse("#ancestor .descendents"+e())).to.deep.equal(t(evt, "#ancestor .descendents"));
      expect(parse(".ancestors #descendent"+e())).to.deep.equal(t(evt, ".ancestors #descendent"));
      expect(parse(".ancestors .descendents"+e())).to.deep.equal(t(evt, ".ancestors .descendents"));
      expect(parse("#ancestor #descendent"+e())).to.deep.equal(t(evt, "#ancestor #descendent"));

      expect(parse("parent > child"+e())).to.deep.equal(t(evt, "parent > child"));
      expect(parse("before+after"+e())).to.deep.equal(t(evt, "before+after"));
      expect(parse("before~after"+e())).to.deep.equal(t(evt, "before~after"));

      expect(parse("div[class=foo]"+e())).to.deep.equal(t(evt, "div[class=foo]"));
      expect(parse("div[class~=foo]"+e())).to.deep.equal(t(evt, "div[class~=foo]"));
      expect(parse("div[class|=foo]"+e())).to.deep.equal(t(evt, "div[class|=foo]"));
      expect(parse("div[class~=foo]"+e())).to.deep.equal(t(evt, "div[class~=foo]"));
      expect(parse("div[class^=foo]"+e())).to.deep.equal(t(evt, "div[class^=foo]"));
      expect(parse("div[class$=foo]"+e())).to.deep.equal(t(evt, "div[class$=foo]"));
      expect(parse("div[class*=foo]"+e())).to.deep.equal(t(evt, "div[class*=foo]"));

      // Parser doesn't enforce valid CSS selectors, but event selector syntax takes
      // precedence over css selector syntax.
      expect(parse.fn("a:active:mouseover")).to.throw();
      expect(parse.fn("(a:active):mouseover")).to.throw();
      expect(parse("div, a:click")).to.not.equal(t("click", "div, a"));
      expect(parse.fn("(div, a):click")).to.throw();
    });
  });

  // Signals are just names that aren't eventTypes, or have the
  // : event pseudo-selector
  it('should parse signals', function() {
    function s(name) { return [{ signal: name }]; }

    expect(parse("brush_start")).to.deep.equal(s("brush_start"));
    expect(parse("brush-end")).to.deep.equal(s("brush-end"));
    expect(parse("date1")).to.deep.equal(s("date1"));
    expect(parse("0date")).to.deep.equal(s("0date"));
    expect(parse("Napoleon")).to.deep.equal(s("Napoleon"));
    expect(parse("rect")).to.deep.equal(s("rect"));

    expect(parse("mousedown")).to.not.deep.equal(s("mousedown"));
    expect(parse("brush_start:mouseover")).to.not.deep.equal(s("brush_start:mouseover"));
  });

  // Validity of filter expressions are determined by parseExpr. Here we just verify the
  // expressiveness of the event selector parser (i.e. all filter predicates can be expressed)
  it('should parse filters', function() {
    function f(filters) { return [{ event: "mousedown", filters: dl.array(filters) }]; }

    // Comparison operators
    expect(parse("mousedown[event.pageX > 5]")).to.deep.equal(f("event.pageX > 5"));
    expect(parse("mousedown[event.pageX >= 5]")).to.deep.equal(f("event.pageX >= 5"));
    expect(parse("mousedown[event.pageX < 5]")).to.deep.equal(f("event.pageX < 5"));
    expect(parse("mousedown[event.pageX <= 5]")).to.deep.equal(f("event.pageX <= 5"));
    expect(parse("mousedown[event.target.tagName == 'div']"))
      .to.deep.equal(f("event.target.tagName == 'div'"));
    expect(parse("mousedown[event.target.className != 'points']"))
      .to.deep.equal(f("event.target.className != 'points'"));

    // Boolean
    expect(parse("mousedown[event.shiftKey]")).to.deep.equal(f("event.shiftKey"));
    expect(parse("mousedown[!event.altKey]")).to.deep.equal(f("!event.altKey"));
    expect(parse("mousedown[~event.altKey]")).to.deep.equal(f("~event.altKey"));
    expect(parse("mousedown[event.shiftKey && event.altKey]"))
      .to.deep.equal(f("event.shiftKey && event.altKey"));
    expect(parse("mousedown[event.shiftKey || event.altKey]"))
      .to.deep.equal(f("event.shiftKey || event.altKey"));

    // Signals
    expect(parse("mousedown[dragging]")).to.deep.equal(f("dragging"));
    expect(parse("mousedown[!dragging]")).to.deep.equal(f("!dragging"));

    // Multiple filters
    expect(parse("mousedown[event.shiftKey][dragging]"))
      .to.deep.equal(f(["event.shiftKey", "dragging"]));

    // No event selectors within a filter
    expect(parse.fn("mousedown[div:mousemove]")).to.throw();
    expect(parse.fn("mousedown[(dragging, brush_start)]")).to.throw();
    expect(parse.fn("mousedown[mouseup[event.pageX > 5]]")).to.throw();
    expect(parse.fn("mousedown[event.pageX > 0")).to.throw();
  });

  it('should parse ordered streams', function() {
    var sel = "[div:mousedown, @name:mouseup] > .class:mousemove";
    expect(parse(sel)).to.have.deep.property("[0].start.event", "mousedown");
    expect(parse(sel)).to.have.deep.property("[0].end.event", "mouseup");
    expect(parse(sel)).to.have.deep.property("[0].middle.event", "mousemove");

    // Right associativity
    sel = "[mousedown, mouseup] > [keydown, keyup] > touchstart";
    expect(parse(sel)).to.have.deep.property("[0].start.event", "mousedown");
    expect(parse(sel)).to.have.deep.property("[0].end.event", "mouseup");
    expect(parse(sel)).to.have.deep.property("[0].middle.start.event", "keydown");
    expect(parse(sel)).to.have.deep.property("[0].middle.end.event", "keyup");
    expect(parse(sel)).to.have.deep.property("[0].middle.middle.event", "touchstart");

    // Filters
    sel = "[mousedown[event.pageX > 5], @name:mouseup[event.shiftKey]] > .class:mousemove[event.altKey]";
    expect(parse(sel)).to.have.deep.property("[0].start.event", "mousedown");
    expect(parse(sel)).to.have.deep.property("[0].start.filters[0]", "event.pageX > 5");
    expect(parse(sel)).to.have.deep.property("[0].end.event", "mouseup");
    expect(parse(sel)).to.have.deep.property("[0].end.filters[0]", "event.shiftKey");
    expect(parse(sel)).to.have.deep.property("[0].middle.event", "mousemove");
    expect(parse(sel)).to.have.deep.property("[0].middle.filters[0]", "event.altKey");

    // Nested
    sel = "[[keydown, keyup] > keypress, mouseup] > mousemove"; // Requires explicit associativity
    expect(parse.fn(sel)).to.throw();
    sel = "[([keydown, keyup] > keypress), mouseup] > mousemove";
    expect(parse.fn(sel)).to.not.throw();
  });

  it('should parse merged streams', function() {
    var sel = "@name:mousedown, div:mouseup, rect:mousemove";
    expect(parse(sel)).to.have.deep.property("[0].event", "mousedown");
    expect(parse(sel)).to.have.deep.property("[1].event", "mouseup");
    expect(parse(sel)).to.have.deep.property("[2].event", "mousemove");

    sel = "(@name:mousedown, div:mouseup), rect:mousemove";
    expect(parse(sel)).to.have.deep.property("[0].stream[0].event", "mousedown");
    expect(parse(sel)).to.have.deep.property("[0].stream[1].event", "mouseup");
    expect(parse(sel)).to.have.deep.property("[1].event", "mousemove");

    sel = "@name:mousedown, (div:mouseup, rect:mousemove)";
    expect(parse(sel)).to.have.deep.property("[0].event", "mousedown");
    expect(parse(sel)).to.have.deep.property("[1].stream[0].event", "mouseup");
    expect(parse(sel)).to.have.deep.property("[1].stream[1].event", "mousemove");

    sel = "[(mousedown, mouseup), (keydown, keyup)] > (touchstart, touchend), mousemove";
    expect(parse(sel)).to.have.deep.property("[0].start.stream[0].event", "mousedown");
    expect(parse(sel)).to.have.deep.property("[0].start.stream[1].event", "mouseup");
    expect(parse(sel)).to.have.deep.property("[0].end.stream[0].event", "keydown");
    expect(parse(sel)).to.have.deep.property("[0].end.stream[1].event", "keyup");
    expect(parse(sel)).to.have.deep.property("[0].middle.stream[0].event", "touchstart");
    expect(parse(sel)).to.have.deep.property("[0].middle.stream[1].event", "touchend");
    expect(parse(sel)).to.have.deep.property("[1].event", "mousemove");

    expect(parse.fn("@name:mousedown, (div:mouseup, rect:mousemove")).to.throw();
    expect(parse.fn("@name:mousedown, (div:mouseup), rect:mousemove)")).to.throw();
    expect(parse.fn("@name:mousedown, (div:mouseup), rect:mousemove))")).to.throw();
    expect(parse.fn("@name:mousedown, ((div:mouseup), rect:mousemove)")).to.not.throw();
  });

});