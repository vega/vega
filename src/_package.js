if (typeof vg === 'undefined') { vg = {}; }

vg.version = '1.0.0'; // semantic versioning

vg.identity = function(x) { return x; };

vg.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
};

vg.isObject = function(obj) {
  return obj === Object(obj);
};

vg.accessor = function(f) {
  return (typeof f === "function" || f == null) ? f : Array.isArray(f)
    ? function(x) { return f.reduce(function(x,f) { return x[f]; }, x); }
    : function(x) { return x[f]; };
};

vg.comparator = function(sort) {
  var sign = [];
  if (sort === undefined) sort = [];
  sort = vg.array(sort).map(function(f) {
    var s = 1;
    if (f[0] === "-") {
      s = -1; f = f.slice(1);
    } else if (field[0] === "+") {
      f = f.slice(1);
    }
    sign.push(s);
    return f;
  });
  return function(a,b) {
    var i, s;
    for (i=0; i<sort.length; ++i) {
      s = sort[i];
      if (a[s] < b[s]) return -1 * sign[i];
      if (a[s] > b[s]) return sign[i];
    }
    return 0;
  };
};

vg.array = function(x) {
  return x != null ? (Array.isArray(x) ? x : [x]) : [];
};

vg.str = function(str) {
  return Array.isArray(str)
    ? "[" + str.map(vg.str) + "]"
    : (typeof str === 'string') ? ("'"+str+"'") : str;
};

vg.keys = function(x) {
  var keys = [];
  for (var key in x) keys.push(key);
  return keys;
};

vg.unique = function(data, f) {
  f = f || vg.identity;
  var results = [], v;
  for (var i=0; i<data.length; ++i) {
    v = f(data[i]);
    if (results.indexOf(v) < 0) results.push(v);
  }
  return results;
};

vg.log = function(msg) {
  console.log(msg);
};

vg.error = function(msg) {
  console.log(msg);
  alert(msg);
};