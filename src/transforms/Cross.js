var dl = require('datalib'),
    df = require('vega-dataflow'),
    ChangeSet = df.ChangeSet,
    Tuple = df.Tuple,
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
  this._lastWith = null; // Last time we crossed w/with-ds.
  this._cids  = {};
  this._cache = {};

  return this.router(true).produces(true);
}

var prototype = (Cross.prototype = Object.create(BatchTransform.prototype));
prototype.constructor = Cross;

// Each cached incoming tuple also has a flag to determine whether
// any tuples were filtered.
function _cache(x, t) {
  var c = this._cache,
      cross = c[x._id] || (c[x._id] = {c: [], f: false});
  cross.c.push(t);
}

function _cid(left, x, y) {
  return left ? x._id+'_'+y._id : y._id+'_'+x._id;
}

function add(output, left, data, diag, test, mids, x) {
  var as = this._output,
      cache = this._cache,
      cids  = this._cids,
      oadd  = output.add,
      fltrd = false,
      i = 0, len = data.length,
      t = {}, y, cid;

  for (; i<len; ++i) {
    y = data[i];
    cid = _cid(left, x, y);
    if (cids[cid]) continue;
    if (x._id === y._id && !diag) continue;

    Tuple.set(t, as.left, left ? x : y);
    Tuple.set(t, as.right, left ? y : x);

    // Only ingest a tuple if we keep it around. Otherwise, flag the
    // caches as filtered.
    if (!test || test(t)) {
      oadd.push(t=Tuple.ingest(t));
      _cache.call(this, x, t);
      if (x._id !== y._id) _cache.call(this, y, t);
      mids[t._id] = 1;
      cids[cid] = true;
      t = {};
    } else {
      if (cache[y._id]) cache[y._id].f = true;
      fltrd = true;
    }
  }

  if (cache[x._id]) cache[x._id].f = fltrd;
}

function mod(output, left, data, diag, test, mids, rids, x) {
  var as = this._output,
      cache = this._cache,
      cids  = this._cids,
      cross = cache[x._id],
      tpls  = cross && cross.c,
      fltrd = !cross || cross.f,
      omod  = output.mod,
      orem  = output.rem,
      i, t, y, l, cid;

  // If we have cached values, iterate through them for lazy
  // removal, and to re-run the filter.
  if (tpls) {
    for (i=tpls.length-1; i>=0; --i) {
      t = tpls[i];
      l = x === t[as.left]; // Cache has tpls w/x both on left & right.
      y = l ? t[as.right] : t[as.left];
      cid = _cid(l, x, y);

      // Lazy removal: y was previously rem'd, so clean up the cache.
      if (!cache[y._id]) {
        cids[cid] = false;
        tpls.splice(i, 1);
        continue;
      }

      if (!test || test(t)) {
        if (mids[t._id]) continue;
        omod.push(t);
        mids[t._id] = 1;
      } else {
        if (!rids[t._id]) orem.push.apply(orem, tpls.splice(i, 1));
        rids[t._id] = 1;
        cids[cid] = false;
        cross.f = true;
      }
    }
  }

  // If we have a filter param, call add to catch any tuples that may
  // have previously been filtered.
  if (test && fltrd) add.call(this, output, left, data, diag, test, mids, x);
}

function rem(output, left, rids, x) {
  var as = this._output,
      cross = this._cache[x._id],
      cids  = this._cids,
      orem  = output.rem,
      i, len, t, y, l;
  if (!cross) return;

  for (i=0, len=cross.c.length; i<len; ++i) {
    t = cross.c[i];
    l = x === t[as.left];
    y = l ? t[as.right] : t[as.left];
    cids[_cid(l, x, y)] = false;
    if (!rids[t._id]) {
      orem.push(t);
      rids[t._id] = 1;
    }
  }

  this._cache[x._id] = null;
}

function purge(output, rids) {
  var cache = this._cache,
      keys  = dl.keys(cache),
      rem = output.rem,
      i, len, j, jlen, cross, t;

  for (i=0, len=keys.length; i<len; ++i) {
    cross = cache[keys[i]];
    for (j=0, jlen=cross.c.length; j<jlen; ++j) {
      t = cross.c[j];
      if (rids[t._id]) continue;
      rem.push(t);
      rids[t._id] = 1;
    }
  }

  this._cache = {};
  this._cids = {};
  this._lastWith = null;
}

prototype.batchTransform = function(input, data, reset) {
  log.debug(input, ['crossing']);

  var w = this.param('with'),
      diag = this.param('diagonal'),
      as = this._output,
      test = this.param('filter') || null,
      selfCross = (!w.name),
      woutput = selfCross ? input : w.source.last(),
      wdata   = selfCross ? data : w.source.values(),
      output  = ChangeSet.create(input),
      mids = {}, rids = {}; // Track IDs to prevent dupe mod/rem tuples.

  // If signal values (for diag or test) have changed, purge the cache
  // and re-run cross in batch mode. Otherwise stream cross values.
  if (reset) {
    purge.call(this, output, rids);
    data.forEach(add.bind(this, output, true, wdata, diag, test, mids));
    this._lastWith = woutput.stamp;
  } else {
    input.rem.forEach(rem.bind(this, output, true, rids));
    input.add.forEach(add.bind(this, output, true, wdata, diag, test, mids));

    if (woutput.stamp > this._lastWith) {
      woutput.rem.forEach(rem.bind(this, output, false, rids));
      woutput.add.forEach(add.bind(this, output, false, data, diag, test, mids));
      woutput.mod.forEach(mod.bind(this, output, false, data, diag, test, mids, rids));
      this._lastWith = woutput.stamp;
    }

    // Mods need to come after all removals have been run.
    input.mod.forEach(mod.bind(this, output, true, wdata, diag, test, mids, rids));
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
