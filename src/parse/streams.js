var dl = require('datalib'),
    d3 = require('d3'),
    Node = require('../dataflow/Node'),
    parseSignals = require('./signals'),
    changset = require('../dataflow/changeset'),
    selector = require('./events'),
    expr = require('./expr'),
    C = require('../util/constants');

var START = "start", MIDDLE = "middle", END = "end";

function capitalize(str) {
  return str && str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = function(view) {
  var model = view.model(),
      spec  = model.defs().signals,
      register = {}, nodes = {};

  function signal(sig, selector, exp, spec) {
    var n = new Node(model);
    n.evaluate = function(input) {
      if(!input.signals[selector.signal]) return model.doNotPropagate;
      var val = expr.eval(model, exp.fn, {signals: exp.signals});
      if(spec.scale) val = parseSignals.scale(model, spec, val);

      if(val !== sig.value()) {
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.reflow = true;        
      }

      return input;  
    };
    n.dependency(C.SIGNALS, selector.signal);
    n.addListener(sig);
    model.signal(selector.signal).addListener(n);
  };

  function event(sig, selector, exp, spec) {
    var filters = selector.filters || [],
        target = selector.target;

    if(target) {
      filters.push("event.vgItem.mark && event.vgItem.mark.def.name==="+dl.str(target));
    }

    register[selector.event] = register[selector.event] || [];
    register[selector.event].push({
      signal: sig,
      exp: exp,
      filters: filters.map(function(f) { return expr(f); }),
      spec: spec
    });

    nodes[selector.event] = nodes[selector.event] || new Node(model);
    nodes[selector.event].addListener(sig);
  };

  function orderedStream(sig, selector, exp, spec) {
    var name = sig.name(), 
        trueFn = expr("true"),
        s = {};

    s[START]  = model.signal(name + START,  false);
    s[MIDDLE] = model.signal(name + MIDDLE, false);
    s[END]    = model.signal(name + END,    false);

    var router = new Node(model);
    router.evaluate = function(input) {
      if(s[START].value() === true && s[END].value() === false) {
        // TODO: Expand selector syntax to allow start/end signals into stream.
        // Until then, prevent old middles entering stream on new start.
        if(input.signals[name+START]) return model.doNotPropagate;

        if(s[MIDDLE].value() !== sig.value()) {
          sig.value(s[MIDDLE].value());
          input.signals[name] = 1;
        }

        return input;
      }

      if(s[END].value() === true) {
        s[START].value(false);
        s[END].value(false);
      }

      return model.doNotPropagate;
    };
    router.addListener(sig);

    [START, MIDDLE, END].forEach(function(x) {
      var val = (x == MIDDLE) ? exp : trueFn,
          sp = (x == MIDDLE) ? spec : {};

      if(selector[x].event) event(s[x], selector[x], val, sp);
      else if(selector[x].signal) signal(s[x], selector[x], val, sp);
      else if(selector[x].stream) mergedStream(s[x], selector[x].stream, val, sp);
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

  function groupOffsets(event) {
    if (!event.vgItem.mark) return;
    var group = event.vgItem.mark.group,
        name, prefix;

    while (group) {
      if (name = capitalize(group.mark.def.name)) {
        event[(prefix = "vg"+name)+"Item"] = group;
        if (group.x) event[prefix+"X"] = event.vgX - group.x;
        if (group.y) event[prefix+"Y"] = event.vgY - group.y;
      }

      group = group.mark.group;
    }
  }

  (spec || []).forEach(function(sig) {
    var signal = model.signal(sig.name);
    if(sig.expr) return;  // Cannot have an expr and stream definition.

    (sig.streams || []).forEach(function(stream) {
      var sel = selector.parse(stream.type),
          exp = expr(stream.expr);
      mergedStream(signal, sel, exp, stream);
    });
  });

  // We register the event listeners all together so that if multiple
  // signals are registered on the same event, they will receive the
  // new value on the same pulse. 

  // TODO: Filters, time intervals, target selectors
  dl.keys(register).forEach(function(r) {
    var handlers = register[r], 
        node = nodes[r];

    view.on(r, function(evt, item) {
      var cs = changset.create(null, true),
          pad = view.padding(),
          filtered = false,
          val, mouse, datum, name, h, i, len;

      evt.preventDefault(); // Stop text selection
      mouse = d3.mouse((d3.event=evt, view._el)); // Relative position within container

      datum = (item && item.datum) || {};
      evt.vgItem = item || {};
      evt.vgX = mouse[0] - pad.left;
      evt.vgY = mouse[1] - pad.top;
      groupOffsets(evt);

      if (item.mark && (name = item.mark.def.name)) {
        evt["vg"+capitalize(name)+"Item"] = item;
      }

      for(i = 0, len=handlers.length; i<len; i++) {
        h = handlers[i];
        filtered = h.filters.some(function(f) {
          return !expr.eval(model, f.fn, 
            {datum: datum, event: evt, signals: f.signals});
        });
        if(filtered) continue;
        
        val = expr.eval(model, h.exp.fn, 
          {datum: datum, event: evt, signals: h.exp.signals}); 
        if(h.spec.scale) val = parseSignals.scale(model, h.spec, val);

        if(val !== h.signal.value() || h.signal.verbose()) {
          h.signal.value(val);
          cs.signals[h.signal.name()] = 1;
        }
      }

      model.propagate(cs, node);
    });
  })
};