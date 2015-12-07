var d3 = require('d3'),
    dl = require('datalib'),
    df = require('vega-dataflow'),
    SIGNALS = df.Dependencies.SIGNALS,
    parseSignals = require('./signals'),
    selector = require('./events'),
    expr = require('./expr');

var GATEKEEPER = '_vgGATEKEEPER';

var vgEvent = {
  getGroup: function(name) { return name ? this.name[name] : this.group; },
  getXY: function(item) {
      var p = {x: this.x, y: this.y};
      if (typeof item === 'string') {
        item = this.name[item];
      }
      for (; item; item = item.mark && item.mark.group) {
        p.x -= item.x || 0;
        p.y -= item.y || 0;
      }
      return p;
    },
  getX: function(item) { return this.getXY(item).x; },
  getY: function(item) { return this.getXY(item).y; }
};

function parseStreams(view) {
  var model = view.model(),
      spec  = model.defs().signals,
      registry = {handlers: {}, nodes: {}},
      internal = dl.duplicate(registry),  // Internal event processing
      external = dl.duplicate(registry);  // External event processing

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
  dl.keys(internal.handlers).forEach(function(type) {
    if (type === 'tick') {
      return; // no need to register the tick event
    }
    view.on(type, function(evt, item) {
      evt.preventDefault(); // stop text selection
      extendEvent(evt, item);
      fire(internal, type, (item && item.datum) || {}, evt);
    });
  });

  // add external event listeners
  dl.keys(external.handlers).forEach(function(type) {
    if (typeof window === 'undefined') return; // No external support

    if (type === 'tick') {
      function tick(timestamp) {
        fire(external, type, {}, {now:timestamp});
        requestAnimationFrame(tick);
      }
      external.handlers[type].animationFrameId = requestAnimationFrame(tick);
      return;
    }

    var h = external.handlers[type],
        t = type.split(':'), // --> no element pseudo-selectors
        elt = (t[0] === 'window') ? [window] :
              window.document.querySelectorAll(t[0]);

    function handler(evt) {
      extendEvent(evt);
      fire(external, type, d3.select(this).datum(), evt);
    }

    for (var i=0; i<elt.length; ++i) {
      elt[i].addEventListener(t[1], handler);
    }

    h.elements = elt;
    h.listener = handler;
  });

  // remove external event listeners
  external.detach = function() {
    dl.keys(external.handlers).forEach(function(type) {
      var h = external.handlers[type],
          t = type.split(':'),
          elt = h.elements || [];
      if (type == 'tick') {
        cancelAnimationFrame(h.animationFrameId);
        return;
      }
      for (var i=0; i<elt.length; ++i) {
        elt[i].removeEventListener(t[1], h.listener);
      }
    });
  };

  // export detach method
  return external.detach;

  // -- helper functions -----

  function extendEvent(evt, item) {
    var mouse = d3.mouse((d3.event=evt, view.renderer().scene())),
        pad = view.padding(),
        names = {}, mark, group, i;

    if (item) {
      mark = item.mark;
      group = mark.marktype === 'group' ? item : mark.group;
      for (i=item; i!=null; i=i.mark.group) {
        if (i.mark.def.name) {
          names[i.mark.def.name] = i;
        }
      }
    }
    names.root = view.model().scene().items[0];

    evt.vg = Object.create(vgEvent);
    evt.vg.group = group;
    evt.vg.item = item || {};
    evt.vg.name = names;
    evt.vg.x = mouse[0] - pad.left;
    evt.vg.y = mouse[1] - pad.top;
  }

  function fire(registry, type, datum, evt) {
    var handlers = registry.handlers[type],
        node = registry.nodes[type],
        cs = df.ChangeSet.create(null, true),
        filtered = false,
        val, i, n, h;

    function invoke(f) {
      return !f.fn(datum, evt, model.values(SIGNALS, f.globals));
    }

    for (i=0, n=handlers.length; i<n; ++i) {
      h = handlers[i];
      filtered = h.filters.some(invoke);
      if (filtered) continue;

      val = h.exp.fn(datum, evt, model.values(SIGNALS, h.exp.globals));
      if (h.spec.scale) {
        val = parseSignals.scale(model, h.spec, val, datum, evt);
      }

      if (val !== h.signal.value() || h.signal.verbose()) {
        h.signal.value(val);
        cs.signals[h.signal.name()] = 1;
      }
    }

    model.propagate(cs, node);
  }

  function mergedStream(sig, selector, exp, spec) {
    selector.forEach(function(s) {
      if (s.event)       domEvent(sig, s, exp, spec);
      else if (s.signal) signal(sig, s, exp, spec);
      else if (s.start)  orderedStream(sig, s, exp, spec);
      else if (s.stream) mergedStream(sig, s.stream, exp, spec);
    });
  }

  function domEvent(sig, selector, exp, spec) {
    var evt = selector.event,
        name = selector.name,
        mark = selector.mark,
        target   = selector.target,
        filters  = selector.filters || [],
        registry = target ? external : internal,
        type = target ? target+':'+evt : evt,
        node = registry.nodes[type] || (registry.nodes[type] = new df.Node(model)),
        handlers = registry.handlers[type] || (registry.handlers[type] = []);
    if (name) {
      filters.push('!!event.vg.name["' + name + '"]'); // Mimic event bubbling
    } else if (mark) {
      filters.push('event.vg.item.mark && event.vg.item.mark.marktype==='+dl.str(mark));
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
    var n = new df.Node(model);
    n.evaluate = function(input) {
      if (!input.signals[selector.signal]) return model.doNotPropagate;
      var val = exp.fn(null, null, model.values(SIGNALS, exp.globals));
      if (spec.scale) {
        val = parseSignals.scale(model, spec, val);
      }

      if (val !== sig.value() || sig.verbose()) {
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.reflow = true;
      }

      return input;
    };
    n.dependency(df.Dependencies.SIGNALS, selector.signal);
    n.addListener(sig);
    model.signal(selector.signal).addListener(n);
  }

  function orderedStream(sig, selector, exp, spec) {
    var name = sig.name(),
        gk = name + GATEKEEPER,
        trueFn  = expr('true'),
        falseFn = expr('false'),
        middle  = selector.middle,
        filters = middle.filters || (middle.filters = []),
        gatekeeper = model.signal(gk) || model.signal(gk, false);

    // Register an anonymous signal to act as a gatekeeper. Its value is
    // true or false depending on whether the start or end streams occur.
    // The middle signal then simply filters for the gatekeeper's value.
    mergedStream(gatekeeper, [selector.start], trueFn, {});
    mergedStream(gatekeeper, [selector.end], falseFn, {});

    filters.push(gatekeeper.name());
    mergedStream(sig, [selector.middle], exp, spec);
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
