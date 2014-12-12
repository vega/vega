define(function(require, exports, module) {
  var d3 = require('d3'),
      changset = require('../core/changeset'),
      selector = require('./events'),
      expr = require('./expr'),
      util = require('../util/index');

  var START = "start", MIDDLE = "middle", END = "end";

  return function(view) {
    var model = view.model(),
        spec  = model._defs.signals,
        register = {}, nodes = {};

    function signal(sig, selector, exp, spec) {
      var n = new model.Node(function(input) {
        var val = expr.eval(model, exp.fn, null, null, null, null, exp.signals);
        if(spec.scale) val = model.scene().scale(spec, val);
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.touch = true;
        return input;  
      });
      n._deps.signals = [selector.signal];
      n.addListener(sig.node());
      model.signal(selector.signal).addListener(n);
    };

    function event(sig, selector, exp, spec) {
      var filters = selector.filters || [],
          target = selector.target;

      if(target) filters.push("i."+target.type+"=="+util.str(target.value));

      register[selector.event] = register[selector.event] || [];
      register[selector.event].push({
        signal: sig,
        exp: exp,
        filters: filters.map(function(f) { return expr(model, f); }),
        spec: spec
      });

      nodes[selector.event] = nodes[selector.event] || new model.Node();
      nodes[selector.event].addListener(sig.node());
    };

    function orderedStream(sig, selector, exp, spec) {
      var name = sig.name(), 
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

          sig.value(s[MIDDLE].value());
          input.signals[name] = 1;
          return input;
        }

        if(s[END].value() === true) {
          s[START].value(false);
          s[END].value(false);
        }

        return model.graph.doNotPropagate;
      });
      router.addListener(sig.node());

      [START, MIDDLE, END].forEach(function(x) {
        var val = (x == MIDDLE) ? exp : trueFn,
            sp = (x == MIDDLE) ? spec : {};

        if(selector[x].event) event(s[x], selector[x], val, sp);
        else if(selector[x].signal) signal(s[x], selector[x], val, sp);
        else if(selector[x].stream) mergedStream(s[x], selector[x], val, sp);
        s[x].addListener(router);
      });
    };

    function mergedStream(sig, selector, exp, spec) {
      selector.forEach(function(s) {
        if(s.event)       event(sig, s, exp, spec);
        else if(s.signal) signal(sig, s, exp, spec);
        else if(s.start)  orderedStream(sig, s, exp, spec);
        else if(s.stream) mergedStream(sig, s.stream, exp, spec);
      });
    };

    (spec || []).forEach(function(sig) {
      var signal = model.signal(sig.name);
      if(sig.expr) return;  // Cannot have an expr and stream definition.

      (sig.streams || []).forEach(function(stream) {
        var sel = selector.parse(stream.type),
            exp = expr(model, stream.expr);
        mergedStream(signal, sel, exp, stream);
      });
    });

    // We register the event listeners all together so that if multiple
    // signals are registered on the same event, they will receive the
    // new value on the same pulse. 

    // TODO: Filters, time intervals, target selectors
    util.keys(register).forEach(function(r) {
      var handlers = register[r], 
          node = nodes[r];

      view.on(r, function(evt, item) {
        var cs = changset.create({}, true),
            pad = view.padding(),
            filtered = false,
            val, h, i, m, d, p = {};

        evt.preventDefault(); // Stop text selection

        // Stash event in d3.event so we can calculate relative positions
        d3.event = evt, m = d3.mouse(view._el), p.x = m[0] - pad.left, p.y = m[1] - pad.top;
        item = item||{};
        d = item.datum||{};

        for(i = 0; i < handlers.length; i++) {
          h = handlers[i];
          filtered = h.filters.some(function(f) {
            return !expr.eval(model, f.fn, d, evt, item, p, f.signals);
          });
          if(filtered) continue;
          
          val = expr.eval(model, h.exp.fn, d, evt, item, p, h.exp.signals); 
          if(h.spec.scale) val = model.scene().scale(h.spec, val);
          h.signal.value(val);
          cs.signals[h.signal.name()] = 1;
        }

        model.graph.propagate(cs, node);
      });
    })
  };
})