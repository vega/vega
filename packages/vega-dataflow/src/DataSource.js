var log = require('vega-logging'),
    ChangeSet = require('./ChangeSet'), 
    Collector = require('./Collector'),
    Tuple = require('./Tuple'),
    Node = require('./Node'), // jshint ignore:line
    SENTINEL = require('./Sentinel');

function DataSource(graph, name, facet) {
  this._graph = graph;
  this._name = name;
  this._data = [];
  this._source = null;
  this._facet = facet;
  this._input = ChangeSet.create();
  this._output = null; // Output changeset

  this._pipeline  = null; // Pipeline of transformations.
  this._collector = null; // Collector to materialize output of pipeline
  this._revises = false;  // Does any pipeline operator need to track prev?
}

var prototype = DataSource.prototype;

prototype.name = function(name) {
  if (!arguments.length) return this._name;
  return (this._name = name, this);
};

prototype.source = function(src) {
  if (!arguments.length) return this._source;
  return (this._source = this._graph.data(src));
};

prototype.insert = function(tuples) {
  var prev = this._revises ? null : undefined;
  var insert = tuples.map(function(d) {
    return Tuple.ingest(d, prev);
  });

  this._input.add = this._input.add.concat(insert);
  return this;
};

prototype.remove = function(where) {
  var remove = this._data.filter(where);
  this._input.rem = this._input.rem.concat(remove);
  return this;
};

prototype.update = function(where, field, func) {
  var mod = this._input.mod,
      ids = Tuple.idMap(mod);

  this._input.fields[field] = 1;

  this._data.filter(where).forEach(function(x) {
    var prev = x[field],
        next = func(x);
    if (prev !== next) {
      Tuple.set(x, field, next);
      if (ids[x._id] !== 1) {
        mod.push(x);
        ids[x._id] = 1;
      }
    }
  });

  return this;
};

prototype.values = function(data) {
  if (!arguments.length) {
    return this._collector ? this._collector.data() : this._data;
  }

  // Replace backing data
  this._input.rem = this._data.slice();
  if (data) { this.insert(data); }
  return this;
};

function set_prev(d) {
  if (d._prev === undefined) d._prev = SENTINEL;
}

prototype.revises = function(p) {
  if (!arguments.length) return this._revises;

  // If we've not needed prev in the past, but a new dataflow node needs it now
  // ensure existing tuples have prev set.
  if (!this._revises && p) {
    this._data.forEach(set_prev);

    // New tuples that haven't yet been merged into _data
    this._input.add.forEach(set_prev); 
  }

  this._revises = this._revises || p;
  return this;
};

prototype.last = function() {
  return this._output;
};

prototype.fire = function(input) {
  if (input) this._input = input;
  this._graph.propagate(this._input, this._pipeline[0]);
  return this;
};

prototype.pipeline = function(pipeline) {
  if (!arguments.length) return this._pipeline;

  var ds = this;

  // Add a collector to materialize the output of pipeline operators.
  if (pipeline.length) {
    ds._collector = new Collector(this._graph);
    pipeline.push(ds._collector);
    ds._revises = pipeline.some(function(p) { return p.revises(); });
  }

  // Input/output nodes masquerade as collector nodes, so they need to
  // have a `data` function. dsData is used if a collector isn't available.
  function dsData() { return ds._data; }

  // Input node applies the datasource's delta, and propagates it to 
  // the rest of the pipeline. It receives touches to reflow data.
  var input = new Node(this._graph)
    .router(true)
    .collector(true);

  input.data = dsData;

  input.evaluate = function(input) {
    log.debug(input, ['input', ds._name]);

    var delta = ds._input, 
        out = ChangeSet.create(input), f;

    // Delta might contain fields updated through API
    for (f in delta.fields) {
      out.fields[f] = 1;
    }

    // update data
    if (delta.rem.length) {
      ds._data = Tuple.idFilter(ds._data, delta.rem);
    }

    if (delta.add.length) {
      ds._data = ds._data.concat(delta.add);
    }

    // if reflowing, add any other tuples not currently in changeset
    if (input.reflow) {
      delta.mod = delta.mod.concat(Tuple.idFilter(ds._data,
        delta.add, delta.mod, delta.rem));
    }

    // reset change list
    ds._input = ChangeSet.create();

    out.add = delta.add; 
    out.mod = delta.mod;
    out.rem = delta.rem;
    out.facet = ds._facet;
    return out;
  };

  pipeline.unshift(input);

  // Output node captures the last changeset seen by this datasource
  // (needed for joins and builds) and materializes any nested data.
  // If this datasource is faceted, materializes the values in the facet.
  var output = new Node(this._graph)
    .router(true)
    .reflows(true)
    .collector(true);

  output.data = ds._collector ?
    ds._collector.data.bind(ds._collector) :
    dsData;

  output.evaluate = function(input) {
    log.debug(input, ['output', ds._name]);

    var output = ChangeSet.create(input, true);

    if (ds._facet) {
      ds._facet.values = ds.values();
      input.facet = null;
    }

    ds._output = input;
    output.data[ds._name] = 1;
    return output;
  };

  pipeline.push(output);

  this._pipeline = pipeline;
  this._graph.connect(ds._pipeline);
  return this;
};

prototype.finalize = function() {
  if (!this._revises) return;
  for (var i=0, n=this._data.length; i<n; ++i) {
    var x = this._data[i];
    x._prev = (x._prev === undefined) ? undefined : SENTINEL;
  }
};

prototype.listener = function() { 
  var l = new Node(this._graph).router(true),
      dest = this,
      prev = this._revises ? null : undefined;

  l.evaluate = function(input) {
    dest._srcMap = dest._srcMap || {}; // to propagate tuples correctly
    var map = dest._srcMap,
        output  = ChangeSet.create(input);

    output.add = input.add.map(function(t) {
      var d = Tuple.derive(t, t._prev !== undefined ? t._prev : prev);
      return (map[t._id] = d);
    });

    output.mod = input.mod.map(function(t) {
      return map[t._id];
    });

    output.rem = input.rem.map(function(t) { 
      var o = map[t._id];
      map[t._id] = null;
      return o;
    });

    return (dest._input = output);
  };

  l.addListener(this._pipeline[0]);
  return l;
};

prototype.addListener = function(l) {
  if (l instanceof DataSource) {
    if (this._collector) {
      this._collector.addListener(l.listener());
    } else {
      this._pipeline[0].addListener(l.listener());
    }
  } else {
    this._pipeline[this._pipeline.length-1].addListener(l);      
  }

  return this;
};

prototype.removeListener = function(l) {
  this._pipeline[this._pipeline.length-1].removeListener(l);
};

prototype.listeners = function(ds) {
  if (ds) {
    return this._collector ?
      this._collector.listeners() :
      this._pipeline[0].listeners();
  } else {
    return this._pipeline[this._pipeline.length-1].listeners();
  }
};

module.exports = DataSource;
