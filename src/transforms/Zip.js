define(function(require, exports, module) {
  var Transform = require('./Transform'),
      Collector = require('../dataflow/Collector'),
      util = require('../util/index');

  function Zip(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      with: {type: "data"},
      as:  {type: "string"},
      key: {type: "field", default: "data"},
      withKey: {type: "field", default: null},
      default: {type: "*"}
    });

    this._map = {};
    this._collector = new Collector(graph);
    this._lastJoin = 0;

    return this;
  }

  var proto = (Zip.prototype = new Transform());

  proto.__map = function(k) {
    return this._map[k] || (this._map[k] = []);
  };

  proto.transform = function(input) {
    var w = this.with.get(this._graph),
        wds = w.source,
        woutput = wds.last(),
        wdata = wds.values(),
        key = this.key.get(this._graph),
        withKey = this.withKey.get(this._graph),
        as = this.as.get(this._graph),
        dflt = this.default.get(this._graph),
        map = this.__map.bind(this);

    util.debug(input, ["zipping", w]);

    if(withKey.field) {
      if(woutput && woutput.stamp > this._lastJoin) {
        woutput.add.forEach(function(x) { 
          var m = map(withKey.accessor(x));
          if(m[0]) m[0][as] = x;
          m[1] = x; 
        });
        woutput.rem.forEach(function(x) {
          var m = map(withKey.accessor(x));
          if(m[0]) m[0][as] = dflt;
          m[1] = null;
        });
        
        // Only process woutput.mod tuples if the join key has changed.
        // Other field updates will auto-propagate via prototype.
        if(woutput.fields[withKey.field]) {
          woutput.mod.forEach(function(x) {
            var prev = withKey.accessor(x._prev);
            if(!prev) return;
            if(prev.stamp < this._lastJoin) return; // Only process new key updates

            var prevm = map(prev.value);
            if(prevm[0]) prevm[0][as] = dflt;
            prevm[1] = null;

            var m = map(withKey.accessor(x));
            if(m[0]) m[0][as] = x;
            m[1] = x;
          });
        }

        this._lastJoin = woutput.stamp;
      }
      
      input.add.forEach(function(x) {
        var m = map(key.accessor(x));
        x[as] = m[1] || dflt;
        m[0]  = x;
      });
      input.rem.forEach(function(x) { map(key.accessor(x))[0] = null; });

      if(input.fields[key.field]) {
        input.mod.forEach(function(x) {
          var prev = key.accessor(x._prev);
          if(!prev) return;
          if(prev.stamp < input.stamp) return; // Only process new key updates

          map(prev.value)[0] = null;
          var m = map(key.accessor(x));
          x[as] = m[1] || dflt;
          m[0]  = x;
        });
      }
    } else {
      // We only need to run a non-key-join again if we've got any add/rem
      // on input or woutput
      if(input.add.length == 0 && input.rem.length == 0 && 
          woutput.add.length == 0 && woutput.rem.length == 0) return input;

      // If we don't have a key-join, then we need to materialize both
      // data sources to iterate through them. 
      this._collector.evaluate(input);

      var data = this._collector.data(), 
          wlen = wdata.length, i;

      for(i = 0; i < data.length; i++) { data[i][as] = wdata[i%wlen]; }
    }

    return input;
  };

  return Zip;
});