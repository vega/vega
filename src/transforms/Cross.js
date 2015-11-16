var dl = require('datalib'),
    df = require('vega-dataflow'),
    ChangeSet = df.ChangeSet,
    Tuple = df.Tuple,
    SIGNALS = df.Dependencies.SIGNALS,
    log = require('vega-logging'),
    Transform = require('./Transform'),
    BatchTransform = require('./BatchTransform');

function Cross(graph) {
  BatchTransform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    with: {type: 'data'},
    diagonal: {type: 'value', default: 'true'},
    filter: {type: 'expr'}
  });

  this._output = {'left': 'a', 'right': 'b'};
  this._lastRem  = null; // Most recent stamp that rem occured.
  this._lastWith = null; // Last time we crossed w/withds.
  this._ids   = {};
  this._cache = {};

  return this.router(true).produces(true);
}

var prototype = (Cross.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Cross;

// Each cached incoming tuple also has a stamp to track if we need to do
// lazy filtering of removed tuples.
function cache(x, t) {
  var c = this._cache[x._id] = this._cache[x._id] || {c: [], s: this._stamp};
  c.c.push(t);
}

function add(output, left, data, diag, test, x) {
  var i = 0, len = data.length, t = {}, y, id;

  for (; i<len; ++i) {
    y = data[i];
    id = left ? x._id+'_'+y._id : y._id+'_'+x._id;
    if (this._ids[id]) continue;
    if (x._id == y._id && !diag) continue;

    t[this._output.left]  = left ? x : y;
    t[this._output.right] = left ? y : x;

    // Only ingest a tuple if we keep it around.
    if (!test || test(t)) {
      output.add.push(t=Tuple.ingest(t));
      cache.call(this, x, t);
      cache.call(this, y, t);
      this._ids[id] = 1;
      t = {};
    }
  }
}

function mod(output, left, data, diag, test, x) {
  var cache = this._cache,
      cross = cache[x._id],
      other = this._output[left ? 'right' : 'left'];

  if (!cross) return;
  if (this._lastRem > cross.s) {  // Lazy removal
    cross.c = cross.c.filter(function(t) {
      var y = t[other];
      return cache[y._id] !== null;
    });
    cross.s = this._lastRem;
  }

  output.mod.push.apply(output.mod, cross.c);
}

function rem(output, x) {
  var cross = this._cache[x._id];
  if (!cross) return;
  output.rem.push.apply(output.rem, cross.c);
  this._cache[x._id] = null;
  this._lastRem = this._stamp;
}

function purge(output) {
  var cache = this._cache,
      keys  = dl.keys(cache),
      rem = output.rem,
      ids = {},
      i, len, j, jlen, cross, t;

  for (i=0, len=keys.length; i<len; ++i) {
    cross = cache[keys[i]];
    for (j=0, jlen=cross.c.length; j<jlen; ++j) {
      t = cross.c[j];
      if (ids[t._id]) continue;
      rem.push(t);
      ids[t._id] = 1;
    }
  }

  this._cache = {};
  this._ids = {};
  this._lastWith = null;
  this._lastRem  = null;
}

prototype.batchTransform = function(input, data, reset) {
  log.debug(input, ['crossing']);

  var g = this._graph,
      w = this.param('with'),
      f = this.param('filter'),
      diag = this.param('diagonal'),
      as = this._output,
      sg = g.values(SIGNALS, this.dependency(SIGNALS)),
      test = f ? function(x) {return f(x, null, sg); } : null,
      selfCross = (!w.name),
      woutput = selfCross ? input : w.source.last(),
      wdata   = selfCross ? data : w.source.values(),
      output  = ChangeSet.create(input),
      r = rem.bind(this, output);

  // If signal values (for diag or test) have changed, purge the cache
  // and re-run cross in batch mode. Otherwise stream cross values.
  if (reset) {
    purge.call(this, output);
    data.forEach(add.bind(this, output, true, wdata, diag, test));
    this._lastWith = woutput.stamp;
  } else {
    input.rem.forEach(r);
    input.add.forEach(add.bind(this, output, true, wdata, diag, test));

    if (woutput.stamp > this._lastWith) {
      woutput.rem.forEach(r);
      woutput.add.forEach(add.bind(this, output, false, data, diag, test));
      woutput.mod.forEach(mod.bind(this, output, false, data, diag, test));
      this._lastWith = woutput.stamp;
    }

    // Mods need to come after all removals have been run.
    input.mod.forEach(mod.bind(this, output, true, wdata, diag, test));
  }

  output.fields[as.left]  = 1;
  output.fields[as.right] = 1;
  return output;
};

module.exports = Cross;

Cross.schema = {
  "$schema": "http://json-schema.org/draft-04/schema#",
  "title": "Cross transform",
  "description": "Compute the cross-product of two data sets.",
  "type": "object",
  "properties": {
    "type": {"enum": ["cross"]},
    "with": {
      "type": "string",
      "description": "The name of the secondary data set to cross with the primary data. " +
        "If unspecified, the primary data is crossed with itself."
    },
    "diagonal": {
      "oneOf": [{"type": "boolean"}, {"$ref": "#/refs/signal"}],
      "description": "If false, items along the \"diagonal\" of the cross-product " +
        "(those elements with the same index in their respective array) " +
        "will not be included in the output.",
      "default": true
    },
    "filter": {
      "type": "string",
      "description": "A string containing an expression (in JavaScript syntax) " +
        "to filter the resulting data elements."
    },
    "output": {
      "type": "object",
      "description": "Rename the output data fields",
      "properties": {
        "left": {"type": "string", "default": "a"},
        "right": {"type": "string", "default": "b"}
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "required": ["type"]
};
