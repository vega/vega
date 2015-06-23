var ChangeSet = require('./ChangeSet'),
    Tuple = require('./Tuple'),
    Base = require('./Node').prototype;

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
  if (input.reflow) {
    input = ChangeSet.create(input);
    input.mod = this._data.slice();
    return input;
  }

  if (input.rem.length) {
    this._data = Tuple.idFilter(this._data, input.rem);
  }

  if (input.add.length) {
    this._data = this._data.length ? this._data.concat(input.add) : input.add;
  }

  if (input.sort) {
    this._data.sort(input.sort);
  }

  return input;
};

module.exports = Collector;
