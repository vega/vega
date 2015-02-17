define(function(require, exports, module) {
  var d3 = require('d3'),
      Node = require('../dataflow/Node'),
      changset = require('../dataflow/changeset'),
      selector = require('./events'),
      expr = require('./expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  var START = "start", MIDDLE = "middle", END = "end";

  return function(view) {
    var model = view.model(),
        graph = model.graph,
        spec  = model.defs().signals,
        register = {}, nodes = {};

    function scale(def, value, item) {
      if(!item || !item.scale) {
        item = (item && item.mark) ? item.mark.group : model.scene().items[0];
      }

      var scale = item.scale(def.scale.signal || def.scale);
      if(!scale) return value;
      return def.invert ? scale.invert(value) : scale(value);
    }

    function signal(sig, selector, exp, spec) {
      var n = new Node(graph);
      n.evaluate = function(input) {
        var val = expr.eval(graph, exp.fn, null, null, null, null, exp.signals);
        if(spec.scale) val = scale(spec, val);
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.reflow = true;
        return input;  
      };
      n.dependency(C.SIGNALS, selector.signal);
      n.addListener(sig);
      graph.signal(selector.signal).addListener(n);
    };

    function event(sig, selector, exp, spec) {
      var filters = selector.filters || [],
          target = selector.target;

      if(target) filters.push("i."+target.type+"=="+util.str(target.value));

      register[selector.event] = register[selector.event] || [];
      register[selector.event].push({
        signal: sig,
        exp: exp,
        filters: filters.map(function(f) { return expr(graph, f); }),
        spec: spec
      });

      nodes[selector.event] = nodes[selector.event] || new Node(graph);
      nodes[selector.event].addListener(sig);
    };

    function orderedStream(sig, selector, exp, spec) {
      var name = sig.name(), 
          trueFn = expr(graph, "true"),
          s = {};

      s[START]  = graph.signal(name + START,  false);
      s[MIDDLE] = graph.signal(name + MIDDLE, false);
      s[END]    = graph.signal(name + END,    false);

      var router = new Node(graph);
      router.evaluate = function(input) {
        if(s[START].value() === true && s[END].value() === false) {
          // TODO: Expand selector syntax to allow start/end signals into stream.
          // Until then, prevent old middles entering stream on new start.
          if(input.signals[name+START]) return graph.doNotPropagate;

          sig.value(s[MIDDLE].value());
          input.signals[name] = 1;
          return input;
        }

        if(s[END].value() === true) {
          s[START].value(false);
          s[END].value(false);
        }

        return graph.doNotPropagate;
      };
      router.addListener(sig);

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
      var signal = graph.signal(sig.name);
      if(sig.expr) return;  // Cannot have an expr and stream definition.

      (sig.streams || []).forEach(function(stream) {
        var sel = selector.parse(stream.type),
            exp = expr(graph, stream.expr);
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
        var cs = changset.create(null, true),
            pad = view.padding(),
            filtered = false,
            val, h, i, m, d;

        evt.preventDefault(); // Stop text selection
        m = d3.mouse((d3.event=evt, view._el)); // Relative position within container
        item = item||{};
        d = item.datum||{};
        var p = {x: m[0] - pad.left, y: m[1] - pad.top};

        for(i = 0; i < handlers.length; i++) {
          h = handlers[i];
          filtered = h.filters.some(function(f) {
            return !expr.eval(graph, f.fn, d, evt, item, p, f.signals);
          });
          if(filtered) continue;
          
          val = expr.eval(graph, h.exp.fn, d, evt, item, p, h.exp.signals); 
          if(h.spec.scale) val = scale(h.spec, val, item);
          h.signal.value(val);
          cs.signals[h.signal.name()] = 1;
        }

        graph.propagate(cs, node);
      });
    })
  };
})