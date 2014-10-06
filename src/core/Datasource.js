define(function(require, exports, module) {
  var changeset = require('./changeset'), 
      tuple = require('./tuple'), 
      collector = require('../transforms/collector');

  return function(model) {
    function Datasource(name, facet) {
      this._name = name;
      this._data = [];
      this._facet = facet;
      this._input = changeset.create();
      this._output = null;    // Output changeset

      this._pipeline  = null; // Pipeline of transformations.
      this._collector = null; // Collector to materialize output of pipeline
    };

    Datasource.prototype.add = function(d) {
      var add = this._input.add;
      add.push.apply(add, d.map(function(d) { return tuple.create(d); }));
      return this;
    };

    Datasource.prototype.remove = function(where) {
      var d = this._data.filter(where);
      this._input.rem.push.apply(this._input.rem, d);
      return this;
    };

    Datasource.prototype.update = function(where, field, func) {
      var mod = this._input.mod;
      this._input.fields[field] = 1;
      this._data.filter(where).forEach(function(x) {
        var prev = x[field],
            next = func(x);
        if (prev !== next) {
          x.__proto__[field] = next;
          x._prev[field] || (x._prev[field] = {});
          x._prev[field].value = prev;
          mod.push(x);
        }
      });
      return this;
    };

    Datasource.prototype.data = function(data) {
      if(!arguments.length)
        return this._collector ? this._collector.data() : this._data;

      // Replace backing data
      this._input.rem = this._data.slice();
      if (data) { this.add(data); }
      return this;
    };

    Datasource.prototype.fire = function() {
      model.graph.propagate(this._input, this._pipeline[0]); 
    };

    Datasource.prototype.pipeline = function(pipeline) {
      var ds = this, n, c;

      if(pipeline.length) {
        // If we have a pipeline, add a collector to the end to materialize
        // the output.
        ds._collector = collector(model, pipeline);
        pipeline.push(ds._collector);
      }

      // Input node applies the datasource's delta, and propagates it to 
      // the rest of the pipeline. It receives touches to propagate data.
      var input = new model.Node(function(input) {
        global.debug(input, ["input", ds._name]);

        var delta = ds._input, out = changeset.create(input);
        out.facet = ds._facet;

        if(input.touch) {
          out.mod = ds._data.slice();
        } else {
          // update data
          var delta = ds._input;
          var ids = delta.rem.reduce(function(m,x) {
            return (m[x._id] = 1, m);
          }, {});

          ds._data = ds._data
            .filter(function(x) { return ids[x._id] !== 1; })
            .concat(delta.add);

          // reset change list
          ds._input = changeset.create();

          out.add = delta.add, out.mod = delta.mod, out.rem = delta.rem;
        }

        return out;
      });
      input._type = 'input';
      input._router = true;
      input._touchable = true;
      pipeline.unshift(input);
      model.addListener(input);

      // Output node puts this datasource's output data into the Model.db.
      // Downstream nodes will pull from there. This is important to prevent
      // glitches. 
      var output = new model.Node(function(input) {
        global.debug(input, ["output", ds._name]);

        ds._output = input;

        var out = changeset.create(input, true);
        out.data[ds._name] = 1;
        return out;
      });
      output._type = 'output';
      output._router = true;
      output._touchable = true;
      pipeline.push(output);

      ds._pipeline = pipeline;
      model.graph.connect(ds._pipeline);
      return this;
    };

    Datasource.prototype.addListener = function(l) {
      this._pipeline[this._pipeline.length-1].addListener(l);
    };

    Datasource.prototype.removeListener = function(l) {
      this._pipeline[this._pipeline.length-1].removeListener(l);
    };

    return Datasource;
  }
});