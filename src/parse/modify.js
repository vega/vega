var dl = require('datalib'),
    log = require('vega-logging'),
    df = require('vega-dataflow'),
    Node = df.Node, // jshint ignore:line
    Tuple = df.Tuple,
    Deps = df.Dependencies;

var Types = {
  INSERT: "insert",
  REMOVE: "remove",
  TOGGLE: "toggle",
  CLEAR:  "clear"
};

var EMPTY = [];

var filter = function(fields, value, src, dest) {
  if ((fields = dl.array(fields)) && !fields.length) {
    fields = dl.isObject(value) ? dl.keys(value) : ['data'];
  }

  var splice = true, len = fields.length, i, j, f, v;
  for (i = src.length - 1; i >= 0; --i) {
    for (j=0; j<len; ++j) {
      v = value[f=fields[j]] || value;
      if (src[i][f] !== v) {
        splice = false;
        break;
      }
    }

    if (splice) dest.push.apply(dest, src.splice(i, 1));
    splice = true;
  }
};

function parseModify(model, def, ds) {
  var signal = def.signal ? dl.field(def.signal) : null,
      signalName = signal ? signal[0] : null,
      predicate = def.predicate ? model.predicate(def.predicate.name || def.predicate) : null,
      exprTrigger = def.test ? model.expr(def.test) : null,
      reeval  = (predicate === null && exprTrigger === null),
      isClear = def.type === Types.CLEAR,
      fieldName = def.field,
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
        t = null, add = [], rem = [], datum;

    if (dl.isObject(value)) {
      datum = value;
    } else {
      datum = {};
      datum[fieldName || 'data'] = value;
    }

    // We have to modify ds._data so that subsequent pulses contain
    // our dynamic data. W/o modifying ds._data, only the output
    // collector will contain dynamic tuples.
    if (def.type === Types.INSERT) {
      input.add.push(t=Tuple.ingest(datum));
      d._data.push(t);
    } else if (def.type === Types.REMOVE) {
      filter(fieldName, value, input.mod, input.rem);
      filter(fieldName, value, input.add, rem);
      filter(fieldName, value, d._data, rem);
    } else if (def.type === Types.TOGGLE) {
      // If tuples are in mod, remove them.
      filter(fieldName, value, input.mod, rem);
      input.rem.push.apply(input.rem, rem);

      // If tuples are in add, they've been added to backing data source,
      // but no downstream operators will have seen it yet.
      filter(fieldName, value, input.add, add);

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

    if (fieldName) input.fields[fieldName] = 1;
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
            "type": {"enum": [Types.INSERT, Types.REMOVE, Types.TOGGLE]},
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
