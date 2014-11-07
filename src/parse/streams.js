define(function(require, exports, module) {
  var d3 = require('d3'),
      vg = require('vega'),
      changset = require('../core/changeset'),
      selector = require('./events'),
      expr = require('./expr');

  var START = "start", MIDDLE = "middle", END = "end";

  return function(view) {
    var model = view.model(),
        spec  = model._defs.signals,
        register = {};

    function event(signal, selector, exp) {
      register[selector.event] = register[selector.event] || [];
      register[selector.event].push({
        signal: signal,
        exp: exp
      });
    };

    function orderedStream(signal, selector, exp) {
      var name = signal.name(), 
          trueFn = expr(model, "true"),
          s = {};

      s[START]  = model.signal(name + START,  false);
      s[MIDDLE] = model.signal(name + MIDDLE, false);
      s[END]    = model.signal(name + END,    false);

      var router = new model.Node(function(input) {
        if(s[START].value() === true && s[END].value() === false) {
          // TODO: Expand selector syntax to allow start/end signals into stream.
          // Until then, prevent old middles entering stream on new start.
          if(input.signals[name+START]) return model.graph.doNotPropagate;

          signal.value(s[MIDDLE].value());
          input.signals[name] = 1;
          return input;
        }

        if(s[END].value() === true) {
          s[START].value(false);
          s[END].value(false);
        }

        return model.graph.doNotPropagate;
      });
      router.addListener(signal.node());

      [START, MIDDLE, END].forEach(function(x) {
        var val = x == MIDDLE ? exp : trueFn
        if(selector[x].event) event(s[x], selector[x], val);
        else if(selector[x].stream) mergedStream(s[x], selector[x], val);
        s[x].addListener(router);
      });
    };

    function mergedStream(signal, selector, exp) {
      selector.forEach(function(s) {
        if(s.event)       event(signal, s, exp);
        else if(s.start)  orderedStream(signal, s, exp);
        else if(s.stream) mergedStream(signal, s.stream, exp);
      });
    };

    (spec || []).forEach(function(sig) {
      var signal = model.signal(sig.name);
      if(sig.expr) return;  // Cannot have an expr and stream definition.

      (sig.streams || []).forEach(function(stream) {
        var sel = selector.parse(stream.type),
            exp = expr(model, stream.expr);
        mergedStream(signal, sel, exp);
      });
    });

    // We register the event listeners all together so that if multiple
    // signals are registered on the same event, they will receive the
    // new value on the same pulse. 

    // TODO: Filters, time intervals, target selectors
    vg.keys(register).forEach(function(r) {
      var h = register[r];
      view.on(r, function(evt, item) {
        var cs = changset.create({}, true),
            n = new model.Node(null, h.map(function(h) { return h.signal.node() })),
            val, i, m, p = {};

        // Stash event in d3.event so we can calculate relative positions
        d3.event = evt, m = d3.mouse(view._el), p.x = m[0], p.y = m[1];
        item = item||{};

        for(i = 0; i < h.length; i++) {
          val = expr.eval(model, h[i].exp.fn, item.datum||{}, evt, item, p||{}, h[i].exp.signals); 
          h[i].signal.value(val);
          cs.signals[h[i].signal.name()] = 1;
        }

        model.graph.propagate(cs, n);
      });
    })
  };
})