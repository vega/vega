define(function(require, exports, module) {
  var tuple = require('../dataflow/tuple'),
      quickselect = require('../util/quickselect'),
      C = require('../util/constants');

  var types = {
    "count": measure({
      name: "count",
      init: "this.cnt = 0;",
      add:  "this.cnt += 1;",
      rem:  "this.cnt -= 1;",
      set:  "this.cnt"
    }),
    "sum": measure({
      name: "sum",
      init: "this.sum = 0;",
      add:  "this.sum += v;",
      rem:  "this.sum -= v;",
      set:  "this.sum"
    }),
    "avg": measure({
      name: "avg",
      init: "this.avg = 0;",
      add:  "var d = v - this.avg; this.avg += d / this.cnt;",
      rem:  "var d = v - this.avg; this.avg -= d / this.cnt;",
      set:  "this.avg",
      req:  ["count"], idx: 1
    }),
    "var": measure({
      name: "var",
      init: "this.dev = 0;",
      add:  "this.dev += d * (v - this.avg);",
      rem:  "this.dev -= d * (v - this.avg);",
      set:  "this.dev / (this.cnt-1)",
      req:  ["avg"], idx: 2
    }),
    "varp": measure({
      name: "varp",
      init: "",
      add:  "",
      rem:  "",
      set:  "this.dev / this.cnt",
      req:  ["var"], idx: 3
    }),
    "stdev": measure({
      name: "stdev",
      init: "",
      add:  "",
      rem:  "",
      set:  "Math.sqrt(this.dev / (this.cnt-1))",
      req:  ["var"], idx: 4
    }),
    "stdevp": measure({
      name: "stdevp",
      init: "",
      add:  "",
      rem:  "",
      set:  "Math.sqrt(this.dev / this.cnt)",
      req:  ["var"], idx: 5
    }),
    "median": measure({
      name: "median",
      init: "this.val = []; this.cnts = {};",
      add:  "this.cnts[v] = ++this.cnts[v] || 1; " +
            "if(this.val) this.val.push(v); ",
      rem:  "--this.cnts[v]; this.val = null;",
      set:  "this.sel(~~(this.cnt/2), this.val, this.cnts)",
      req: ["count"], idx: 6
    }),
    "min": measure({
      name: "min",
      init: "",
      add: "",
      rem: "",
      set: "this.sel(0, this.val, this.cnts)",
      req: ["median"]
    }),
    "max": measure({
      name: "max",
      init: "",
      add: "",
      rem: "",
      set: "this.sel(this.cnt-1, this.val, this.cnts)",
      req: ["median"]
    })
  };

  function measure(base) {
    return function(out) {
      var m = Object.create(base);
      m.out = out || base.name;
      if (!m.idx) m.idx = 0;
      return m;
    };
  }

  function resolve(agg) {
    function collect(m, a) {
      (a.req || []).forEach(function(r) {
        if (!m[r]) collect(m, m[r] = types[r]());
      });
      return m;
    }
    var map = agg.reduce(collect,
      agg.reduce(function(m, a) { return (m[a.name] = a, m); }, {}));
    var all = [];
    for (var k in map) all.push(map[k]);
    all.sort(function(a,b) { return a.idx - b.idx; });
    return all;
  }

  function compile(agg) {
    var all = resolve(agg),
        ctr = "this.flg = this.ADD; this.tpl = t;",
        add = "",
        rem = "",
        set = "var t = this.tpl;";
    
    all.forEach(function(a) { ctr += a.init; add += a.add; rem += a.rem; });
    agg.forEach(function(a) { set += "this.tuple.set(t,'"+a.out+"',"+a.set+");"; });
    add += "this.flg |= this.MOD;"
    rem += "this.flg |= this.MOD;"
    set += "return t;"

    ctr = Function("t", ctr);
    ctr.prototype.ADD = C.ADD_CELL;
    ctr.prototype.MOD = C.MOD_CELL;
    ctr.prototype.add = Function("v", add);
    ctr.prototype.rem = Function("v", rem);
    ctr.prototype.set = Function("stamp", set);
    ctr.prototype.mod = mod;
    ctr.prototype.sel = quickselect;
    ctr.prototype.tuple = tuple;
    return ctr;
  }

  function mod(v_new, v_old) {
    if (v_old === undefined || v_old === v_new) return;
    this.rem(v_old);
    this.add(v_new);
  };

  types.create = compile;
  return types;
});