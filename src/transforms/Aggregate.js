var util = require('datalib/src/util'),
    Transform = require('./Transform'),
    Facetor = require('./Facetor'),
    tuple = require('../dataflow/tuple'), 
    changeset = require('../dataflow/changeset'), 
    log = require('../util/log'),
    C = require('../util/constants');


function Aggregate(graph) {
  Transform.prototype.init.call(this, graph)
    .router(true).revises(true);

  Transform.addParameters(this, {
    groupby: {type: "array<field>"},

    summarize: {
      type: "custom", 
      set: function(summarize) {
        var i, len, f, fields, name, ops, signals = {};
        if(!util.isArray(fields = summarize)) { // Object syntax from util
          fields = [];
          for (name in summarize) {
            ops = util.array(summarize[name]);
            fields.push({name: name, ops: ops});
          }
        }

        function sg(x) { if (x.signal) signals[x.signal] = 1; }

        for(i=0, len=fields.length; i<len; ++i) {
          f = fields[i];
          if(f.name.signal) signals[f.name.signal] = 1;
          util.array(f.ops).forEach(sg);
          util.array(f.as).forEach(sg);
        }

        this._transform._fieldsDef = fields;
        this._transform._aggr = null;
        this._transform.dependency(C.SIGNALS, util.keys(signals));
        return this._transform;
      }
    }
  });

  this._fieldsDef = [];
  this._aggr = null;  // util.Aggregator

  this._type = TYPES.TUPLE; 
  this._acc = {groupby: util.true, value: util.true}
  this._cache = {};     // And cache them as aggregators expect original tuples.

  // Aggregator needs a full instantiation of the previous tuple. 
  // Cache them to reduce creation costs
  this._prev = {}; 

  return this;
}

var proto = (Aggregate.prototype = new Transform());

var TYPES = Aggregate.TYPES = {
  VALUE: 1, 
  TUPLE: 2, 
  MULTI: 3
};

proto.type = function(type) { 
  return (this._type = type, this); 
};

proto.accessors = function(groupby, value) {
  var acc = this._acc;
  acc.groupby = util.$(groupby) || util.true;
  acc.value = util.$(value) || util.true;
};

function standardize(x) {
  var acc = this._acc;
  if(this._type === TYPES.TUPLE) {
    return x;
  } else if(this._type === TYPES.VALUE) {
    return acc.value(x);
  } else {
    return this._cache[x._id] || (this._cache[x._id] = {
      _id: x._id,
      groupby: acc.groupby(x),
      value: acc.value(x)
    });
  }
}

proto.aggr = function() {
  if(this._aggr) return this._aggr;

  var graph = this._graph,
      groupby = this.param("groupby").field;

  var fields = this._fieldsDef.map(function(field) {
    var f  = util.duplicate(field);
    if(field.get) f.get = field.get;

    f.name = f.name.signal ? graph.signalRef(f.name.signal) : f.name;
    f.ops  = f.ops.signal ? graph.signalRef(f.ops.signal) : util.array(f.ops).map(function(o) {
      return o.signal ? graph.signalRef(o.signal) : o;
    });

    return f;
  });

  var aggr = this._aggr = new Facetor()
    .groupby(groupby)
    .stream(true)
    .summarize(fields);

  if(this._type !== TYPES.VALUE) aggr.key("_id");
  return aggr;
};

proto._reset = function(input, output) {
  output.rem.push.apply(output.rem, this.aggr().result());
  this.aggr().clear();
  this._aggr = null;
};

function spoof_prev(x) {
  var prev = this._prev[x._id] || (this._prev[x._id] = Object.create(x));
  return util.extend(prev, x._prev);
}

proto.transform = function(input, reset) {
  log.debug(input, ["aggregate"]);

  var output = changeset.create(input);
  if(reset) this._reset(input, output);

  var t = this,
      tpl  = this._type === TYPES.TUPLE, // reduce calls to standardize
      aggr = this.aggr();

  input.add.forEach(function(x) {
    aggr._add(tpl ? x : standardize.call(t, x));
  });

  input.mod.forEach(function(x) {
    if(reset) {
      aggr._add(tpl ? x : standardize.call(t, x));  // Signal change triggered reflow
    } else if(tuple.has_prev(x)) {
      var prev = spoof_prev.call(t, x);
      aggr._mod(tpl ? x : standardize.call(t, x), 
        tpl ? prev : standardize.call(t, prev));
    }
  });

  input.rem.forEach(function(x) {
    var y = tuple.has_prev(x) ? spoof_prev.call(t, x) : x;
    aggr._rem(tpl ? y : standardize.call(t, y));
    t._cache[x._id] = t._prev[x._id] = null;
  });

  return aggr.changes(input, output);
}

var VALID_OPS = Aggregate.VALID_OPS = [
  "values", "count", "valid", "missing", "distinct", 
  "sum", "mean", "average", "variance", "variancep", "stdev", 
  "stdevp", "median", "q1", "q3", "modeskew", "min", "max", 
  "argmin", "argmax"
];

module.exports   = Aggregate;
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
              "name": {
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
            "required": ["name", "ops"]
          }
        }
      ]
    }
  },
  "additionalProperties": false,
  "required": ["type", "groupby"]
};
