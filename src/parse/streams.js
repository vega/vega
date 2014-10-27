define(function(require, exports, module) {
  var d3 = require('d3'),
      vg = require('vega'),
      changset = require('../core/changeset'),
      selector = require('./events'),
      expr = require('./expr');

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
      // TODO
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
    vg.keys(register).forEach(function(r) {
      var h = register[r];
      view.on(r, function(evt, item) {
        var cs = changset.create({}, true),
            n = new model.Node(null, h.map(function(h) { return h.signal.node() })),
            val, i, m, p = {};

        // Stash event in d3.event so we can calculate relative positions
        d3.event = evt, m = d3.mouse(view._el), p.x = m[0], p.y = m[1];

        for(i = 0; i < h.length; i++) {
          val = expr.eval(model, h[i].exp.fn, item.datum, evt, item, p, h[i].exp.signals); 
          h[i].signal.value(val);
          cs.signals[h[i].signal.name()] = 1;
        }

        model.graph.propagate(cs, n);
      });
    })
  };
})