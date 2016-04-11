var dl = require('datalib'),
    log = require('vega-logging'),
    df = require('vega-dataflow'),
    Node = df.Node, // jshint ignore:line
    Tuple = df.Tuple,
    Deps = df.Dependencies;

var Types = {
  INSERT: "insert",
  REMOVE: "remove",
  UPSERT: "upsert",
  TOGGLE: "toggle",
  CLEAR:  "clear"
};

var EMPTY = [];

function filter(fields, value, src, dest) {
  var splice = true, len = fields.length, i, j, f, v;
  for (i = src.length - 1; i >= 0; --i) {
    for (j=0; j<len; ++j) {
      f = fields[j];
      v = value && f(value) || value;
      if (f(src[i]) !== v) {
        splice = false;
        break;
      }
    }

    if (splice) dest.push.apply(dest, src.splice(i, 1));
    splice = true;
  }
}

function insert(input, datum, source) {
  var t = Tuple.ingest(datum);
  input.add.push(t);
  source._data.push(t);
}

function parseModify(model, def, ds) {
  var signal = def.signal ? dl.field(def.signal) : null,
      signalName  = signal ? signal[0] : null,
      predicate   = def.predicate ? model.predicate(def.predicate.name || def.predicate) : null,
      exprTrigger = def.test ? model.expr(def.test) : null,
      reeval  = (predicate === null && exprTrigger === null),
      isClear = def.type === Types.CLEAR,
      fields  = dl.array(def.field || 'data'),
      getters = fields.map(dl.accessor),
      setters = fields.map(dl.mutator),
      node = new Node(model).router(isClear);

  node.evaluate = function(input) {
    var db, sg;

    if (predicate !== null) {  // TODO: predicate args
      db = model.values(Deps.DATA, predicate.data || EMPTY);
      sg = model.values(Deps.SIGNALS, predicate.signals || EMPTY);
      reeval = predicate.call(predicate, {}, db, sg, model._predicates);
    }

    if (exprTrigger !== null) {
      sg = model.values(Deps.SIGNALS, exprTrigger.globals || EMPTY);
      reeval = exprTrigger.fn();
    }

    log.debug(input, [def.type+"ing", reeval]);
    if (!reeval || (!isClear && !input.signals[signalName])) return input;

    var value = signal ? model.signalRef(def.signal) : null,
        d = model.data(ds.name),
        t = null, add = [], rem = [], up = 0, datum;

    if (dl.isObject(value)) {
      datum = value;
      if (!def.field) {
        fields = dl.keys(datum);
        getters = fields.map(dl.accessor);
        setters = fields.map(dl.mutator);
      }
    } else {
      datum = {};
      setters.forEach(function(f) { f(datum, value); });
    }

    // We have to modify ds._data so that subsequent pulses contain
    // our dynamic data. W/o modifying ds._data, only the output
    // collector will contain dynamic tuples.
    if (def.type === Types.INSERT) {
      insert(input, datum, d);
    } else if (def.type === Types.REMOVE) {
      filter(getters, value, input.mod, input.rem);
      filter(getters, value, input.add, rem);
      filter(getters, value, d._data, rem);
    } else if (def.type === Types.UPSERT) {
      input.mod.forEach(function(x) {
        var every = getters.every(function(f) {
          return f(x) === f(datum);
        });

        if (every) up = (dl.extend(x, datum), up+1);
      });

      if (up === 0) insert(input, datum, d);
    } else if (def.type === Types.TOGGLE) {
      // If tuples are in mod, remove them.
      filter(getters, value, input.mod, rem);
      input.rem.push.apply(input.rem, rem);

      // If tuples are in add, they've been added to backing data source,
      // but no downstream operators will have seen it yet.
      filter(getters, value, input.add, add);

      if (add.length || rem.length) {
        d._data = d._data.filter(function(x) {
          return rem.indexOf(x) < 0 && add.indexOf(x) < 0;
        });
      } else {
        // If the tuples aren't seen in the changeset, add a new tuple.
        // Note, tuple might be in input.rem, but we ignore this and just
        // re-add a new tuple for simplicity.
        input.add.push(t=Tuple.ingest(datum));
        d._data.push(t);
      }
    } else if (def.type === Types.CLEAR) {
      input.rem.push.apply(input.rem, input.mod.splice(0));
      input.add.splice(0);
      d._data.splice(0);
    }

    fields.forEach(function(f) { input.fields[f] = 1; });
    return input;
  };

  if (signalName) node.dependency(Deps.SIGNALS, signalName);

  if (predicate) {
    node.dependency(Deps.DATA, predicate.data);
    node.dependency(Deps.SIGNALS, predicate.signals);
  }

  if (exprTrigger) {
    node.dependency(Deps.SIGNALS, exprTrigger.globals);
    node.dependency(Deps.DATA,    exprTrigger.dataSources);
  }

  return node;
}

module.exports = parseModify;
parseModify.schema = {
  "defs": {
    "modify": {
      "type": "array",
      "items": {
        "type": "object",
        "oneOf": [{
          "properties": {
            "type": {"enum": [
              Types.INSERT, Types.REMOVE, Types.UPSERT, Types.TOGGLE
            ]},
            "signal": {"type": "string"},
            "field": {"type": "string"}
          },
          "required": ["type", "signal"]
        }, {
          "properties": {
            "type": {"enum": [Types.CLEAR]},
            "predicate": {"type": "string"}  // TODO predicate args
          },
          "required": ["type", "predicate"]
        },
        {
          "properties": {
            "type": {"enum": [Types.CLEAR]},
            "test": {"type": "string"}
          },
          "required": ["type", "test"]
        }]
      }
    }
  }
};
