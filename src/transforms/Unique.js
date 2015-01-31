define(function(require, exports, module) {
  var d3 = require('d3'),
      Transform = require('./Transform'),
      changeset = require('../dataflow/changeset'), 
      tuple = require('../dataflow/tuple'),
      util = require('../util/index'),
      C = require('../util/constants');

  var ADD = 1, MOD = 2;

  function Unique(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      on: {type: "field"},
      as: {type: "value"}
    });

    this._cache = {};
    return this.router(true).prev(true);
  }

  var proto = (Unique.prototype = new Transform());

  function rst(input, output) {
    var k, c;
    for(var k in this._cache) output.rem.push(this._cache[k].tuple);
    this._cache = {};
  };

  function add(val, cache, as) {
    var c, o;
    if((c = cache[val]) === undefined) {
      o = {};
      o[as] = val;

      cache[val] = {
        count: 1,
        tuple: tuple.create(o, null),
        state: ADD
      }
    } else {
      c.count += 1;
      c.state |= MOD;
    }
  }

  function rem(val, cache) {
    var c = cache[val];
    c.count -= 1;
    c.state |= MOD;
  }

  proto.transform = function(input, reset) {
    util.debug(input, ["uniques"]);

    var unique = this,
        output = changeset.create(input),
        on = this.on.get(this._graph),
        get = on.accessor,
        as = this.as.get(this._graph),
        cache = this._cache,
        k, c, x;

    if(reset) rst.call(this, input, output);

    input.add.forEach(function(x) { add(get(x), cache, as); });

    input.mod.forEach(function(x) {
      var prev, val = get(x);
      if(x._prev && (prev = get(x._prev)) !== undefined && val !== prev) {
        rem(prev, cache);
      }
      add(val, cache, as);
    });

    input.rem.forEach(function(x) { 
      var prev;
      if(x._prev && (prev = get(x._prev)) !== undefined) {
        rem(prev, cache);
      } else {
        rem(get(x), cache);
      }
    });

    for(var k in cache) {
      c = cache[k], x = c.tuple;
      if(c.count === 0) {
        if(c.state === MOD) output.rem.push(x);
        delete cache[k];
      } else if(c.state & ADD) {
        output.add.push(x);
      } else if(c.state & MOD) {
        output.mod.push(x);
      }
      c.state = 0;
    }

    return output;
  };

  return Unique;
});