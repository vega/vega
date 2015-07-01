vg.data.aggregate = (function() {

  var SUM = 1,
      AVG = 2,
      DEV = 4,
      MIN = 8,
      MAX = 16,
      VAL = 32;

  function Monoid(field) {
    this.field = field;
    this.ops = [];
    this.flags = 0;
    this.count = 0;
  }

  Monoid.prototype.clone = function() {
    var clone = new Monoid(this.field), k, v;
    for (k in this) {
      v = this[k];
      clone[k] = vg.isArray(v) ? v.slice() : v;
    }
    return clone;
  };

  Monoid.prototype.init = function(op) {
    if (op === 'sum') {
      this.flags |= SUM;
      this.sum = 0;
    }
    else if (op === 'avg') {
      this.flags |= AVG;
      this.avg = 0;
    }
    else if (op === 'var' || op === 'std') {
      this.flags |= DEV | AVG;
      this.avg = 0;
      this.dev = 0;
    }
    else if (op === 'min') {
      this.flags |= MIN;
      this.min = +Infinity;
    }
    else if (op === 'max') {
      this.flags |= MAX;
      this.max = -Infinity;
    }
    else if (op === 'median') {
      this.flags |= VAL;
      this.vals = [];
    }
    this.ops.push(op);
  };

  Monoid.prototype.update = function(v) {
    var m = this, f = m.flags, d;
    m.count += 1;
    if (f & SUM) { m.sum += v; }
    if (f & AVG) { d = (v - m.avg); m.avg += d / m.count; }
    if (f & DEV) { m.dev += d * (v - m.avg); }
    if (f & MIN) { m.min = v < m.min ? v : m.min; }
    if (f & MAX) { m.max = v > m.max ? v : m.max; }
    if (f & VAL) { m.vals.push(v); }
  };

  Monoid.prototype.value = function(op) {
    switch (op) {
      case 'sum': return this.sum;
      case 'avg': return this.avg;
      case 'var': return this.dev / (this.count - 1);
      case 'std': return Math.sqrt(this.dev / (this.count - 1));
      case 'min': return this.min;
      case 'max': return this.max;
      case 'median':
        var v = this.vals, n = v.length, hn = ~~(n/2);
        return n ? (n % 2 ? v[hn] : 0.5 * (v[hn-1] + v[hn])) : 0;
    }
  };

  Monoid.prototype.done = function(o) {
    if (this.vals) this.vals.sort(vg.numcmp);
    var ops = this.ops;
    for (var i=0; i<ops.length; ++i) {
      if (ops[i] === 'count') {
        o.count = this.count;
      } else {
        o[ops[i] + "_" + this.field] = this.value(ops[i]);
      }
    }
    return o;
  };

  return function() {
    var groupby = [],
  	    cells = {},
  	    monoids, gaccess, faccess;

    function cell(x) {
      var k = vg.keystr(gaccess.map(function(f) { return f(x); }));
      return cells[k] || (cells[k] = new_cell(x));
    }
    
    function new_cell(x) {
      var c = monoids.map(function(m) { return m.clone(); });
      c.data = {};
      for (i=0; i<groupby.length; ++i) {
        c.data[groupby[i]] = gaccess[i](x);
      }
      return c;
    }

    function aggregate(input) {
      var k, i, j, x, c;

      // compute aggregates
      for (i=0; i<input.length; ++i) {
        x = input[i];
        c = cell(x);
        for (j=0; j<c.length; ++j) {
          c[j].update(faccess[j](x));
  			}
      }

      // collect output tuples
      var output = [], index = 0;
      for (k in cells) {
        c = cells[k];
        for (i=0; i<c.length; ++i) {
          c[i].done(c.data);
  			}
        output.push({index: index++, data: c.data});
      }

      cells = {}; // clear internal state
      return output;
    }

    aggregate.fields = function(f) {
      var map = {};
      faccess = [];
      monoids = vg.array(f).reduce(function(m, x) {
        var xf = x.field, f;
        if (!map[xf]) {
          faccess.push(vg.accessor(xf));
          f = xf.indexOf("data.") === 0 ? xf.slice(5) : xf;
          m.push(map[xf] = new Monoid(f));
        }
        map[xf].init(x.op);
        return m;
      }, []);
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

})();