if (typeof vg === 'undefined') { vg = {}; }

// semantic versioning
vg.version = '1.0.0';

// type checking functions
var toString = Object.prototype.toString;

vg.isObject = function(obj) {
  return obj === Object(obj);
};

vg.isFunction = function(obj) {
  return toString.call(obj) == '[object Function]';
};

vg.isString = function(obj) {
  return toString.call(obj) == '[object String]';
};
  
vg.isArray = Array.isArray || function(obj) {
  return toString.call(obj) == '[object Array]';
};

vg.isNumber = function(obj) {
  return toString.call(obj) == '[object Number]';
};

vg.isBoolean = function(obj) {
  return toString.call(obj) == '[object Boolean]';
};

vg.number = function(s) { return +s; }

vg.boolean = function(s) { return !!s; }

// utility functions

vg.identity = function(x) { return x; };

vg.extend = function(obj) {
  for (var x, name, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (name in x) { obj[name] = x[name]; }
  }
  return obj;
};

vg.duplicate = function(obj) {
  return JSON.parse(JSON.stringify(obj));
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

vg.numcmp = function(a, b) { return a - b; };

vg.array = function(x) {
  return x != null ? (Array.isArray(x) ? x : [x]) : [];
};

vg.values = function(x) {
  return (vg.isObject(x) && !vg.isArray(x) && x.values) ? x.values : x;
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

// Colors

vg.category10 = [
	"#1f77b4",
	"#ff7f0e",
	"#2ca02c",
	"#d62728",
	"#9467bd",
	"#8c564b",
	"#e377c2",
	"#7f7f7f",
	"#bcbd22",
	"#17becf"
];

vg.category20 = [
	"#1f77b4",
	"#aec7e8",
	"#ff7f0e",
	"#ffbb78",
	"#2ca02c",
	"#98df8a",
	"#d62728",
	"#ff9896",
	"#9467bd",
	"#c5b0d5",
	"#8c564b",
	"#c49c94",
	"#e377c2",
	"#f7b6d2",
	"#7f7f7f",
	"#c7c7c7",
	"#bcbd22",
	"#dbdb8d",
	"#17becf",
	"#9edae5"
];

// Logging
vg.log = function(msg) {
  console.log(msg);
};

vg.error = function(msg) {
  console.log(msg);
  alert(msg);
};