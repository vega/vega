var Transform = require('./Transform'),
    Collector = require('../dataflow/Collector'),
    debug = require('../util/debug'),
    tuple = require('../dataflow/tuple'),
    changeset = require('../dataflow/changeset');

function Cross(graph) {
  Transform.prototype.init.call(this, graph);
  Transform.addParameters(this, {
    with: {type: "data"},
    diagonal: {type: "value", default: "true"}
  });

  this._output = {"left": "a", "right": "b"};
  this._collector = new Collector(graph);
  this._lastRem  = null; // Most recent stamp that rem occured. 
  this._lastWith = null; // Last time we crossed w/withds.
  this._ids   = {};
  this._cache = {};

  return this.router(true);
}

var proto = (Cross.prototype = new Transform());

// Each cached incoming tuple also has a stamp to track if we need to do
// lazy filtering of removed tuples.
function cache(x, t) {
  var c = this._cache[x._id] = this._cache[x._id] || {c: [], s: this._stamp};
  c.c.push(t);
}

function add(output, left, wdata, diag, x) {
  var data = left ? wdata : this._collector.data(), // Left tuples cross w/right.
      i = 0, len = data.length,
      prev  = x._prev !== undefined ? null : undefined, 
      t, y, id;

  for(; i<len; ++i) {
    y = data[i];
    id = left ? x._id+"_"+y._id : y._id+"_"+x._id;
    if(this._ids[id]) continue;
    if(x._id == y._id && !diag) continue;

    t = tuple.ingest({}, prev);
    t[this._output.left]  = left ? x : y;
    t[this._output.right] = left ? y : x;
    output.add.push(t);
    cache.call(this, x, t);
    cache.call(this, y, t);
    this._ids[id] = 1;
  }
}

function mod(output, left, x) {
  var cross = this,
      c = this._cache[x._id];

  if(this._lastRem > c.s) {  // Removed tuples haven't been filtered yet
    c.c = c.c.filter(function(y) {
      var t = y[cross._output[left ? "right" : "left"]];
      return cross._cache[t._id] !== null;
    });
    c.s = this._lastRem;
  }

  output.mod.push.apply(output.mod, c.c);
}

function rem(output, x) {
  output.rem.push.apply(output.rem, this._cache[x._id].c);
  this._cache[x._id] = null;
  this._lastRem = this._stamp;
}

function upFields(input, output) {
  if(input.add.length || input.rem.length) {
    output.fields[this._output.left]  = 1; 
    output.fields[this._output.right] = 1;
  }
}

proto.transform = function(input) {
  debug(input, ["crossing"]);

  // Materialize the current datasource. TODO: share collectors
  this._collector.evaluate(input);

  var w = this.with.get(this._graph),
      diag = this.diagonal.get(this._graph),
      selfCross = (!w.name),
      data = this._collector.data(),
      woutput = selfCross ? input : w.source.last(),
      wdata   = selfCross ? data : w.source.values(),
      output  = changeset.create(input),
      r = rem.bind(this, output); 

  input.rem.forEach(r);
  input.add.forEach(add.bind(this, output, true, wdata, diag));

  if(!selfCross && woutput.stamp > this._lastWith) {
    woutput.rem.forEach(r);
    woutput.add.forEach(add.bind(this, output, false, data, diag));
    woutput.mod.forEach(mod.bind(this, output, false));
    upFields.call(this, woutput, output);
    this._lastWith = woutput.stamp;
  }

  // Mods need to come after all removals have been run.
  input.mod.forEach(mod.bind(this, output, true));
  upFields.call(this, input, output);

  return output;
};

module.exports = Cross;