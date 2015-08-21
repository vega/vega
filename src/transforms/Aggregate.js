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

  this._aggr = null; // dl.Aggregator
  this._fields = [];
  this._out = [];

  this._type = TYPES.TUPLE; 
  this._acc = {groupby: dl.true, value: dl.true};

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

  this._out = getFields(aggr);

  if (this._type !== TYPES.VALUE) { aggr.key('_id'); }
  return aggr;
};

// Collect all fields set by this aggregate
function getFields(aggr) {
  var f = [], i, n, j, m, dims, vals, meas;

  dims = aggr._dims;
  for (i=0, n=dims.length; i<n; ++i) {
    f.push(dims[i].name);
  }

  vals = aggr._aggr;
  for (i=0, n=vals.length; i<n; ++i) {
    meas = vals[i].measures.fields;
    for (j=0, m=meas.length; j<m; ++j) {
      f.push(meas[j]);
    }
  }

  return f;
}

prototype.transform = function(input, reset) {
  log.debug(input, ['aggregate']);
  this._input = input; // Used by Facetor._on_keep

  var output = ChangeSet.create(input),
      aggr = this.aggr(),
      out = this._out,
      add, rem, mod;

  if (reset) {
    output.rem.push.apply(output.rem, aggr.result());
    aggr.clear();
    this._aggr = null;
    aggr = this.aggr();
  }

  if (this._type === TYPES.TUPLE) {
    add = function(x) { aggr._add(x); };
    rem = function(x) { aggr._rem(Tuple.prev(x)); };
    mod = function(x) { aggr._mod(x, Tuple.prev(x)); };
  } else {
    var gby = this._acc.groupby,
        val = this._acc.value,
        get = this._type === TYPES.VALUE ? val : function(x) {
          return { _id: x._id, groupby: gby(x), value: val(x) };
        };
    add = function(x) { aggr._add(get(x)); };
    rem = function(x) { aggr._rem(get(Tuple.prev(x))); };
    mod = function(x) { aggr._mod(get(x), get(Tuple.prev(x))); };
  }

  input.add.forEach(add);
  if (reset) {
    // A signal change triggered reflow. Add everything.
    // No need for rem, we cleared the aggregator.
    input.mod.forEach(add);
  } else {
    input.mod.forEach(mod);
    input.rem.forEach(rem);
  }

  for (var i=0; i<out.length; ++i) {
    output.fields[out[i]] = 1;
  }
  return aggr.changes(output);
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
