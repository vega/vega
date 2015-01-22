define(function(require, exports, module) {
  var Node = require('./Node'),
      changeset = require('../core/changeset'),
      util = require('../util/index'),
      C = require('../util/collector');

  function Collector(graph) {
    Node.prototype.call(this, graph);

    this._data = [];
    this.router(true)
      .collector(true);
  }

  var proto = (Bin.prototype = new Node());

  proto.data = function() { return this._data; }

  proto.evaluate = function(input) {
    util.debug(input, ["collecting"]);

    if(input.touch) {
      input = changeset.create(input);
      input.mod = this._data.slice();
      return input;
    }

    if(input.rem.length) {
      var ids = input.rem.reduce(function(m,x) { return (m[x._id]=1, m); }, {});
      this._data = this._data.filter(function(x) { return ids[x._id] !== 1; });
    }

    if(input.add.length) {
      this._data = this._data.length ? this._data.concat(input.add) : input.add;
    }

    if(input.sort) {
      this._data.sort(input.sort);
    }

    return input;
  };
});