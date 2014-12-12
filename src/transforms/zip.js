define(function(require, exports, module) {
  var util = require('../util/index'), 
      collector = require('../core/collector');

  return function zip(model) {
    var z = null,
        as = "zip",
        key = util.accessor("data"),
        defaultValue = undefined,
        withKey = null;

    var _map = {}, _data = collector(model), lastZip = 0;

    function map(k) {
      return map[k] || (map[k] = []);
    }

    var node = new model.Node(function(input) {
      util.debug(input, ["zipping", z]);

      var zds = model.data(z), zinput = zds._output, zdata = zds.values();

      if(withKey) {
        if(zinput && zinput.stamp > lastZip) {
          zinput.add.forEach(function(x) { 
            var m = map(withKey(x));
            if(m[0]) m[0][as] = x;
            m[1] = x; 
          });
          zinput.rem.forEach(function(x) {
            var m = map(withKey(x));
            if(m[0]) m[0][as] = defaultValue;
            m[1] = null;
          });
          // We shouldn't need to do anything with zinput.mod because references.
          lastZip = zinput.stamp;
        }
        
        input.add.forEach(function(x) {
          var m = map(key(x));
          // console.log(x.key, m, m[1] || defaultValue);
          x[as] = m[1] || defaultValue;
          m[0] = x;
        });
        input.rem.forEach(function(x) { map(key(x))[0] = null; });
        // We shouldn't need to do anything with input.mod.
      } else {
        // We only need to run a non-key-join again if we've got any add/rem
        // on input or zinput
        if(input.add.length == 0 && input.rem.length == 0 && 
            zinput.add.length == 0 && zinput.rem.length == 0) return input;

        // If we don't have a key-join, then we need to materialize both
        // data sources to iterate through them. 
        _data._fn(input);

        var data = _data.data(), zlen = zdata.length, i;

        for(i = 0; i < data.length; i++) { data[i][as] = zdata[i%zlen]; }
      }

      return input;
    });

    node["with"] = function(d) {
      var deps = node._deps.data,
          idx = deps.indexOf(z);

      if(idx > -1) deps.splice(idx, 1);
      z = d;
      deps.push(z);
      return node;
    };

    node["default"] = function(d) {
      defaultValue = d;
      return node;
    };

    node.as = function(name) {
      as = name;
      return node;
    };

    node.key = function(k) {
      key = util.accessor(k);
      return node;
    };

    node.withKey = function(k) {
      withKey = util.accessor(k);
      return node;
    };

    return node;
  };
});