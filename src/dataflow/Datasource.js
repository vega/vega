define(function(require, exports, module) {
  var changeset = require('./changeset'), 
      tuple = require('./tuple'), 
      Node = require('./Node'),
      Collector = require('./Collector'),
      util = require('../util/index'),
      C = require('../util/constants');
  
  function Datasource(graph, name, facet) {
    this._graph = graph;
    this._name = name;
    this._data = [];
    this._source = null;
    this._facet = facet;
    this._input = changeset.create();
    this._output = null;    // Output changeset

    this._pipeline  = null; // Pipeline of transformations.
    this._collector = null; // Collector to materialize output of pipeline
  };

  var proto = Datasource.prototype;

  proto.source = function(src) {
    if(!arguments.length) return this._source;
    this._source = this._graph.data(src);
    return this;
  };

  proto.add = function(d) {
    var add = this._input.add;
    add.push.apply(add, util.array(d).map(function(d) { return tuple.create(d); }));
    return this;
  };

  proto.remove = function(where) {
    var d = this._data.filter(where);
    this._input.rem.push.apply(this._input.rem, d);
    return this;
  };

  proto.update = function(where, field, func) {
    var mod = this._input.mod;
    this._input.fields[field] = 1;
    this._data.filter(where).forEach(function(x) {
      var prev = x[field],
          next = func(x);
      if (prev !== next) {
        tuple.prev(x, field);
        x.__proto__[field] = next;
        if(mod.indexOf(x) < 0) mod.push(x);
      }
    });
    return this;
  };

  proto.values = function(data) {
    if(!arguments.length)
      return this._collector ? this._collector.data() : this._data;

    // Replace backing data
    this._input.rem = this._data.slice();
    if (data) { this.add(data); }
    return this;
  };

  proto.last = function() { return this._output; }

  proto.fire = function(input) {
    if(input) this._input = input;
    this._graph.propagate(this._input, this._pipeline[0]); 
  };

  proto.pipeline = function(pipeline) {
    var ds = this, n, c;

    if(pipeline.length) {
      // If we have a pipeline, add a collector to the end to materialize
      // the output.
      ds._collector = new Collector(this._graph);
      pipeline.push(ds._collector);
    }

    // Input node applies the datasource's delta, and propagates it to 
    // the rest of the pipeline. It receives touches to reflow data.
    var input = new Node(this._graph)
      .router(true)
      .collector(true);

    input.evaluate = function(input) {
      util.debug(input, ["input", ds._name]);

      var delta = ds._input, 
          out = changeset.create(input);
      out.facet = ds._facet;

      if(input.reflow) {
        out.mod = ds._source ? ds._source.values().slice() : ds._data.slice();
      } else {
        // update data
        var delta = ds._input;
        var ids = util.tuple_ids(delta.rem);

        ds._data = ds._data
          .filter(function(x) { return ids[x._id] !== 1; })
          .concat(delta.add);

        // reset change list
        ds._input = changeset.create();

        out.add = delta.add; 
        out.rem = delta.rem;

        // Assign a timestamp to any updated tuples
        out.mod = delta.mod.map(function(x) { 
          var k;
          if(x._prev === C.SENTINEL) return x;
          for(k in x._prev) {
            if(x._prev[k].stamp === undefined) x._prev[k].stamp = input.stamp;
          }
          return x;
        }); 
      }

      return out;
    };

    pipeline.unshift(input);

    // Output node captures the last changeset seen by this datasource
    // (needed for joins and builds) and materializes any nested data.
    // If this datasource is faceted, materializes the values in the facet.
    var output = new Node(this._graph)
      .router(true)
      .collector(true);

    output.evaluate = function(input) {
      util.debug(input, ["output", ds._name]);
      var output = changeset.create(input, true);

      if(ds._facet) {
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

  proto.addListener = function(l) {
    if(l instanceof Datasource) {
      var source = this, dest = l;
      l = new Node(this._graph);
      l.evaluate = function(input) {
        dest._input = source._output;
        return input;
      };
      l.addListener(dest._pipeline[0]);
    }

    this._pipeline[this._pipeline.length-1].addListener(l);
  };

  proto.removeListener = function(l) {
    this._pipeline[this._pipeline.length-1].removeListener(l);
  };

  return Datasource;
});