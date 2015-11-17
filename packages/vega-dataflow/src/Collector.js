var log = require('vega-logging'),
    Tuple = require('./Tuple'),
    Base = require('./Node').prototype,
    ChangeSet = require('./ChangeSet');

function Collector(graph) {
  Base.init.call(this, graph);
  this._data = [];
  this.router(true).collector(true);
}

var prototype = (Collector.prototype = Object.create(Base));
prototype.constructor = Collector;

prototype.data = function() {
  return this._data;
};

prototype.evaluate = function(input) {
  log.debug(input, ["collecting"]);

  // Create a new output changeset to prevent pollution when the Graph
  // merges reflow and regular changesets.
  var output = ChangeSet.create(input);

  if (input.rem.length) {
    this._data = Tuple.idFilter(this._data, input.rem);
    output.rem = input.rem.slice(0);
  }

  if (input.add.length) {
    this._data = this._data.concat(input.add);
    output.add = input.add.slice(0);
  }

  if (input.mod.length) {
    output.mod = input.mod.slice(0);
  }

  if (input.sort) {
    this._data.sort(input.sort);
  }

  if (input.reflow) {
    output.mod = output.mod.concat(
      Tuple.idFilter(this._data, output.add, output.mod, output.rem));
    output.reflow = false;
  }

  return output;
};

module.exports = Collector;