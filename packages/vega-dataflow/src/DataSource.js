var dl = require('datalib'),
    log = require('vega-logging'),
    ChangeSet = require('./ChangeSet'),
    Collector = require('./Collector'),
    Tuple = require('./Tuple'),
    Node = require('./Node'); // jshint ignore:line

function DataSource(graph, name, facet) {
  this._graph = graph;
  this._name = name;
  this._data = [];
  this._source = null;
  this._facet  = facet;
  this._input  = ChangeSet.create();
  this._output = null; // Output changeset
  this._indexes = {};
  this._indexFields = [];

  this._inputNode  = null;
  this._outputNode = null;
  this._pipeline  = null; // Pipeline of transformations.
  this._collector = null; // Collector to materialize output of pipeline.
  this._mutates = false;  // Does any pipeline operator mutate tuples?
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
  this._input.add = this._input.add.concat(tuples.map(Tuple.ingest));
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
  if (!arguments.length) return this._collector.data();

  // Replace backing data
  this._input.rem = this._data.slice();
  if (data) { this.insert(data); }
  return this;
};

prototype.mutates = function(m) {
  if (!arguments.length) return this._mutates;
  this._mutates = this._mutates || m;
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

  var graph = this._graph,
      status;

  pipeline.unshift(this._inputNode = DataSourceInput(this));
  status = graph.preprocess(pipeline);

  if (status.router) {
    pipeline.push(status.collector = new Collector(graph));
  }

  pipeline.push(this._outputNode = DataSourceOutput(this));
  this._collector = status.collector;
  this._mutates = !!status.mutates;
  graph.connect(this._pipeline = pipeline);

  return this;
};

prototype.synchronize = function() {
  this._graph.synchronize(this._pipeline);
  return this;
};

prototype.getIndex = function(field) {
  var data = this.values(),
      indexes = this._indexes,
      fields  = this._indexFields,
      f = dl.$(field),
      index, i, len, value;

  if (!indexes[field]) {
    indexes[field] = index = {};
    fields.push(field);
    for (i=0, len=data.length; i<len; ++i) {
      value = f(data[i]);
      index[value] = (index[value] || 0) + 1;
      Tuple.prev_init(data[i]);
    }
  }
  return indexes[field];
};

prototype.listener = function() {
  return DataSourceListener(this).addListener(this._inputNode);
};

prototype.addListener = function(l) {
  if (l instanceof DataSource) {
    this._collector.addListener(l.listener());
  } else {
    this._outputNode.addListener(l);
  }
  return this;
};

prototype.removeListener = function(l) {
  this._outputNode.removeListener(l);
};

prototype.listeners = function(ds) {
  return (ds ? this._collector : this._outputNode).listeners();
};

// Input node applies the datasource's delta, and propagates it to
// the rest of the pipeline. It receives touches to reflow data.
function DataSourceInput(ds) {
  var input = new Node(ds._graph)
    .router(true)
    .collector(true);

  input.data = function() {
    return ds._data;
  };

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

    if (delta.sort) {
      ds._data.sort(delta.sort);
    }

    // if reflowing, add any other tuples not currently in changeset
    if (input.reflow) {
      delta.mod = delta.mod.concat(
        Tuple.idFilter(ds._data, delta.add, delta.mod, delta.rem));
    }

    // reset change list
    ds._input = ChangeSet.create();

    out.add = delta.add;
    out.mod = delta.mod;
    out.rem = delta.rem;
    out.facet = ds._facet;
    return out;
  };

  return input;
}

// Output node captures the last changeset seen by this datasource
// (needed for joins and builds) and materializes any nested data.
// If this datasource is faceted, materializes the values in the facet.
function DataSourceOutput(ds) {
  var output = new Node(ds._graph)
    .router(true)
    .reflows(true)
    .collector(true);

  function updateIndices(pulse) {
    var fields = ds._indexFields,
        i, j, f, key, index, value;

    for (i=0; i<fields.length; ++i) {
      key = fields[i];
      index = ds._indexes[key];
      f = dl.$(key);

      for (j=0; j<pulse.add.length; ++j) {
        value = f(pulse.add[j]);
        Tuple.prev_init(pulse.add[j]);
        index[value] = (index[value] || 0) + 1;
      }
      for (j=0; j<pulse.rem.length; ++j) {
        value = f(pulse.rem[j]);
        index[value] = (index[value] || 0) - 1;
      }
      for (j=0; j<pulse.mod.length; ++j) {
        value = f(pulse.mod[j]._prev);
        index[value] = (index[value] || 0) - 1;
        value = f(pulse.mod[j]);
        index[value] = (index[value] || 0) + 1;
      }
    }
  }

  output.data = function() {
    return ds._collector ? ds._collector.data() : ds._data;
  };

  output.evaluate = function(input) {
    log.debug(input, ['output', ds._name]);

    updateIndices(input);
    var out = ChangeSet.create(input, true);

    if (ds._facet) {
      ds._facet.values = ds.values();
      input.facet = null;
    }

    ds._output = input;
    out.data[ds._name] = 1;
    return out;
  };

  return output;
}

function DataSourceListener(ds) {
  var l = new Node(ds._graph).router(true);

  l.evaluate = function(input) {
    // Tuple derivation carries a cost. So only derive if the pipeline has
    // operators that mutate, and thus would override the source data.
    if (ds.mutates()) {
      var map = ds._srcMap || (ds._srcMap = {}), // to propagate tuples correctly
          output = ChangeSet.create(input);

      output.add = input.add.map(function(t) {
        return (map[t._id] = Tuple.derive(t));
      });

      output.mod = input.mod.map(function(t) {
        return Tuple.rederive(t, map[t._id]);
      });

      output.rem = input.rem.map(function(t) {
        var o = map[t._id];
        return (map[t._id] = null, o);
      });

      return (ds._input = output);
    } else {
      return (ds._input = input);
    }
  };

  return l;
}

module.exports = DataSource;
