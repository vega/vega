vg.data.aggregate = function() {
  var groupby = [],
      fields = [],
      gaccess,
      faccess;

  var OPS = {
    "count": function() {},
		"sum": function(c, s, x) { return s + x; },
		"avg": function(c, s, x) { return s + (x-s)/c.count; },
		"min": function(c, s, x) { return x < s ? x : s; },
		"max": function(c, s, x) { return x > s ? x : s; }
	};
	OPS.min.init = function() { return +Infinity; }
	OPS.max.init = function() { return -Infinity; }

	function fkey(x) {
		return x.op + "_" + x.field;
	}

	var cells = {};

  function cell(x) {
    // consider other key constructions...
    var k = gaccess.reduce(function(v,f) {
      return (v.push(f(x)), v);
    }, []).join("|");
    return cells[k] || (cells[k] = new_cell(x));
  }

  function new_cell(x) {
    var o = {};
    // dimensions
    for (var i=0, f; i<groupby.length; ++i) {
      o[groupby[i]] = gaccess[i](x);
    }
    // measures
    o.count = 0;
		for (i=0; i<fields.length; ++i) {
		  if (fields[i].op === "count") continue;
		  var op = OPS[fields[i].op];
			o[fkey(fields[i])] = op.init ? op.init() : 0;
		}
    return o;
  }

  function aggregate(input) {
    var output = [], k;
		var keys = fields.map(fkey);
		var ops = fields.map(function(x) { return OPS[x.op]; });

    // compute aggregates
    input.forEach(function(x) {
      var c = cell(x);

			// compute aggregates...
      c.count += 1;
			for (var i=0; i<fields.length; ++i) {
				c[keys[i]] = ops[i](c, c[keys[i]], faccess[i](x));
			}
    });
    // collect output tuples
    var index = 0;
    for (k in cells) {
      output.push({index:index++, data:cells[k]});
    }
    cells = {}; // clear internal state
    return output;
  };

  aggregate.fields = function(f) {
    fields = vg.array(f);
    faccess = fields.map(function(x,i) {
      var xf = x.field;
      if (xf.indexOf("data.") === 0) {
        fields[i] = {op:x.op, field:xf.slice(5)};
      }
      return vg.accessor(xf);
    });
    return aggregate;
  };

  aggregate.groupby = function(f) {
    groupby = vg.array(f);
    gaccess = groupby.map(function(x,i) {
      if (x.indexOf("data.") === 0) {
        groupby[i] = x.slice(5);
      }
      return vg.accessor(x);
    });
    return aggregate;
  };

  return aggregate;
};