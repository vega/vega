var dl = require('datalib'),
    df = require('vega-dataflow'),
    log = require('vega-logging'),
    ChangeSet = df.ChangeSet,
    Tuple = df.Tuple,
    Deps = df.Dependencies,
    Transform = require('./Transform'),
    Facetor = require('./Facetor');

function Aggregate(graph) {
  Transform.prototype.init.call(this, graph);

  Transform.addParameters(this, {
    groupby: {type: 'array<field>'},
    summarize: {
      type: 'custom', 
      set: function(summarize) {
        var signalDeps = {},
            tx = this._transform,
            i, len, f, fields, name, ops;

        if (!dl.isArray(fields = summarize)) { // Object syntax from dl
          fields = [];
          for (name in summarize) {
            ops = dl.array(summarize[name]);
            fields.push({field: name, ops: ops});
          }
        }

        function sg(x) { if (x.signal) signalDeps[x.signal] = 1; }

        for (i=0, len=fields.length; i<len; ++i) {
          f = fields[i];
          if (f.field.signal) { signalDeps[f.field.signal] = 1; }
          dl.array(f.ops).forEach(sg);
          dl.array(f.as).forEach(sg);
        }

        tx._fields = fields;
        tx._aggr = null;
        tx.dependency(Deps.SIGNALS, dl.keys(signalDeps));
        return tx;
      }
    }
  });

  this._fields = [];
  this._aggr = null;  // dl.Aggregator

  this._type = TYPES.TUPLE; 
  this._acc = {groupby: dl.true, value: dl.true};
  this._cache = {}; // And cache them as aggregators expect original tuples.

  return this.router(true).revises(true);
}

var prototype = (Aggregate.prototype = Object.create(Transform.prototype));
prototype.constructor = Aggregate;

var TYPES = Aggregate.TYPES = {
  VALUE: 1, 
  TUPLE: 2, 
  MULTI: 3
};

Aggregate.VALID_OPS = [
  'values', 'count', 'valid', 'missing', 'distinct', 
  'sum', 'mean', 'average', 'variance', 'variancep', 'stdev', 
  'stdevp', 'median', 'q1', 'q3', 'modeskew', 'min', 'max', 
  'argmin', 'argmax'
];

prototype.type = function(type) { 
  return (this._type = type, this); 
};

prototype.accessors = function(groupby, value) {
  var acc = this._acc;
  acc.groupby = dl.$(groupby) || dl.true;
  acc.value = dl.$(value) || dl.true;
};

function standardize(x) {
  var acc = this._acc;
  if (this._type === TYPES.TUPLE) {
    return x;
  } else if (this._type === TYPES.VALUE) {
    return acc.value(x);
  } else {
    return this._cache[x._id] || (this._cache[x._id] = {
      _id: x._id,
      groupby: acc.groupby(x),
      value: acc.value(x)
    });
  }
}

prototype.aggr = function() {
  if (this._aggr) return this._aggr;

  var g = this._graph,
      groupby = this.param('groupby').field,
      value = function(x) { return x.signal ? g.signalRef(x.signal) : x; },
      fields = this._fields.map(function(f) {
        return {
          name: value(f.field),
          as:   dl.array(f.as),
          ops:  dl.array(value(f.ops)).map(value),
          get:  f.get
        };
      });

  if (!fields.length) fields = {'*': 'values'};

  var aggr = this._aggr = new Facetor()
    .groupby(groupby)
    .stream(true)
    .summarize(fields);

  if (this._type !== TYPES.VALUE) { aggr.key('_id'); }
  return aggr;
};

prototype._reset = function(input, output) {
  var aggr = this.aggr(),
      rem = output.rem;

  rem.push.apply(rem, aggr.result());
  aggr.clear();
  this._aggr = null;
};

prototype.transform = function(input, reset) {
  log.debug(input, ['aggregate']);

  var output = ChangeSet.create(input);
  if (reset) this._reset(input, output);

  var t = this,
      tpl = this._type === TYPES.TUPLE, // reduce calls to standardize
      aggr = this.aggr();

  input.add.forEach(function(x) {
    aggr._add(tpl ? x : standardize.call(t, x));
  });

  if (reset) {
    // Signal change triggered reflow, so add everything
    input.mod.forEach(function(x) {
      aggr._add(tpl ? x : standardize.call(t, x));
    });
  } else {
    input.mod.forEach(function(x) {
      var y = Tuple.prev(x);
      aggr._mod(tpl ? x : standardize.call(t, x), 
        tpl ? y : standardize.call(t, y));
    });
  }

  if (!reset) {
    // not necessary upon reset, as we clear the aggregator
    input.rem.forEach(function(x) {
      var y = Tuple.prev(x);
      aggr._rem(tpl ? y : standardize.call(t, y));
      t._cache[x._id] = null;
    });
  }

  return aggr.changes(input, output);
};

module.exports = Aggregate;

var VALID_OPS = Aggregate.VALID_OPS;

Aggregate.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Aggregate transform",
  "description": "Compute summary aggregate statistics",
  "type": "object",
  "properties": {
    "type": {"enum": ["aggregate"]},
    "groupby": {
      "type": "array",
      "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]},
      "description": "A list of fields to split the data into groups."
    },
    "summarize": {
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": {
            "type": "array",
            "description": "An array of aggregate functions.",
            "items": {"oneOf": [{"enum": VALID_OPS}, {"$ref": "#/refs/signal"}]}
          }
        },
        {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "field": {
                "description": "The name of the field to aggregate.",
                "oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]
              },
              "ops": {
                "type": "array",
                "description": "An array of aggregate functions.",
                "items": {"oneOf": [{"enum": VALID_OPS}, {"$ref": "#/refs/signal"}]}
              },
              "as": {
                "type": "array",
                "description": "An optional array of names to use for the output fields.",
                "items": {"oneOf": [{"type": "string"}, {"$ref": "#/refs/signal"}]}
              }
            },
            "additionalProperties": false,
            "required": ["field", "ops"]
          }
        }
      ]
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};
