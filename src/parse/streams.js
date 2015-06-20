var d3 = require('d3'),
    util = require('datalib/src/util'),
    Node = require('../dataflow/Node'),
    parseSignals = require('./signals'),
    changeset = require('../dataflow/changeset'),
    selector = require('./events'),
    expr = require('./expr'),
    C = require('../util/constants');

var START = "start", MIDDLE = "middle", END = "end";

function capitalize(str) {
  return str && str.charAt(0).toUpperCase() + str.slice(1);
}

function parseStreams(view) {
  var model = view.model(),
      spec  = model.defs().signals,
      registry = {handlers: {}, nodes: {}},
      internal = util.duplicate(registry),  // Vega internal event processing
      external = util.duplicate(registry);  // D3 external event processing

  (spec || []).forEach(function(sig) {
    var signal = model.signal(sig.name);
    if (sig.expr) return;  // Cannot have an expr and stream definition.

    (sig.streams || []).forEach(function(stream) {
      var sel = selector.parse(stream.type),
          exp = expr(stream.expr);
      mergedStream(signal, sel, exp, stream);
    });
  });

  // We register the event listeners all together so that if multiple
  // signals are registered on the same event, they will receive the
  // new value on the same pulse. 
  util.keys(internal.handlers).forEach(function(type) {
    view.on(type, function(evt, item) {
      var pad = view.padding(),
          mouse, datum, name;

      evt.preventDefault(); // Stop text selection
      mouse = d3.mouse((d3.event=evt, view._el)); // Relative position within container

      datum = (item && item.datum) || {};
      evt.vgItem = item || {};
      evt.vgX = mouse[0] - pad.left;
      evt.vgY = mouse[1] - pad.top;
      groupOffsets(evt);

      if (item && (name = item.mark.def.name)) {
        evt["vg"+capitalize(name)+"Item"] = item;
      }

      fire(internal, type, datum, evt);
    });
  });

  util.keys(external.handlers).forEach(function(type) {
    var sel = type.split(":"); // This means no element pseudo-selectors

    d3.selectAll(sel[0]).on(sel[1], function(datum, idx) {
      fire(external, type, datum, d3.event);
    });
  });

  function fire(registry, type, datum, evt) {
    var handlers = registry.handlers[type],
        node = registry.nodes[type],
        cs = changeset.create(null, true),
        filtered = false,
        val, i, len, h;

    for (i = 0, len=handlers.length; i<len; i++) {
      h = handlers[i];
      filtered = h.filters.some(function(f) {
        return !expr.eval(model, f.fn, 
          {datum: datum, event: evt, signals: f.globals});
      });
      if (filtered) continue;
      
      val = expr.eval(model, h.exp.fn, 
        {datum: datum, event: evt, signals: h.exp.globals}); 
      if (h.spec.scale) val = parseSignals.scale(model, h.spec, val);

      if (val !== h.signal.value() || h.signal.verbose()) {
        h.signal.value(val);
        cs.signals[h.signal.name()] = 1;
      }
    }

    model.propagate(cs, node);
  }

  function mergedStream(sig, selector, exp, spec) {
    selector.forEach(function(s) {
      if (s.event)       event(sig, s, exp, spec);
      else if (s.signal) signal(sig, s, exp, spec);
      else if (s.start)  orderedStream(sig, s, exp, spec);
      else if (s.stream) mergedStream(sig, s.stream, exp, spec);
    });
  }

  function event(sig, selector, exp, spec) {
    var evt = selector.event,
        name = selector.name,
        mark = selector.mark,
        target   = selector.target,
        filters  = selector.filters || [],
        registry = target ? external : internal,
        type = target ? target+":"+evt : evt,
        node = registry.nodes[type] || (registry.nodes[type] = new Node(model))
        handlers = registry.handlers[type] || (registry.handlers[type] = []);

    if (name) {
      filters.push("event.vgItem.mark && event.vgItem.mark.def.name==="+util.str(name));
    } else if (mark) {
      filters.push("event.vgItem.mark && event.vgItem.mark.marktype==="+util.str(mark));
    }

    handlers.push({
      signal: sig,
      exp: exp,
      spec: spec,
      filters: filters.map(function(f) { return expr(f); })
    });

    node.addListener(sig);
  }

  function signal(sig, selector, exp, spec) {
    var n = new Node(model);
    n.evaluate = function(input) {
      if (!input.signals[selector.signal]) return model.doNotPropagate;
      var val = expr.eval(model, exp.fn, {signals: exp.globals});
      if (spec.scale) val = parseSignals.scale(model, spec, val);

      if (val !== sig.value()) {
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.reflow = true;        
      }

      return input;  
    };
    n.dependency(C.SIGNALS, selector.signal);
    n.addListener(sig);
    model.signal(selector.signal).addListener(n);
  }

  function orderedStream(sig, selector, exp, spec) {
    var name = sig.name(), 
        trueFn = expr("true"),
        s = {};

    s[START]  = model.signal(name + START,  false);
    s[MIDDLE] = model.signal(name + MIDDLE, false);
    s[END]    = model.signal(name + END,    false);

    var router = new Node(model);
    router.evaluate = function(input) {
      if (s[START].value() === true && s[END].value() === false) {
        // TODO: Expand selector syntax to allow start/end signals into stream.
        // Until then, prevent old middles entering stream on new start.
        if (input.signals[name+START]) return model.doNotPropagate;

        if (s[MIDDLE].value() !== sig.value()) {
          sig.value(s[MIDDLE].value());
          input.signals[name] = 1;
        }

        return input;
      }

      if (s[END].value() === true) {
        s[START].value(false);
        s[END].value(false);
      }

      return model.doNotPropagate;
    };
    router.addListener(sig);

    [START, MIDDLE, END].forEach(function(x) {
      var val = (x == MIDDLE) ? exp : trueFn,
          sp = (x == MIDDLE) ? spec : {};

      if (selector[x].event) event(s[x], selector[x], val, sp);
      else if (selector[x].signal) signal(s[x], selector[x], val, sp);
      else if (selector[x].stream) mergedStream(s[x], selector[x].stream, val, sp);
      s[x].addListener(router);
    });
  }

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
}

module.exports = parseStreams;
parseStreams.schema = {
  "defs": {
    "streams": {
      "type": "array",
      "items": {
        "type": "object",

        "properties": {
          "type": {"type": "string"},
          "expr": {"type": "string"},
          "scale": {"$ref": "#/refs/scopedScale"}
        },

        "additionalProperties": false,
        "required": ["type", "expr"]
      }
    }
  }
};