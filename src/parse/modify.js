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

var filter = function(field, value, src, dest) {
  for(var i = src.length-1; i >= 0; --i) {
    if (src[i][field] == value)
      dest.push.apply(dest, src.splice(i, 1));
  }
};

function parseModify(model, def, ds) {
  var signal = def.signal ? dl.field(def.signal) : null, 
      signalName = signal ? signal[0] : null,
      predicate = def.predicate ? model.predicate(def.predicate.name || def.predicate) : null,
      reeval = (predicate === null),
      node = new Node(model).router(def.type === Types.CLEAR);

  node.evaluate = function(input) {
    if (predicate !== null) {  // TODO: predicate args
      var db = model.dataValues(predicate.data||[]);
      reeval = predicate.call(predicate, {}, db, model.signalValues(predicate.signals||[]), model._predicates);
    }

    log.debug(input, [def.type+"ing", reeval]);
    if (!reeval) return input;

    var datum = {}, 
        value = signal ? model.signalRef(def.signal) : null,
        d = model.data(ds.name),
        prev = d.revises() ? null : undefined,
        t = null;

    datum[def.field] = value;

    // We have to modify ds._data so that subsequent pulses contain
    // our dynamic data. W/o modifying ds._data, only the output
    // collector will contain dynamic tuples. 
    if (def.type === Types.INSERT) {
      t = Tuple.ingest(datum, prev);
      input.add.push(t);
      d._data.push(t);
    } else if (def.type === Types.REMOVE) {
      filter(def.field, value, input.add, input.rem);
      filter(def.field, value, input.mod, input.rem);
      d._data = d._data.filter(function(x) { return x[def.field] !== value; });
    } else if (def.type === Types.TOGGLE) {
      var add = [], rem = [];
      filter(def.field, value, input.rem, add);
      filter(def.field, value, input.add, rem);
      filter(def.field, value, input.mod, rem);
      if (!(add.length || rem.length)) add.push(Tuple.ingest(datum));

      input.add.push.apply(input.add, add);
      d._data.push.apply(d._data, add);
      input.rem.push.apply(input.rem, rem);
      d._data = d._data.filter(function(x) { return rem.indexOf(x) === -1; });
    } else if (def.type === Types.CLEAR) {
      input.rem.push.apply(input.rem, input.add);
      input.rem.push.apply(input.rem, input.mod);
      input.add = [];
      input.mod = [];
      d._data  = [];
    } 

    input.fields[def.field] = 1;
    return input;
  };

  if (signalName) node.dependency(Deps.SIGNALS, signalName);
  if (predicate)  node.dependency(Deps.SIGNALS, predicate.signals);
  
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
          "required": ["type", "signal", "field"]
        }, {
          "properties": {
            "type": {"enum": [Types.CLEAR]},
            "predicate": {"type": "string"}  // TODO predicate args
          },
          "required": ["type", "predicate"]
        }]
      }
    }
  }
};