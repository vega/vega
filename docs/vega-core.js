(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-request'), require('d3-dsv'), require('topojson'), require('d3-time-format'), require('d3-array'), require('d3-shape'), require('d3-path'), require('d3-scale'), require('d3-scale-chromatic'), require('d3-interpolate'), require('d3-time'), require('d3-format'), require('d3-geo'), require('d3-force'), require('d3-collection'), require('d3-hierarchy'), require('d3-voronoi'), require('d3-color')) :
	typeof define === 'function' && define.amd ? define(['exports', 'd3-request', 'd3-dsv', 'topojson', 'd3-time-format', 'd3-array', 'd3-shape', 'd3-path', 'd3-scale', 'd3-scale-chromatic', 'd3-interpolate', 'd3-time', 'd3-format', 'd3-geo', 'd3-force', 'd3-collection', 'd3-hierarchy', 'd3-voronoi', 'd3-color'], factory) :
	(factory((global.vega = global.vega || {}),global.d3,global.d3,global.topojson,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Request,d3Dsv,topojson,d3TimeFormat,d3Array,d3Shape,d3Path,$,_,$$1,d3Time,d3Format,d3Geo,d3Force,d3Collection,d3Hierarchy,d3Voronoi,d3Color) { 'use strict';

var accessor = function(fn, fields, name) {
  fn.fields = fields || [];
  fn.fname = name;
  return fn;
};

function accessorName(fn) {
  return fn == null ? null : fn.fname;
}

function accessorFields(fn) {
  return fn == null ? null : fn.fields;
}

var error$1 = function(message) {
  throw Error(message);
};

var splitAccessPath = function(p) {
  var path$$1 = [],
      q = null,
      b = 0,
      n = p.length,
      s = '',
      i, j, c;

  p = p + '';

  function push() {
    path$$1.push(s + p.substring(i, j));
    s = '';
    i = j + 1;
  }

  for (i=j=0; j<n; ++j) {
    c = p[j];
    if (c === '\\') {
      s += p.substring(i, j);
      i = ++j;
    } else if (c === q) {
      push();
      q = null;
      b = -1;
    } else if (q) {
      continue;
    } else if (i === b && c === '"') {
      i = j + 1;
      q = c;
    } else if (i === b && c === "'") {
      i = j + 1;
      q = c;
    } else if (c === '.' && !b) {
      if (j > i) {
        push();
      } else {
        i = j + 1;
      }
    } else if (c === '[') {
      if (j > i) push();
      b = i = j + 1;
    } else if (c === ']') {
      if (!b) error$1('Access path missing open bracket: ' + p);
      if (b > 0) push();
      b = 0;
      i = j + 1;
    }
  }

  if (b) error$1('Access path missing closing bracket: ' + p);
  if (q) error$1('Access path missing closing quote: ' + p);

  if (j > i) {
    j++;
    push();
  }

  return path$$1;
};

var isArray = Array.isArray;

var isObject = function(_$$1) {
  return _$$1 === Object(_$$1);
};

var isString = function(_$$1) {
  return typeof _$$1 === 'string';
};

function $$2(x) {
  return isArray(x) ? '[' + x.map($$2) + ']'
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
}

var field = function(field, name) {
  var path$$1 = splitAccessPath(field),
      code = 'return _[' + path$$1.map($$2).join('][') + '];';

  return accessor(
    Function('_', code),
    [(field = path$$1.length===1 ? path$$1[0] : field)],
    name || field
  );
};

var empty = [];

var id = field('id');

var identity = accessor(function(_$$1) { return _$$1; }, empty, 'identity');

var zero = accessor(function() { return 0; }, empty, 'zero');

var one = accessor(function() { return 1; }, empty, 'one');

var truthy = accessor(function() { return true; }, empty, 'true');

var falsy = accessor(function() { return false; }, empty, 'false');

function log(method, level, input) {
  var args = [level].concat([].slice.call(input));
  console[method].apply(console, args); // eslint-disable-line no-console
}

var None  = 0;
var Error$1 = 1;
var Warn  = 2;
var Info  = 3;
var Debug = 4;

var logger = function(_$$1) {
  var level = _$$1 || None;
  return {
    level: function(_$$1) {
      if (arguments.length) {
        level = +_$$1;
        return this;
      } else {
        return level;
      }
    },
    error: function() {
      if (level >= Error$1) log('error', 'ERROR', arguments);
      return this;
    },
    warn: function() {
      if (level >= Warn) log('warn', 'WARN', arguments);
      return this;
    },
    info: function() {
      if (level >= Info) log('log', 'INFO', arguments);
      return this;
    },
    debug: function() {
      if (level >= Debug) log('log', 'DEBUG', arguments);
      return this;
    }
  }
};

var peek = function(array) {
  return array[array.length - 1];
};

var toNumber = function(_$$1) {
  return _$$1 == null || _$$1 === '' ? null : +_$$1;
};

function exp(sign) {
  return function(x) { return sign * Math.exp(x); };
}

function log$1(sign) {
  return function(x) { return Math.log(sign * x); };
}

function pow(exponent) {
  return function(x) {
    return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
  };
}

function pan(domain, delta, lift, ground) {
  var d0 = lift(domain[0]),
      d1 = lift(peek(domain)),
      dd = (d1 - d0) * delta;

  return [
    ground(d0 - dd),
    ground(d1 - dd)
  ];
}

function panLinear(domain, delta) {
  return pan(domain, delta, toNumber, identity);
}

function panLog(domain, delta) {
  var sign = Math.sign(domain[0]);
  return pan(domain, delta, log$1(sign), exp(sign));
}

function panPow(domain, delta, exponent) {
  return pan(domain, delta, pow(exponent), pow(1/exponent));
}

function zoom(domain, anchor, scale, lift, ground) {
  var d0 = lift(domain[0]),
      d1 = lift(peek(domain)),
      da = anchor != null ? lift(anchor) : (d0 + d1) / 2;

  return [
    ground(da + (d0 - da) * scale),
    ground(da + (d1 - da) * scale)
  ];
}

function zoomLinear(domain, anchor, scale) {
  return zoom(domain, anchor, scale, toNumber, identity);
}

function zoomLog(domain, anchor, scale) {
  var sign = Math.sign(domain[0]);
  return zoom(domain, anchor, scale, log$1(sign), exp(sign));
}

function zoomPow(domain, anchor, scale, exponent) {
  return zoom(domain, anchor, scale, pow(exponent), pow(1/exponent));
}

var array = function(_$$1) {
  return _$$1 != null ? (isArray(_$$1) ? _$$1 : [_$$1]) : [];
};

var isFunction = function(_$$1) {
  return typeof _$$1 === 'function';
};

var compare = function(fields, orders) {
  var idx = [],
      cmp = (fields = array(fields)).map(function(f, i) {
        if (f == null) {
          return null;
        } else {
          idx.push(i);
          return isFunction(f) ? f
            : splitAccessPath(f).map($$2).join('][');
        }
      }),
      n = idx.length - 1,
      ord = array(orders),
      code = 'var u,v;return ',
      i, j, f, u, v, d, t, lt, gt;

  if (n < 0) return null;

  for (j=0; j<=n; ++j) {
    i = idx[j];
    f = cmp[i];

    if (isFunction(f)) {
      d = 'f' + i;
      u = '(u=this.' + d + '(a))';
      v = '(v=this.' + d + '(b))';
      (t = t || {})[d] = f;
    } else {
      u = '(u=a['+f+'])';
      v = '(v=b['+f+'])';
    }

    d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';

    if (ord[i] !== 'descending') {
      gt = 1;
      lt = -1;
    } else {
      gt = -1;
      lt = 1;
    }

    code += '(' + u+'<'+v+'||u==null)&&v!=null?' + lt
      + ':(u>v||v==null)&&u!=null?' + gt
      + ':'+d+'!==u&&v===v?' + lt
      + ':v!==v&&u===u?' + gt
      + (i < n ? ':' : ':0');
  }

  f = Function('a', 'b', code + ';');
  if (t) f = f.bind(t);

  fields = fields.reduce(function(map, field) {
    if (isFunction(field)) {
      (accessorFields(field) || []).forEach(function(_$$1) { map[_$$1] = 1; });
    } else if (field != null) {
      map[field + ''] = 1;
    }
    return map;
  }, {});

  return accessor(f, Object.keys(fields));
};

var constant = function(_$$1) {
  return isFunction(_$$1) ? _$$1 : function() { return _$$1; };
};

var debounce = function(delay, handler) {
  var tid, evt;

  function callback() {
    handler(evt);
    tid = evt = null;
  }

  return function(e) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  };
};

var extend = function(_$$1) {
  for (var x, k, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (k in x) { _$$1[k] = x[k]; }
  }
  return _$$1;
};

var extentIndex = function(array, f) {
  var i = -1,
      n = array.length,
      a, b, c, u, v;

  if (f == null) {
    while (++i < n) {
      b = array[i];
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    u = v = i;
    while (++i < n) {
      b = array[i];
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  } else {
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null && b >= b) {
        a = c = b;
        break;
      }
    }
    u = v = i;
    while (++i < n) {
      b = f(array[i], i, array);
      if (b != null) {
        if (a > b) {
          a = b;
          u = i;
        }
        if (c < b) {
          c = b;
          v = i;
        }
      }
    }
  }

  return [u, v];
};

var NULL = {};

var fastmap = function(input) {
  var obj = {},
      map,
      test;

  function has(key) {
    return obj.hasOwnProperty(key) && obj[key] !== NULL;
  }

  map = {
    size: 0,
    empty: 0,
    object: obj,
    has: has,
    get: function(key) {
      return has(key) ? obj[key] : undefined;
    },
    set: function(key, value) {
      if (!has(key)) {
        ++map.size;
        if (obj[key] === NULL) --map.empty;
      }
      obj[key] = value;
      return this;
    },
    delete: function(key) {
      if (has(key)) {
        --map.size;
        ++map.empty;
        obj[key] = NULL;
      }
      return this;
    },
    clear: function() {
      map.size = map.empty = 0;
      map.object = obj = {};
    },
    test: function(_$$1) {
      if (arguments.length) {
        test = _$$1;
        return map;
      } else {
        return test;
      }
    },
    clean: function() {
      var next = {},
          size = 0,
          key, value;
      for (key in obj) {
        value = obj[key];
        if (value !== NULL && (!test || !test(value))) {
          next[key] = value;
          ++size;
        }
      }
      map.size = size;
      map.empty = 0;
      map.object = (obj = next);
    }
  };

  if (input) Object.keys(input).forEach(function(key) {
    map.set(key, input[key]);
  });

  return map;
};

var inherits = function(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
};

var isBoolean = function(_$$1) {
  return typeof _$$1 === 'boolean';
};

var isDate = function(_$$1) {
  return Object.prototype.toString.call(_$$1) === '[object Date]';
};

var isNumber = function(_$$1) {
  return typeof _$$1 === 'number';
};

var isRegExp = function(_$$1) {
  return Object.prototype.toString.call(_$$1) === '[object RegExp]';
};

var key = function(fields) {
  fields = fields ? array(fields) : fields;
  var fn = !(fields && fields.length)
    ? function() { return ''; }
    : Function('_', 'return \'\'+' +
        fields.map(function(f) {
          return '_[' + splitAccessPath(f).map($$2).join('][') + ']';
        }).join('+\'|\'+') + ';');
  return accessor(fn, fields, 'key');
};

var merge = function(compare, array0, array1, output) {
  var n0 = array0.length,
      n1 = array1.length;

  if (!n1) return array0;
  if (!n0) return array1;

  var merged = output || new array0.constructor(n0 + n1),
      i0 = 0, i1 = 0, i = 0;

  for (; i0<n0 && i1<n1; ++i) {
    merged[i] = compare(array0[i0], array1[i1]) > 0
       ? array1[i1++]
       : array0[i0++];
  }

  for (; i0<n0; ++i0, ++i) {
    merged[i] = array0[i0];
  }

  for (; i1<n1; ++i1, ++i) {
    merged[i] = array1[i1];
  }

  return merged;
};

var repeat = function(str, reps) {
  var s = '';
  while (--reps >= 0) s += str;
  return s;
};

var pad = function(str, length, padchar, align) {
  var c = padchar || ' ',
      s = str + '',
      n = length - s.length;

  return n <= 0 ? s
    : align === 'left' ? repeat(c, n) + s
    : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
    : s + repeat(c, n);
};

var toBoolean = function(_$$1) {
  return _$$1 == null || _$$1 === '' ? null : !_$$1 || _$$1 === 'false' || _$$1 === '0' ? false : !!_$$1;
};

function defaultParser(_$$1) {
  return isNumber(_$$1) ? _$$1 : isDate(_$$1) ? _$$1 : Date.parse(_$$1);
}

var toDate = function(_$$1, parser) {
  parser = parser || defaultParser;
  return _$$1 == null || _$$1 === '' ? null : parser(_$$1);
};

var toString = function(_$$1) {
  return _$$1 == null || _$$1 === '' ? null : _$$1 + '';
};

var toSet = function(_$$1) {
  for (var s={}, i=0, n=_$$1.length; i<n; ++i) s[_$$1[i]] = 1;
  return s;
};

var truncate = function(str, length, align, ellipsis) {
  var e = ellipsis != null ? ellipsis : '\u2026',
      s = str + '',
      n = s.length,
      l = Math.max(0, length - e.length);

  return n <= length ? s
    : align === 'left' ? e + s.slice(n - l)
    : align === 'center' ? s.slice(0, Math.ceil(l/2)) + e + s.slice(n - ~~(l/2))
    : s.slice(0, l) + e;
};

var visitArray = function(array, filter, visitor) {
  if (array) {
    var i = 0, n = array.length, t;
    if (filter) {
      for (; i<n; ++i) {
        if (t = filter(array[i])) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
};

function UniqueList(idFunc) {
  var $$$1 = idFunc || identity,
      list = [],
      ids = {};

  list.add = function(_$$1) {
    var id$$1 = $$$1(_$$1);
    if (!ids[id$$1]) {
      ids[id$$1] = 1;
      list.push(_$$1);
    }
    return list;
  };

  list.remove = function(_$$1) {
    var id$$1 = $$$1(_$$1), idx;
    if (ids[id$$1]) {
      ids[id$$1] = 0;
      if ((idx = list.indexOf(_$$1)) >= 0) {
        list.splice(idx, 1);
      }
    }
    return list;
  };

  return list;
}

var TUPLE_ID_KEY = Symbol('vega_id');
var TUPLE_ID = 1;

/**
 * Resets the internal tuple id counter to one.
 */


/**
 * Checks if an input value is a registered tuple.
 * @param {*} t - The value to check.
 * @return {boolean} True if the input is a tuple, false otherwise.
 */
function isTuple(t) {
  return !!(t && tupleid(t));
}

/**
 * Returns the id of a tuple.
 * @param {object} t - The input tuple.
 * @return {*} the tuple id.
 */
function tupleid(t) {
  return t[TUPLE_ID_KEY];
}

/**
 * Sets the id of a tuple.
 * @param {object} t - The input tuple.
 * @param {*} id - The id value to set.
 * @return {object} the input tuple.
 */
function setid(t, id) {
  t[TUPLE_ID_KEY] = id;
  return t;
}

/**
 * Ingest an object or value as a data tuple.
 * If the input value is an object, an id field will be added to it. For
 * efficiency, the input object is modified directly. A copy is not made.
 * If the input value is a literal, it will be wrapped in a new object
 * instance, with the value accessible as the 'data' property.
 * @param datum - The value to ingest.
 * @return {object} The ingested data tuple.
 */
function ingest(datum) {
  var t = (datum === Object(datum)) ? datum : {data: datum};
  return tupleid(t) ? t : setid(t, TUPLE_ID++);
}

/**
 * Given a source tuple, return a derived copy.
 * @param {object} t - The source tuple.
 * @return {object} The derived tuple.
 */
function derive(t) {
  return rederive(t, ingest({}));
}

/**
 * Rederive a derived tuple by copying values from the source tuple.
 * @param {object} t - The source tuple.
 * @param {object} d - The derived tuple.
 * @return {object} The derived tuple.
 */
function rederive(t, d) {
  for (var k in t) d[k] = t[k];
  return d;
}

/**
 * Replace an existing tuple with a new tuple.
 * @param {object} t - The existing data tuple.
 * @param {object} d - The new tuple that replaces the old.
 * @return {object} The new tuple.
 */
function replace(t, d) {
  return setid(d, tupleid(t));
}

function isChangeSet(v) {
  return v && v.constructor === changeset;
}

function changeset() {
  var add = [],  // insert tuples
      rem = [],  // remove tuples
      mod = [],  // modify tuples
      remp = [], // remove by predicate
      modp = [], // modify by predicate
      reflow = false;

  return {
    constructor: changeset,
    insert: function(t) {
      var d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) add.push(d[i]);
      return this;
    },
    remove: function(t) {
      var a = isFunction(t) ? remp : rem,
          d = array(t), i = 0, n = d.length;
      for (; i<n; ++i) a.push(d[i]);
      return this;
    },
    modify: function(t, field$$1, value) {
      var m = {field: field$$1, value: constant(value)};
      if (isFunction(t)) {
        m.filter = t;
        modp.push(m);
      } else {
        m.tuple = t;
        mod.push(m);
      }
      return this;
    },
    encode: function(t, set) {
      if (isFunction(t)) modp.push({filter: t, field: set});
      else mod.push({tuple: t, field: set});
      return this;
    },
    reflow: function() {
      reflow = true;
      return this;
    },
    pulse: function(pulse, tuples) {
      var out, i, n, m, f, t, id$$1;

      // add
      for (i=0, n=add.length; i<n; ++i) {
        pulse.add.push(ingest(add[i]));
      }

      // remove
      for (out={}, i=0, n=rem.length; i<n; ++i) {
        t = rem[i];
        out[tupleid(t)] = t;
      }
      for (i=0, n=remp.length; i<n; ++i) {
        f = remp[i];
        tuples.forEach(function(t) {
          if (f(t)) out[tupleid(t)] = t;
        });
      }
      for (id$$1 in out) pulse.rem.push(out[id$$1]);

      // modify
      function modify(t, f, v) {
        if (v) t[f] = v(t); else pulse.encode = f;
        if (!reflow) out[tupleid(t)] = t;
      }
      for (out={}, i=0, n=mod.length; i<n; ++i) {
        m = mod[i];
        modify(m.tuple, m.field, m.value);
        pulse.modifies(m.field);
      }
      for (i=0, n=modp.length; i<n; ++i) {
        m = modp[i];
        f = m.filter;
        tuples.forEach(function(t) {
          if (f(t)) modify(t, m.field, m.value);
        });
        pulse.modifies(m.field);
      }

      // reflow?
      if (reflow) {
        pulse.mod = rem.length || remp.length
          ? tuples.filter(function(t) { return out.hasOwnProperty(tupleid(t)); })
          : tuples.slice();
      } else {
        for (id$$1 in out) pulse.mod.push(out[id$$1]);
      }

      return pulse;
    }
  };
}

var CACHE = '_:mod:_';

/**
 * Hash that tracks modifications to assigned values.
 * Callers *must* use the set method to update values.
 */
function Parameters() {
  Object.defineProperty(this, CACHE, {writable:true, value: {}});
}

var prototype$2 = Parameters.prototype;

/**
 * Set a parameter value. If the parameter value changes, the parameter
 * will be recorded as modified.
 * @param {string} name - The parameter name.
 * @param {number} index - The index into an array-value parameter. Ignored if
 *   the argument is undefined, null or less than zero.
 * @param {*} value - The parameter value to set.
 * @param {boolean} [force=false] - If true, records the parameter as modified
 *   even if the value is unchanged.
 * @return {Parameters} - This parameter object.
 */
prototype$2.set = function(name, index, value, force) {
  var o = this,
      v = o[name],
      mod = o[CACHE];

  if (index != null && index >= 0) {
    if (v[index] !== value || force) {
      v[index] = value;
      mod[index + ':' + name] = -1;
      mod[name] = -1;
    }
  } else if (v !== value || force) {
    o[name] = value;
    mod[name] = isArray(value) ? 1 + value.length : -1;
  }

  return o;
};

/**
 * Tests if one or more parameters has been modified. If invoked with no
 * arguments, returns true if any parameter value has changed. If the first
 * argument is array, returns trues if any parameter name in the array has
 * changed. Otherwise, tests if the given name and optional array index has
 * changed.
 * @param {string} name - The parameter name to test.
 * @param {number} [index=undefined] - The parameter array index to test.
 * @return {boolean} - Returns true if a queried parameter was modified.
 */
prototype$2.modified = function(name, index) {
  var mod = this[CACHE], k;
  if (!arguments.length) {
    for (k in mod) { if (mod[k]) return true; }
    return false;
  } else if (isArray(name)) {
    for (k=0; k<name.length; ++k) {
      if (mod[name[k]]) return true;
    }
    return false;
  }
  return (index != null && index >= 0)
    ? (index + 1 < mod[name] || !!mod[index + ':' + name])
    : !!mod[name];
};

/**
 * Clears the modification records. After calling this method,
 * all parameters are considered unmodified.
 */
prototype$2.clear = function() {
  this[CACHE] = {};
  return this;
};

var OP_ID = 0;
var PULSE = 'pulse';
var NO_PARAMS = new Parameters();

// Boolean Flags
var SKIP     = 1;
var MODIFIED = 2;

/**
 * An Operator is a processing node in a dataflow graph.
 * Each operator stores a value and an optional value update function.
 * Operators can accept a hash of named parameters. Parameter values can
 * either be direct (JavaScript literals, arrays, objects) or indirect
 * (other operators whose values will be pulled dynamically). Operators
 * included as parameters will have this operator added as a dependency.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {function(object, Pulse)} [update] - An update function. Upon
 *   evaluation of this operator, the update function will be invoked and the
 *   return value will be used as the new value of this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @see parameters
 */
function Operator(init, update, params, react) {
  this.id = ++OP_ID;
  this.value = init;
  this.stamp = -1;
  this.rank = -1;
  this.qrank = -1;
  this.flags = 0;

  if (update) {
    this._update = update;
  }
  if (params) this.parameters(params, react);
}

var prototype$1 = Operator.prototype;

/**
 * Returns a list of target operators dependent on this operator.
 * If this list does not exist, it is created and then returned.
 * @return {UniqueList}
 */
prototype$1.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};

/**
 * Sets the value of this operator.
 * @param {*} value - the value to set.
 * @return {Number} Returns 1 if the operator value has changed
 *   according to strict equality, returns 0 otherwise.
 */
prototype$1.set = function(value) {
  if (this.value !== value) {
    this.value = value;
    return 1;
  } else {
    return 0;
  }
};

function flag(bit) {
  return function(state) {
    var f = this.flags;
    if (arguments.length === 0) return !!(f & bit);
    this.flags = state ? (f | bit) : (f & ~bit);
    return this;
  };
}

/**
 * Indicates that operator evaluation should be skipped on the next pulse.
 * This operator will still propagate incoming pulses, but its update function
 * will not be invoked. The skip flag is reset after every pulse, so calling
 * this method will affect processing of the next pulse only.
 */
prototype$1.skip = flag(SKIP);

/**
 * Indicates that this operator's value has been modified on its most recent
 * pulse. Normally modification is checked via strict equality; however, in
 * some cases it is more efficient to update the internal state of an object.
 * In those cases, the modified flag can be used to trigger propagation. Once
 * set, the modification flag persists across pulses until unset. The flag can
 * be used with the last timestamp to test if a modification is recent.
 */
prototype$1.modified = flag(MODIFIED);

/**
 * Sets the parameters for this operator. The parameter values are analyzed for
 * operator instances. If found, this operator will be added as a dependency
 * of the parameterizing operator. Operator values are dynamically marshalled
 * from each operator parameter prior to evaluation. If a parameter value is
 * an array, the array will also be searched for Operator instances. However,
 * the search does not recurse into sub-arrays or object properties.
 * @param {object} params - A hash of operator parameters.
 * @param {boolean} [react=true] - A flag indicating if this operator should
 *   automatically update (react) when parameter values change. In other words,
 *   this flag determines if the operator registers itself as a listener on
 *   any upstream operators included in the parameters.
 * @return {Operator[]} - An array of upstream dependencies.
 */
prototype$1.parameters = function(params, react) {
  react = react !== false;
  var self = this,
      argval = (self._argval = self._argval || new Parameters()),
      argops = (self._argops = self._argops || []),
      deps = [],
      name, value, n, i;

  function add(name, index, value) {
    if (value instanceof Operator) {
      if (value !== self) {
        if (react) value.targets().add(self);
        deps.push(value);
      }
      argops.push({op:value, name:name, index:index});
    } else {
      argval.set(name, index, value);
    }
  }

  for (name in params) {
    value = params[name];

    if (name === PULSE) {
      array(value).forEach(function(op) {
        if (!(op instanceof Operator)) {
          error$1('Pulse parameters must be operator instances.');
        } else if (op !== self) {
          op.targets().add(self);
          deps.push(op);
        }
      });
      self.source = value;
    } else if (isArray(value)) {
      argval.set(name, -1, Array(n = value.length));
      for (i=0; i<n; ++i) add(name, i, value[i]);
    } else {
      add(name, -1, value);
    }
  }

  this.marshall().clear(); // initialize values
  return deps;
};

/**
 * Internal method for marshalling parameter values.
 * Visits each operator dependency to pull the latest value.
 * @return {Parameters} A Parameters object to pass to the update function.
 */
prototype$1.marshall = function(stamp) {
  var argval = this._argval || NO_PARAMS,
      argops = this._argops, item, i, n, op, mod;

  if (argops && (n = argops.length)) {
    for (i=0; i<n; ++i) {
      item = argops[i];
      op = item.op;
      mod = op.modified() && op.stamp === stamp;
      argval.set(item.name, item.index, op.value, mod);
    }
  }
  return argval;
};

/**
 * Delegate method to perform operator processing.
 * Subclasses can override this method to perform custom processing.
 * By default, it marshalls parameters and calls the update function
 * if that function is defined. If the update function does not
 * change the operator value then StopPropagation is returned.
 * If no update function is defined, this method does nothing.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return The output pulse or StopPropagation. A falsy return value
 *   (including undefined) will let the input pulse pass through.
 */
prototype$1.evaluate = function(pulse) {
  if (this._update) {
    var params = this.marshall(pulse.stamp),
        v = this._update(params, pulse);

    params.clear();
    if (v !== this.value) {
      this.value = v;
    } else if (!this.modified()) {
      return pulse.StopPropagation;
    }
  }
};

/**
 * Run this operator for the current pulse. If this operator has already
 * been run at (or after) the pulse timestamp, returns StopPropagation.
 * Internally, this method calls {@link evaluate} to perform processing.
 * If {@link evaluate} returns a falsy value, the input pulse is returned.
 * This method should NOT be overridden, instead overrride {@link evaluate}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return the output pulse for this operator (or StopPropagation)
 */
prototype$1.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
  var rv;
  if (this.skip()) {
    this.skip(false);
    rv = 0;
  } else {
    rv = this.evaluate(pulse);
  }
  this.stamp = pulse.stamp;
  this.pulse = rv;
  return rv || pulse;
};

/**
 * Add an operator to the dataflow graph. This function accepts a
 * variety of input argument types. The basic signature supports an
 * initial value, update function and parameters. If the first parameter
 * is an Operator instance, it will be added directly. If it is a
 * constructor for an Operator subclass, a new instance will be instantiated.
 * Otherwise, if the first parameter is a function instance, it will be used
 * as the update function and a null initial value is assumed.
 * @param {*} init - One of: the operator to add, the initial value of
 *   the operator, an operator class to instantiate, or an update function.
 * @param {function} [update] - The operator update function.
 * @param {object} [params] - The operator parameters.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @return {Operator} - The added operator.
 */
var add = function(init, update, params, react) {
  var shift = 1,
    op;

  if (init instanceof Operator) {
    op = init;
  } else if (init && init.prototype instanceof Operator) {
    op = new init();
  } else if (isFunction(init)) {
    op = new Operator(null, init);
  } else {
    shift = 0;
    op = new Operator(init, update);
  }

  this.rank(op);
  if (shift) {
    react = params;
    params = update;
  }
  if (params) this.connect(op, op.parameters(params, react));
  this.touch(op);

  return op;
};

/**
 * Connect a target operator as a dependent of source operators.
 * If necessary, this method will rerank the target operator and its
 * dependents to ensure propagation proceeds in a topologically sorted order.
 * @param {Operator} target - The target operator.
 * @param {Array<Operator>} - The source operators that should propagate
 *   to the target operator.
 */
var connect = function(target, sources) {
  var targetRank = target.rank, i, n;

  for (i=0, n=sources.length; i<n; ++i) {
    if (targetRank < sources[i].rank) {
      this.rerank(target);
      return;
    }
  }
};

var STREAM_ID = 0;

/**
 * Models an event stream.
 * @constructor
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @param {function(Object)} [receive] - Event callback function to invoke
 *   upon receipt of a new event. Use to override standard event processing.
 */
function EventStream(filter, apply, receive) {
  this.id = ++STREAM_ID;
  this.value = null;
  if (receive) this.receive = receive;
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}

/**
 * Creates a new event stream instance with the provided
 * (optional) filter, apply and receive functions.
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @see EventStream
 */
function stream(filter, apply, receive) {
  return new EventStream(filter, apply, receive);
}

var prototype$3 = EventStream.prototype;

prototype$3._filter = truthy;

prototype$3._apply = identity;

prototype$3.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};

prototype$3.consume = function(_$$1) {
  if (!arguments.length) return !!this._consume;
  this._consume = !!_$$1;
  return this;
};

prototype$3.receive = function(evt) {
  if (this._filter(evt)) {
    var val = (this.value = this._apply(evt)),
        trg = this._targets,
        n = trg ? trg.length : 0,
        i = 0;

    for (; i<n; ++i) trg[i].receive(val);

    if (this._consume) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
};

prototype$3.filter = function(filter) {
  var s = stream(filter);
  this.targets().add(s);
  return s;
};

prototype$3.apply = function(apply) {
  var s = stream(null, apply);
  this.targets().add(s);
  return s;
};

prototype$3.merge = function() {
  var s = stream();

  this.targets().add(s);
  for (var i=0, n=arguments.length; i<n; ++i) {
    arguments[i].targets().add(s);
  }

  return s;
};

prototype$3.throttle = function(pause) {
  var t = -1;
  return this.filter(function() {
    var now = Date.now();
    if ((now - t) > pause) {
      t = now;
      return 1;
    } else {
      return 0;
    }
  });
};

prototype$3.debounce = function(delay) {
  var s = stream();

  this.targets().add(stream(null, null,
    debounce(delay, function(e) {
      var df = e.dataflow;
      s.receive(e);
      if (df && df.run) df.run();
    })
  ));

  return s;
};

prototype$3.between = function(a, b) {
  var active = false;
  a.targets().add(stream(null, null, function() { active = true; }));
  b.targets().add(stream(null, null, function() { active = false; }));
  return this.filter(function() { return active; });
};

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor. The input must
 *  support the addEventListener method.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @param {function(object): *} [apply] - Event application function.
 *   If provided, this function will be invoked and the result will be
 *   used as the downstream event value.
 * @return {EventStream}
 */
var events = function(source, type, filter, apply) {
  var df = this,
      s = stream(filter, apply),
      send = function(e) {
        e.dataflow = df;
        try {
          s.receive(e);
        } catch (error) {
          df.error(error);
        } finally {
          df.run();
        }
      },
      sources;

  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array(source);
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  return s;
};

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

// Request options to check for d3-request
var requestOptions = [
  'mimeType',
  'responseType',
  'user',
  'password'
];

/**
 * Creates a new loader instance that provides methods for requesting files
 * from either the network or disk, and for sanitizing request URIs.
 * @param {object} [options] - Optional default loading options to use.
 * @return {object} - A new loader instance.
 */
var loader = function(options) {
  return {
    options: options || {},
    sanitize: sanitize,
    load: load,
    file: file,
    http: http
  };
};

function marshall(loader, options) {
  return extend({}, loader.options, options);
}

/**
 * Load an external resource, typically either from the web or from the local
 * filesystem. This function uses {@link sanitize} to first sanitize the uri,
 * then calls either {@link http} (for web requests) or {@link file} (for
 * filesystem loading).
 * @param {string} uri - The resource indicator (e.g., URL or filename).
 * @param {object} [options] - Optional loading options. These options will
 *   override any existing default options.
 * @return {Promise} - A promise that resolves to the loaded content.
 */
function load(uri, options) {
  var loader = this;
  return loader.sanitize(uri, options)
    .then(function(opt) {
      var url = opt.href;
      return opt.localFile
        ? loader.file(url)
        : loader.http(url, options);
    });
}

/**
 * URI sanitizer function.
 * @param {string} uri - The uri (url or filename) to sanity check.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to an object containing
 *  sanitized uri data, or rejects it the input uri is deemed invalid.
 *  The properties of the resolved object are assumed to be
 *  valid attributes for an HTML 'a' tag. The sanitized uri *must* be
 *  provided by the 'href' property of the returned object.
 */
function sanitize(uri, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var result = {href: null},
        isFile, hasProtocol, loadFile, base;

    if (uri == null || typeof uri !== 'string') {
      reject('Sanitize failure, invalid URI: ' + $$2(uri));
      return;
    }

    hasProtocol = protocol_re.test(uri);

    // if relative url (no protocol/host), prepend baseURL
    if ((base = options.baseURL) && !hasProtocol) {
      // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      if (!startsWith(uri, '/') && base[base.length-1] !== '/') {
        uri = '/' + uri;
      }
      uri = base + uri;
    }

    // should we load from file system?
    loadFile = (isFile = startsWith(uri, fileProtocol))
      || options.mode === 'file'
      || options.mode !== 'http' && !hasProtocol && fs();

    if (isFile) {
      // strip file protocol
      uri = uri.slice(fileProtocol.length);
    } else if (startsWith(uri, '//')) {
      if (options.defaultProtocol === 'file') {
        // if is file, strip protocol and set loadFile flag
        uri = uri.slice(2);
        loadFile = true;
      } else {
        // if relative protocol (starts with '//'), prepend default protocol
        uri = (options.defaultProtocol || 'http') + ':' + uri;
      }
    }

    // set non-enumerable mode flag to indicate local file load
    Object.defineProperty(result, 'localFile', {value: !!loadFile});

    // set uri and return
    result.href = uri;
    accept(result);
  });
}

/**
 * HTTP request loader.
 * @param {string} url - The url to request.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to the file contents.
 */
function http(url, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var req = d3Request.request(url),
        name;

    for (name in options.headers) {
      req.header(name, options.headers[name]);
    }

    requestOptions.forEach(function(name) {
      if (options[name]) req[name](options[name]);
    });

    req.on('error', function(error) {
        reject(error || 'Error loading URL: ' + url);
      })
      .on('load', function(result) {
        var text = result && result.responseText;
        (!result || result.status === 0)
          ? reject(text || 'Error')
          : accept(text);
      })
      .get();
  });
}

/**
 * File system loader.
 * @param {string} filename - The file system path to load.
 * @return {Promise} - A promise that resolves to the file contents.
 */
function file(filename) {
  return new Promise(function(accept, reject) {
    var f = fs();
    f ? f.readFile(filename, function(error, data) {
          if (error) reject(error);
          else accept(data);
        })
      : reject('No file system access for ' + filename);
  });
}

function fs() {
  var fs = typeof require === 'function' && require('fs');
  return fs && isFunction(fs.readFile) ? fs : null;
}

function startsWith(string, query) {
  return string == null ? false : string.lastIndexOf(query, 0) === 0;
}

var typeParsers = {
  boolean: toBoolean,
  integer: toNumber,
  number:  toNumber,
  date:    toDate,
  string:  toString
};

var typeTests = [
  isBoolean$1,
  isInteger,
  isNumber$1,
  isDate$1
];

var typeList = [
  'boolean',
  'integer',
  'number',
  'date'
];

function inferType(values, field$$1) {
  var tests = typeTests.slice(),
      value, i, n, j;

  for (i=0, n=values.length; i<n; ++i) {
    value = field$$1 ? values[i][field$$1] : values[i];
    for (j=0; j<tests.length; ++j) {
      if (isValid(value) && !tests[j](value)) {
        tests.splice(j, 1); --j;
      }
    }
    if (tests.length === 0) return 'string';
  }
  return typeList[typeTests.indexOf(tests[0])];
}

function inferTypes(data, fields) {
  return fields.reduce(function(types, field$$1) {
    types[field$$1] = inferType(data, field$$1);
    return types;
  }, {});
}

// -- Type Checks ----

function isValid(_$$1) {
  return _$$1 != null && _$$1 === _$$1;
}

function isBoolean$1(_$$1) {
  return _$$1 === 'true' || _$$1 === 'false' || _$$1 === true || _$$1 === false;
}

function isDate$1(_$$1) {
  return !isNaN(Date.parse(_$$1));
}

function isNumber$1(_$$1) {
  return !isNaN(+_$$1) && !(_$$1 instanceof Date);
}

function isInteger(_$$1) {
  return isNumber$1(_$$1) && (_$$1=+_$$1) === ~~_$$1;
}

function delimitedFormat(delimiter) {
  return function(data, format$$1) {
    var delim = {delimiter: delimiter};
    return dsv(data, format$$1 ? extend(format$$1, delim) : delim);
  };
}

function dsv(data, format$$1) {
  if (format$$1.header) {
    data = format$$1.header
      .map($$2)
      .join(format$$1.delimiter) + '\n' + data;
  }
  return d3Dsv.dsvFormat(format$$1.delimiter).parse(data+'');
}

function isBuffer(_$$1) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_$$1) : false;
}

var json = function(data, format$$1) {
  var prop = (format$$1 && format$$1.property) ? field(format$$1.property) : identity;
  return isObject(data) && !isBuffer(data)
    ? parseJSON(prop(data))
    : prop(JSON.parse(data));
};

function parseJSON(data, format$$1) {
  return (format$$1 && format$$1.copy)
    ? JSON.parse(JSON.stringify(data))
    : data;
}

var topojson$1 = function(data, format$$1) {
  var object, property;
  data = json(data, format$$1);

  if (format$$1 && (property = format$$1.feature)) {
    return (object = data.objects[property])
      ? topojson.feature(data, object).features
      : error$1('Invalid TopoJSON object: ' + property);
  }

  else if (format$$1 && (property = format$$1.mesh)) {
    return (object = data.objects[property])
      ? [topojson.mesh(data, object)]
      : error$1('Invalid TopoJSON object: ' + property);
  }

  error$1('Missing TopoJSON feature or mesh parameter.');
};

var formats = {
  dsv: dsv,
  csv: delimitedFormat(','),
  tsv: delimitedFormat('\t'),
  json: json,
  topojson: topojson$1
};

var formats$1 = function(name, format$$1) {
  if (arguments.length > 1) {
    formats[name] = format$$1;
    return this;
  } else {
    return formats.hasOwnProperty(name) ? formats[name] : null;
  }
};

var read = function(data, schema, dateParse) {
  schema = schema || {};

  var reader = formats$1(schema.type || 'json');
  if (!reader) error$1('Unknown data format type: ' + schema.type);

  data = reader(data, schema);
  if (schema.parse) parse(data, schema.parse, dateParse);

  if (data.hasOwnProperty('columns')) delete data.columns;
  return data;
};

function parse(data, types, dateParse) {
  dateParse = dateParse || d3TimeFormat.timeParse;

  var fields = data.columns || Object.keys(data[0]),
      parsers, datum, field$$1, i, j, n, m;

  if (types === 'auto') types = inferTypes(data, fields);

  fields = Object.keys(types);
  parsers = fields.map(function(field$$1) {
    var type = types[field$$1],
        parts, pattern;

    if (type && (type.indexOf('date:') === 0 || type.indexOf('utc:') === 0)) {
      parts = type.split(/:(.+)?/, 2);  // split on first :
      pattern = parts[1];

      if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
          (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
        pattern = pattern.slice(1, -1);
      }

      return parts[0] === 'utc' ? d3TimeFormat.utcParse(pattern) : dateParse(pattern);
    }

    if (!typeParsers[type]) {
      throw Error('Illegal format pattern: ' + field$$1 + ':' + type);
    }

    return typeParsers[type];
  });

  for (i=0, n=data.length, m=fields.length; i<n; ++i) {
    datum = data[i];
    for (j=0; j<m; ++j) {
      field$$1 = fields[j];
      datum[field$$1] = parsers[j](datum[field$$1]);
    }
  }
}

function ingest$1(target, data, format$$1) {
  return this.pulse(target, this.changeset().insert(read(data, format$$1)));
}

function loadPending(df) {
  var accept, reject,
      pending = new Promise(function(a, r) {
        accept = a;
        reject = r;
      });

  pending.requests = 0;

  pending.done = function() {
    if (--pending.requests === 0) {
      df.runAfter(function() {
        df._pending = null;
        try {
          df.run();
          accept(df);
        } catch (err) {
          reject(err);
        }
      });
    }
  };

  return (df._pending = pending);
}

function request$1(target, url, format$$1) {
  var df = this,
      pending = df._pending || loadPending(df);

  pending.requests += 1;

  df.loader()
    .load(url, {context:'dataflow'})
    .then(
      function(data) { df.ingest(target, data, format$$1); },
      function(error) { df.error('Loading failed', url, error); })
    .catch(
      function(error) { df.error('Data ingestion failed', url, error); })
    .then(pending.done, pending.done);
}

var SKIP$1 = {skip: true};

/**
 * Perform operator updates in response to events. Applies an
 * update function to compute a new operator value. If the update function
 * returns a {@link ChangeSet}, the operator will be pulsed with those tuple
 * changes. Otherwise, the operator value will be updated to the return value.
 * @param {EventStream|Operator} source - The event source to react to.
 *   This argument can be either an EventStream or an Operator.
 * @param {Operator|function(object):Operator} target - The operator to update.
 *   This argument can either be an Operator instance or (if the source
 *   argument is an EventStream), a function that accepts an event object as
 *   input and returns an Operator to target.
 * @param {function(Parameters,Event): *} [update] - Optional update function
 *   to compute the new operator value, or a literal value to set. Update
 *   functions expect to receive a parameter object and event as arguments.
 *   This function can either return a new operator value or (if the source
 *   argument is an EventStream) a {@link ChangeSet} instance to pulse
 *   the target operator with tuple changes.
 * @param {object} [params] - The update function parameters.
 * @param {object} [options] - Additional options hash. If not overridden,
 *   updated operators will be skipped by default.
 * @param {boolean} [options.skip] - If true, the operator will
 *  be skipped: it will not be evaluated, but its dependents will be.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @return {Dataflow}
 */
var on = function(source, target, update, params, options) {
  var fn = source instanceof Operator ? onOperator : onStream;
  fn(this, source, target, update, params, options);
  return this;
};

function onStream(df, stream, target, update, params, options) {
  var opt = extend({}, options, SKIP$1), func, op;

  if (!isFunction(target)) target = constant(target);

  if (update === undefined) {
    func = function(e) {
      df.touch(target(e));
    };
  } else if (isFunction(update)) {
    op = new Operator(null, update, params, false);
    func = function(e) {
      var v, t = target(e);
      op.evaluate(e);
      isChangeSet(v = op.value) ? df.pulse(t, v, options) : df.update(t, v, opt);
    };
  } else {
    func = function(e) {
      df.update(target(e), update, opt);
    };
  }

  stream.apply(func);
}

function onOperator(df, source, target, update, params, options) {
  var func, op;

  if (update === undefined) {
    op = target;
  } else {
    func = isFunction(update) ? update : constant(update);
    update = !target ? func : function(_$$1, pulse) {
      var value = func(_$$1, pulse);
      return target.skip()
        ? value
        : (target.skip(true).value = value);
    };

    op = new Operator(null, update, params, false);
    op.modified(options && options.force);
    op.rank = 0;

    if (target) {
      op.skip(true); // skip first invocation
      op.value = target.value;
      op.targets().add(target);
    }
  }

  source.targets().add(op);
}

/**
 * Assigns a rank to an operator. Ranks are assigned in increasing order
 * by incrementing an internal rank counter.
 * @param {Operator} op - The operator to assign a rank.
 */
function rank(op) {
  op.rank = ++this._rank;
}

/**
 * Re-ranks an operator and all downstream target dependencies. This
 * is necessary when upstream depencies of higher rank are added to
 * a target operator.
 * @param {Operator} op - The operator to re-rank.
 */
function rerank(op) {
  var queue = [op],
      cur, list, i;

  while (queue.length) {
    this.rank(cur = queue.pop());
    if (list = cur._targets) {
      for (i=list.length; --i >= 0;) {
        queue.push(cur = list[i]);
        if (cur === op) error$1('Cycle detected in dataflow graph.');
      }
    }
  }
}

/**
 * Sentinel value indicating pulse propagation should stop.
 */
var StopPropagation = {};

// Pulse visit type flags
var ADD       = (1 << 0);
var REM       = (1 << 1);
var MOD       = (1 << 2);
var ADD_REM   = ADD | REM;
var ADD_MOD   = ADD | MOD;
var ALL       = ADD | REM | MOD;
var REFLOW    = (1 << 3);
var SOURCE    = (1 << 4);
var NO_SOURCE = (1 << 5);
var NO_FIELDS = (1 << 6);

/**
 * A Pulse enables inter-operator communication during a run of the
 * dataflow graph. In addition to the current timestamp, a pulse may also
 * contain a change-set of added, removed or modified data tuples, as well as
 * a pointer to a full backing data source. Tuple change sets may not
 * be fully materialized; for example, to prevent needless array creation
 * a change set may include larger arrays and corresponding filter functions.
 * The pulse provides a {@link visit} method to enable proper and efficient
 * iteration over requested data tuples.
 *
 * In addition, each pulse can track modification flags for data tuple fields.
 * Responsible transform operators should call the {@link modifies} method to
 * indicate changes to data fields. The {@link modified} method enables
 * querying of this modification state.
 *
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The current propagation timestamp.
 * @param {string} [encode] - An optional encoding set name, which is then
 *   accessible as Pulse.encode. Operators can respond to (or ignore) this
 *   setting as appropriate. This parameter can be used in conjunction with
 *   the Encode transform in the vega-encode module.
 */
function Pulse(dataflow, stamp, encode) {
  this.dataflow = dataflow;
  this.stamp = stamp == null ? -1 : stamp;
  this.add = [];
  this.rem = [];
  this.mod = [];
  this.fields = null;
  this.encode = encode || null;
}

var prototype$4 = Pulse.prototype;

/**
 * Sentinel value indicating pulse propagation should stop.
 */
prototype$4.StopPropagation = StopPropagation;

/**
 * Boolean flag indicating ADD (added) tuples.
 */
prototype$4.ADD = ADD;

/**
 * Boolean flag indicating REM (removed) tuples.
 */
prototype$4.REM = REM;

/**
 * Boolean flag indicating MOD (modified) tuples.
 */
prototype$4.MOD = MOD;

/**
 * Boolean flag indicating ADD (added) and REM (removed) tuples.
 */
prototype$4.ADD_REM = ADD_REM;

/**
 * Boolean flag indicating ADD (added) and MOD (modified) tuples.
 */
prototype$4.ADD_MOD = ADD_MOD;

/**
 * Boolean flag indicating ADD, REM and MOD tuples.
 */
prototype$4.ALL = ALL;

/**
 * Boolean flag indicating all tuples in a data source
 * except for the ADD, REM and MOD tuples.
 */
prototype$4.REFLOW = REFLOW;

/**
 * Boolean flag indicating a 'pass-through' to a
 * backing data source, ignoring ADD, REM and MOD tuples.
 */
prototype$4.SOURCE = SOURCE;

/**
 * Boolean flag indicating that source data should be
 * suppressed when creating a forked pulse.
 */
prototype$4.NO_SOURCE = NO_SOURCE;

/**
 * Boolean flag indicating that field modifications should be
 * suppressed when creating a forked pulse.
 */
prototype$4.NO_FIELDS = NO_FIELDS;

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created.
 * @return {Pulse} - The forked pulse instance.
 * @see init
 */
prototype$4.fork = function(flags) {
  return new Pulse(this.dataflow).init(this, flags);
};

/**
 * Returns a pulse that adds all tuples from a backing source. This is
 * useful for cases where operators are added to a dataflow after an
 * upstream data pipeline has already been processed, ensuring that
 * new operators can observe all tuples within a stream.
 * @return {Pulse} - A pulse instance with all source tuples included
 *   in the add array. If the current pulse already has all source
 *   tuples in its add array, it is returned directly. If the current
 *   pulse does not have a backing source, it is returned directly.
 */
prototype$4.addAll = function() {
  var p = this;
  if (!this.source || this.source.length === this.add.length) {
    return p;
  } else {
    p = new Pulse(this.dataflow).init(this);
    p.add = p.source;
    return p;
  }
};

/**
 * Initialize this pulse based on the values of another pulse. This method
 * is used internally by {@link fork} to initialize a new forked tuple.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {Pulse} src - The source pulse to copy from.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created. By default, source data arrays are copied
 *   to the new pulse. Use the NO_SOURCE flag to enforce a null source.
 * @return {Pulse} - Returns this Pulse instance.
 */
prototype$4.init = function(src, flags) {
  var p = this;
  p.stamp = src.stamp;
  p.encode = src.encode;

  if (src.fields && !(flags & NO_FIELDS)) {
    p.fields = src.fields;
  }

  if (flags & ADD) {
    p.addF = src.addF;
    p.add = src.add;
  } else {
    p.addF = null;
    p.add = [];
  }

  if (flags & REM) {
    p.remF = src.remF;
    p.rem = src.rem;
  } else {
    p.remF = null;
    p.rem = [];
  }

  if (flags & MOD) {
    p.modF = src.modF;
    p.mod = src.mod;
  } else {
    p.modF = null;
    p.mod = [];
  }

  if (flags & NO_SOURCE) {
    p.srcF = null;
    p.source = null;
  } else {
    p.srcF = src.srcF;
    p.source = src.source;
  }

  return p;
};

/**
 * Schedules a function to run after pulse propagation completes.
 * @param {function} func - The function to run.
 */
prototype$4.runAfter = function(func) {
  this.dataflow.runAfter(func);
};

/**
 * Indicates if tuples have been added, removed or modified.
 * @param {number} [flags] - The tuple types (ADD, REM or MOD) to query.
 *   Defaults to ALL, returning true if any tuple type has changed.
 * @return {boolean} - Returns true if one or more queried tuple types have
 *   changed, false otherwise.
 */
prototype$4.changed = function(flags) {
  var f = flags || ALL;
  return ((f & ADD) && this.add.length)
      || ((f & REM) && this.rem.length)
      || ((f & MOD) && this.mod.length);
};

/**
 * Forces a "reflow" of tuple values, such that all tuples in the backing
 * source are added to the MOD set, unless already present in the ADD set.
 * @param {boolean} [fork=false] - If true, returns a forked copy of this
 *   pulse, and invokes reflow on that derived pulse.
 * @return {Pulse} - The reflowed pulse instance.
 */
prototype$4.reflow = function(fork) {
  if (fork) return this.fork(ALL).reflow();

  var len = this.add.length,
      src = this.source && this.source.length;
  if (src && src !== len) {
    this.mod = this.source;
    if (len) this.filter(MOD, filter(this, ADD));
  }
  return this;
};

/**
 * Marks one or more data field names as modified to assist dependency
 * tracking and incremental processing by transform operators.
 * @param {string|Array<string>} _ - The field(s) to mark as modified.
 * @return {Pulse} - This pulse instance.
 */
prototype$4.modifies = function(_$$1) {
  var fields = array(_$$1),
      hash = this.fields || (this.fields = {});
  fields.forEach(function(f) { hash[f] = true; });
  return this;
};

/**
 * Checks if one or more data fields have been modified during this pulse
 * propagation timestamp.
 * @param {string|Array<string>} _ - The field(s) to check for modified.
 * @return {boolean} - Returns true if any of the provided fields has been
 *   marked as modified, false otherwise.
 */
prototype$4.modified = function(_$$1) {
  var fields = this.fields;
  return !(this.mod.length && fields) ? false
    : !arguments.length ? !!fields
    : isArray(_$$1) ? _$$1.some(function(f) { return fields[f]; })
    : fields[_$$1];
};

/**
 * Adds a filter function to one more tuple sets. Filters are applied to
 * backing tuple arrays, to determine the actual set of tuples considered
 * added, removed or modified. They can be used to delay materialization of
 * a tuple set in order to avoid expensive array copies. In addition, the
 * filter functions can serve as value transformers: unlike standard predicate
 * function (which return boolean values), Pulse filters should return the
 * actual tuple value to process. If a tuple set is already filtered, the
 * new filter function will be appended into a conjuntive ('and') query.
 * @param {number} flags - Flags indicating the tuple set(s) to filter.
 * @param {function(*):object} filter - Filter function that will be applied
 *   to the tuple set array, and should return a data tuple if the value
 *   should be included in the tuple set, and falsy (or null) otherwise.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$4.filter = function(flags, filter) {
  var p = this;
  if (flags & ADD) p.addF = addFilter(p.addF, filter);
  if (flags & REM) p.remF = addFilter(p.remF, filter);
  if (flags & MOD) p.modF = addFilter(p.modF, filter);
  if (flags & SOURCE) p.srcF = addFilter(p.srcF, filter);
  return p;
};

function addFilter(a, b) {
  return a ? function(t,i) { return a(t,i) && b(t,i); } : b;
}

/**
 * Materialize one or more tuple sets in this pulse. If the tuple set(s) have
 * a registered filter function, it will be applied and the tuple set(s) will
 * be replaced with materialized tuple arrays.
 * @param {number} flags - Flags indicating the tuple set(s) to materialize.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$4.materialize = function(flags) {
  flags = flags || ALL;
  var p = this;
  if ((flags & ADD) && p.addF) {
    p.add = materialize(p.add, p.addF);
    p.addF = null;
  }
  if ((flags & REM) && p.remF) {
    p.rem = materialize(p.rem, p.remF);
    p.remF = null;
  }
  if ((flags & MOD) && p.modF) {
    p.mod = materialize(p.mod, p.modF);
    p.modF = null;
  }
  if ((flags & SOURCE) && p.srcF) {
    p.source = p.source.filter(p.srcF);
    p.srcF = null;
  }
  return p;
};

function materialize(data, filter) {
  var out = [];
  visitArray(data, filter, function(_$$1) { out.push(_$$1); });
  return out;
}

function filter(pulse, flags) {
  var map = {};
  pulse.visit(flags, function(t) { map[tupleid(t)] = 1; });
  return function(t) { return map[tupleid(t)] ? null : t; };
}

/**
 * Visit one or more tuple sets in this pulse.
 * @param {number} flags - Flags indicating the tuple set(s) to visit.
 *   Legal values are ADD, REM, MOD and SOURCE (if a backing data source
 *   has been set).
 * @param {function(object):*} - Visitor function invoked per-tuple.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$4.visit = function(flags, visitor) {
  var p = this, v = visitor, src, sum$$1;

  if (flags & SOURCE) {
    visitArray(p.source, p.srcF, v);
    return p;
  }

  if (flags & ADD) visitArray(p.add, p.addF, v);
  if (flags & REM) visitArray(p.rem, p.remF, v);
  if (flags & MOD) visitArray(p.mod, p.modF, v);

  if ((flags & REFLOW) && (src = p.source)) {
    sum$$1 = p.add.length + p.mod.length;
    if (sum$$1 === src.length) {
      // do nothing
    } else if (sum$$1) {
      visitArray(src, filter(p, ADD_MOD), v);
    } else {
      // if no add/rem/mod tuples, visit source
      visitArray(src, p.srcF, v);
    }
  }

  return p;
};

/**
 * Represents a set of multiple pulses. Used as input for operators
 * that accept multiple pulses at a time. Contained pulses are
 * accessible via the public "pulses" array property. This pulse doe
 * not carry added, removed or modified tuples directly. However,
 * the visit method can be used to traverse all such tuples contained
 * in sub-pulses with a timestamp matching this parent multi-pulse.
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The timestamp.
 * @param {Array<Pulse>} pulses - The sub-pulses for this multi-pulse.
 */
function MultiPulse(dataflow, stamp, pulses, encode) {
  var p = this,
      c = 0,
      pulse, hash, i, n, f;

  this.dataflow = dataflow;
  this.stamp = stamp;
  this.fields = null;
  this.encode = encode || null;
  this.pulses = pulses;

  for (i=0, n=pulses.length; i<n; ++i) {
    pulse = pulses[i];
    if (pulse.stamp !== stamp) continue;

    if (pulse.fields) {
      hash = p.fields || (p.fields = {});
      for (f in pulse.fields) { hash[f] = 1; }
    }

    if (pulse.changed(p.ADD)) c |= p.ADD;
    if (pulse.changed(p.REM)) c |= p.REM;
    if (pulse.changed(p.MOD)) c |= p.MOD;
  }

  this.changes = c;
}

var prototype$5 = inherits(MultiPulse, Pulse);

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * @return {Pulse}
 */
prototype$5.fork = function(flags) {
  var p = new Pulse(this.dataflow).init(this, flags & this.NO_FIELDS);
  if (flags !== undefined) {
    if (flags & p.ADD) {
      this.visit(p.ADD, function(t) { return p.add.push(t); });
    }
    if (flags & p.REM) {
      this.visit(p.REM, function(t) { return p.rem.push(t); });
    }
    if (flags & p.MOD) {
      this.visit(p.MOD, function(t) { return p.mod.push(t); });
    }
  }
  return p;
};

prototype$5.changed = function(flags) {
  return this.changes & flags;
};

prototype$5.modified = function(_$$1) {
  var p = this, fields = p.fields;
  return !(fields && (p.changes & p.MOD)) ? 0
    : isArray(_$$1) ? _$$1.some(function(f) { return fields[f]; })
    : fields[_$$1];
};

prototype$5.filter = function() {
  error$1('MultiPulse does not support filtering.');
};

prototype$5.materialize = function() {
  error$1('MultiPulse does not support materialization.');
};

prototype$5.visit = function(flags, visitor) {
  var p = this,
      pulses = p.pulses,
      n = pulses.length,
      i = 0;

  if (flags & p.SOURCE) {
    for (; i<n; ++i) {
      pulses[i].visit(flags, visitor);
    }
  } else {
    for (; i<n; ++i) {
      if (pulses[i].stamp === p.stamp) {
        pulses[i].visit(flags, visitor);
      }
    }
  }

  return p;
};

/**
 * Runs the dataflow. This method will increment the current timestamp
 * and process all updated, pulsed and touched operators. When run for
 * the first time, all registered operators will be processed. If there
 * are pending data loading operations, this method will return immediately
 * without evaluating the dataflow. Instead, the dataflow will be
 * asynchronously invoked when data loading completes. To track when dataflow
 * evaluation completes, use the {@link runAsync} method instead.
 * @param {string} [encode] - The name of an encoding set to invoke during
 *   propagation. This value is added to generated Pulse instances;
 *   operators can then respond to (or ignore) this setting as appropriate.
 *   This parameter can be used in conjunction with the Encode transform in
 *   the vega-encode module.
 */
function run(encode) {
  var df = this,
      count = 0,
      level = df.logLevel(),
      op, next, dt, error;

  if (df._pending) {
    df.info('Awaiting requests, delaying dataflow run.');
    return 0;
  }

  if (df._pulse) {
    df.error('Dataflow invoked recursively. Use the runAfter method to queue invocation.');
    return 0;
  }

  if (!df._touched.length) {
    df.info('Dataflow invoked, but nothing to do.');
    return 0;
  }

  df._pulse = new Pulse(df, ++df._clock, encode);

  if (level >= Info) {
    dt = Date.now();
    df.debug('-- START PROPAGATION (' + df._clock + ') -----');
  }

  // initialize queue, reset touched operators
  df._touched.forEach(function(op) { df._enqueue(op, true); });
  df._touched = UniqueList(id);

  try {
    while (df._heap.size() > 0) {
      op = df._heap.pop();

      // re-queue if rank changes
      if (op.rank !== op.qrank) { df._enqueue(op, true); continue; }

      // otherwise, evaluate the operator
      next = op.run(df._getPulse(op, encode));

      if (level >= Debug) {
        df.debug(op.id, next === StopPropagation ? 'STOP' : next, op);
      }

      // propagate the pulse
      if (next !== StopPropagation) {
        df._pulse = next;
        if (op._targets) op._targets.forEach(function(op) { df._enqueue(op); });
      }

      // increment visit counter
      ++count;
    }
  } catch (err) {
    error = err;
  }

  // reset pulse map
  df._pulses = {};
  df._pulse = null;

  if (level >= Info) {
    dt = Date.now() - dt;
    df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
  }

  if (error) {
    df._postrun = [];
    df.error(error);
  }

  if (df._onrun) {
    try { df._onrun(df, count, error); } catch (err) { df.error(err); }
  }

  // invoke callbacks queued via runAfter
  if (df._postrun.length) {
    var postrun = df._postrun;
    df._postrun = [];
    postrun.forEach(function(f) {
      try { f(df); } catch (err) { df.error(err); }
    });
  }

  return count;
}

/**
 * Runs the dataflow and returns a Promise that resolves when the
 * propagation cycle completes. The standard run method may exit early
 * if there are pending data loading operations. In contrast, this
 * method returns a Promise to allow callers to receive notification
 * when dataflow evaluation completes.
 * @return {Promise} - A promise that resolves to this dataflow.
 */
function runAsync() {
  return this._pending || Promise.resolve(this.run());
}

/**
 * Schedules a callback function to be invoked after the current pulse
 * propagation completes. If no propagation is currently occurring,
 * the function is invoked immediately.
 * @param {function(Dataflow)} callback - The callback function to run.
 *   The callback will be invoked with this Dataflow instance as its
 *   sole argument.
 * @param {boolean} enqueue - A boolean flag indicating that the
 *   callback should be queued up to run after the next propagation
 *   cycle, suppressing immediate invovation when propagation is not
 *   currently occurring.
 */
function runAfter(callback, enqueue) {
  if (this._pulse || enqueue) {
    // pulse propagation is currently running, queue to run after
    this._postrun.push(callback);
  } else {
    // pulse propagation already complete, invoke immediately
    try { callback(this); } catch (err) { this.error(err); }
  }
}

/**
 * Enqueue an operator into the priority queue for evaluation. The operator
 * will be enqueued if it has no registered pulse for the current cycle, or if
 * the force argument is true. Upon enqueue, this method also sets the
 * operator's qrank to the current rank value.
 * @param {Operator} op - The operator to enqueue.
 * @param {boolean} [force] - A flag indicating if the operator should be
 *   forceably added to the queue, even if it has already been previously
 *   enqueued during the current pulse propagation. This is useful when the
 *   dataflow graph is dynamically modified and the operator rank changes.
 */
function enqueue(op, force) {
  var p = !this._pulses[op.id];
  if (p) this._pulses[op.id] = this._pulse;
  if (p || force) {
    op.qrank = op.rank;
    this._heap.push(op);
  }
}

/**
 * Provide a correct pulse for evaluating an operator. If the operator has an
 * explicit source operator, we will try to pull the pulse(s) from it.
 * If there is an array of source operators, we build a multi-pulse.
 * Otherwise, we return a current pulse with correct source data.
 * If the pulse is the pulse map has an explicit target set, we use that.
 * Else if the pulse on the upstream source operator is current, we use that.
 * Else we use the pulse from the pulse map, but copy the source tuple array.
 * @param {Operator} op - The operator for which to get an input pulse.
 * @param {string} [encode] - An (optional) encoding set name with which to
 *   annotate the returned pulse. See {@link run} for more information.
 */
function getPulse(op, encode) {
  var s = op.source,
      stamp = this._clock,
      p;

  if (s && isArray(s)) {
    p = s.map(function(_$$1) { return _$$1.pulse; });
    return new MultiPulse(this, stamp, p, encode);
  } else {
    s = s && s.pulse;
    p = this._pulses[op.id];
    if (s && s !== StopPropagation) {
      if (s.stamp === stamp && p.target !== op) p = s;
      else p.source = s.source;
    }
    return p;
  }
}

var NO_OPT = {skip: false, force: false};

/**
 * Touches an operator, scheduling it to be evaluated. If invoked outside of
 * a pulse propagation, the operator will be evaluated the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the operator
 * will be queued for evaluation if and only if the operator has not yet been
 * evaluated on the current propagation timestamp.
 * @param {Operator} op - The operator to touch.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function touch(op, options) {
  var opt = options || NO_OPT;
  if (this._pulse) {
    // if in midst of propagation, add to priority queue
    this._enqueue(op);
  } else {
    // otherwise, queue for next propagation
    this._touched.add(op);
  }
  if (opt.skip) op.skip(true);
  return this;
}

/**
 * Updates the value of the given operator.
 * @param {Operator} op - The operator to update.
 * @param {*} value - The value to set.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function update(op, value, options) {
  var opt = options || NO_OPT;
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
}

/**
 * Pulses an operator with a changeset of tuples. If invoked outside of
 * a pulse propagation, the pulse will be applied the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the pulse
 * will be added to the set of active pulses and will be applied if and
 * only if the target operator has not yet been evaluated on the current
 * propagation timestamp.
 * @param {Operator} op - The operator to pulse.
 * @param {ChangeSet} value - The tuple changeset to apply.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function pulse(op, changeset, options) {
  this.touch(op, options || NO_OPT);

  var p = new Pulse(this, this._clock + (this._pulse ? 0 : 1)),
      t = op.pulse && op.pulse.source || [];
  p.target = op;
  this._pulses[op.id] = changeset.pulse(p, t);

  return this;
}

function Heap(comparator) {
  this.cmp = comparator;
  this.nodes = [];
}

var prototype$6 = Heap.prototype;

prototype$6.size = function() {
  return this.nodes.length;
};

prototype$6.clear = function() {
  this.nodes = [];
  return this;
};

prototype$6.peek = function() {
  return this.nodes[0];
};

prototype$6.push = function(x) {
  var array = this.nodes;
  array.push(x);
  return siftdown(array, 0, array.length-1, this.cmp);
};

prototype$6.pop = function() {
  var array = this.nodes,
      last = array.pop(),
      item;

  if (array.length) {
    item = array[0];
    array[0] = last;
    siftup(array, 0, this.cmp);
  } else {
    item = last;
  }
  return item;
};

prototype$6.replace = function(item) {
  var array = this.nodes,
      retval = array[0];
  array[0] = item;
  siftup(array, 0, this.cmp);
  return retval;
};

prototype$6.pushpop = function(item) {
  var array = this.nodes, ref = array[0];
  if (array.length && this.cmp(ref, item) < 0) {
    array[0] = item;
    item = ref;
    siftup(array, 0, this.cmp);
  }
  return item;
};

function siftdown(array, start, idx, cmp) {
  var item, parent, pidx;

  item = array[idx];
  while (idx > start) {
    pidx = (idx - 1) >> 1;
    parent = array[pidx];
    if (cmp(item, parent) < 0) {
      array[idx] = parent;
      idx = pidx;
      continue;
    }
    break;
  }
  return (array[idx] = item);
}

function siftup(array, idx, cmp) {
  var start = idx,
      end = array.length,
      item = array[idx],
      cidx = 2 * idx + 1, ridx;

  while (cidx < end) {
    ridx = cidx + 1;
    if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
      cidx = ridx;
    }
    array[idx] = array[cidx];
    idx = cidx;
    cidx = 2 * idx + 1;
  }
  array[idx] = item;
  return siftdown(array, start, idx, cmp);
}

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
function Dataflow() {
  this._log = logger();
  this.logLevel(Error$1);

  this._clock = 0;
  this._rank = 0;
  this._loader = loader();

  this._touched = UniqueList(id);
  this._pulses = {};
  this._pulse = null;

  this._heap = new Heap(function(a, b) { return a.qrank - b.qrank; });
  this._postrun = [];
}

var prototype = Dataflow.prototype;

/**
 * The current timestamp of this dataflow. This value reflects the
 * timestamp of the previous dataflow run. The dataflow is initialized
 * with a stamp value of 0. The initial run of the dataflow will have
 * a timestap of 1, and so on. This value will match the
 * {@link Pulse.stamp} property.
 * @return {number} - The current timestamp value.
 */
prototype.stamp = function() {
  return this._clock;
};

/**
 * Gets or sets the loader instance to use for data file loading. A
 * loader object must provide a "load" method for loading files and a
 * "sanitize" method for checking URL/filename validity. Both methods
 * should accept a URI and options hash as arguments, and return a Promise
 * that resolves to the loaded file contents (load) or a hash containing
 * sanitized URI data with the sanitized url assigned to the "href" property
 * (sanitize).
 * @param {object} _ - The loader instance to use.
 * @return {object|Dataflow} - If no arguments are provided, returns
 *   the current loader instance. Otherwise returns this Dataflow instance.
 */
prototype.loader = function(_$$1) {
  if (arguments.length) {
    this._loader = _$$1;
    return this;
  } else {
    return this._loader;
  }
};

/**
 * Empty entry threshold for garbage cleaning. Map data structures will
 * perform cleaning once the number of empty entries exceeds this value.
 */
prototype.cleanThreshold = 1e4;

// OPERATOR REGISTRATION
prototype.add = add;
prototype.connect = connect;
prototype.rank = rank;
prototype.rerank = rerank;

// OPERATOR UPDATES
prototype.pulse = pulse;
prototype.touch = touch;
prototype.update = update;
prototype.changeset = changeset;

// DATA LOADING
prototype.ingest = ingest$1;
prototype.request = request$1;

// EVENT HANDLING
prototype.events = events;
prototype.on = on;

// PULSE PROPAGATION
prototype.run = run;
prototype.runAsync = runAsync;
prototype.runAfter = runAfter;
prototype._enqueue = enqueue;
prototype._getPulse = getPulse;

// LOGGING AND ERROR HANDLING

function logMethod(method) {
  return function() {
    return this._log[method].apply(this, arguments);
  };
}

/**
 * Logs an error message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit error messages.
 */
prototype.error = logMethod('error');

/**
 * Logs a warning message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit warning messages.
 */
prototype.warn = logMethod('warn');

/**
 * Logs a information message. By default, logged messages are written to
 * console output. The message will only be logged if the current log level is
 * high enough to permit information messages.
 */
prototype.info = logMethod('info');

/**
 * Logs a debug message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit debug messages.
 */
prototype.debug = logMethod('debug');

/**
 * Get or set the current log level. If an argument is provided, it
 * will be used as the new log level.
 * @param {number} [level] - Should be one of None, Warn, Info
 * @return {number} - The current log level.
 */
prototype.logLevel = logMethod('level');

/**
 * Abstract class for operators that process data tuples.
 * Subclasses must provide a {@link transform} method for operator processing.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {Operator} [source] - The operator from which to receive pulses.
 */
function Transform(init, params) {
  Operator.call(this, init, null, params);
}

var prototype$7 = inherits(Transform, Operator);

/**
 * Overrides {@link Operator.evaluate} for transform operators.
 * Internally, this method calls {@link evaluate} to perform processing.
 * If {@link evaluate} returns a falsy value, the input pulse is returned.
 * This method should NOT be overridden, instead overrride {@link evaluate}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return the output pulse for this operator (or StopPropagation)
 */
prototype$7.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;

  var rv;
  if (this.skip()) {
    this.skip(false);
  } else {
    rv = this.evaluate(pulse);
  }
  rv = rv || pulse;

  if (rv !== pulse.StopPropagation) this.pulse = rv;
  this.stamp = pulse.stamp;

  return rv;
};

/**
 * Overrides {@link Operator.evaluate} for transform operators.
 * Marshalls parameter values and then invokes {@link transform}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return {Pulse} The output pulse (or StopPropagation). A falsy return
     value (including undefined) will let the input pulse pass through.
 */
prototype$7.evaluate = function(pulse) {
  var params = this.marshall(pulse.stamp),
      out = this.transform(params, pulse);
  params.clear();
  return out;
};

/**
 * Process incoming pulses.
 * Subclasses should override this method to implement transforms.
 * @param {Parameters} _ - The operator parameter values.
 * @param {Pulse} pulse - The current dataflow pulse.
 * @return {Pulse} The output pulse (or StopPropagation). A falsy return
 *   value (including undefined) will let the input pulse pass through.
 */
prototype$7.transform = function() {};

var transforms = {};

function definition(type) {
  var t = transform(type);
  return t && t.Definition || null;
}

function transform(type) {
  type = type && type.toLowerCase();
  return transforms.hasOwnProperty(type) ? transforms[type] : null;
}

// Utilities

function multikey(f) {
  return function(x) {
    var n = f.length,
        i = 1,
        k = String(f[0](x));

    for (; i<n; ++i) {
      k += '|' + f[i](x);
    }

    return k;
  };
}

function groupkey(fields) {
  return !fields || !fields.length ? function() { return ''; }
    : fields.length === 1 ? fields[0]
    : multikey(fields);
}

function measureName(op, field$$1, as) {
  return as || (op + (!field$$1 ? '' : '_' + field$$1));
}

var AggregateOps = {
  'values': measure({
    name: 'values',
    init: 'cell.store = true;',
    set:  'cell.data.values()', idx: -1
  }),
  'count': measure({
    name: 'count',
    set:  'cell.num'
  }),
  'missing': measure({
    name: 'missing',
    set:  'this.missing'
  }),
  'valid': measure({
    name: 'valid',
    set:  'this.valid'
  }),
  'sum': measure({
    name: 'sum',
    init: 'this.sum = 0;',
    add:  'this.sum += v;',
    rem:  'this.sum -= v;',
    set:  'this.sum'
  }),
  'mean': measure({
    name: 'mean',
    init: 'this.mean = 0;',
    add:  'var d = v - this.mean; this.mean += d / this.valid;',
    rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
    set:  'this.mean'
  }),
  'average': measure({
    name: 'average',
    set:  'this.mean',
    req:  ['mean'], idx: 1
  }),
  'variance': measure({
    name: 'variance',
    init: 'this.dev = 0;',
    add:  'this.dev += d * (v - this.mean);',
    rem:  'this.dev -= d * (v - this.mean);',
    set:  'this.valid > 1 ? this.dev / (this.valid-1) : 0',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure({
    name: 'variancep',
    set:  'this.valid > 1 ? this.dev / this.valid : 0',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure({
    name: 'stdev',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : 0',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure({
    name: 'stdevp',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : 0',
    req:  ['variance'], idx: 2
  }),
  'stderr': measure({
    name: 'stderr',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : 0',
    req:  ['variance'], idx: 2
  }),
  'distinct': measure({
    name: 'distinct',
    set:  'cell.data.distinct(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci0': measure({
    name: 'ci0',
    set:  'cell.data.ci0(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci1': measure({
    name: 'ci1',
    set:  'cell.data.ci1(this.get)',
    req:  ['values'], idx: 3
  }),
  'median': measure({
    name: 'median',
    set:  'cell.data.q2(this.get)',
    req:  ['values'], idx: 3
  }),
  'q1': measure({
    name: 'q1',
    set:  'cell.data.q1(this.get)',
    req:  ['values'], idx: 3
  }),
  'q3': measure({
    name: 'q3',
    set:  'cell.data.q3(this.get)',
    req:  ['values'], idx: 3
  }),
  'argmin': measure({
    name: 'argmin',
    init: 'this.argmin = null;',
    add:  'if (v < this.min) this.argmin = t;',
    rem:  'if (v <= this.min) this.argmin = null;',
    set:  'this.argmin || cell.data.argmin(this.get)',
    req:  ['min'], str: ['values'], idx: 3
  }),
  'argmax': measure({
    name: 'argmax',
    init: 'this.argmax = null;',
    add:  'if (v > this.max) this.argmax = t;',
    rem:  'if (v >= this.max) this.argmax = null;',
    set:  'this.argmax || cell.data.argmax(this.get)',
    req:  ['max'], str: ['values'], idx: 3
  }),
  'min': measure({
    name: 'min',
    init: 'this.min = null;',
    add:  'if (v < this.min || this.min === null) this.min = v;',
    rem:  'if (v <= this.min) this.min = NaN;',
    set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
    str:  ['values'], idx: 4
  }),
  'max': measure({
    name: 'max',
    init: 'this.max = null;',
    add:  'if (v > this.max || this.max === null) this.max = v;',
    rem:  'if (v >= this.max) this.max = NaN;',
    set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
    str:  ['values'], idx: 4
  })
};

var ValidAggregateOps = Object.keys(AggregateOps);

function createMeasure(op, name) {
  return AggregateOps[op](name);
}

function measure(base) {
  return function(out) {
    var m = extend({init:'', add:'', rem:'', idx:0}, base);
    m.out = out || base.name;
    return m;
  };
}

function compareIndex(a, b) {
  return a.idx - b.idx;
}

function resolve(agg, stream) {
  function collect(m, a) {
    function helper(r) { if (!m[r]) collect(m, m[r] = AggregateOps[r]()); }
    if (a.req) a.req.forEach(helper);
    if (stream && a.str) a.str.forEach(helper);
    return m;
  }
  var map = agg.reduce(
    collect,
    agg.reduce(function(m, a) {
      m[a.name] = a;
      return m;
    }, {})
  );
  var values = [], key$$1;
  for (key$$1 in map) values.push(map[key$$1]);
  return values.sort(compareIndex);
}

function compileMeasures(agg, field$$1) {
  var get = field$$1 || identity,
      all = resolve(agg, true), // assume streaming removes may occur
      init = 'var cell = this.cell; this.valid = 0; this.missing = 0;',
      ctr = 'this.cell = cell; this.init();',
      add = 'if(v==null){++this.missing; return;} if(v!==v) return; ++this.valid;',
      rem = 'if(v==null){--this.missing; return;} if(v!==v) return; --this.valid;',
      set = 'var cell = this.cell;';

  all.forEach(function(a) {
    init += a.init;
    add += a.add;
    rem += a.rem;
  });
  agg.slice().sort(compareIndex).forEach(function(a) {
    set += 't[\'' + a.out + '\']=' + a.set + ';';
  });
  set += 'return t;';

  ctr = Function('cell', ctr);
  ctr.prototype.init = Function(init);
  ctr.prototype.add = Function('v', 't', add);
  ctr.prototype.rem = Function('v', 't', rem);
  ctr.prototype.set = Function('t', set);
  ctr.prototype.get = get;
  ctr.fields = agg.map(function(_$$1) { return _$$1.out; });
  return ctr;
}

var bin = function(_$$1) {
  // determine range
  var maxb = _$$1.maxbins || 20,
      base = _$$1.base || 10,
      logb = Math.log(base),
      div  = _$$1.divide || [5, 2],
      min$$1  = _$$1.extent[0],
      max$$1  = _$$1.extent[1],
      span = max$$1 - min$$1,
      step, level, minstep, precision, v, i, n, eps;

  if (_$$1.step) {
    // if step size is explicitly given, use that
    step = _$$1.step;
  } else if (_$$1.steps) {
    // if provided, limit choice to acceptable step sizes
    v = span / maxb;
    for (i=0, n=_$$1.steps.length; i < n && _$$1.steps[i] < v; ++i);
    step = _$$1.steps[Math.max(0, i-1)];
  } else {
    // else use span to determine step size
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = _$$1.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );

    // increase step size if too many bins
    while (Math.ceil(span/step) > maxb) { step *= base; }

    // decrease step size if allowed
    for (i=0, n=div.length; i<n; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  if (_$$1.nice || _$$1.nice === undefined) {
    v = Math.floor(min$$1 / step + eps) * step;
    min$$1 = min$$1 < v ? v - step : v;
    max$$1 = Math.ceil(max$$1 / step) * step;
  }

  return {
    start: min$$1,
    stop:  max$$1,
    step:  step
  };
};

var numbers = function(array, f) {
  var numbers = [],
      n = array.length,
      i = -1, a;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
  } else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
  }
  return numbers;
};

function number(x) {
  return x === null ? NaN : +x;
}

exports.random = Math.random;

function setRandom(r) {
  exports.random = r;
}

var bootstrapCI = function(array, samples, alpha, f) {
  var values = numbers(array, f),
      n = values.length,
      m = samples,
      a, i, j, mu;

  for (j=0, mu=Array(m); j<m; ++j) {
    for (a=0, i=0; i<n; ++i) {
      a += values[~~(exports.random() * n)];
    }
    mu[j] = a / n;
  }

  return [
    d3Array.quantile(mu.sort(d3Array.ascending), alpha/2),
    d3Array.quantile(mu, 1-(alpha/2))
  ];
};

var quartiles = function(array, f) {
  var values = numbers(array, f);

  return [
    d3Array.quantile(values.sort(d3Array.ascending), 0.25),
    d3Array.quantile(values, 0.50),
    d3Array.quantile(values, 0.75)
  ];
};

var integer = function(min$$1, max$$1) {
  if (max$$1 == null) {
    max$$1 = min$$1;
    min$$1 = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_$$1) {
    if (arguments.length) {
      a = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return a;
    }
  };

  dist.max = function(_$$1) {
    if (arguments.length) {
      b = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return b;
    }
  };

  dist.sample = function() {
    return a + Math.floor(d * exports.random());
  };

  dist.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p * d) : NaN;
  };

  return dist.min(min$$1).max(max$$1);
};

var randomNormal = function(mean$$1, stdev) {
  var mu,
      sigma,
      next = NaN,
      dist = {};

  dist.mean = function(_$$1) {
    if (arguments.length) {
      mu = _$$1 || 0;
      next = NaN;
      return dist;
    } else {
      return mu;
    }
  };

  dist.stdev = function(_$$1) {
    if (arguments.length) {
      sigma = _$$1 == null ? 1 : _$$1;
      next = NaN;
      return dist;
    } else {
      return sigma;
    }
  };

  dist.sample = function() {
    var x = 0, y = 0, rds, c;
    if (next === next) {
      x = next;
      next = NaN;
      return x;
    }
    do {
      x = exports.random() * 2 - 1;
      y = exports.random() * 2 - 1;
      rds = x * x + y * y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
    next = mu + y * c * sigma;
    return mu + x * c * sigma;
  };

  dist.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mu, 2) / (-2 * Math.pow(sigma, 2)));
    return (1 / (sigma * Math.sqrt(2*Math.PI))) * exp;
  };

  // Approximation from West (2009)
  // Better Approximations to Cumulative Normal Functions
  dist.cdf = function(x) {
    var cd,
        z = (x - mu) / sigma,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum$$1, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum$$1 = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum$$1 = sum$$1 * Z + 6.37396220353165;
        sum$$1 = sum$$1 * Z + 33.912866078383;
        sum$$1 = sum$$1 * Z + 112.079291497871;
        sum$$1 = sum$$1 * Z + 221.213596169931;
        sum$$1 = sum$$1 * Z + 220.206867912376;
        cd = exp * sum$$1;
        sum$$1 = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum$$1 = sum$$1 * Z + 16.064177579207;
        sum$$1 = sum$$1 * Z + 86.7807322029461;
        sum$$1 = sum$$1 * Z + 296.564248779674;
        sum$$1 = sum$$1 * Z + 637.333633378831;
        sum$$1 = sum$$1 * Z + 793.826512519948;
        sum$$1 = sum$$1 * Z + 440.413735824752;
        cd = cd / sum$$1;
      } else {
        sum$$1 = Z + 0.65;
        sum$$1 = Z + 4 / sum$$1;
        sum$$1 = Z + 3 / sum$$1;
        sum$$1 = Z + 2 / sum$$1;
        sum$$1 = Z + 1 / sum$$1;
        cd = exp / sum$$1 / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };

  // Approximation of Probit function using inverse error function.
  dist.icdf = function(p) {
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mu + sigma * Math.SQRT2 * s;
  };

  return dist.mean(mean$$1).stdev(stdev);
};

// TODO: support for additional kernels?
var randomKDE = function(support, bandwidth) {
  var kernel = randomNormal(),
      dist = {},
      n = 0;

  dist.data = function(_$$1) {
    if (arguments.length) {
      support = _$$1;
      n = _$$1 ? _$$1.length : 0;
      return dist.bandwidth(bandwidth);
    } else {
      return support;
    }
  };

  dist.bandwidth = function(_$$1) {
    if (!arguments.length) return bandwidth;
    bandwidth = _$$1;
    if (!bandwidth && support) bandwidth = estimateBandwidth(support);
    return dist;
  };

  dist.sample = function() {
    return support[~~(exports.random() * n)] + bandwidth * kernel.sample();
  };

  dist.pdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.pdf((x - support[i]) / bandwidth);
    }
    return y / bandwidth / n;
  };

  dist.cdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.cdf((x - support[i]) / bandwidth);
    }
    return y / n;
  };

  dist.icdf = function() {
    throw Error('KDE icdf not supported.');
  };

  return dist.data(support);
};

// Scott, D. W. (1992) Multivariate Density Estimation:
// Theory, Practice, and Visualization. Wiley.
function estimateBandwidth(array) {
  var n = array.length,
      q = quartiles(array),
      h = (q[2] - q[0]) / 1.34;
  return 1.06 * Math.min(Math.sqrt(d3Array.variance(array)), h) * Math.pow(n, -0.2);
}

var randomMixture = function(dists, weights) {
  var dist = {}, m = 0, w;

  function normalize(x) {
    var w = [], sum$$1 = 0, i;
    for (i=0; i<m; ++i) { sum$$1 += (w[i] = (x[i]==null ? 1 : +x[i])); }
    for (i=0; i<m; ++i) { w[i] /= sum$$1; }
    return w;
  }

  dist.weights = function(_$$1) {
    if (arguments.length) {
      w = normalize(weights = (_$$1 || []));
      return dist;
    }
    return weights;
  };

  dist.distributions = function(_$$1) {
    if (arguments.length) {
      if (_$$1) {
        m = _$$1.length;
        dists = _$$1;
      } else {
        m = 0;
        dists = [];
      }
      return dist.weights(weights);
    }
    return dists;
  };

  dist.sample = function() {
    var r = exports.random(),
        d = dists[m-1],
        v = w[0],
        i = 0;

    // first select distribution
    for (; i<m-1; v += w[++i]) {
      if (r < v) { d = dists[i]; break; }
    }
    // then sample from it
    return d.sample();
  };

  dist.pdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].pdf(x);
    }
    return p;
  };

  dist.cdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].cdf(x);
    }
    return p;
  };

  dist.icdf = function() {
    throw Error('Mixture icdf not supported.');
  };

  return dist.distributions(dists).weights(weights);
};

var randomUniform = function(min$$1, max$$1) {
  if (max$$1 == null) {
    max$$1 = (min$$1 == null ? 1 : min$$1);
    min$$1 = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_$$1) {
    if (arguments.length) {
      a = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return a;
    }
  };

  dist.max = function(_$$1) {
    if (arguments.length) {
      b = _$$1 || 0;
      d = b - a;
      return dist;
    } else {
      return b;
    }
  };

  dist.sample = function() {
    return a + d * exports.random();
  };

  dist.pdf = function(x) {
    return (x >= a && x <= b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    return x < a ? 0 : x > b ? 1 : (x - a) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a + p * d : NaN;
  };

  return dist.min(min$$1).max(max$$1);
};

function TupleStore(key$$1) {
  this._key = key$$1 ? field(key$$1) : tupleid;
  this.reset();
}

var prototype$9 = TupleStore.prototype;

prototype$9.reset = function() {
  this._add = [];
  this._rem = [];
  this._ext = null;
  this._get = null;
  this._q = null;
};

prototype$9.add = function(v) {
  this._add.push(v);
};

prototype$9.rem = function(v) {
  this._rem.push(v);
};

prototype$9.values = function() {
  this._get = null;
  if (this._rem.length === 0) return this._add;

  var a = this._add,
      r = this._rem,
      k = this._key,
      n = a.length,
      m = r.length,
      x = Array(n - m),
      map = {}, i, j, v;

  // use unique key field to clear removed values
  for (i=0; i<m; ++i) {
    map[k(r[i])] = 1;
  }
  for (i=0, j=0; i<n; ++i) {
    if (map[k(v = a[i])]) {
      map[k(v)] = 0;
    } else {
      x[j++] = v;
    }
  }

  this._rem = [];
  return (this._add = x);
};

// memoizing statistics methods

prototype$9.distinct = function(get) {
  var v = this.values(),
      n = v.length,
      map = {},
      count = 0, s;

  while (--n >= 0) {
    s = get(v[n]) + '';
    if (!map.hasOwnProperty(s)) {
      map[s] = 1;
      ++count;
    }
  }

  return count;
};

prototype$9.extent = function(get) {
  if (this._get !== get || !this._ext) {
    var v = this.values(),
        i = extentIndex(v, get);
    this._ext = [v[i[0]], v[i[1]]];
    this._get = get;
  }
  return this._ext;
};

prototype$9.argmin = function(get) {
  return this.extent(get)[0] || {};
};

prototype$9.argmax = function(get) {
  return this.extent(get)[1] || {};
};

prototype$9.min = function(get) {
  var m = this.extent(get)[0];
  return m != null ? get(m) : +Infinity;
};

prototype$9.max = function(get) {
  var m = this.extent(get)[1];
  return m != null ? get(m) : -Infinity;
};

prototype$9.quartile = function(get) {
  if (this._get !== get || !this._q) {
    this._q = quartiles(this.values(), get);
    this._get = get;
  }
  return this._q;
};

prototype$9.q1 = function(get) {
  return this.quartile(get)[0];
};

prototype$9.q2 = function(get) {
  return this.quartile(get)[1];
};

prototype$9.q3 = function(get) {
  return this.quartile(get)[2];
};

prototype$9.ci = function(get) {
  if (this._get !== get || !this._ci) {
    this._ci = bootstrapCI(this.values(), 1000, 0.05, get);
    this._get = get;
  }
  return this._ci;
};

prototype$9.ci0 = function(get) {
  return this.ci(get)[0];
};

prototype$9.ci1 = function(get) {
  return this.ci(get)[1];
};

/**
 * Group-by aggregation operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {Array<function(object): *>} [params.fields] - An array of accessors to aggregate.
 * @param {Array<string>} [params.ops] - An array of strings indicating aggregation operations.
 * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
 * @param {boolean} [params.cross=false] - A flag indicating that the full
 *   cross-product of groupby values should be generated, including empty cells.
 *   If true, the drop parameter is ignored and empty cells are retained.
 * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
 */
function Aggregate(params) {
  Transform.call(this, null, params);

  this._adds = []; // array of added output tuples
  this._mods = []; // array of modified output tuples
  this._alen = 0;  // number of active added tuples
  this._mlen = 0;  // number of active modified tuples
  this._drop = true;   // should empty aggregation cells be removed
  this._cross = false; // produce full cross-product of group-by values

  this._dims = [];   // group-by dimension accessors
  this._dnames = []; // group-by dimension names

  this._measures = []; // collection of aggregation monoids
  this._countOnly = false; // flag indicating only count aggregation
  this._counts = null; // collection of count fields
  this._prev = null;   // previous aggregation cells

  this._inputs = null;  // array of dependent input tuple field names
  this._outputs = null; // array of output tuple field names
}

Aggregate.Definition = {
  "type": "Aggregate",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidAggregateOps },
    { "name": "fields", "type": "field", "null": true, "array": true },
    { "name": "as", "type": "string", "null": true, "array": true },
    { "name": "drop", "type": "boolean", "default": true },
    { "name": "cross", "type": "boolean", "default": false },
    { "name": "key", "type": "field" }
  ]
};

var prototype$8 = inherits(Aggregate, Transform);

prototype$8.transform = function(_$$1, pulse) {
  var aggr = this,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      mod;

  this.stamp = out.stamp;

  if (this.value && ((mod = _$$1.modified()) || pulse.modified(this._inputs))) {
    this._prev = this.value;
    this.value = mod ? this.init(_$$1) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    this.value = this.value || this.init(_$$1);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }

  // Indicate output fields and return aggregate tuples.
  out.modifies(this._outputs);

  // Should empty cells be dropped?
  aggr._drop = _$$1.drop !== false;

  // If domain cross-product requested, generate empty cells as needed
  // and ensure that empty cells are not dropped
  if (_$$1.cross && aggr._dims.length > 1) {
    aggr._drop = false;
    this.cross();
  }

  return aggr.changes(out);
};

prototype$8.cross = function() {
  var aggr = this,
      curr = aggr.value,
      dims = aggr._dnames,
      vals = dims.map(function() { return {}; }),
      n = dims.length;

  // collect all group-by domain values
  function collect(cells) {
    var key$$1, i, t, v;
    for (key$$1 in cells) {
      t = cells[key$$1].tuple;
      for (i=0; i<n; ++i) {
        vals[i][(v = t[dims[i]])] = v;
      }
    }
  }
  collect(aggr._prev);
  collect(curr);

  // iterate over key cross-product, create cells as needed
  function generate(base, tuple, index) {
    var name = dims[index],
        v = vals[index++],
        k, key$$1;

    for (k in v) {
      tuple[name] = v[k];
      key$$1 = base ? base + '|' + k : k;
      if (index < n) generate(key$$1, tuple, index);
      else if (!curr[key$$1]) aggr.cell(key$$1, tuple);
    }
  }
  generate('', {}, 0);
};

prototype$8.init = function(_$$1) {
  // initialize input and output fields
  var inputs = (this._inputs = []),
      outputs = (this._outputs = []),
      inputMap = {};

  function inputVisit(get) {
    var fields = array(accessorFields(get)),
        i = 0, n = fields.length, f;
    for (; i<n; ++i) {
      if (!inputMap[f=fields[i]]) {
        inputMap[f] = 1;
        inputs.push(f);
      }
    }
  }

  // initialize group-by dimensions
  this._dims = array(_$$1.groupby);
  this._dnames = this._dims.map(function(d) {
    var dname = accessorName(d);
    inputVisit(d);
    outputs.push(dname);
    return dname;
  });
  this.cellkey = _$$1.key ? _$$1.key : groupkey(this._dims);

  // initialize aggregate measures
  this._countOnly = true;
  this._counts = [];
  this._measures = [];

  var fields = _$$1.fields || [null],
      ops = _$$1.ops || ['count'],
      as = _$$1.as || [],
      n = fields.length,
      map = {},
      field$$1, op, m, mname, outname, i;

  if (n !== ops.length) {
    error$1('Unmatched number of fields and aggregate ops.');
  }

  for (i=0; i<n; ++i) {
    field$$1 = fields[i];
    op = ops[i];

    if (field$$1 == null && op !== 'count') {
      error$1('Null aggregate field specified.');
    }
    mname = accessorName(field$$1);
    outname = measureName(op, mname, as[i]);
    outputs.push(outname);

    if (op === 'count') {
      this._counts.push(outname);
      continue;
    }

    m = map[mname];
    if (!m) {
      inputVisit(field$$1);
      m = (map[mname] = []);
      m.field = field$$1;
      this._measures.push(m);
    }

    if (op !== 'count') this._countOnly = false;
    m.push(createMeasure(op, outname));
  }

  this._measures = this._measures.map(function(m) {
    return compileMeasures(m, m.field);
  });

  return {}; // aggregation cells (this.value)
};

// -- Cell Management -----

prototype$8.cellkey = groupkey();

prototype$8.cell = function(key$$1, t) {
  var cell = this.value[key$$1];
  if (!cell) {
    cell = this.value[key$$1] = this.newcell(key$$1, t);
    this._adds[this._alen++] = cell;
  } else if (cell.num === 0 && this._drop && cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._adds[this._alen++] = cell;
  } else if (cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._mods[this._mlen++] = cell;
  }
  return cell;
};

prototype$8.newcell = function(key$$1, t) {
  var cell = {
    key:   key$$1,
    num:   0,
    agg:   null,
    tuple: this.newtuple(t, this._prev && this._prev[key$$1]),
    stamp: this.stamp,
    store: false
  };

  if (!this._countOnly) {
    var measures = this._measures,
        n = measures.length, i;

    cell.agg = Array(n);
    for (i=0; i<n; ++i) {
      cell.agg[i] = new measures[i](cell);
    }
  }

  if (cell.store) {
    cell.data = new TupleStore();
  }

  return cell;
};

prototype$8.newtuple = function(t, p) {
  var names = this._dnames,
      dims = this._dims,
      x = {}, i, n;

  for (i=0, n=dims.length; i<n; ++i) {
    x[names[i]] = dims[i](t);
  }

  return p ? replace(p.tuple, x) : ingest(x);
};

// -- Process Tuples -----

prototype$8.add = function(t) {
  var key$$1 = this.cellkey(t),
      cell = this.cell(key$$1, t),
      agg, i, n;

  cell.num += 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.add(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].add(agg[i].get(t), t);
  }
};

prototype$8.rem = function(t) {
  var key$$1 = this.cellkey(t),
      cell = this.cell(key$$1, t),
      agg, i, n;

  cell.num -= 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.rem(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].rem(agg[i].get(t), t);
  }
};

prototype$8.celltuple = function(cell) {
  var tuple = cell.tuple,
      counts = this._counts,
      agg, i, n;

  // consolidate stored values
  if (cell.store) {
    cell.data.values();
  }

  // update tuple properties
  for (i=0, n=counts.length; i<n; ++i) {
    tuple[counts[i]] = cell.num;
  }
  if (!this._countOnly) {
    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].set(tuple);
    }
  }

  return tuple;
};

prototype$8.changes = function(out) {
  var adds = this._adds,
      mods = this._mods,
      prev = this._prev,
      drop = this._drop,
      add = out.add,
      rem = out.rem,
      mod = out.mod,
      cell, key$$1, i, n;

  if (prev) for (key$$1 in prev) {
    cell = prev[key$$1];
    if (!drop || cell.num) rem.push(cell.tuple);
  }

  for (i=0, n=this._alen; i<n; ++i) {
    add.push(this.celltuple(adds[i]));
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    cell = mods[i];
    (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
  this._prev = null;
  return out;
};

/**
 * Generates a binning function for discretizing data.
 * @constructor
 * @param {object} params - The parameters for this operator. The
 *   provided values should be valid options for the {@link bin} function.
 * @param {function(object): *} params.field - The data field to bin.
 */
function Bin(params) {
  Transform.call(this, null, params);
}

Bin.Definition = {
  "type": "Bin",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "anchor", "type": "number" },
    { "name": "maxbins", "type": "number", "default": 20 },
    { "name": "base", "type": "number", "default": 10 },
    { "name": "divide", "type": "number", "array": true, "default": [5, 2] },
    { "name": "extent", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "step", "type": "number" },
    { "name": "steps", "type": "number", "array": true },
    { "name": "minstep", "type": "number", "default": 0 },
    { "name": "nice", "type": "boolean", "default": true },
    { "name": "name", "type": "string" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["bin0", "bin1"] }
  ]
};

var prototype$10 = inherits(Bin, Transform);

prototype$10.transform = function(_$$1, pulse) {
  var bins = this._bins(_$$1),
      start = bins.start,
      step = bins.step,
      as = _$$1.as || ['bin0', 'bin1'],
      b0 = as[0],
      b1 = as[1],
      flag;

  if (_$$1.modified()) {
    pulse = pulse.reflow(true);
    flag = pulse.SOURCE;
  } else {
    flag = pulse.modified(accessorFields(_$$1.field)) ? pulse.ADD_MOD : pulse.ADD;
  }

  pulse.visit(flag, function(t) {
    var v = bins(t);
    // minimum bin value (inclusive)
    t[b0] = v;
    // maximum bin value (exclusive)
    // use convoluted math for better floating point agreement
    // see https://github.com/vega/vega/issues/830
    t[b1] = v == null ? null : start + step * (1 + (v - start) / step);
  });

  return pulse.modifies(as);
};

prototype$10._bins = function(_$$1) {
  if (this.value && !_$$1.modified()) {
    return this.value;
  }

  var field$$1 = _$$1.field,
      bins  = bin(_$$1),
      start = bins.start,
      stop  = bins.stop,
      step  = bins.step,
      a, d;

  if ((a = _$$1.anchor) != null) {
    d = a - (start + step * Math.floor((a - start) / step));
    start += d;
    stop += d;
  }

  var f = function(t) {
    var v = field$$1(t);
    if (v == null) {
      return null;
    } else {
      v = Math.max(start, Math.min(+v, stop - step));
      return start + step * Math.floor((v - start) / step);
    }
  };

  f.start = start;
  f.stop = stop;
  f.step = step;

  return this.value = accessor(
    f,
    accessorFields(field$$1),
    _$$1.name || 'bin_' + accessorName(field$$1)
  );
};

var SortedList = function(idFunc, source, input) {
  var $$$1 = idFunc,
      data = source || [],
      add = input || [],
      rem = {},
      cnt = 0;

  return {
    add: function(t) { add.push(t); },
    remove: function(t) { rem[$$$1(t)] = ++cnt; },
    size: function() { return data.length; },
    data: function(compare$$1, resort) {
      if (cnt) {
        data = data.filter(function(t) { return !rem[$$$1(t)]; });
        rem = {};
        cnt = 0;
      }
      if (resort && compare$$1) {
        data.sort(compare$$1);
      }
      if (add.length) {
        data = compare$$1
          ? merge(compare$$1, data, add.sort(compare$$1))
          : data.concat(add);
        add = [];
      }
      return data;
    }
  }
};

/**
 * Collects all data tuples that pass through this operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for additionally sorting the collected tuples.
 */
function Collect(params) {
  Transform.call(this, [], params);
}

Collect.Definition = {
  "type": "Collect",
  "metadata": {"source": true},
  "params": [
    { "name": "sort", "type": "compare" }
  ]
};

var prototype$11 = inherits(Collect, Transform);

prototype$11.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      list = SortedList(tupleid, this.value, out.materialize(out.ADD).add),
      sort = _$$1.sort,
      mod = pulse.changed() || (sort &&
            (_$$1.modified('sort') || pulse.modified(sort.fields)));

  out.visit(out.REM, list.remove);

  this.modified(mod);
  this.value = out.source = list.data(sort, mod);
  return out;
};

/**
 * Generates a comparator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The fields to compare.
 * @param {Array<string>} [params.orders] - The sort orders.
 *   Each entry should be one of "ascending" (default) or "descending".
 */
function Compare(params) {
  Operator.call(this, null, update$1, params);
}

inherits(Compare, Operator);

function update$1(_$$1) {
  return (this.value && !_$$1.modified())
    ? this.value
    : compare(_$$1.fields, _$$1.orders);
}

/**
 * Count regexp-defined pattern occurrences in a text field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the text field.
 * @param {string} [params.pattern] - RegExp string defining the text pattern.
 * @param {string} [params.case] - One of 'lower', 'upper' or null (mixed) case.
 * @param {string} [params.stopwords] - RegExp string of words to ignore.
 */
function CountPattern(params) {
  Transform.call(this, null, params);
}

CountPattern.Definition = {
  "type": "CountPattern",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "case", "type": "enum", "values": ["upper", "lower", "mixed"], "default": "mixed" },
    { "name": "pattern", "type": "string", "default": "[\\w\"]+" },
    { "name": "stopwords", "type": "string", "default": "" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["text", "count"] }
  ]
};

function tokenize(text, tcase, match) {
  switch (tcase) {
    case 'upper': text = text.toUpperCase(); break;
    case 'lower': text = text.toLowerCase(); break;
  }
  return text.match(match);
}

var prototype$12 = inherits(CountPattern, Transform);

prototype$12.transform = function(_$$1, pulse) {
  function process(update) {
    return function(tuple) {
      var tokens = tokenize(get(tuple), _$$1.case, match) || [], t;
      for (var i=0, n=tokens.length; i<n; ++i) {
        if (!stop.test(t = tokens[i])) update(t);
      }
    };
  }

  var init = this._parameterCheck(_$$1, pulse),
      counts = this._counts,
      match = this._match,
      stop = this._stop,
      get = _$$1.field,
      as = _$$1.as || ['text', 'count'],
      add = process(function(t) { counts[t] = 1 + (counts[t] || 0); }),
      rem = process(function(t) { counts[t] -= 1; });

  if (init) {
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);
    pulse.visit(pulse.REM, rem);
  }

  return this._finish(pulse, as); // generate output tuples
};

prototype$12._parameterCheck = function(_$$1, pulse) {
  var init = false;

  if (_$$1.modified('stopwords') || !this._stop) {
    this._stop = new RegExp('^' + (_$$1.stopwords || '') + '$', 'i');
    init = true;
  }

  if (_$$1.modified('pattern') || !this._match) {
    this._match = new RegExp((_$$1.pattern || '[\\w\']+'), 'g');
    init = true;
  }

  if (_$$1.modified('field') || pulse.modified(_$$1.field.fields)) {
    init = true;
  }

  if (init) this._counts = {};
  return init;
};

prototype$12._finish = function(pulse, as) {
  var counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      text = as[0],
      count = as[1],
      out = pulse.fork(),
      w, t, c;

  for (w in counts) {
    t = tuples[w];
    c = counts[w] || 0;
    if (!t && c) {
      tuples[w] = (t = ingest({}));
      t[text] = w;
      t[count] = c;
      out.add.push(t);
    } else if (c === 0) {
      if (t) out.rem.push(t);
      counts[w] = null;
      tuples[w] = null;
    } else if (t[count] !== c) {
      t[count] = c;
      out.mod.push(t);
    }
  }

  return out.modifies(as);
};

/**
 * Perform a cross-product of a tuple stream with itself.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object):boolean} [params.filter] - An optional filter
 *   function for selectively including tuples in the cross product.
 * @param {Array<string>} [params.as] - The names of the output fields.
 */
function Cross(params) {
  Transform.call(this, null, params);
}

Cross.Definition = {
  "type": "Cross",
  "metadata": {"source": true, "generates": true, "changes": true},
  "params": [
    { "name": "filter", "type": "expr" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["a", "b"] }
  ]
};

var prototype$13 = inherits(Cross, Transform);

prototype$13.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      data = this.value,
      as = _$$1.as || ['a', 'b'],
      a = as[0], b = as[1],
      reset = !data
          || pulse.changed(pulse.ADD_REM)
          || _$$1.modified('as')
          || _$$1.modified('filter');

  if (reset) {
    if (data) out.rem = data;
    out.add = this.value = cross(pulse.source, a, b, _$$1.filter || truthy);
  } else {
    out.mod = data;
  }

  out.source = this.value;
  return out.modifies(as);
};

function cross(input, a, b, filter) {
  var data = [],
      t = {},
      n = input.length,
      i = 0,
      j, left;

  for (; i<n; ++i) {
    t[a] = left = input[i];
    for (j=0; j<n; ++j) {
      t[b] = input[j];
      if (filter(t)) {
        data.push(ingest(t));
        t = {};
        t[a] = left;
      }
    }
  }

  return data;
}

var Distributions = {
  kde:     randomKDE,
  mixture: randomMixture,
  normal:  randomNormal,
  uniform: randomUniform
};

var DISTRIBUTIONS = 'distributions';
var FUNCTION = 'function';
var FIELD = 'field';

/**
 * Parse a parameter object for a probability distribution.
 * @param {object} def - The distribution parameter object.
 * @param {function():Array<object>} - A method for requesting
 *   source data. Used for distributions (such as KDE) that
 *   require sample data points. This method will only be
 *   invoked if the 'from' parameter for a target data source
 *   is not provided. Typically this method returns backing
 *   source data for a Pulse object.
 * @return {object} - The output distribution object.
 */
function parse$1(def, data) {
  var func = def[FUNCTION];
  if (!Distributions.hasOwnProperty(func)) {
    error$1('Unknown distribution function: ' + func);
  }

  var d = Distributions[func]();

  for (var name in def) {
    // if data field, extract values
    if (name === FIELD) {
      d.data((def.from || data()).map(def[name]));
    }

    // if distribution mixture, recurse to parse each definition
    else if (name === DISTRIBUTIONS) {
      d[name](def[name].map(function(_$$1) { return parse$1(_$$1, data); }));
    }

    // otherwise, simply set the parameter
    else if (typeof d[name] === FUNCTION) {
      d[name](def[name]);
    }
  }

  return d;
}

/**
 * Grid sample points for a probability density. Given a distribution and
 * a sampling extent, will generate points suitable for plotting either
 * PDF (probability density function) or CDF (cumulative distribution
 * function) curves.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.distribution - The probability distribution. This
 *   is an object parameter dependent on the distribution type.
 * @param {string} [params.method='pdf'] - The distribution method to sample.
 *   One of 'pdf' or 'cdf'.
 * @param {Array<number>} [params.extent] - The [min, max] extent over which
 *   to sample the distribution. This argument is required in most cases, but
 *   can be omitted if the distribution (e.g., 'kde') supports a 'data' method
 *   that returns numerical sample points from which the extent can be deduced.
 * @param {number} [params.steps=100] - The number of sampling steps.
 */
function Density(params) {
  Transform.call(this, null, params);
}

var distributions = [
  {
    "key": {"function": "normal"},
    "params": [
      { "name": "mean", "type": "number", "default": 0 },
      { "name": "stdev", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "uniform"},
    "params": [
      { "name": "min", "type": "number", "default": 0 },
      { "name": "max", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "kde"},
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "from", "type": "data" },
      { "name": "bandwidth", "type": "number", "default": 0 }
    ]
  }
];

var mixture = {
  "key": {"function": "mixture"},
  "params": [
    { "name": "distributions", "type": "param", "array": true,
      "params": distributions },
    { "name": "weights", "type": "number", "array": true }
  ]
};

Density.Definition = {
  "type": "Density",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "extent", "type": "number", "array": true, "length": 2 },
    { "name": "steps", "type": "number", "default": 100 },
    { "name": "method", "type": "string", "default": "pdf",
      "values": ["pdf", "cdf"] },
    { "name": "distribution", "type": "param",
      "params": distributions.concat(mixture) },
    { "name": "as", "type": "string", "array": true,
      "default": ["value", "density"] }
  ]
};

var prototype$14 = inherits(Density, Transform);

prototype$14.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

  if (!this.value || pulse.changed() || _$$1.modified()) {
    var dist = parse$1(_$$1.distribution, source(pulse)),
        method = _$$1.method || 'pdf';

    if (method !== 'pdf' && method !== 'cdf') {
      error$1('Invalid density method: ' + method);
    }
    if (!_$$1.extent && !dist.data) {
      error$1('Missing density extent parameter.');
    }
    method = dist[method];

    var as = _$$1.as || ['value', 'density'],
        domain = _$$1.extent || d3Array.extent(dist.data()),
        step = (domain[1] - domain[0]) / (_$$1.steps || 100),
        values = d3Array.range(domain[0], domain[1] + step/2, step)
          .map(function(v) {
            var tuple = {};
            tuple[as[0]] = v;
            tuple[as[1]] = method(v);
            return ingest(tuple);
          });

    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;
  }

  return out;
};

function source(pulse) {
  return function() { return pulse.materialize(pulse.SOURCE).source; };
}

/**
 * Computes extents (min/max) for a data field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field over which to compute extends.
 */
function Extent(params) {
  Transform.call(this, [+Infinity, -Infinity], params);
}

Extent.Definition = {
  "type": "Extent",
  "metadata": {},
  "params": [
    { "name": "field", "type": "field", "required": true }
  ]
};

var prototype$15 = inherits(Extent, Transform);

prototype$15.transform = function(_$$1, pulse) {
  var extent$$1 = this.value,
      field$$1 = _$$1.field,
      min$$1 = extent$$1[0],
      max$$1 = extent$$1[1],
      flag = pulse.ADD,
      mod;

  mod = pulse.changed()
     || pulse.modified(field$$1.fields)
     || _$$1.modified('field');

  if (mod) {
    flag = pulse.SOURCE;
    min$$1 = +Infinity;
    max$$1 = -Infinity;
  }

  pulse.visit(flag, function(t) {
    var v = field$$1(t);
    if (v != null) {
      if (v < min$$1) min$$1 = v;
      if (v > max$$1) max$$1 = v;
    }
  });

  this.value = [min$$1, max$$1];
};

/**
 * Provides a bridge between a parent transform and a target subflow that
 * consumes only a subset of the tuples that pass through the parent.
 * @constructor
 * @param {Pulse} pulse - A pulse to use as the value of this operator.
 * @param {Transform} parent - The parent transform (typically a Facet instance).
 * @param {Transform} target - A transform that receives the subflow of tuples.
 */
function Subflow(pulse, parent) {
  Operator.call(this, pulse);
  this.parent = parent;
}

var prototype$17 = inherits(Subflow, Operator);

prototype$17.connect = function(target) {
  this.targets().add(target);
  return (target.source = this);
};

/**
 * Add an 'add' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being added.
 */
prototype$17.add = function(t) {
  this.value.add.push(t);
};

/**
 * Add a 'rem' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being removed.
 */
prototype$17.rem = function(t) {
  this.value.rem.push(t);
};

/**
 * Add a 'mod' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being modified.
 */
prototype$17.mod = function(t) {
  this.value.mod.push(t);
};

/**
 * Re-initialize this operator's pulse value.
 * @param {Pulse} pulse - The pulse to copy from.
 * @see Pulse.init
 */
prototype$17.init = function(pulse) {
  this.value.init(pulse, pulse.NO_SOURCE);
};

/**
 * Evaluate this operator. This method overrides the
 * default behavior to simply return the contained pulse value.
 * @return {Pulse}
 */
prototype$17.evaluate = function() {
  // assert: this.value.stamp === pulse.stamp
  return this.value;
};

/**
 * Facets a dataflow into a set of subflows based on a key.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Dataflow, string): Operator} params.subflow - A function
 *   that generates a subflow of operators and returns its root operator.
 * @param {function(object): *} params.key - The key field to facet by.
 */
function Facet(params) {
  Transform.call(this, {}, params);
  this._keys = fastmap(); // cache previously calculated key values

  // keep track of active subflows, use as targets array for listeners
  // this allows us to limit propagation to only updated subflows
  var a = this._targets = [];
  a.active = 0;
  a.forEach = function(f) {
    for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
  };
}

var prototype$16 = inherits(Facet, Transform);

prototype$16.activate = function(flow) {
  this._targets[this._targets.active++] = flow;
};

prototype$16.subflow = function(key$$1, flow, pulse, parent) {
  var flows = this.value,
      sf = flows.hasOwnProperty(key$$1) && flows[key$$1],
      df, p;

  if (!sf) {
    p = parent || (p = this._group[key$$1]) && p.tuple;
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(pulse.NO_SOURCE), this))
      .connect(flow(df, key$$1, p));
    flows[key$$1] = sf;
    this.activate(sf);
  } else if (sf.value.stamp < pulse.stamp) {
    sf.init(pulse);
    this.activate(sf);
  }

  return sf;
};

prototype$16.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      self = this,
      key$$1 = _$$1.key,
      flow = _$$1.subflow,
      cache = this._keys,
      rekey = _$$1.modified('key');

  function subflow(key$$1) {
    return self.subflow(key$$1, flow, pulse);
  }

  this._group = _$$1.group || {};
  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.REM, function(t) {
    var id$$1 = tupleid(t),
        k = cache.get(id$$1);
    if (k !== undefined) {
      cache.delete(id$$1);
      subflow(k).rem(t);
    }
  });

  pulse.visit(pulse.ADD, function(t) {
    var k = key$$1(t);
    cache.set(tupleid(t), k);
    subflow(k).add(t);
  });

  if (rekey || pulse.modified(key$$1.fields)) {
    pulse.visit(pulse.MOD, function(t) {
      var id$$1 = tupleid(t),
          k0 = cache.get(id$$1),
          k1 = key$$1(t);
      if (k0 === k1) {
        subflow(k1).mod(t);
      } else {
        cache.set(id$$1, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  } else if (pulse.changed(pulse.MOD)) {
    pulse.visit(pulse.MOD, function(t) {
      subflow(cache.get(tupleid(t))).mod(t);
    });
  }

  if (rekey) {
    pulse.visit(pulse.REFLOW, function(t) {
      var id$$1 = tupleid(t),
          k0 = cache.get(id$$1),
          k1 = key$$1(t);
      if (k0 !== k1) {
        cache.set(id$$1, k1);
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  }

  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return pulse;
};

/**
 * Generates one or more field accessor functions.
 * If the 'name' parameter is an array, an array of field accessors
 * will be created and the 'as' parameter will be ignored.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.name - The field name(s) to access.
 * @param {string} params.as - The accessor function name.
 */
function Field(params) {
  Operator.call(this, null, update$2, params);
}

inherits(Field, Operator);

function update$2(_$$1) {
  return (this.value && !_$$1.modified()) ? this.value
    : isArray(_$$1.name) ? array(_$$1.name).map(function(f) { return field(f); })
    : field(_$$1.name, _$$1.as);
}

/**
 * Filters data tuples according to a predicate function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The predicate expression function
 *   that determines a tuple's filter status. Truthy values pass the filter.
 */
function Filter(params) {
  Transform.call(this, fastmap(), params);
}

Filter.Definition = {
  "type": "Filter",
  "metadata": {"changes": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true }
  ]
};

var prototype$18 = inherits(Filter, Transform);

prototype$18.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      cache = this.value, // cache ids of filtered tuples
      output = pulse.fork(),
      add = output.add,
      rem = output.rem,
      mod = output.mod,
      test = _$$1.expr,
      isMod = true;

  pulse.visit(pulse.REM, function(t) {
    var id$$1 = tupleid(t);
    if (!cache.has(id$$1)) rem.push(t);
    else cache.delete(id$$1);
  });

  pulse.visit(pulse.ADD, function(t) {
    if (test(t, _$$1)) add.push(t);
    else cache.set(tupleid(t), 1);
  });

  function revisit(t) {
    var id$$1 = tupleid(t),
        b = test(t, _$$1),
        s = cache.get(id$$1);
    if (b && s) {
      cache.delete(id$$1);
      add.push(t);
    } else if (!b && !s) {
      cache.set(id$$1, 1);
      rem.push(t);
    } else if (isMod && b && !s) {
      mod.push(t);
    }
  }

  pulse.visit(pulse.MOD, revisit);

  if (_$$1.modified()) {
    isMod = false;
    pulse.visit(pulse.REFLOW, revisit);
  }

  if (cache.empty > df.cleanThreshold) df.runAfter(cache.clean);
  return output;
};

/**
 * Folds one more tuple fields into multiple tuples in which the field
 * name and values are available under new 'key' and 'value' fields.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.fields - An array of field accessors
 *   for the tuple fields that should be folded.
 */
function Fold(params) {
  Transform.call(this, {}, params);
}

Fold.Definition = {
  "type": "Fold",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["key", "value"] }
  ]
};

var prototype$19 = inherits(Fold, Transform);

function keyFunction(f) {
  return f.fields.join('|');
}

prototype$19.transform = function(_$$1, pulse) {
  var cache = this.value,
      reset = _$$1.modified('fields'),
      fields = _$$1.fields,
      as = _$$1.as || ['key', 'value'],
      key$$1 = as[0],
      value = as[1],
      keys = fields.map(keyFunction),
      n = fields.length,
      stamp = pulse.stamp,
      out = pulse.fork(pulse.NO_SOURCE),
      i = 0, mask = 0, id$$1;

  function add(t) {
    var f = (cache[tupleid(t)] = Array(n)); // create cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, derive folds
      ft = (f[i] = derive(t));
      ft[key$$1] = keys[i];
      ft[value] = fields[i](t);
      out.add.push(ft);
    }
  }

  function mod(t) {
    var f = cache[tupleid(t)]; // get cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, rederive folds
      if (!(mask & (1 << i))) continue; // field is unchanged
      ft = rederive(t, f[i], stamp);
      ft[key$$1] = keys[i];
      ft[value] = fields[i](t);
      out.mod.push(ft);
    }
  }

  if (reset) {
    // on reset, remove all folded tuples and clear cache
    for (id$$1 in cache) out.rem.push.apply(out.rem, cache[id$$1]);
    cache = this.value = {};
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);

    for (; i<n; ++i) {
      if (pulse.modified(fields[i].fields)) mask |= (1 << i);
    }
    if (mask) pulse.visit(pulse.MOD, mod);

    pulse.visit(pulse.REM, function(t) {
      var id$$1 = tupleid(t);
      out.rem.push.apply(out.rem, cache[id$$1]);
      cache[id$$1] = null;
    });
  }

  return out.modifies(as);
};

/**
 * Invokes a function for each data tuple and saves the results as a new field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The formula function to invoke for each tuple.
 * @param {string} params.as - The field name under which to save the result.
 * @param {boolean} [params.initonly=false] - If true, the formula is applied to
 *   added tuples only, and does not update in response to modifications.
 */
function Formula(params) {
  Transform.call(this, null, params);
}

Formula.Definition = {
  "type": "Formula",
  "metadata": {"modifies": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true },
    { "name": "as", "type": "string", "required": true },
    { "name": "initonly", "type": "boolean" }
  ]
};

var prototype$20 = inherits(Formula, Transform);

prototype$20.transform = function(_$$1, pulse) {
  var func = _$$1.expr,
      as = _$$1.as,
      mod = _$$1.modified(),
      flag = _$$1.initonly ? pulse.ADD
        : mod ? pulse.SOURCE
        : pulse.modified(func.fields) ? pulse.ADD_MOD
        : pulse.ADD;

  function set(t) {
    t[as] = func(t, _$$1);
  }

  if (mod) {
    // parameters updated, need to reflow
    pulse = pulse.materialize().reflow(true);
  }

  if (!_$$1.initonly) {
    pulse.modifies(as);
  }

  return pulse.visit(flag, set);
};

/**
 * Generates data tuples using a provided generator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Parameters): object} params.generator - A tuple generator
 *   function. This function is given the operator parameters as input.
 *   Changes to any additional parameters will not trigger re-calculation
 *   of previously generated tuples. Only future tuples are affected.
 * @param {number} params.size - The number of tuples to produce.
 */
function Generate(params) {
  Transform.call(this, [], params);
}

var prototype$21 = inherits(Generate, Transform);

prototype$21.transform = function(_$$1, pulse) {
  var data = this.value,
      out = pulse.fork(pulse.ALL),
      num = _$$1.size - data.length,
      gen = _$$1.generator,
      add, rem, t;

  if (num > 0) {
    // need more tuples, generate and add
    for (add=[]; --num >= 0;) {
      add.push(t = ingest(gen(_$$1)));
      data.push(t);
    }
    out.add = out.add.length
      ? out.materialize(out.ADD).add.concat(add)
      : add;
  } else {
    // need fewer tuples, remove
    rem = data.slice(0, -num);
    out.rem = out.rem.length
      ? out.materialize(out.REM).rem.concat(rem)
      : rem;
    data = data.slice(-num);
  }

  out.source = this.value = data;
  return out;
};

var Methods = {
  value: 'value',
  median: d3Array.median,
  mean: d3Array.mean,
  min: d3Array.min,
  max: d3Array.max
};

var Empty = [];

/**
 * Impute missing values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to impute.
 * @param {Array<function(object): *>} [params.groupby] - An array of
 *   accessors to determine series within which to perform imputation.
 * @param {function(object): *} params.key - An accessor for a key value.
 *   Each key value should be unique within a group. New tuples will be
 *   imputed for any key values that are not found within a group.
 * @param {Array<*>} [params.keyvals] - Optional array of required key
 *   values. New tuples will be imputed for any key values that are not
 *   found within a group. In addition, these values will be automatically
 *   augmented with the key values observed in the input data.
 * @param {string} [method='value'] - The imputation method to use. One of
 *   'value', 'mean', 'median', 'max', 'min'.
 * @param {*} [value=0] - The constant value to use for imputation
 *   when using method 'value'.
 */
function Impute(params) {
  Transform.call(this, [], params);
}

Impute.Definition = {
  "type": "Impute",
  "metadata": {"changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "key", "type": "field", "required": true },
    { "name": "keyvals", "array": true },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "method", "type": "enum", "default": "value",
      "values": ["value", "mean", "median", "max", "min"] },
    { "name": "value", "default": 0 }
  ]
};

var prototype$22 = inherits(Impute, Transform);

function getValue(_$$1) {
  var m = _$$1.method || Methods.value, v;

  if (Methods[m] == null) {
    error$1('Unrecognized imputation method: ' + m);
  } else if (m === Methods.value) {
    v = _$$1.value !== undefined ? _$$1.value : 0;
    return function() { return v; };
  } else {
    return Methods[m];
  }
}

function getField(_$$1) {
  var f = _$$1.field;
  return function(t) { return t ? f(t) : NaN; };
}

prototype$22.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      impute = getValue(_$$1),
      field$$1 = getField(_$$1),
      fName = accessorName(_$$1.field),
      kName = accessorName(_$$1.key),
      gNames = (_$$1.groupby || []).map(accessorName),
      groups = partition$1(pulse.source, _$$1.groupby, _$$1.key, _$$1.keyvals),
      curr = [],
      prev = this.value,
      m = groups.domain.length,
      group, value, gVals, kVal, g, i, j, l, n, t;

  for (g=0, l=groups.length; g<l; ++g) {
    group = groups[g];
    gVals = group.values;
    value = NaN;

    // add tuples for missing values
    for (j=0; j<m; ++j) {
      if (group[j] != null) continue;
      kVal = groups.domain[j];

      t = {_impute: true};
      for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
      t[kName] = kVal;
      t[fName] = isNaN(value) ? (value = impute(group, field$$1)) : value;

      curr.push(ingest(t));
    }
  }

  // update pulse with imputed tuples
  if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
  if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
  this.value = curr;

  return out;
};

function partition$1(data, groupby, key$$1, keyvals) {
  var get = function(f) { return f(t); },
      groups = [],
      domain = keyvals ? keyvals.slice() : [],
      kMap = {},
      gMap = {}, gVals, gKey,
      group, i, j, k, n, t;

  domain.forEach(function(k, i) { kMap[k] = i + 1; });

  for (i=0, n=data.length; i<n; ++i) {
    t = data[i];
    k = key$$1(t);
    j = kMap[k] || (kMap[k] = domain.push(k));

    gKey = (gVals = groupby ? groupby.map(get) : Empty) + '';
    if (!(group = gMap[gKey])) {
      group = (gMap[gKey] = []);
      groups.push(group);
      group.values = gVals;
    }
    group[j-1] = t;
  }

  groups.domain = domain;
  return groups;
}

/**
 * Extend input tuples with aggregate values.
 * Calcuates aggregate values and joins them with the input stream.
 * @constructor
 */
function JoinAggregate(params) {
  Aggregate.call(this, params);
}

JoinAggregate.Definition = {
  "type": "JoinAggregate",
  "metadata": {"modifies": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "fields", "type": "field", "null": true, "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidAggregateOps },
    { "name": "as", "type": "string", "null": true, "array": true },
    { "name": "key", "type": "field" }
  ]
};

var prototype$23 = inherits(JoinAggregate, Aggregate);

prototype$23.transform = function(_$$1, pulse) {
  var aggr = this,
      mod = _$$1.modified(),
      cells;

  // process all input tuples to calculate aggregates
  if (aggr.value && (mod || pulse.modified(aggr._inputs))) {
    cells = aggr.value = mod ? aggr.init(_$$1) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    cells = aggr.value = aggr.value || this.init(_$$1);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }

  // update aggregation cells
  aggr.changes();

  // write aggregate values to input tuples
  pulse.visit(pulse.SOURCE, function(t) {
    extend(t, cells[aggr.cellkey(t)].tuple);
  });

  return pulse.reflow(mod).modifies(this._outputs);
};

prototype$23.changes = function() {
  var adds = this._adds,
      mods = this._mods,
      i, n;

  for (i=0, n=this._alen; i<n; ++i) {
    this.celltuple(adds[i]);
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    this.celltuple(mods[i]);
    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
};

/**
 * Generates a key function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The field name(s) for the key function.
 */
function Key(params) {
  Operator.call(this, null, update$3, params);
}

inherits(Key, Operator);

function update$3(_$$1) {
  return (this.value && !_$$1.modified()) ? this.value : key(_$$1.fields);
}

/**
 * Extend tuples by joining them with values from a lookup table.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Map} params.index - The lookup table map.
 * @param {Array<function(object): *} params.fields - The fields to lookup.
 * @param {Array<string>} params.as - Output field names for each lookup value.
 * @param {*} [params.default] - A default value to use if lookup fails.
 */
function Lookup(params) {
  Transform.call(this, {}, params);
}

Lookup.Definition = {
  "type": "Lookup",
  "metadata": {"modifies": true},
  "params": [
    { "name": "index", "type": "index", "params": [
        {"name": "from", "type": "data", "required": true },
        {"name": "key", "type": "field", "required": true }
      ] },
    { "name": "values", "type": "field", "array": true },
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true },
    { "name": "default", "default": null }
  ]
};

var prototype$24 = inherits(Lookup, Transform);

prototype$24.transform = function(_$$1, pulse) {
  var out = pulse,
      as = _$$1.as,
      keys = _$$1.fields,
      index = _$$1.index,
      values = _$$1.values,
      defaultValue = _$$1.default==null ? null : _$$1.default,
      reset = _$$1.modified(),
      flag = reset ? pulse.SOURCE : pulse.ADD,
      n = keys.length,
      set, m, mods;

  if (values) {
    m = values.length;

    if (n > 1 && !as) {
      error$1('Multi-field lookup requires explicit "as" parameter.');
    }
    if (as && as.length !== n * m) {
      error$1('The "as" parameter has too few output field names.');
    }
    as = as || values.map(accessorName);

    set = function(t) {
      for (var i=0, k=0, j, v; i<n; ++i) {
        v = index.get(keys[i](t));
        if (v == null) for (j=0; j<m; ++j, ++k) t[as[k]] = defaultValue;
        else for (j=0; j<m; ++j, ++k) t[as[k]] = values[j](v);
      }
    };
  } else {
    if (!as) {
      error$1('Missing output field names.');
    }

    set = function(t) {
      for (var i=0, v; i<n; ++i) {
        v = index.get(keys[i](t));
        t[as[i]] = v==null ? defaultValue : v;
      }
    };
  }

  if (reset) {
    out = pulse.reflow(true);
  } else {
    mods = keys.some(function(k) { return pulse.modified(k.fields); });
    flag |= (mods ? pulse.MOD : 0);
  }
  pulse.visit(flag, set);

  return out.modifies(as);
};

/**
 * Computes global min/max extents over a collection of extents.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<Array<number>>} params.extents - The input extents.
 */
function MultiExtent(params) {
  Operator.call(this, null, update$4, params);
}

inherits(MultiExtent, Operator);

function update$4(_$$1) {
  if (this.value && !_$$1.modified()) {
    return this.value;
  }

  var min$$1 = +Infinity,
      max$$1 = -Infinity,
      ext = _$$1.extents,
      i, n, e;

  for (i=0, n=ext.length; i<n; ++i) {
    e = ext[i];
    if (e[0] < min$$1) min$$1 = e[0];
    if (e[1] > max$$1) max$$1 = e[1];
  }
  return [min$$1, max$$1];
}

/**
 * Merge a collection of value arrays.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<Array<*>>} params.values - The input value arrrays.
 */
function MultiValues(params) {
  Operator.call(this, null, update$5, params);
}

inherits(MultiValues, Operator);

function update$5(_$$1) {
  return (this.value && !_$$1.modified())
    ? this.value
    : _$$1.values.reduce(function(data, _$$1) { return data.concat(_$$1); }, []);
}

/**
 * Operator whose value is simply its parameter hash. This operator is
 * useful for enabling reactive updates to values of nested objects.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Params(params) {
  Transform.call(this, null, params);
}

inherits(Params, Transform);

Params.prototype.transform = function(_$$1, pulse) {
  this.modified(_$$1.modified());
  this.value = _$$1;
  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS); // do not pass tuples
};

/**
 * Partitions pre-faceted data into tuple subflows.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Dataflow, string): Operator} params.subflow - A function
 *   that generates a subflow of operators and returns its root operator.
 * @param {function(object): Array<object>} params.field - The field
 *   accessor for an array of subflow tuple objects.
 */
function PreFacet(params) {
  Facet.call(this, params);
}

var prototype$25 = inherits(PreFacet, Facet);

prototype$25.transform = function(_$$1, pulse) {
  var self = this,
      flow = _$$1.subflow,
      field$$1 = _$$1.field;

  if (_$$1.modified('field') || field$$1 && pulse.modified(accessorFields(field$$1))) {
    error$1('PreFacet does not support field modification.');
  }

  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.MOD, function(t) {
    var sf = self.subflow(tupleid(t), flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_$$1) { sf.mod(_$$1); }) : sf.mod(t);
  });

  pulse.visit(pulse.ADD, function(t) {
    var sf = self.subflow(tupleid(t), flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_$$1) { sf.add(ingest(_$$1)); }) : sf.add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    var sf = self.subflow(tupleid(t), flow, pulse, t);
    field$$1 ? field$$1(t).forEach(function(_$$1) { sf.rem(_$$1); }) : sf.rem(t);
  });

  return pulse;
};

/**
 * Performs a relational projection, copying selected fields from source
 * tuples to a new set of derived tuples.
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *} params.fields - The fields to project,
 *   as an array of field accessors. If unspecified, all fields will be
 *  copied with names unchanged.
 * @param {Array<string>} params.as - Output field names for each projected
 *   field. Any unspecified fields will use the field name provided by
 *   the field accessor.
 * @constructor
 */
function Project(params) {
  Transform.call(this, null, params);
}

Project.Definition = {
  "type": "Project",
  "metadata": {"generates": true, "changes": true, "modifies": true},
  "params": [
    { "name": "fields", "type": "field", "array": true },
    { "name": "as", "type": "string", "null": true, "array": true },
  ]
};

var prototype$26 = inherits(Project, Transform);

prototype$26.transform = function(_$$1, pulse) {
  var fields = _$$1.fields,
      as = output(_$$1.fields, _$$1.as),
      derive$$1 = fields
        ? function(s, t) { return project(s, t, fields, as); }
        : rederive,
      out, lut;

  if (this.value) {
    lut = this.value;
  } else {
    pulse = pulse.addAll();
    lut = this.value = {};
  }

  out = pulse.fork();

  pulse.visit(pulse.REM, function(t) {
    var id$$1 = tupleid(t);
    out.rem.push(lut[id$$1]);
    lut[id$$1] = null;
  });

  pulse.visit(pulse.ADD, function(t) {
    var dt = derive$$1(t, ingest({}));
    lut[tupleid(t)] = dt;
    out.add.push(dt);
  });

  pulse.visit(pulse.MOD, function(t) {
    out.mod.push(derive$$1(t, lut[tupleid(t)]));
  });

  return out;
};

function output(fields, as) {
  if (!fields) return null;
  return fields.map(function(f, i) {
    return as[i] || accessorName(f);
  });
}

function project(s, t, fields, as) {
  for (var i=0, n=fields.length; i<n; ++i) {
    t[as[i]] = fields[i](s);
  }
  return t;
}

/**
 * Proxy the value of another operator as a pure signal value.
 * Ensures no tuples are propagated.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {*} params.value - The value to proxy, becomes the value of this operator.
 */
function Proxy(params) {
  Transform.call(this, null, params);
}

var prototype$27 = inherits(Proxy, Transform);

prototype$27.transform = function(_$$1, pulse) {
  this.value = _$$1.value;
  return _$$1.modified('value')
    ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
    : pulse.StopPropagation;
};

/**
 * Relays a data stream between data processing pipelines.
 * If the derive parameter is set, this transform will create derived
 * copies of observed tuples. This provides derived data streams in which
 * modifications to the tuples do not pollute an upstream data source.
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.derive=false] - Boolean flag indicating if
 *   the transform should make derived copies of incoming tuples.
 * @constructor
 */
function Relay(params) {
  Transform.call(this, null, params);
}

var prototype$28 = inherits(Relay, Transform);

prototype$28.transform = function(_$$1, pulse) {
  var out, lut;

  if (this.value) {
    lut = this.value;
  } else {
    out = pulse = pulse.addAll();
    lut = this.value = {};
  }

  if (_$$1.derive) {
    out = pulse.fork();

    pulse.visit(pulse.REM, function(t) {
      var id$$1 = tupleid(t);
      out.rem.push(lut[id$$1]);
      lut[id$$1] = null;
    });

    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[tupleid(t)] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[tupleid(t)]));
    });
  }

  return out;
};

/**
 * Samples tuples passing through this operator.
 * Uses reservoir sampling to maintain a representative sample.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.size=1000] - The maximum number of samples.
 */
function Sample(params) {
  Transform.call(this, [], params);
  this.count = 0;
}

Sample.Definition = {
  "type": "Sample",
  "metadata": {"source": true, "changes": true},
  "params": [
    { "name": "size", "type": "number", "default": 1000 }
  ]
};

var prototype$29 = inherits(Sample, Transform);

prototype$29.transform = function(_$$1, pulse) {
  var out = pulse.fork(),
      mod = _$$1.modified('size'),
      num = _$$1.size,
      res = this.value,
      cnt = this.count,
      cap = 0,
      map = res.reduce(function(m, t) {
        m[tupleid(t)] = 1;
        return m;
      }, {});

  // sample reservoir update function
  function update(t) {
    var p, idx;

    if (res.length < num) {
      res.push(t);
    } else {
      idx = ~~((cnt + 1) * exports.random());
      if (idx < res.length && idx >= cap) {
        p = res[idx];
        if (map[tupleid(p)]) out.rem.push(p); // eviction
        res[idx] = t;
      }
    }
    ++cnt;
  }

  if (pulse.rem.length) {
    // find all tuples that should be removed, add to output
    pulse.visit(pulse.REM, function(t) {
      var id$$1 = tupleid(t);
      if (map[id$$1]) {
        map[id$$1] = -1;
        out.rem.push(t);
      }
      --cnt;
    });

    // filter removed tuples out of the sample reservoir
    res = res.filter(function(t) { return map[tupleid(t)] !== -1; });
  }

  if ((pulse.rem.length || mod) && res.length < num && pulse.source) {
    // replenish sample if backing data source is available
    cap = cnt = res.length;
    pulse.visit(pulse.SOURCE, function(t) {
      // update, but skip previously sampled tuples
      if (!map[tupleid(t)]) update(t);
    });
    cap = -1;
  }

  if (mod && res.length > num) {
    for (var i=0, n=res.length-num; i<n; ++i) {
      map[tupleid(res[i])] = -1;
      out.rem.push(res[i]);
    }
    res = res.slice(n);
  }

  if (pulse.mod.length) {
    // propagate modified tuples in the sample reservoir
    pulse.visit(pulse.MOD, function(t) {
      if (map[tupleid(t)]) out.mod.push(t);
    });
  }

  if (pulse.add.length) {
    // update sample reservoir
    pulse.visit(pulse.ADD, update);
  }

  if (pulse.add.length || cap < 0) {
    // output newly added tuples
    out.add = res.filter(function(t) { return !map[tupleid(t)]; });
  }

  this.count = cnt;
  this.value = out.source = res;
  return out;
};

/**
 * Generates data tuples for a specified sequence range of numbers.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} params.start - The first number in the sequence.
 * @param {number} params.stop - The last number (exclusive) in the sequence.
 * @param {number} [params.step=1] - The step size between numbers in the sequence.
 */
function Sequence(params) {
  Transform.call(this, null, params);
}

Sequence.Definition = {
  "type": "Sequence",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "start", "type": "number", "required": true },
    { "name": "stop", "type": "number", "required": true },
    { "name": "step", "type": "number", "default": 1 }
  ],
  "output": ["value"]
};

var prototype$30 = inherits(Sequence, Transform);

prototype$30.transform = function(_$$1, pulse) {
  if (this.value && !_$$1.modified()) return;

  var out = pulse.materialize().fork(pulse.MOD);

  out.rem = this.value ? pulse.rem.concat(this.value) : pulse.rem;
  out.source = this.value = d3Array.range(_$$1.start, _$$1.stop, _$$1.step || 1).map(ingest);
  out.add = pulse.add.concat(this.value);
  return out;
};

/**
 * Propagates a new pulse without any tuples so long as the input
 * pulse contains some added, removed or modified tuples.
 * @param {object} params - The parameters for this operator.
 * @constructor
 */
function Sieve(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$31 = inherits(Sieve, Transform);

prototype$31.transform = function(_$$1, pulse) {
  this.value = pulse.source;
  return pulse.changed()
    ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
    : pulse.StopPropagation;
};

/**
 * An index that maps from unique, string-coerced, field values to tuples.
 * Assumes that the field serves as a unique key with no duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
function TupleIndex(params) {
  Transform.call(this, fastmap(), params);
}

var prototype$32 = inherits(TupleIndex, Transform);

prototype$32.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      field$$1 = _$$1.field,
      index = this.value,
      mod = true;

  function set(t) { index.set(field$$1(t), t); }

  if (_$$1.modified('field') || pulse.modified(field$$1.fields)) {
    index.clear();
    pulse.visit(pulse.SOURCE, set);
  } else if (pulse.changed()) {
    pulse.visit(pulse.REM, function(t) { index.delete(field$$1(t)); });
    pulse.visit(pulse.ADD, set);
  } else {
    mod = false;
  }

  this.modified(mod);
  if (index.empty > df.cleanThreshold) df.runAfter(index.clean);
  return pulse.fork();
};

/**
 * Extracts an array of values. Assumes the source data has already been
 * reduced as needed (e.g., by an upstream Aggregate transform).
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The domain field to extract.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for sorting the values. The comparator will be
 *   applied to backing tuples prior to value extraction.
 */
function Values(params) {
  Transform.call(this, null, params);
}

var prototype$33 = inherits(Values, Transform);

prototype$33.transform = function(_$$1, pulse) {
  var run = !this.value
    || _$$1.modified('field')
    || _$$1.modified('sort')
    || pulse.changed()
    || (_$$1.sort && pulse.modified(_$$1.sort.fields));

  if (run) {
    this.value = (_$$1.sort
      ? pulse.source.slice().sort(_$$1.sort)
      : pulse.source).map(_$$1.field);
  }
};

function WindowOp(op, field$$1, param, as) {
  var fn = WindowOps[op](field$$1, param);
  return {
    init:   fn.init || zero,
    update: function(w, t) { t[as] = fn.next(w); }
  };
}

var WindowOps = {
  row_number: function() {
    return {
      next: function(w) { return w.index + 1; }
    };
  },
  rank: function() {
    var rank;
    return {
      init: function() { rank = 1; },
      next: function(w) {
        var i = w.index,
            data = w.data;
        return (i && w.compare(data[i - 1], data[i])) ? (rank = i + 1) : rank;
      }
    };
  },
  dense_rank: function() {
    var drank;
    return {
      init: function() { drank = 1; },
      next: function(w) {
        var i = w.index,
            d = w.data;
        return (i && w.compare(d[i - 1], d[i])) ? ++drank : drank;
      }
    };
  },
  percent_rank: function() {
    var rank = WindowOps.rank(),
        next = rank.next;
    return {
      init: rank.init,
      next: function(w) {
        return (next(w) - 1) / (w.data.length - 1);
      }
    };
  },
  cume_dist: function() {
    var cume;
    return {
      init: function() { cume = 0; },
      next: function(w) {
        var i = w.index,
            d = w.data,
            c = w.compare;
        if (cume < i) {
          while (i + 1 < d.length && !c(d[i], d[i + 1])) ++i;
          cume = i;
        }
        return (1 + cume) / d.length;
      }
    };
  },
  ntile: function(field$$1, num) {
    num = +num;
    if (!(num > 0)) error$1('ntile num must be greater than zero.');
    var cume = WindowOps.cume_dist(),
        next = cume.next;
    return {
      init: cume.init,
      next: function(w) { return Math.ceil(num * next(w)); }
    };
  },

  lag: function(field$$1, offset) {
    offset = +offset || 1;
    return {
      next: function(w) {
        var i = w.index - offset;
        return i >= 0 ? field$$1(w.data[i]) : null;
      }
    };
  },
  lead: function(field$$1, offset) {
    offset = +offset || 1;
    return {
      next: function(w) {
        var i = w.index + offset,
            d = w.data;
        return i < d.length ? field$$1(d[i]) : null;
      }
    };
  },

  first_value: function(field$$1) {
    return {
      next: function(w) { return field$$1(w.data[w.i0]); }
    };
  },
  last_value: function(field$$1) {
    return {
      next: function(w) { return field$$1(w.data[w.i1 - 1]); }
    }
  },
  nth_value: function(field$$1, nth) {
    nth = +nth;
    if (!(nth > 0)) error$1('nth_value nth must be greater than zero.');
    return {
      next: function(w) {
        var i = w.i0 + (nth - 1);
        return i < w.i1 ? field$$1(w.data[i]) : null;
      }
    }
  }
};

var ValidWindowOps = Object.keys(WindowOps);

function WindowState(_$$1) {
  var self = this,
      ops = array(_$$1.ops),
      fields = array(_$$1.fields),
      params = array(_$$1.params),
      as = array(_$$1.as),
      outputs = self.outputs = [],
      windows = self.windows = [],
      inputs = {},
      map = {},
      countOnly = true,
      counts = [],
      measures = [];

  function visitInputs(f) {
    array(accessorFields(f)).forEach(function(_$$1) { inputs[_$$1] = 1; });
  }
  visitInputs(_$$1.sort);

  ops.forEach(function(op, i) {
    var field$$1 = fields[i],
        mname = accessorName(field$$1),
        name = measureName(op, mname, as[i]);

    visitInputs(field$$1);
    outputs.push(name);

    // Window operation
    if (WindowOps.hasOwnProperty(op)) {
      windows.push(WindowOp(op, fields[i], params[i], name));
    }

    // Aggregate operation
    else {
      if (field$$1 == null && op !== 'count') {
        error$1('Null aggregate field specified.');
      }
      if (op === 'count') {
        counts.push(name);
        return;
      }

      countOnly = false;
      var m = map[mname];
      if (!m) {
        m = (map[mname] = []);
        m.field = field$$1;
        measures.push(m);
      }
      m.push(createMeasure(op, name));
    }
  });

  if (counts.length || measures.length) {
    self.cell = cell(measures, counts, countOnly);
  }

  self.inputs = Object.keys(inputs);
}

var prototype$35 = WindowState.prototype;

prototype$35.init = function() {
  this.windows.forEach(function(_$$1) { _$$1.init(); });
  if (this.cell) this.cell.init();
};

prototype$35.update = function(w, t) {
  var self = this,
      cell = self.cell,
      wind = self.windows,
      data = w.data,
      m = wind && wind.length,
      j;

  if (cell) {
    for (j=w.p0; j<w.i0; ++j) cell.rem(data[j]);
    for (j=w.p1; j<w.i1; ++j) cell.add(data[j]);
    cell.set(t);
  }
  for (j=0; j<m; ++j) wind[j].update(w, t);
};

function cell(measures, counts, countOnly) {
  measures = measures.map(function(m) {
    return compileMeasures(m, m.field);
  });

  var cell = {
    num:   0,
    agg:   null,
    store: false,
    count: counts
  };

  if (!countOnly) {
    var n = measures.length,
        a = cell.agg = Array(n),
        i = 0;
    for (; i<n; ++i) a[i] = new measures[i](cell);
  }

  if (cell.store) {
    var store = cell.data = new TupleStore();
  }

  cell.add = function(t) {
    cell.num += 1;
    if (countOnly) return;
    if (store) store.add(t);
    for (var i=0; i<n; ++i) {
      a[i].add(a[i].get(t), t);
    }
  };

  cell.rem = function(t) {
    cell.num -= 1;
    if (countOnly) return;
    if (store) store.rem(t);
    for (var i=0; i<n; ++i) {
      a[i].rem(a[i].get(t), t);
    }
  };

  cell.set = function(t) {
    var i, n;

    // consolidate stored values
    if (store) store.values();

    // update tuple properties
    for (i=0, n=counts.length; i<n; ++i) t[counts[i]] = cell.num;
    if (!countOnly) for (i=0, n=a.length; i<n; ++i) a[i].set(t);
  };

  cell.init = function() {
    cell.num = 0;
    if (store) store.reset();
    for (var i=0; i<n; ++i) a[i].init();
  };

  return cell;
}

/**
 * Perform window calculations and write results to the input stream.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - A comparator function for sorting tuples within a window.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors by which to partition tuples into separate windows.
 * @param {Array<string>} params.ops - An array of strings indicating window operations to perform.
 * @param {Array<function(object): *>} [params.fields] - An array of accessors
 *   for data fields to use as inputs to window operations.
 * @param {Array<*>} [params.params] - An array of parameter values for window operations.
 * @param {Array<string>} [params.as] - An array of output field names for window operations.
 * @param {Array<number>} [params.frame] - Window frame definition as two-element array.
 * @param {boolean} [params.ignorePeers=false] - If true, base window frame boundaries on row
 *   number alone, ignoring peers with identical sort values. If false (default),
 *   the window boundaries will be adjusted to include peer values.
 */
function Window(params) {
  Transform.call(this, {}, params);
  this._mlen = 0;
  this._mods = [];
}

Window.Definition = {
  "type": "Window",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sort", "type": "compare" },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true, "values": ValidWindowOps.concat(ValidAggregateOps) },
    { "name": "params", "type": "number", "null": true, "array": true },
    { "name": "fields", "type": "field", "null": true, "array": true },
    { "name": "as", "type": "string", "null": true, "array": true },
    { "name": "frame", "type": "number", "null": true, "array": true, "length": 2, "default": [null, 0] },
    { "name": "ignorePeers", "type": "boolean", "default": false }
  ]
};

var prototype$34 = inherits(Window, Transform);

prototype$34.transform = function(_$$1, pulse) {
  var self = this,
      state = self.state,
      mod = _$$1.modified(),
      i, n;

  this.stamp = pulse.stamp;

  // initialize window state
  if (!state || mod) {
    state = self.state = new WindowState(_$$1);
  }

  // retrieve group for a tuple
  var key$$1 = groupkey(_$$1.groupby);
  function group(t) { return self.group(key$$1(t)); }

  // partition input tuples
  if (mod || pulse.modified(state.inputs)) {
    self.value = {};
    pulse.visit(pulse.SOURCE, function(t) { group(t).add(t); });
  } else {
    pulse.visit(pulse.REM, function(t) { group(t).remove(t); });
    pulse.visit(pulse.ADD, function(t) { group(t).add(t); });
  }

  // perform window calculations for each modified partition
  for (i=0, n=self._mlen; i<n; ++i) {
    processPartition(self._mods[i], state, _$$1);
  }
  self._mlen = 0;
  self._mods = [];

  // TODO don't reflow everything?
  return pulse.reflow(mod).modifies(state.outputs);
};

prototype$34.group = function(key$$1) {
  var self = this,
      group = self.value[key$$1];

  if (!group) {
    group = self.value[key$$1] = SortedList(tupleid);
    group.stamp = -1;
  }

  if (group.stamp < self.stamp) {
    group.stamp = self.stamp;
    self._mods[self._mlen++] = group;
  }

  return group;
};

function processPartition(list, state, _$$1) {
  var sort = _$$1.sort,
      range$$1 = sort && !_$$1.ignorePeers,
      frame = _$$1.frame || [null, 0],
      data = list.data(sort),
      n = data.length,
      i = 0,
      b = range$$1 ? d3Array.bisector(sort) : null,
      w = {
        i0: 0, i1: 0, p0: 0, p1: 0, index: 0,
        data: data, compare: sort || constant(-1)
      };

  for (state.init(); i<n; ++i) {
    setWindow(w, frame, i, n);
    if (range$$1) adjustRange(w, b);
    state.update(w, data[i]);
  }
}

function setWindow(w, f, i, n) {
  w.p0 = w.i0;
  w.p1 = w.i1;
  w.i0 = f[0] == null ? 0 : Math.max(0, i - Math.abs(f[0]));
  w.i1 = f[1] == null ? n : Math.min(n, i + Math.abs(f[1]) + 1);
  w.index = i;
}

// if frame type is 'range', adjust window for peer values
function adjustRange(w, bisect$$1) {
  var r0 = w.i0,
      r1 = w.i1 - 1,
      c = w.compare,
      d = w.data,
      n = d.length - 1;

  if (r0 > 0 && !c(d[r0], d[r0-1])) w.i0 = bisect$$1.left(d, d[r0]);
  if (r1 < n && !c(d[r1], d[r1+1])) w.i1 = bisect$$1.right(d, d[r1]);
}



var tx = Object.freeze({
	aggregate: Aggregate,
	bin: Bin,
	collect: Collect,
	compare: Compare,
	countpattern: CountPattern,
	cross: Cross,
	density: Density,
	extent: Extent,
	facet: Facet,
	field: Field,
	filter: Filter,
	fold: Fold,
	formula: Formula,
	generate: Generate,
	impute: Impute,
	joinaggregate: JoinAggregate,
	key: Key,
	lookup: Lookup,
	multiextent: MultiExtent,
	multivalues: MultiValues,
	params: Params,
	prefacet: PreFacet,
	project: Project,
	proxy: Proxy,
	relay: Relay,
	sample: Sample,
	sequence: Sequence,
	sieve: Sieve,
	subflow: Subflow,
	tupleindex: TupleIndex,
	values: Values,
	window: Window
});

function Bounds(b) {
  this.clear();
  if (b) this.union(b);
}

var prototype$37 = Bounds.prototype;

prototype$37.clone = function() {
  return new Bounds(this);
};

prototype$37.clear = function() {
  this.x1 = +Number.MAX_VALUE;
  this.y1 = +Number.MAX_VALUE;
  this.x2 = -Number.MAX_VALUE;
  this.y2 = -Number.MAX_VALUE;
  return this;
};

prototype$37.empty = function() {
  return (
    this.x1 === +Number.MAX_VALUE &&
    this.y1 === +Number.MAX_VALUE &&
    this.x2 === -Number.MAX_VALUE &&
    this.y2 === -Number.MAX_VALUE
  );
};

prototype$37.set = function(x1, y1, x2, y2) {
  if (x2 < x1) {
    this.x2 = x1;
    this.x1 = x2;
  } else {
    this.x1 = x1;
    this.x2 = x2;
  }
  if (y2 < y1) {
    this.y2 = y1;
    this.y1 = y2;
  } else {
    this.y1 = y1;
    this.y2 = y2;
  }
  return this;
};

prototype$37.add = function(x, y) {
  if (x < this.x1) this.x1 = x;
  if (y < this.y1) this.y1 = y;
  if (x > this.x2) this.x2 = x;
  if (y > this.y2) this.y2 = y;
  return this;
};

prototype$37.expand = function(d) {
  this.x1 -= d;
  this.y1 -= d;
  this.x2 += d;
  this.y2 += d;
  return this;
};

prototype$37.round = function() {
  this.x1 = Math.floor(this.x1);
  this.y1 = Math.floor(this.y1);
  this.x2 = Math.ceil(this.x2);
  this.y2 = Math.ceil(this.y2);
  return this;
};

prototype$37.translate = function(dx, dy) {
  this.x1 += dx;
  this.x2 += dx;
  this.y1 += dy;
  this.y2 += dy;
  return this;
};

prototype$37.rotate = function(angle, x, y) {
  var cos = Math.cos(angle),
      sin = Math.sin(angle),
      cx = x - x*cos + y*sin,
      cy = y - x*sin - y*cos,
      x1 = this.x1, x2 = this.x2,
      y1 = this.y1, y2 = this.y2;

  return this.clear()
    .add(cos*x1 - sin*y1 + cx,  sin*x1 + cos*y1 + cy)
    .add(cos*x1 - sin*y2 + cx,  sin*x1 + cos*y2 + cy)
    .add(cos*x2 - sin*y1 + cx,  sin*x2 + cos*y1 + cy)
    .add(cos*x2 - sin*y2 + cx,  sin*x2 + cos*y2 + cy);
};

prototype$37.union = function(b) {
  if (b.x1 < this.x1) this.x1 = b.x1;
  if (b.y1 < this.y1) this.y1 = b.y1;
  if (b.x2 > this.x2) this.x2 = b.x2;
  if (b.y2 > this.y2) this.y2 = b.y2;
  return this;
};

prototype$37.intersect = function(b) {
  if (b.x1 > this.x1) this.x1 = b.x1;
  if (b.y1 > this.y1) this.y1 = b.y1;
  if (b.x2 < this.x2) this.x2 = b.x2;
  if (b.y2 < this.y2) this.y2 = b.y2;
  return this;
};

prototype$37.encloses = function(b) {
  return b && (
    this.x1 <= b.x1 &&
    this.x2 >= b.x2 &&
    this.y1 <= b.y1 &&
    this.y2 >= b.y2
  );
};

prototype$37.alignsWith = function(b) {
  return b && (
    this.x1 == b.x1 ||
    this.x2 == b.x2 ||
    this.y1 == b.y1 ||
    this.y2 == b.y2
  );
};

prototype$37.intersects = function(b) {
  return b && !(
    this.x2 < b.x1 ||
    this.x1 > b.x2 ||
    this.y2 < b.y1 ||
    this.y1 > b.y2
  );
};

prototype$37.contains = function(x, y) {
  return !(
    x < this.x1 ||
    x > this.x2 ||
    y < this.y1 ||
    y > this.y2
  );
};

prototype$37.width = function() {
  return this.x2 - this.x1;
};

prototype$37.height = function() {
  return this.y2 - this.y1;
};

var gradient_id = 0;

var Gradient = function(p0, p1) {
  var stops = [], gradient;
  return gradient = {
    id: 'gradient_' + (gradient_id++),
    x1: p0 ? p0[0] : 0,
    y1: p0 ? p0[1] : 0,
    x2: p1 ? p1[0] : 1,
    y2: p1 ? p1[1] : 0,
    stops: stops,
    stop: function(offset, color) {
      stops.push({offset: offset, color: color});
      return gradient;
    }
  };
};

function Item(mark) {
  this.mark = mark;
  this.bounds = (this.bounds || new Bounds());
}

function GroupItem(mark) {
  Item.call(this, mark);
  this.items = (this.items || []);
}

inherits(GroupItem, Item);

// create a new DOM element
function domCreate(doc, tag, ns) {
  if (!doc && typeof document !== 'undefined' && document.createElement) {
    doc = document;
  }
  return doc
    ? (ns ? doc.createElementNS(ns, tag) : doc.createElement(tag))
    : null;
}

// find first child element with matching tag
function domFind(el, tag) {
  tag = tag.toLowerCase();
  var nodes = el.childNodes, i = 0, n = nodes.length;
  for (; i<n; ++i) if (nodes[i].tagName.toLowerCase() === tag) {
    return nodes[i];
  }
}

// retrieve child element at given index
// create & insert if doesn't exist or if tags do not match
function domChild(el, index, tag, ns) {
  var a = el.childNodes[index], b;
  if (!a || a.tagName.toLowerCase() !== tag.toLowerCase()) {
    b = a || null;
    a = domCreate(el.ownerDocument, tag, ns);
    el.insertBefore(a, b);
  }
  return a;
}

// remove all child elements at or above the given index
function domClear(el, index) {
  var nodes = el.childNodes,
      curr = nodes.length;
  while (curr > index) el.removeChild(nodes[--curr]);
  return el;
}

// generate css class name for mark
function cssClass(mark) {
  return 'mark-' + mark.marktype
    + (mark.role ? ' role-' + mark.role : '')
    + (mark.name ? ' ' + mark.name : '');
}

var Canvas;

try {
  // try to load canvas module
  Canvas = require('canvas');
} catch (e) {
  try {
    // if canvas fails, try to load canvas-prebuilt
    Canvas = require('canvas-prebuilt');
  } catch (e2) {
    // if all options fail, set to null
    Canvas = null;
  }
}

var Canvas$1 = function(w, h) {
  var canvas = domCreate(null, 'canvas');
  if (canvas && canvas.getContext) {
    canvas.width = w;
    canvas.height = h;
  } else if (Canvas) {
    try {
      canvas = new Canvas(w, h);
    } catch (e) {
      canvas = null;
    }
  }
  return canvas;
};

var Image$1 = typeof Image !== 'undefined' ? Image
  : (Canvas && Canvas.Image || null);

function ResourceLoader(customLoader) {
  this._pending = 0;
  this._loader = customLoader || loader();
}

var prototype$38 = ResourceLoader.prototype;

prototype$38.pending = function() {
  return this._pending;
};

function increment(loader$$1) {
  loader$$1._pending += 1;
}

function decrement(loader$$1) {
  loader$$1._pending -= 1;
}

prototype$38.sanitizeURL = function(uri) {
  var loader$$1 = this;
  increment(loader$$1);

  return loader$$1._loader.sanitize(uri, {context:'href'})
    .then(function(opt) {
      decrement(loader$$1);
      return opt;
    })
    .catch(function() {
      decrement(loader$$1);
      return null;
    });
};

prototype$38.loadImage = function(uri) {
  var loader$$1 = this;
  increment(loader$$1);

  return loader$$1._loader
    .sanitize(uri, {context:'image'})
    .then(function(opt) {
      var url = opt.href;
      if (!url || !Image$1) throw {url: url};

      var image = new Image$1();

      image.onload = function() {
        decrement(loader$$1);
        image.loaded = true;
      };

      image.onerror = function() {
        decrement(loader$$1);
        image.loaded = false;
      };

      image.src = url;
      return image;
    })
    .catch(function(e) {
      decrement(loader$$1);
      return {loaded: false, width: 0, height: 0, src: e && e.url || ''};
    });
};

prototype$38.ready = function() {
  var loader$$1 = this;
  return new Promise(function(accept) {
    function poll(value) {
      if (!loader$$1.pending()) accept(value);
      else setTimeout(function() { poll(true); }, 10);
    }
    poll(false);
  });
};

var lookup = {
  'basis': {
    curve: d3Shape.curveBasis
  },
  'basis-closed': {
    curve: d3Shape.curveBasisClosed
  },
  'basis-open': {
    curve: d3Shape.curveBasisOpen
  },
  'bundle': {
    curve: d3Shape.curveBundle,
    tension: 'beta',
    value: 0.85
  },
  'cardinal': {
    curve: d3Shape.curveCardinal,
    tension: 'tension',
    value: 0
  },
  'cardinal-open': {
    curve: d3Shape.curveCardinalOpen,
    tension: 'tension',
    value: 0
  },
  'cardinal-closed': {
    curve: d3Shape.curveCardinalClosed,
    tension: 'tension',
    value: 0
  },
  'catmull-rom': {
    curve: d3Shape.curveCatmullRom,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-closed': {
    curve: d3Shape.curveCatmullRomClosed,
    tension: 'alpha',
    value: 0.5
  },
  'catmull-rom-open': {
    curve: d3Shape.curveCatmullRomOpen,
    tension: 'alpha',
    value: 0.5
  },
  'linear': {
    curve: d3Shape.curveLinear
  },
  'linear-closed': {
    curve: d3Shape.curveLinearClosed
  },
  'monotone': {
    horizontal: d3Shape.curveMonotoneY,
    vertical:   d3Shape.curveMonotoneX
  },
  'natural': {
    curve: d3Shape.curveNatural
  },
  'step': {
    curve: d3Shape.curveStep
  },
  'step-after': {
    curve: d3Shape.curveStepAfter
  },
  'step-before': {
    curve: d3Shape.curveStepBefore
  }
};

function curves(type, orientation, tension) {
  var entry = lookup.hasOwnProperty(type) && lookup[type],
      curve = null;

  if (entry) {
    curve = entry.curve || entry[orientation || 'vertical'];
    if (entry.tension && tension != null) {
      curve = curve[entry.tension](tension);
    }
  }

  return curve;
}

// Path parsing and rendering code adapted from fabric.js -- Thanks!
var cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 };
var regexp = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)([-+])/g, /\s|,|###/];

var pathParse = function(pathstr) {
  var result = [],
      path$$1,
      curr,
      chunks,
      parsed, param,
      cmd, len, i, j, n, m;

  // First, break path into command sequence
  path$$1 = pathstr
    .slice()
    .replace(regexp[0], '###$1')
    .split(regexp[1])
    .slice(1);

  // Next, parse each command in turn
  for (i=0, n=path$$1.length; i<n; ++i) {
    curr = path$$1[i];
    chunks = curr
      .slice(1)
      .trim()
      .replace(regexp[2],'$1###$2')
      .split(regexp[3]);
    cmd = curr.charAt(0);

    parsed = [cmd];
    for (j=0, m=chunks.length; j<m; ++j) {
      if ((param = +chunks[j]) === param) { // not NaN
        parsed.push(param);
      }
    }

    len = cmdlen[cmd.toLowerCase()];
    if (parsed.length-1 > len) {
      for (j=1, m=parsed.length; j<m; j+=len) {
        result.push([cmd].concat(parsed.slice(j, j+len)));
      }
    }
    else {
      result.push(parsed);
    }
  }

  return result;
};

var segmentCache = {};
var bezierCache = {};

var join = [].join;

// Copied from Inkscape svgtopdf, thanks!
function segments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
  var key = join.call(arguments);
  if (segmentCache[key]) {
    return segmentCache[key];
  }

  var th = rotateX * (Math.PI/180);
  var sin_th = Math.sin(th);
  var cos_th = Math.cos(th);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
  var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
  var pl = (px*px) / (rx*rx) + (py*py) / (ry*ry);
  if (pl > 1) {
    pl = Math.sqrt(pl);
    rx *= pl;
    ry *= pl;
  }

  var a00 = cos_th / rx;
  var a01 = sin_th / rx;
  var a10 = (-sin_th) / ry;
  var a11 = (cos_th) / ry;
  var x0 = a00 * ox + a01 * oy;
  var y0 = a10 * ox + a11 * oy;
  var x1 = a00 * x + a01 * y;
  var y1 = a10 * x + a11 * y;

  var d = (x1-x0) * (x1-x0) + (y1-y0) * (y1-y0);
  var sfactor_sq = 1 / d - 0.25;
  if (sfactor_sq < 0) sfactor_sq = 0;
  var sfactor = Math.sqrt(sfactor_sq);
  if (sweep == large) sfactor = -sfactor;
  var xc = 0.5 * (x0 + x1) - sfactor * (y1-y0);
  var yc = 0.5 * (y0 + y1) + sfactor * (x1-x0);

  var th0 = Math.atan2(y0-yc, x0-xc);
  var th1 = Math.atan2(y1-yc, x1-xc);

  var th_arc = th1-th0;
  if (th_arc < 0 && sweep === 1){
    th_arc += 2 * Math.PI;
  } else if (th_arc > 0 && sweep === 0) {
    th_arc -= 2 * Math.PI;
  }

  var segs = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
  var result = [];
  for (var i=0; i<segs; ++i) {
    var th2 = th0 + i * th_arc / segs;
    var th3 = th0 + (i+1) * th_arc / segs;
    result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
  }

  return (segmentCache[key] = result);
}

function bezier(params) {
  var key = join.call(params);
  if (bezierCache[key]) {
    return bezierCache[key];
  }

  var cx = params[0],
      cy = params[1],
      th0 = params[2],
      th1 = params[3],
      rx = params[4],
      ry = params[5],
      sin_th = params[6],
      cos_th = params[7];

  var a00 = cos_th * rx;
  var a01 = -sin_th * ry;
  var a10 = sin_th * rx;
  var a11 = cos_th * ry;

  var cos_th0 = Math.cos(th0);
  var sin_th0 = Math.sin(th0);
  var cos_th1 = Math.cos(th1);
  var sin_th1 = Math.sin(th1);

  var th_half = 0.5 * (th1 - th0);
  var sin_th_h2 = Math.sin(th_half * 0.5);
  var t = (8/3) * sin_th_h2 * sin_th_h2 / Math.sin(th_half);
  var x1 = cx + cos_th0 - t * sin_th0;
  var y1 = cy + sin_th0 + t * cos_th0;
  var x3 = cx + cos_th1;
  var y3 = cy + sin_th1;
  var x2 = x3 + t * sin_th1;
  var y2 = y3 - t * cos_th1;

  return (bezierCache[key] = [
    a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
    a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
    a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
  ]);
}

var temp$1 = ['l', 0, 0, 0, 0, 0, 0, 0];

function scale(current, s) {
  var c = (temp$1[0] = current[0]);
  if (c === 'a' || c === 'A') {
    temp$1[1] = s * current[1];
    temp$1[2] = s * current[2];
    temp$1[6] = s * current[6];
    temp$1[7] = s * current[7];
  } else {
    for (var i=1, n=current.length; i<n; ++i) {
      temp$1[i] = s * current[i];
    }
  }
  return temp$1;
}

var pathRender = function(context, path$$1, l, t, s) {
  var current, // current instruction
      previous = null,
      x = 0, // current x
      y = 0, // current y
      controlX = 0, // current control point x
      controlY = 0, // current control point y
      tempX,
      tempY,
      tempControlX,
      tempControlY;

  if (l == null) l = 0;
  if (t == null) t = 0;
  if (s == null) s = 1;

  if (context.beginPath) context.beginPath();

  for (var i=0, len=path$$1.length; i<len; ++i) {
    current = path$$1[i];
    if (s !== 1) current = scale(current, s);

    switch (current[0]) { // first letter

      case 'l': // lineto, relative
        x += current[1];
        y += current[2];
        context.lineTo(x + l, y + t);
        break;

      case 'L': // lineto, absolute
        x = current[1];
        y = current[2];
        context.lineTo(x + l, y + t);
        break;

      case 'h': // horizontal lineto, relative
        x += current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'H': // horizontal lineto, absolute
        x = current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'v': // vertical lineto, relative
        y += current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'V': // verical lineto, absolute
        y = current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'm': // moveTo, relative
        x += current[1];
        y += current[2];
        context.moveTo(x + l, y + t);
        break;

      case 'M': // moveTo, absolute
        x = current[1];
        y = current[2];
        context.moveTo(x + l, y + t);
        break;

      case 'c': // bezierCurveTo, relative
        tempX = x + current[5];
        tempY = y + current[6];
        controlX = x + current[3];
        controlY = y + current[4];
        context.bezierCurveTo(
          x + current[1] + l, // x1
          y + current[2] + t, // y1
          controlX + l, // x2
          controlY + t, // y2
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'C': // bezierCurveTo, absolute
        x = current[5];
        y = current[6];
        controlX = current[3];
        controlY = current[4];
        context.bezierCurveTo(
          current[1] + l,
          current[2] + t,
          controlX + l,
          controlY + t,
          x + l,
          y + t
        );
        break;

      case 's': // shorthand cubic bezierCurveTo, relative
        // transform to absolute x,y
        tempX = x + current[3];
        tempY = y + current[4];
        // calculate reflection of previous control points
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          x + current[1] + l,
          y + current[2] + t,
          tempX + l,
          tempY + t
        );

        // set control point to 2nd one of this command
        // the first control point is assumed to be the reflection of
        // the second control point on the previous command relative
        // to the current point.
        controlX = x + current[1];
        controlY = y + current[2];

        x = tempX;
        y = tempY;
        break;

      case 'S': // shorthand cubic bezierCurveTo, absolute
        tempX = current[3];
        tempY = current[4];
        // calculate reflection of previous control points
        controlX = 2*x - controlX;
        controlY = 2*y - controlY;
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        // set control point to 2nd one of this command
        // the first control point is assumed to be the reflection of
        // the second control point on the previous command relative
        // to the current point.
        controlX = current[1];
        controlY = current[2];

        break;

      case 'q': // quadraticCurveTo, relative
        // transform to absolute x,y
        tempX = x + current[3];
        tempY = y + current[4];

        controlX = x + current[1];
        controlY = y + current[2];

        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'Q': // quadraticCurveTo, absolute
        tempX = current[3];
        tempY = current[4];

        context.quadraticCurveTo(
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = current[1];
        controlY = current[2];
        break;

      case 't': // shorthand quadraticCurveTo, relative

        // transform to absolute x,y
        tempX = x + current[1];
        tempY = y + current[2];

        if (previous[0].match(/[QqTt]/) === null) {
          // If there is no previous command or if the previous command was not a Q, q, T or t,
          // assume the control point is coincident with the current point
          controlX = x;
          controlY = y;
        }
        else if (previous[0] === 't') {
          // calculate reflection of previous control points for t
          controlX = 2 * x - tempControlX;
          controlY = 2 * y - tempControlY;
        }
        else if (previous[0] === 'q') {
          // calculate reflection of previous control points for q
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
        }

        tempControlX = controlX;
        tempControlY = controlY;

        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = x + current[1];
        controlY = y + current[2];
        break;

      case 'T':
        tempX = current[1];
        tempY = current[2];

        // calculate reflection of previous control points
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'a':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + x + l,
          current[7] + y + t
        ]);
        x += current[6];
        y += current[7];
        break;

      case 'A':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + l,
          current[7] + t
        ]);
        x = current[6];
        y = current[7];
        break;

      case 'z':
      case 'Z':
        context.closePath();
        break;
    }
    previous = current;
  }
};

function drawArc(context, x, y, coords) {
  var seg = segments(
    coords[5], // end x
    coords[6], // end y
    coords[0], // radius x
    coords[1], // radius y
    coords[3], // large flag
    coords[4], // sweep flag
    coords[2], // rotation
    x, y
  );
  for (var i=0; i<seg.length; ++i) {
    var bez = bezier(seg[i]);
    context.bezierCurveTo(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5]);
  }
}

var tau = 2 * Math.PI;
var halfSqrt3 = Math.sqrt(3) / 2;

var builtins = {
  'circle': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau);
    }
  },
  'cross': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          s = r / 2.5;
      context.moveTo(-r, -s);
      context.lineTo(-r, s);
      context.lineTo(-s, s);
      context.lineTo(-s, r);
      context.lineTo(s, r);
      context.lineTo(s, s);
      context.lineTo(r, s);
      context.lineTo(r, -s);
      context.lineTo(s, -s);
      context.lineTo(s, -r);
      context.lineTo(-s, -r);
      context.lineTo(-s, -s);
      context.closePath();
    }
  },
  'diamond': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(-r, 0);
      context.lineTo(0, -r);
      context.lineTo(r, 0);
      context.lineTo(0, r);
      context.closePath();
    }
  },
  'square': {
    draw: function(context, size) {
      var w = Math.sqrt(size),
          x = -w / 2;
      context.rect(x, x, w, w);
    }
  },
  'triangle-up': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, -h);
      context.lineTo(-r, h);
      context.lineTo(r, h);
      context.closePath();
    }
  },
  'triangle-down': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, h);
      context.lineTo(-r, -h);
      context.lineTo(r, -h);
      context.closePath();
    }
  },
  'triangle-right': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(h, 0);
      context.lineTo(-h, -r);
      context.lineTo(-h, r);
      context.closePath();
    }
  },
  'triangle-left': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(-h, 0);
      context.lineTo(h, -r);
      context.lineTo(h, r);
      context.closePath();
    }
  }
};

function symbols(_$$1) {
  return builtins.hasOwnProperty(_$$1) ? builtins[_$$1] : customSymbol(_$$1);
}

var custom = {};

function customSymbol(path$$1) {
  if (!custom.hasOwnProperty(path$$1)) {
    var parsed = pathParse(path$$1);
    custom[path$$1] = {
      draw: function(context, size) {
        pathRender(context, parsed, 0, 0, Math.sqrt(size) / 2);
      }
    };
  }
  return custom[path$$1];
}

function rectangleX(d) {
  return d.x;
}

function rectangleY(d) {
  return d.y;
}

function rectangleWidth(d) {
  return d.width;
}

function rectangleHeight(d) {
  return d.height;
}

function constant$1(_$$1) {
  return function() { return _$$1; };
}

var vg_rect = function() {
  var x = rectangleX,
      y = rectangleY,
      width = rectangleWidth,
      height = rectangleHeight,
      cornerRadius = constant$1(0),
      context = null;

  function rectangle(_$$1, x0, y0) {
    var buffer,
        x1 = x0 != null ? x0 : +x.call(this, _$$1),
        y1 = y0 != null ? y0 : +y.call(this, _$$1),
        w  = +width.call(this, _$$1),
        h  = +height.call(this, _$$1),
        cr = +cornerRadius.call(this, _$$1);

    if (!context) context = buffer = d3Path.path();

    if (cr <= 0) {
      context.rect(x1, y1, w, h);
    } else {
      var x2 = x1 + w,
          y2 = y1 + h;
      context.moveTo(x1 + cr, y1);
      context.lineTo(x2 - cr, y1);
      context.quadraticCurveTo(x2, y1, x2, y1 + cr);
      context.lineTo(x2, y2 - cr);
      context.quadraticCurveTo(x2, y2, x2 - cr, y2);
      context.lineTo(x1 + cr, y2);
      context.quadraticCurveTo(x1, y2, x1, y2 - cr);
      context.lineTo(x1, y1 + cr);
      context.quadraticCurveTo(x1, y1, x1 + cr, y1);
      context.closePath();
    }

    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }

  rectangle.x = function(_$$1) {
    if (arguments.length) {
      x = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return x;
    }
  };

  rectangle.y = function(_$$1) {
    if (arguments.length) {
      y = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return y;
    }
  };

  rectangle.width = function(_$$1) {
    if (arguments.length) {
      width = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return width;
    }
  };

  rectangle.height = function(_$$1) {
    if (arguments.length) {
      height = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return height;
    }
  };

  rectangle.cornerRadius = function(_$$1) {
    if (arguments.length) {
      cornerRadius = typeof _$$1 === 'function' ? _$$1 : constant$1(+_$$1);
      return rectangle;
    } else {
      return cornerRadius;
    }
  };

  rectangle.context = function(_$$1) {
    if (arguments.length) {
      context = _$$1 == null ? null : _$$1;
      return rectangle;
    } else {
      return context;
    }
  };

  return rectangle;
};

var pi = Math.PI;

var vg_trail = function() {
  var x,
      y,
      size,
      defined,
      context = null,
      ready, x1, y1, r1;

  function point(x2, y2, w2) {
    var r2 = w2 / 2;

    if (ready) {
      var ux = y1 - y2,
          uy = x2 - x1;

      if (ux || uy) {
        // get normal vector
        var ud = Math.sqrt(ux * ux + uy * uy),
            rx = (ux /= ud) * r1,
            ry = (uy /= ud) * r1,
            t = Math.atan2(uy, ux);

        // draw segment
        context.moveTo(x1 - rx, y1 - ry);
        context.lineTo(x2 - ux * r2, y2 - uy * r2);
        context.arc(x2, y2, r2, t - pi, t);
        context.lineTo(x1 + rx, y1 + ry);
        context.arc(x1, y1, r1, t, t + pi);
      } else {
        context.arc(x2, y2, r2, 0, 2*pi);
      }
      context.closePath();
    } else {
      ready = 1;
    }
    x1 = x2;
    y1 = y2;
    r1 = r2;
  }

  function trail(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) context = buffer = d3Path.path();

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) ready = 0;
      }
      if (defined0) point(+x(d, i, data), +y(d, i, data), +size(d, i, data));
    }

    if (buffer) {
      context = null;
      return buffer + '' || null;
    }
  }

  trail.x = function(_$$1) {
    if (arguments.length) {
      x = _$$1;
      return trail;
    } else {
      return x;
    }
  };

  trail.y = function(_$$1) {
    if (arguments.length) {
      y = _$$1;
      return trail;
    } else {
      return y;
    }
  };

  trail.size = function(_$$1) {
    if (arguments.length) {
      size = _$$1;
      return trail;
    } else {
      return size;
    }
  };

  trail.defined = function(_$$1) {
    if (arguments.length) {
      defined = _$$1;
      return trail;
    } else {
      return defined;
    }
  };

  trail.context = function(_$$1) {
    if (arguments.length) {
      if (_$$1 == null) {
        context = null;
      } else {
        context = _$$1;
      }
      return trail;
    } else {
      return context;
    }
  };

  return trail;
};

function x(item)    { return item.x || 0; }
function y(item)    { return item.y || 0; }
function w(item)    { return item.width || 0; }
function ts(item)   { return item.size || 1; }
function h(item)    { return item.height || 0; }
function xw(item)   { return (item.x || 0) + (item.width || 0); }
function yh(item)   { return (item.y || 0) + (item.height || 0); }
function sa(item)   { return item.startAngle || 0; }
function ea(item)   { return item.endAngle || 0; }
function pa(item)   { return item.padAngle || 0; }
function ir(item)   { return item.innerRadius || 0; }
function or(item)   { return item.outerRadius || 0; }
function cr(item)   { return item.cornerRadius || 0; }
function def(item)  { return !(item.defined === false); }
function size(item) { return item.size == null ? 64 : item.size; }
function type(item) { return symbols(item.shape || 'circle'); }

var arcShape    = d3Shape.arc().startAngle(sa).endAngle(ea).padAngle(pa)
                          .innerRadius(ir).outerRadius(or).cornerRadius(cr);
var areavShape  = d3Shape.area().x(x).y1(y).y0(yh).defined(def);
var areahShape  = d3Shape.area().y(y).x1(x).x0(xw).defined(def);
var lineShape   = d3Shape.line().x(x).y(y).defined(def);
var rectShape   = vg_rect().x(x).y(y).width(w).height(h).cornerRadius(cr);
var symbolShape = d3Shape.symbol().type(type).size(size);
var trailShape  = vg_trail().x(x).y(y).defined(def).size(ts);

function arc$2(context, item) {
  return arcShape.context(context)(item);
}

function area$1(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return (item.orient === 'horizontal' ? areahShape : areavShape)
    .curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

function line$1(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear';
  return lineShape.curve(curves(interp, item.orient, item.tension))
    .context(context)(items);
}

function rectangle(context, item, x, y) {
  return rectShape.context(context)(item, x, y);
}

function shape(context, item) {
  return (item.mark.shape || item.shape)
    .context(context)(item);
}

function symbol$1(context, item) {
  return symbolShape.context(context)(item);
}

function trail(context, items) {
  return trailShape.context(context)(items);
}

var boundStroke = function(bounds, item) {
  if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
    bounds.expand(item.strokeWidth != null ? +item.strokeWidth : 1);
  }
  return bounds;
};

var bounds;
var tau$1 = Math.PI * 2;
var halfPi = tau$1 / 4;
var circleThreshold = tau$1 - 1e-8;

function context(_$$1) {
  bounds = _$$1;
  return context;
}

function noop() {}

function add$1(x, y) { bounds.add(x, y); }

context.beginPath = noop;

context.closePath = noop;

context.moveTo = add$1;

context.lineTo = add$1;

context.rect = function(x, y, w, h) {
  add$1(x, y);
  add$1(x + w, y + h);
};

context.quadraticCurveTo = function(x1, y1, x2, y2) {
  add$1(x1, y1);
  add$1(x2, y2);
};

context.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
  add$1(x1, y1);
  add$1(x2, y2);
  add$1(x3, y3);
};

context.arc = function(cx, cy, r, sa, ea, ccw) {
  if (Math.abs(ea - sa) > circleThreshold) {
    add$1(cx - r, cy - r);
    add$1(cx + r, cy + r);
    return;
  }

  var xmin = Infinity, xmax = -Infinity,
      ymin = Infinity, ymax = -Infinity,
      s, i, x, y;

  function update(a) {
    x = r * Math.cos(a);
    y = r * Math.sin(a);
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  // Sample end points and interior points aligned with 90 degrees
  update(sa);
  update(ea);

  if (ea !== sa) {
    sa = sa % tau$1; if (sa < 0) sa += tau$1;
    ea = ea % tau$1; if (ea < 0) ea += tau$1;

    if (ea < sa) {
      ccw = !ccw; // flip direction
      s = sa; sa = ea; ea = s; // swap end-points
    }

    if (ccw) {
      ea -= tau$1;
      s = sa - (sa % halfPi);
      for (i=0; i<3 && s>ea; ++i, s-=halfPi) update(s);
    } else {
      s = sa - (sa % halfPi) + halfPi;
      for (i=0; i<3 && s<ea; ++i, s=s+halfPi) update(s);
    }
  }

  add$1(cx + xmin, cy + ymin);
  add$1(cx + xmax, cy + ymax);
};

var gradient = function(context, gradient, bounds) {
  var w = bounds.width(),
      h = bounds.height(),
      x1 = bounds.x1 + gradient.x1 * w,
      y1 = bounds.y1 + gradient.y1 * h,
      x2 = bounds.x1 + gradient.x2 * w,
      y2 = bounds.y1 + gradient.y2 * h,
      stop = gradient.stops,
      i = 0,
      n = stop.length,
      linearGradient = context.createLinearGradient(x1, y1, x2, y2);

  for (; i<n; ++i) {
    linearGradient.addColorStop(stop[i].offset, stop[i].color);
  }

  return linearGradient;
};

var color = function(context, item, value) {
  return (value.id) ?
    gradient(context, value, item.bounds) :
    value;
};

var fill = function(context, item, opacity) {
  opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.fillStyle = color(context, item, item.fill);
    return true;
  } else {
    return false;
  }
};

var Empty$1 = [];

var stroke = function(context, item, opacity) {
  var lw = (lw = item.strokeWidth) != null ? lw : 1;

  if (lw <= 0) return false;

  opacity *= (item.strokeOpacity==null ? 1 : item.strokeOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.strokeStyle = color(context, item, item.stroke);

    context.lineWidth = lw;
    context.lineCap = item.strokeCap || 'butt';
    context.lineJoin = item.strokeJoin || 'miter';
    context.miterLimit = item.strokeMiterLimit || 10;

    if (context.setLineDash) {
      context.setLineDash(item.strokeDash || Empty$1);
      context.lineDashOffset = item.strokeDashOffset || 0;
    }
    return true;
  } else {
    return false;
  }
};

function compare$1(a, b) {
  return a.zindex - b.zindex || a.index - b.index;
}

function zorder(scene) {
  if (!scene.zdirty) return scene.zitems;

  var items = scene.items,
      output = [], item, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    item.index = i;
    if (item.zindex) output.push(item);
  }

  scene.zdirty = false;
  return scene.zitems = output.sort(compare$1);
}

function visit(scene, visitor) {
  var items = scene.items, i, n;
  if (!items || !items.length) return;

  var zitems = zorder(scene);

  if (zitems && zitems.length) {
    for (i=0, n=items.length; i<n; ++i) {
      if (!items[i].zindex) visitor(items[i]);
    }
    items = zitems;
  }

  for (i=0, n=items.length; i<n; ++i) {
    visitor(items[i]);
  }
}

function pickVisit(scene, visitor) {
  var items = scene.items, hit, i;
  if (!items || !items.length) return null;

  var zitems = zorder(scene);
  if (zitems && zitems.length) items = zitems;

  for (i=items.length; --i >= 0;) {
    if (hit = visitor(items[i])) return hit;
  }

  if (items === zitems) {
    for (items=scene.items, i=items.length; --i >= 0;) {
      if (!items[i].zindex) {
        if (hit = visitor(items[i])) return hit;
      }
    }
  }

  return null;
}

function drawAll(path$$1) {
  return function(context, scene, bounds) {
    visit(scene, function(item) {
      if (!bounds || bounds.intersects(item.bounds)) {
        drawPath(path$$1, context, item, item);
      }
    });
  };
}

function drawOne(path$$1) {
  return function(context, scene, bounds) {
    if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
      drawPath(path$$1, context, scene.items[0], scene.items);
    }
  };
}

function drawPath(path$$1, context, item, items) {
  var opacity = item.opacity == null ? 1 : item.opacity;
  if (opacity === 0) return;

  if (path$$1(context, items)) return;

  if (item.fill && fill(context, item, opacity)) {
    context.fill();
  }

  if (item.stroke && stroke(context, item, opacity)) {
    context.stroke();
  }
}

var trueFunc = function() { return true; };

function pick(test) {
  if (!test) test = trueFunc;

  return function(context, scene, x, y, gx, gy) {
    if (context.pixelRatio > 1) {
      x *= context.pixelRatio;
      y *= context.pixelRatio;
    }

    return pickVisit(scene, function(item) {
      var b = item.bounds;
      // first hit test against bounding box
      if ((b && !b.contains(gx, gy)) || !b) return;
      // if in bounding box, perform more careful test
      if (test(context, item, x, y, gx, gy)) return item;
    });
  };
}

function hitPath(path$$1, filled) {
  return function(context, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        fill = (filled == null) ? item.fill : filled,
        stroke = item.stroke && context.isPointInStroke, lw, lc;

    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      context.lineWidth = lw != null ? lw : 1;
      context.lineCap   = lc != null ? lc : 'butt';
    }

    return path$$1(context, o) ? false :
      (fill && context.isPointInPath(x, y)) ||
      (stroke && context.isPointInStroke(x, y));
  };
}

function pickPath(path$$1) {
  return pick(hitPath(path$$1));
}

var translate = function(x, y) {
  return 'translate(' + x + ',' + y + ')';
};

var translateItem = function(item) {
  return translate(item.x || 0, item.y || 0);
};

var markItemPath = function(type, shape) {

  function attr(emit, item) {
    emit('transform', translateItem(item));
    emit('d', shape(null, item));
  }

  function bound(bounds, item) {
    shape(context(bounds), item);
    return boundStroke(bounds, item)
      .translate(item.x || 0, item.y || 0);
  }

  function draw(context$$1, item) {
    var x = item.x || 0,
        y = item.y || 0;
    context$$1.translate(x, y);
    context$$1.beginPath();
    shape(context$$1, item);
    context$$1.translate(-x, -y);
  }

  return {
    type:   type,
    tag:    'path',
    nested: false,
    attr:   attr,
    bound:  bound,
    draw:   drawAll(draw),
    pick:   pickPath(draw)
  };

};

var arc$1 = markItemPath('arc', arc$2);

var markMultiItemPath = function(type, shape) {

  function attr(emit, item) {
    var items = item.mark.items;
    if (items.length) emit('d', shape(null, items));
  }

  function bound(bounds, mark) {
    var items = mark.items;
    if (items.length === 0) {
      return bounds;
    } else {
      shape(context(bounds), items);
      return boundStroke(bounds, items[0]);
    }
  }

  function draw(context$$1, items) {
    context$$1.beginPath();
    shape(context$$1, items);
  }

  var hit = hitPath(draw);

  function pick$$1(context$$1, scene, x, y, gx, gy) {
    var items = scene.items,
        b = scene.bounds;

    if (!items || !items.length || b && !b.contains(gx, gy)) {
      return null;
    }

    if (context$$1.pixelRatio > 1) {
      x *= context$$1.pixelRatio;
      y *= context$$1.pixelRatio;
    }
    return hit(context$$1, items, x, y) ? items[0] : null;
  }

  return {
    type:   type,
    tag:    'path',
    nested: true,
    attr:   attr,
    bound:  bound,
    draw:   drawOne(draw),
    pick:   pick$$1
  };

};

var area$2 = markMultiItemPath('area', area$1);

var clip_id = 1;

function resetSVGClipId() {
  clip_id = 1;
}

var clip = function(renderer, item, size) {
  var defs = renderer._defs,
      id = item.clip_id || (item.clip_id = 'clip' + clip_id++),
      c = defs.clipping[id] || (defs.clipping[id] = {id: id});
  c.width = size.width || 0;
  c.height = size.height || 0;
  return 'url(#' + id + ')';
};

var StrokeOffset = 0.5;

function attr(emit, item) {
  emit('transform', translateItem(item));
}

function background(emit, item) {
  var offset = item.stroke ? StrokeOffset : 0;
  emit('class', 'background');
  emit('d', rectangle(null, item, offset, offset));
}

function foreground(emit, item, renderer) {
  var url = item.clip ? clip(renderer, item, item) : null;
  emit('clip-path', url);
}

function bound(bounds, group) {
  if (!group.clip && group.items) {
    var items = group.items;
    for (var j=0, m=items.length; j<m; ++j) {
      bounds.union(items[j].bounds);
    }
  }

  if (group.clip || group.width || group.height) {
    boundStroke(
      bounds.add(0, 0).add(group.width || 0, group.height || 0),
      group
    );
  }

  return bounds.translate(group.x || 0, group.y || 0);
}

function draw(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(group) {
    var gx = group.x || 0,
        gy = group.y || 0,
        w = group.width || 0,
        h = group.height || 0,
        offset, opacity;

    // setup graphics context
    context.save();
    context.translate(gx, gy);

    // draw group background
    if (group.stroke || group.fill) {
      opacity = group.opacity == null ? 1 : group.opacity;
      if (opacity > 0) {
        context.beginPath();
        offset = group.stroke ? StrokeOffset : 0;
        rectangle(context, group, offset, offset);
        if (group.fill && fill(context, group, opacity)) {
          context.fill();
        }
        if (group.stroke && stroke(context, group, opacity)) {
          context.stroke();
        }
      }
    }

    // set clip and bounds
    if (group.clip) {
      context.beginPath();
      context.rect(0, 0, w, h);
      context.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
    visit(group, function(item) {
      renderer.draw(context, item, bounds);
    });

    // restore graphics context
    if (bounds) bounds.translate(gx, gy);
    context.restore();
  });
}

function pick$1(context, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy) || !scene.items) {
    return null;
  }

  var handler = this;

  return pickVisit(scene, function(group) {
    var hit, dx, dy, b;

    // first hit test against bounding box
    // if a group is clipped, that should be handled by the bounds check.
    b = group.bounds;
    if (b && !b.contains(gx, gy)) return;

    // passed bounds check, so test sub-groups
    dx = (group.x || 0);
    dy = (group.y || 0);

    context.save();
    context.translate(dx, dy);

    dx = gx - dx;
    dy = gy - dy;

    hit = pickVisit(group, function(mark) {
      return pickMark(mark, dx, dy)
        ? handler.pick(mark, x, y, dx, dy)
        : null;
    });

    context.restore();
    if (hit) return hit;

    hit = scene.interactive !== false
      && (group.fill || group.stroke)
      && dx >= 0
      && dx <= group.width
      && dy >= 0
      && dy <= group.height;

    return hit ? group : null;
  });
}

function pickMark(mark, x, y) {
  return (mark.interactive !== false || mark.marktype === 'group')
    && mark.bounds && mark.bounds.contains(x, y);
}

var group = {
  type:       'group',
  tag:        'g',
  nested:     false,
  attr:       attr,
  bound:      bound,
  draw:       draw,
  pick:       pick$1,
  background: background,
  foreground: foreground
};

function getImage(item, renderer) {
  var image = item.image;
  if (!image || image.url !== item.url) {
    image = {loaded: false, width: 0, height: 0};
    renderer.loadImage(item.url).then(function(image) {
      item.image = image;
      item.image.url = item.url;
    });
  }
  return image;
}

function imageXOffset(align, w) {
  return align === 'center' ? w / 2 : align === 'right' ? w : 0;
}

function imageYOffset(baseline, h) {
  return baseline === 'middle' ? h / 2 : baseline === 'bottom' ? h : 0;
}

function attr$1(emit, item, renderer) {
  var image = getImage(item, renderer),
      x = item.x || 0,
      y = item.y || 0,
      w = (item.width != null ? item.width : image.width) || 0,
      h = (item.height != null ? item.height : image.height) || 0,
      a = item.aspect === false ? 'none' : 'xMidYMid';

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  emit('href', image.src || '', 'http://www.w3.org/1999/xlink', 'xlink:href');
  emit('transform', translate(x, y));
  emit('width', w);
  emit('height', h);
  emit('preserveAspectRatio', a);
}

function bound$1(bounds, item) {
  var image = item.image,
      x = item.x || 0,
      y = item.y || 0,
      w = (item.width != null ? item.width : (image && image.width)) || 0,
      h = (item.height != null ? item.height : (image && image.height)) || 0;

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  return bounds.set(x, y, x + w, y + h);
}

function draw$1(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

    var image = getImage(item, renderer),
        x = item.x || 0,
        y = item.y || 0,
        w = (item.width != null ? item.width : image.width) || 0,
        h = (item.height != null ? item.height : image.height) || 0,
        opacity, ar0, ar1, t;

    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);

    if (item.aspect !== false) {
      ar0 = image.width / image.height;
      ar1 = item.width / item.height;
      if (ar0 === ar0 && ar1 === ar1 && ar0 !== ar1) {
        if (ar1 < ar0) {
          t = w / ar0;
          y += (h - t) / 2;
          h = t;
        } else {
          t = h * ar0;
          x += (w - t) / 2;
          w = t;
        }
      }
    }

    if (image.loaded) {
      context.globalAlpha = (opacity = item.opacity) != null ? opacity : 1;
      context.drawImage(image, x, y, w, h);
    }
  });
}

var image = {
  type:     'image',
  tag:      'image',
  nested:   false,
  attr:     attr$1,
  bound:    bound$1,
  draw:     draw$1,
  pick:     pick(),
  get:      getImage,
  xOffset:  imageXOffset,
  yOffset:  imageYOffset
};

var line$2 = markMultiItemPath('line', line$1);

function attr$2(emit, item) {
  emit('transform', translateItem(item));
  emit('d', item.path);
}

function path$1(context$$1, item) {
  var path$$1 = item.path;
  if (path$$1 == null) return true;

  var cache = item.pathCache;
  if (!cache || cache.path !== path$$1) {
    (item.pathCache = cache = pathParse(path$$1)).path = path$$1;
  }
  pathRender(context$$1, cache, item.x, item.y);
}

function bound$2(bounds, item) {
  return path$1(context(bounds), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(bounds, item);
}

var path$2 = {
  type:   'path',
  tag:    'path',
  nested: false,
  attr:   attr$2,
  bound:  bound$2,
  draw:   drawAll(path$1),
  pick:   pickPath(path$1)
};

function attr$3(emit, item) {
  emit('d', rectangle(null, item));
}

function bound$3(bounds, item) {
  var x, y;
  return boundStroke(bounds.set(
    x = item.x || 0,
    y = item.y || 0,
    (x + item.width) || 0,
    (y + item.height) || 0
  ), item);
}

function draw$2(context, item) {
  context.beginPath();
  rectangle(context, item);
}

var rect = {
  type:   'rect',
  tag:    'path',
  nested: false,
  attr:   attr$3,
  bound:  bound$3,
  draw:   drawAll(draw$2),
  pick:   pickPath(draw$2)
};

function attr$4(emit, item) {
  emit('transform', translateItem(item));
  emit('x2', item.x2 != null ? item.x2 - (item.x||0) : 0);
  emit('y2', item.y2 != null ? item.y2 - (item.y||0) : 0);
}

function bound$4(bounds, item) {
  var x1, y1;
  return boundStroke(bounds.set(
    x1 = item.x || 0,
    y1 = item.y || 0,
    item.x2 != null ? item.x2 : x1,
    item.y2 != null ? item.y2 : y1
  ), item);
}

function path$3(context, item, opacity) {
  var x1, y1, x2, y2;

  if (item.stroke && stroke(context, item, opacity)) {
    x1 = item.x || 0;
    y1 = item.y || 0;
    x2 = item.x2 != null ? item.x2 : x1;
    y2 = item.y2 != null ? item.y2 : y1;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    return true;
  }
  return false;
}

function draw$3(context, scene, bounds) {
  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    var opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity && path$3(context, item, opacity)) {
      context.stroke();
    }
  });
}

function hit(context, item, x, y) {
  if (!context.isPointInStroke) return false;
  return path$3(context, item, 1) && context.isPointInStroke(x, y);
}

var rule = {
  type:   'rule',
  tag:    'line',
  nested: false,
  attr:   attr$4,
  bound:  bound$4,
  draw:   draw$3,
  pick:   pick(hit)
};

var shape$1 = markItemPath('shape', shape);

var symbol$2 = markItemPath('symbol', symbol$1);

var context$1;
var fontHeight;

var textMetrics = {
  height: height,
  measureWidth: measureWidth,
  estimateWidth: estimateWidth,
  width: estimateWidth,
  canvas: canvas
};

canvas(true);

// make dumb, simple estimate if no canvas is available
function estimateWidth(item) {
  fontHeight = height(item);
  return estimate(textValue(item));
}

function estimate(text) {
  return ~~(0.8 * text.length * fontHeight);
}

// measure text width if canvas is available
function measureWidth(item) {
  context$1.font = font(item);
  return measure$1(textValue(item));
}

function measure$1(text) {
  return context$1.measureText(text).width;
}

function height(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

function canvas(use) {
  context$1 = use && (context$1 = Canvas$1(1,1)) ? context$1.getContext('2d') : null;
  textMetrics.width = context$1 ? measureWidth : estimateWidth;
}

function textValue(item) {
  var s = item.text;
  if (s == null) {
    return '';
  } else {
    return item.limit > 0 ? truncate$1(item) : s + '';
  }
}

function truncate$1(item) {
  var limit = +item.limit,
      text = item.text + '',
      width;

  if (context$1) {
    context$1.font = font(item);
    width = measure$1;
  } else {
    fontHeight = height(item);
    width = estimate;
  }

  if (width(text) < limit) return text;

  var ellipsis = item.ellipsis || '\u2026',
      rtl = item.dir === 'rtl',
      lo = 0,
      hi = text.length, mid;

  limit -= width(ellipsis);

  if (rtl) {
    while (lo < hi) {
      mid = (lo + hi >>> 1);
      if (width(text.slice(mid)) > limit) lo = mid + 1;
      else hi = mid;
    }
    return ellipsis + text.slice(lo);
  } else {
    while (lo < hi) {
      mid = 1 + (lo + hi >>> 1);
      if (width(text.slice(0, mid)) < limit) lo = mid;
      else hi = mid - 1;
    }
    return text.slice(0, lo) + ellipsis;
  }
}


function font(item, quote) {
  var font = item.font;
  if (quote && font) {
    font = String(font).replace(/"/g, '\'');
  }
  return '' +
    (item.fontStyle ? item.fontStyle + ' ' : '') +
    (item.fontVariant ? item.fontVariant + ' ' : '') +
    (item.fontWeight ? item.fontWeight + ' ' : '') +
    height(item) + 'px ' +
    (font || 'sans-serif');
}

function offset(item) {
  // perform our own font baseline calculation
  // why? not all browsers support SVG 1.1 'alignment-baseline' :(
  var baseline = item.baseline,
      h = height(item);
  return Math.round(
    baseline === 'top'    ?  0.93*h :
    baseline === 'middle' ?  0.30*h :
    baseline === 'bottom' ? -0.21*h : 0
  );
}

var textAlign = {
  'left':   'start',
  'center': 'middle',
  'right':  'end'
};

var tempBounds = new Bounds();

function attr$5(emit, item) {
  var dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item),
      x = item.x || 0,
      y = item.y || 0,
      a = item.angle || 0,
      r = item.radius || 0, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  emit('text-anchor', textAlign[item.align] || 'start');

  if (a) {
    t = translate(x, y) + ' rotate('+a+')';
    if (dx || dy) t += ' ' + translate(dx, dy);
  } else {
    t = translate(x + dx, y + dy);
  }
  emit('transform', t);
}

function bound$5(bounds, item, noRotate) {
  var h = textMetrics.height(item),
      a = item.align,
      r = item.radius || 0,
      x = item.x || 0,
      y = item.y || 0,
      dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item) - Math.round(0.8*h), // use 4/5 offset
      w, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  // horizontal alignment
  w = textMetrics.width(item);
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  } else {
    // left by default, do nothing
  }

  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  if (item.angle && !noRotate) {
    bounds.rotate(item.angle*Math.PI/180, x, y);
  }
  return bounds.expand(noRotate || !w ? 0 : 1);
}

function draw$4(context, scene, bounds) {
  visit(scene, function(item) {
    var opacity, x, y, r, t, str;
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    if (!(str = textValue(item))) return; // get text string

    opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity === 0) return;

    context.font = font(item);
    context.textAlign = item.align || 'left';

    x = item.x || 0;
    y = item.y || 0;
    if ((r = item.radius)) {
      t = (item.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    if (item.angle) {
      context.save();
      context.translate(x, y);
      context.rotate(item.angle * Math.PI/180);
      x = y = 0; // reset x, y
    }
    x += (item.dx || 0);
    y += (item.dy || 0) + offset(item);

    if (item.fill && fill(context, item, opacity)) {
      context.fillText(str, x, y);
    }
    if (item.stroke && stroke(context, item, opacity)) {
      context.strokeText(str, x, y);
    }
    if (item.angle) context.restore();
  });
}

function hit$1(context, item, x, y, gx, gy) {
  if (item.fontSize <= 0) return false;
  if (!item.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var b = bound$5(tempBounds, item, true),
      a = -item.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ix = item.x,
      iy = item.y,
      px = cos*gx - sin*gy + (ix - ix*cos + iy*sin),
      py = sin*gx + cos*gy + (iy - ix*sin - iy*cos);

  return b.contains(px, py);
}

var text = {
  type:   'text',
  tag:    'text',
  nested: false,
  attr:   attr$5,
  bound:  bound$5,
  draw:   draw$4,
  pick:   pick(hit$1)
};

var trail$1 = markMultiItemPath('trail', trail);

var marks = {
  arc:     arc$1,
  area:    area$2,
  group:   group,
  image:   image,
  line:    line$2,
  path:    path$2,
  rect:    rect,
  rule:    rule,
  shape:   shape$1,
  symbol:  symbol$2,
  text:    text,
  trail:   trail$1
};

var boundItem$1 = function(item, func, opt) {
  var type = marks[item.mark.marktype],
      bound = func || type.bound;
  if (type.nested) item = item.mark;

  return bound(item.bounds || (item.bounds = new Bounds()), item, opt);
};

var DUMMY = {mark: null};

var boundMark = function(mark, bounds, opt) {
  var type  = marks[mark.marktype],
      bound = type.bound,
      items = mark.items,
      hasItems = items && items.length,
      i, n, item, b;

  if (type.nested) {
    if (hasItems) {
      item = items[0];
    } else {
      // no items, fake it
      DUMMY.mark = mark;
      item = DUMMY;
    }
    b = boundItem$1(item, bound, opt);
    bounds = bounds && bounds.union(b) || b;
    return bounds;
  }

  bounds = bounds
    || mark.bounds && mark.bounds.clear()
    || new Bounds();

  if (hasItems) {
    for (i=0, n=items.length; i<n; ++i) {
      bounds.union(boundItem$1(items[i], bound, opt));
    }
  }

  return mark.bounds = bounds;
};

var keys = [
  'marktype', 'name', 'role', 'interactive', 'clip', 'items', 'zindex',
  'x', 'y', 'width', 'height', 'align', 'baseline',             // layout
  'fill', 'fillOpacity', 'opacity',                             // fill
  'stroke', 'strokeOpacity', 'strokeWidth', 'strokeCap',        // stroke
  'strokeDash', 'strokeDashOffset',                             // stroke dash
  'startAngle', 'endAngle', 'innerRadius', 'outerRadius',       // arc
  'cornerRadius', 'padAngle',                                   // arc, rect
  'interpolate', 'tension', 'orient', 'defined',                // area, line
  'url',                                                        // image
  'path',                                                       // path
  'x2', 'y2',                                                   // rule
  'size', 'shape',                                              // symbol
  'text', 'angle', 'theta', 'radius', 'dx', 'dy',               // text
  'font', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant'  // font
];

function sceneToJSON(scene, indent) {
  return JSON.stringify(scene, keys, indent);
}

function sceneFromJSON(json) {
  var scene = (typeof json === 'string' ? JSON.parse(json) : json);
  return initialize(scene);
}

function initialize(scene) {
  var type = scene.marktype,
      items = scene.items,
      parent, i, n;

  if (items) {
    for (i=0, n=items.length; i<n; ++i) {
      parent = type ? 'mark' : 'group';
      items[i][parent] = scene;
      if (items[i].zindex) items[i][parent].zdirty = true;
      if ('group' === (type || parent)) initialize(items[i]);
    }
  }

  if (type) boundMark(scene);
  return scene;
}

function Scenegraph(scene) {
  if (arguments.length) {
    this.root = sceneFromJSON(scene);
  } else {
    this.root = createMark({
      marktype: 'group',
      name: 'root',
      role: 'frame'
    });
    this.root.items = [new GroupItem(this.root)];
  }
}

var prototype$39 = Scenegraph.prototype;

prototype$39.toJSON = function(indent) {
  return sceneToJSON(this.root, indent || 0);
};

prototype$39.mark = function(markdef, group, index) {
  group = group || this.root.items[0];
  var mark = createMark(markdef, group);
  group.items[index] = mark;
  if (mark.zindex) mark.group.zdirty = true;
  return mark;
};

function createMark(def, group) {
  return {
    bounds:      new Bounds(),
    clip:        !!def.clip,
    group:       group,
    interactive: def.interactive === false ? false : true,
    items:       [],
    marktype:    def.marktype,
    name:        def.name || undefined,
    role:        def.role || undefined,
    zindex:      def.zindex || 0
  };
}

function Handler(customLoader) {
  this._active = null;
  this._handlers = {};
  this._loader = customLoader || loader();
}

var prototype$40 = Handler.prototype;

prototype$40.initialize = function(el, origin, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.origin(origin);
};

prototype$40.element = function() {
  return this._el;
};

prototype$40.origin = function(origin) {
  this._origin = origin || [0, 0];
  return this;
};

prototype$40.scene = function(scene) {
  if (!arguments.length) return this._scene;
  this._scene = scene;
  return this;
};

// add an event handler
// subclasses should override
prototype$40.on = function(/*type, handler*/) {};

// remove an event handler
// subclasses should override
prototype$40.off = function(/*type, handler*/) {};

// return an array with all registered event handlers
prototype$40.handlers = function() {
  var h = this._handlers, a = [], k;
  for (k in h) { a.push.apply(a, h[k]); }
  return a;
};

prototype$40.eventName = function(name) {
  var i = name.indexOf('.');
  return i < 0 ? name : name.slice(0,i);
};

prototype$40.handleHref = function(event, item, href) {
  this._loader
    .sanitize(href, {context:'href'})
    .then(function(opt) {
      var e = new MouseEvent(event.type, event),
          a = domCreate(null, 'a');
      for (var name in opt) a.setAttribute(name, opt[name]);
      a.dispatchEvent(e);
    })
    .catch(function() { /* do nothing */ });
};

prototype$40.handleTooltip = function(event, item, tooltipText) {
  this._el.setAttribute('title', tooltipText || '');
};

/**
 * Create a new Renderer instance.
 * @param {object} [loader] - Optional loader instance for
 *   image and href URL sanitization. If not specified, a
 *   standard loader instance will be generated.
 * @constructor
 */
function Renderer(loader) {
  this._el = null;
  this._bgcolor = null;
  this._loader = new ResourceLoader(loader);
}

var prototype$41 = Renderer.prototype;

/**
 * Initialize a new Renderer instance.
 * @param {DOMElement} el - The containing DOM element for the display.
 * @param {number} width - The width of the display, in pixels.
 * @param {number} height - The height of the display, in pixels.
 * @param {Array<number>} origin - The origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype$41.initialize = function(el, width, height, origin) {
  this._el = el;
  return this.resize(width, height, origin);
};

/**
 * Returns the parent container element for a visualization.
 * @return {DOMElement} - The containing DOM element.
 */
prototype$41.element = function() {
  return this._el;
};

/**
 * Returns the scene element (e.g., canvas or SVG) of the visualization
 * Subclasses must override if the first child is not the scene element.
 * @return {DOMElement} - The scene (e.g., canvas or SVG) element.
 */
prototype$41.scene = function() {
  return this._el && this._el.firstChild;
};

/**
 * Get / set the background color.
 */
prototype$41.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};

/**
 * Resize the display.
 * @param {number} width - The new width of the display, in pixels.
 * @param {number} height - The new height of the display, in pixels.
 * @param {Array<number>} origin - The new origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype$41.resize = function(width, height, origin) {
  this._width = width;
  this._height = height;
  this._origin = origin || [0, 0];
  return this;
};

/**
 * Report a dirty item whose bounds should be redrawn.
 * This base class method does nothing. Subclasses that perform
 * incremental should implement this method.
 * @param {Item} item - The dirty item whose bounds should be redrawn.
 */
prototype$41.dirty = function(/*item*/) {
};

/**
 * Render an input scenegraph, potentially with a set of dirty items.
 * This method will perform an immediate rendering with available resources.
 * The renderer may also need to perform image loading to perform a complete
 * render. This process can lead to asynchronous re-rendering of the scene
 * after this method returns. To receive notification when rendering is
 * complete, use the renderAsync method instead.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @return {Renderer} - This renderer instance.
 */
prototype$41.render = function(scene) {
  var r = this;

  // bind arguments into a render call, and cache it
  // this function may be subsequently called for async redraw
  r._call = function() { r._render(scene); };

  // invoke the renderer
  r._call();

  // clear the cached call for garbage collection
  // async redraws will stash their own copy
  r._call = null;

  return r;
};

/**
 * Internal rendering method. Renderer subclasses should override this
 * method to actually perform rendering.
 * @param {object} scene - The root mark of a scenegraph to render.
 */
prototype$41._render = function(/*scene*/) {
  // subclasses to override
};

/**
 * Asynchronous rendering method. Similar to render, but returns a Promise
 * that resolves when all rendering is completed. Sometimes a renderer must
 * perform image loading to get a complete rendering. The returned
 * Promise will not resolve until this process completes.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @return {Promise} - A Promise that resolves when rendering is complete.
 */
prototype$41.renderAsync = function(scene) {
  var r = this.render(scene);
  return this._ready
    ? this._ready.then(function() { return r; })
    : Promise.resolve(r);
};

/**
 * Internal method for asynchronous resource loading.
 * Proxies method calls to the ImageLoader, and tracks loading
 * progress to invoke a re-render once complete.
 * @param {string} method - The method name to invoke on the ImageLoader.
 * @param {string} uri - The URI for the requested resource.
 * @return {Promise} - A Promise that resolves to the requested resource.
 */
prototype$41._load = function(method, uri) {
  var r = this,
      p = r._loader[method](uri);

  if (!r._ready) {
    // re-render the scene when loading completes
    var call = r._call;
    r._ready = r._loader.ready()
      .then(function(redraw) {
        if (redraw) call();
        r._ready = null;
      });
  }

  return p;
};

/**
 * Sanitize a URL to include as a hyperlink in the rendered scene.
 * This method proxies a call to ImageLoader.sanitizeURL, but also tracks
 * image loading progress and invokes a re-render once complete.
 * @param {string} uri - The URI string to sanitize.
 * @return {Promise} - A Promise that resolves to the sanitized URL.
 */
prototype$41.sanitizeURL = function(uri) {
  return this._load('sanitizeURL', uri);
};

/**
 * Requests an image to include in the rendered scene.
 * This method proxies a call to ImageLoader.loadImage, but also tracks
 * image loading progress and invokes a re-render once complete.
 * @param {string} uri - The URI string of the image.
 * @return {Promise} - A Promise that resolves to the loaded Image.
 */
prototype$41.loadImage = function(uri) {
  return this._load('loadImage', uri);
};

var point = function(event, el) {
  var rect = el.getBoundingClientRect();
  return [
    event.clientX - rect.left - (el.clientLeft || 0),
    event.clientY - rect.top - (el.clientTop || 0)
  ];
};

function CanvasHandler(loader) {
  Handler.call(this, loader);
  this._down = null;
  this._touch = null;
  this._first = true;
}

var prototype$42 = inherits(CanvasHandler, Handler);

prototype$42.initialize = function(el, origin, obj) {
  // add event listeners
  var canvas = this._canvas = el && domFind(el, 'canvas');
  if (canvas) {
    var that = this;
    this.events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        if (prototype$42[type]) {
          prototype$42[type].call(that, evt);
        } else {
          that.fire(type, evt);
        }
      });
    });
  }

  return Handler.prototype.initialize.call(this, el, origin, obj);
};

prototype$42.canvas = function() {
  return this._canvas;
};

// retrieve the current canvas context
prototype$42.context = function() {
  return this._canvas.getContext('2d');
};

// supported events
prototype$42.events = [
  'keydown',
  'keypress',
  'keyup',
  'dragenter',
  'dragleave',
  'dragover',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'click',
  'dblclick',
  'wheel',
  'mousewheel',
  'touchstart',
  'touchmove',
  'touchend'
];

// to keep old versions of firefox happy
prototype$42.DOMMouseScroll = function(evt) {
  this.fire('mousewheel', evt);
};

function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    var a = this._active,
        p = this.pickEvent(evt);

    if (p === a) {
      // active item and picked item are the same
      this.fire(moveEvent, evt); // fire move
    } else {
      // active item and picked item are different
      if (!a || !a.exit) {
        // fire out for prior active item
        // suppress if active item was removed from scene
        this.fire(outEvent, evt);
      }
      this._active = p;          // set new active item
      this.fire(overEvent, evt); // fire over for new active item
      this.fire(moveEvent, evt); // fire move for new active item
    }
  };
}

function inactive(type) {
  return function(evt) {
    this.fire(type, evt);
    this._active = null;
  };
}

prototype$42.mousemove = move('mousemove', 'mouseover', 'mouseout');
prototype$42.dragover  = move('dragover', 'dragenter', 'dragleave');

prototype$42.mouseout  = inactive('mouseout');
prototype$42.dragleave = inactive('dragleave');

prototype$42.mousedown = function(evt) {
  this._down = this._active;
  this.fire('mousedown', evt);
};

prototype$42.click = function(evt) {
  if (this._down === this._active) {
    this.fire('click', evt);
    this._down = null;
  }
};

prototype$42.touchstart = function(evt) {
  this._touch = this.pickEvent(evt.changedTouches[0]);

  if (this._first) {
    this._active = this._touch;
    this._first = false;
  }

  this.fire('touchstart', evt, true);
};

prototype$42.touchmove = function(evt) {
  this.fire('touchmove', evt, true);
};

prototype$42.touchend = function(evt) {
  this.fire('touchend', evt, true);
  this._touch = null;
};

// fire an event
prototype$42.fire = function(type, evt, touch) {
  var a = touch ? this._touch : this._active,
      h = this._handlers[type], i, len;

  // if hyperlinked, handle link first
  if (type === 'click' && a && a.href) {
    this.handleHref(evt, a, a.href);
  } else if ((type === 'mouseover' || type === 'mouseout') && a && a.tooltip) {
    this.handleTooltip(evt, a, type === 'mouseover' ? a.tooltip : null);
  }

  // invoke all registered handlers
  if (h) {
    evt.vegaType = type;
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};

// add an event handler
prototype$42.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers;
  (h[name] || (h[name] = [])).push({
    type: type,
    handler: handler
  });
  return this;
};

// remove an event handler
prototype$42.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type !== type) continue;
    if (!handler || h[i].handler === handler) h.splice(i, 1);
  }
  return this;
};

prototype$42.pickEvent = function(evt) {
  var p = point(evt, this._canvas),
      o = this._origin;
  return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
};

// find the scenegraph item at the current mouse position
// x, y -- the absolute x, y mouse coordinates on the canvas element
// gx, gy -- the relative coordinates within the current group
prototype$42.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};

var clip$1 = function(context, scene) {
  var group = scene.group;
  context.save();
  context.beginPath();
  context.rect(0, 0, group.width || 0, group.height || 0);
  context.clip();
};

var devicePixelRatio = typeof window !== 'undefined'
  ? window.devicePixelRatio || 1 : 1;

var resize = function(canvas, width, height, origin) {
  var scale = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;

  var context = canvas.getContext('2d'),
      ratio = scale ? devicePixelRatio : 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  if (ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  context.pixelRatio = ratio;
  context.setTransform(
    ratio, 0, 0, ratio,
    ratio * origin[0],
    ratio * origin[1]
  );

  return canvas;
};

function CanvasRenderer(loader) {
  Renderer.call(this, loader);
  this._redraw = false;
  this._dirty = new Bounds();
}

var prototype$43 = inherits(CanvasRenderer, Renderer);
var base = Renderer.prototype;
var tempBounds$1 = new Bounds();

prototype$43.initialize = function(el, width, height, origin) {
  this._canvas = Canvas$1(1, 1); // instantiate a small canvas
  if (el) {
    domClear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  // this method will invoke resize to size the canvas appropriately
  return base.initialize.call(this, el, width, height, origin);
};

prototype$43.resize = function(width, height, origin) {
  base.resize.call(this, width, height, origin);
  resize(this._canvas, this._width, this._height, this._origin);
  this._redraw = true;
  return this;
};

prototype$43.canvas = function() {
  return this._canvas;
};

prototype$43.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};

prototype$43.dirty = function(item) {
  var b = translate$1(item.bounds, item.mark.group);
  this._dirty.union(b);
};

function clipToBounds(g, b, origin) {
  // expand bounds by 1 pixel, then round to pixel boundaries
  b.expand(1).round();

  // to avoid artifacts translate if origin has fractional pixels
  b.translate(-(origin[0] % 1), -(origin[1] % 1));

  // set clipping path
  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();

  return b;
}

function translate$1(bounds, group) {
  if (group == null) return bounds;
  var b = tempBounds$1.clear().union(bounds);
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}

prototype$43._render = function(scene) {
  var g = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b = this._dirty;

  // setup
  g.save();
  if (this._redraw || b.empty()) {
    this._redraw = false;
    b = null;
  } else {
    b = clipToBounds(g, b, o);
  }

  this.clear(-o[0], -o[1], w, h);

  // render
  this.draw(g, scene, b);

  // takedown
  g.restore();

  this._dirty.clear();
  return this;
};

prototype$43.draw = function(ctx, scene, bounds) {
  var mark = marks[scene.marktype];
  if (scene.clip) clip$1(ctx, scene);
  mark.draw.call(this, ctx, scene, bounds);
  if (scene.clip) ctx.restore();
};

prototype$43.clear = function(x, y, w, h) {
  var g = this.context();
  g.clearRect(x, y, w, h);
  if (this._bgcolor != null) {
    g.fillStyle = this._bgcolor;
    g.fillRect(x, y, w, h);
  }
};

function SVGHandler(loader) {
  Handler.call(this, loader);
  var h = this;
  h._hrefHandler = listener(h, function(evt, item) {
    if (item && item.href) h.handleHref(evt, item, item.href);
  });
  h._tooltipHandler = listener(h, function(evt, item) {
    if (item && item.tooltip) {
      h.handleTooltip(evt, item, evt.type === 'mouseover' ? item.tooltip : null);
    }
  });
}

var prototype$44 = inherits(SVGHandler, Handler);

prototype$44.initialize = function(el, origin, obj) {
  var svg = this._svg;
  if (svg) {
    svg.removeEventListener('click', this._hrefHandler);
    svg.removeEventListener('mouseover', this._tooltipHandler);
    svg.removeEventListener('mouseout', this._tooltipHandler);
  }
  this._svg = svg = el && domFind(el, 'svg');
  if (svg) {
    svg.addEventListener('click', this._hrefHandler);
    svg.addEventListener('mouseover', this._tooltipHandler);
    svg.addEventListener('mouseout', this._tooltipHandler);
  }
  return Handler.prototype.initialize.call(this, el, origin, obj);
};

prototype$44.svg = function() {
  return this._svg;
};

// wrap an event listener for the SVG DOM
function listener(context, handler) {
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(context._obj, evt, item);
  };
}

// add an event handler
prototype$44.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers,
      x = {
        type:     type,
        handler:  handler,
        listener: listener(this, handler)
      };

  (h[name] || (h[name] = [])).push(x);

  if (this._svg) {
    this._svg.addEventListener(name, x.listener);
  }

  return this;
};

// remove an event handler
prototype$44.off = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers[name], i;

  if (!h) return;

  for (i=h.length; --i>=0;) {
    if (h[i].type === type && !handler || h[i].handler === handler) {
      if (this._svg) {
        svg.removeEventListener(name, h[i].listener);
      }
      h.splice(i, 1);
    }
  }

  return this;
};

// generate string for an opening xml tag
// tag: the name of the xml tag
// attr: hash of attribute name-value pairs to include
// raw: additional raw string to include in tag markup
function openTag(tag, attr, raw) {
  var s = '<' + tag, key, val;
  if (attr) {
    for (key in attr) {
      val = attr[key];
      if (val != null) {
        s += ' ' + key + '="' + val + '"';
      }
    }
  }
  if (raw) s += ' ' + raw;
  return s + '>';
}

// generate string for closing xml tag
// tag: the name of the xml tag
function closeTag(tag) {
  return '</' + tag + '>';
}

var metadata = {
  'version': '1.1',
  'xmlns': 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink'
};

var styles = {
  'fill':             'fill',
  'fillOpacity':      'fill-opacity',
  'stroke':           'stroke',
  'strokeWidth':      'stroke-width',
  'strokeOpacity':    'stroke-opacity',
  'strokeCap':        'stroke-linecap',
  'strokeJoin':       'stroke-linejoin',
  'strokeDash':       'stroke-dasharray',
  'strokeDashOffset': 'stroke-dashoffset',
  'strokeMiterLimit': 'stroke-miterlimit',
  'opacity':          'opacity'
};

var styleProperties = Object.keys(styles);

var ns = metadata.xmlns;

function SVGRenderer(loader) {
  Renderer.call(this, loader);
  this._dirtyID = 1;
  this._dirty = [];
  this._svg = null;
  this._root = null;
  this._defs = null;
}

var prototype$45 = inherits(SVGRenderer, Renderer);
var base$1 = Renderer.prototype;

prototype$45.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = domChild(el, 0, 'svg', ns);
    this._svg.setAttribute('class', 'marks');
    domClear(el, 1);
    // set the svg root group
    this._root = domChild(this._svg, 0, 'g', ns);
    domClear(this._svg, 1);
  }

  // create the svg definitions cache
  this._defs = {
    gradient: {},
    clipping: {}
  };

  // set background color if defined
  this.background(this._bgcolor);

  return base$1.initialize.call(this, el, width, height, padding);
};

prototype$45.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style.setProperty('background-color', bgcolor);
  }
  return base$1.background.apply(this, arguments);
};

prototype$45.resize = function(width, height, origin) {
  base$1.resize.call(this, width, height, origin);

  if (this._svg) {
    this._svg.setAttribute('width', this._width);
    this._svg.setAttribute('height', this._height);
    this._svg.setAttribute('viewBox', '0 0 ' + this._width + ' ' + this._height);
    this._root.setAttribute('transform', 'translate(' + this._origin + ')');
  }

  this._dirty = [];

  return this;
};

prototype$45.svg = function() {
  if (!this._svg) return null;

  var attr = {
    'class':  'marks',
    'width':  this._width,
    'height': this._height,
    'viewBox': '0 0 ' + this._width + ' ' + this._height
  };
  for (var key$$1 in metadata) {
    attr[key$$1] = metadata[key$$1];
  }

  return openTag('svg', attr) + this._svg.innerHTML + closeTag('svg');
};


// -- Render entry point --

prototype$45._render = function(scene) {
  // perform spot updates and re-render markup
  if (this._dirtyCheck()) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene);
    domClear(this._root, 1);
  }

  this.updateDefs();

  this._dirty = [];
  ++this._dirtyID;

  return this;
};

// -- Manage SVG definitions ('defs') block --

prototype$45.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id$$1;

  for (id$$1 in defs.gradient) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id$$1], index++);
  }

  for (id$$1 in defs.clipping) {
    if (!el) defs.el = (el = domChild(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id$$1], index++);
  }

  // clean-up
  if (el) {
    if (index === 0) {
      svg.removeChild(el);
      defs.el = null;
    } else {
      domClear(el, index);
    }
  }
};

function updateGradient(el, grad, index) {
  var i, n, stop;

  el = domChild(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);

  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = domChild(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  domClear(el, i);
}

function updateClipping(el, clip$$1, index) {
  var rect;

  el = domChild(el, index, 'clipPath', ns);
  el.setAttribute('id', clip$$1.id);
  rect = domChild(el, 0, 'rect', ns);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', clip$$1.width);
  rect.setAttribute('height', clip$$1.height);
}

prototype$45._resetDefs = function() {
  var def = this._defs;
  def.gradient = {};
  def.clipping = {};
};


// -- Manage rendering of items marked as dirty --

prototype$45.dirty = function(item) {
  if (item.dirty !== this._dirtyID) {
    item.dirty = this._dirtyID;
    this._dirty.push(item);
  }
};

prototype$45.isDirty = function(item) {
  return this._dirtyAll
    || !item._svg
    || item.dirty === this._dirtyID;
};

prototype$45._dirtyCheck = function() {
  this._dirtyAll = true;
  var items = this._dirty;
  if (!items.length) return true;

  var id$$1 = ++this._dirtyID,
      item, mark, type, mdef, i, n, o;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;

    if (mark.marktype !== type) {
      // memoize mark instance lookup
      type = mark.marktype;
      mdef = marks[type];
    }

    if (mark.zdirty && mark.dirty !== id$$1) {
      this._dirtyAll = false;
      mark.dirty = id$$1;
      dirtyParents(mark.group, id$$1);
    }

    if (item.exit) { // EXIT
      if (mdef.nested && mark.items.length) {
        // if nested mark with remaining points, update instead
        o = mark.items[0];
        if (o._svg) this._update(mdef, o._svg, o);
      } else if (item._svg) {
        // otherwise remove from DOM
        o = item._svg.parentNode;
        if (o) o.removeChild(item._svg);
      }
      item._svg = null;
      continue;
    }

    item = (mdef.nested ? mark.items[0] : item);
    if (item._update === id$$1) continue; // already visited

    if (!item._svg || !item._svg.ownerSVGElement) {
      // ENTER
      this._dirtyAll = false;
      dirtyParents(item, id$$1);
    } else {
      // IN-PLACE UPDATE
      this._update(mdef, item._svg, item);
    }
    item._update = id$$1;
  }
  return !this._dirtyAll;
};

function dirtyParents(item, id$$1) {
  for (; item && item.dirty !== id$$1; item=item.mark.group) {
    item.dirty = id$$1;
    if (item.mark && item.mark.dirty !== id$$1) {
      item.mark.dirty = id$$1;
    } else return;
  }
}


// -- Construct & maintain scenegraph to SVG mapping ---

// Draw a mark container.
prototype$45.draw = function(el, scene, prev) {
  if (!this.isDirty(scene)) return scene._svg;

  var renderer = this,
      mdef = marks[scene.marktype],
      events = scene.interactive === false ? 'none' : null,
      isGroup = mdef.tag === 'g',
      sibling = null,
      i = 0,
      parent;

  parent = bind(scene, el, prev, 'g');
  parent.setAttribute('class', cssClass(scene));
  if (!isGroup && events) {
    parent.style.setProperty('pointer-events', events);
  }
  if (scene.clip) {
    parent.setAttribute('clip-path', clip(renderer, scene, scene.group));
  }

  function process(item) {
    var dirty = renderer.isDirty(item),
        node = bind(item, parent, sibling, mdef.tag);

    if (dirty) {
      renderer._update(mdef, node, item);
      if (isGroup) recurse(renderer, node, item);
    }

    sibling = node;
    ++i;
  }

  if (mdef.nested) {
    if (scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  domClear(parent, i);
  return parent;
};

// Recursively process group contents.
function recurse(renderer, el, group) {
  el = el.lastChild;
  var prev, idx = 0;

  visit(group, function(item) {
    prev = renderer.draw(el, item, prev);
    ++idx;
  });

  // remove any extraneous DOM elements
  domClear(el, 1 + idx);
}

// Bind a scenegraph item to an SVG DOM element.
// Create new SVG elements as needed.
function bind(item, el, sibling, tag) {
  var node = item._svg, doc;

  // create a new dom node if needed
  if (!node) {
    doc = el.ownerDocument;
    node = domCreate(doc, tag, ns);
    item._svg = node;

    if (item.mark) {
      node.__data__ = item;
      node.__values__ = {fill: 'default'};

      // if group, create background and foreground elements
      if (tag === 'g') {
        var bg = domCreate(doc, 'path', ns);
        bg.setAttribute('class', 'background');
        node.appendChild(bg);
        bg.__data__ = item;

        var fg = domCreate(doc, 'g', ns);
        node.appendChild(fg);
        fg.__data__ = item;
      }
    }
  }

  if (doc || node.previousSibling !== sibling || !sibling) {
    el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
  }

  return node;
}


// -- Set attributes & styles on SVG elements ---

var element = null;
var values = null;  // temp var for current values hash

// Extra configuration for certain mark types
var mark_extras = {
  group: function(mdef, el, item) {
    values = el.__values__; // use parent's values hash

    element = el.childNodes[1];
    mdef.foreground(emit, item, this);

    element = el.childNodes[0];
    mdef.background(emit, item, this);

    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values.events) {
      element.style.setProperty('pointer-events', value);
      values.events = value;
    }
  },
  text: function(mdef, el, item) {
    var str = textValue(item);
    if (str !== values.text) {
      el.textContent = str;
      values.text = str;
    }
    str = font(item);
    if (str !== values.font) {
      el.style.setProperty('font', str);
      values.font = str;
    }
  }
};

prototype$45._update = function(mdef, el, item) {
  // set dom element and values cache
  // provides access to emit method
  element = el;
  values = el.__values__;

  // apply svg attributes
  mdef.attr(emit, item, this);

  // some marks need special treatment
  var extra = mark_extras[mdef.type];
  if (extra) extra.call(this, mdef, el, item);

  // apply svg css styles
  // note: element may be modified by 'extra' method
  this.style(element, item);
};

function emit(name, value, ns) {
  // early exit if value is unchanged
  if (value === values[name]) return;

  if (value != null) {
    // if value is provided, update DOM attribute
    if (ns) {
      element.setAttributeNS(ns, name, value);
    } else {
      element.setAttribute(name, value);
    }
  } else {
    // else remove DOM attribute
    if (ns) {
      element.removeAttributeNS(ns, name);
    } else {
      element.removeAttribute(name);
    }
  }

  // note current value for future comparison
  values[name] = value;
}

prototype$45.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    value = o[prop];
    if (value === values[prop]) continue;

    name = styles[prop];
    if (value == null) {
      if (name === 'fill') {
        el.style.setProperty(name, 'none');
      } else {
        el.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        // ensure definition is included
        this._defs.gradient[value.id] = value;
        value = 'url(' + href() + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'');
    }

    values[prop] = value;
  }
};

function href() {
  var loc;
  return typeof window === 'undefined' ? ''
    : (loc = window.location).hash ? loc.href.slice(0, -loc.hash.length)
    : loc.href;
}

function SVGStringRenderer(loader) {
  Renderer.call(this, loader);

  this._text = {
    head: '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };

  this._defs = {
    gradient: {},
    clipping: {}
  };
}

var prototype$46 = inherits(SVGStringRenderer, Renderer);
var base$2 = Renderer.prototype;

prototype$46.resize = function(width, height, origin) {
  base$2.resize.call(this, width, height, origin);
  var o = this._origin,
      t = this._text;

  var attr = {
    'class':  'marks',
    'width':  this._width,
    'height': this._height,
    'viewBox': '0 0 ' + this._width + ' ' + this._height
  };
  for (var key$$1 in metadata) {
    attr[key$$1] = metadata[key$$1];
  }

  t.head = openTag('svg', attr);
  t.root = openTag('g', {
    transform: 'translate(' + o + ')'
  });
  t.foot = closeTag('g') + closeTag('svg');

  return this;
};

prototype$46.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};

prototype$46._render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};

prototype$46.buildDefs = function() {
  var all = this._defs,
      defs = '',
      i, id$$1, def, stops;

  for (id$$1 in all.gradient) {
    def = all.gradient[id$$1];
    stops = def.stops;

    defs += openTag('linearGradient', {
      id: id$$1,
      x1: def.x1,
      x2: def.x2,
      y1: def.y1,
      y2: def.y2
    });

    for (i=0; i<stops.length; ++i) {
      defs += openTag('stop', {
        offset: stops[i].offset,
        'stop-color': stops[i].color
      }) + closeTag('stop');
    }

    defs += closeTag('linearGradient');
  }

  for (id$$1 in all.clipping) {
    def = all.clipping[id$$1];

    defs += openTag('clipPath', {id: id$$1});

    defs += openTag('rect', {
      x: 0,
      y: 0,
      width: def.width,
      height: def.height
    }) + closeTag('rect');

    defs += closeTag('clipPath');
  }

  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};

var object;

function emit$1(name, value, ns, prefixed) {
  object[prefixed || name] = value;
}

prototype$46.attributes = function(attr, item) {
  object = {};
  attr(emit$1, item, this);
  return object;
};

prototype$46.href = function(item) {
  var that = this,
      href = item.href,
      attr;

  if (href) {
    if (attr = that._hrefs && that._hrefs[href]) {
      return attr;
    } else {
      that.sanitizeURL(href).then(function(attr) {
        // rewrite to use xlink namespace
        // note that this will be deprecated in SVG 2.0
        attr['xlink:href'] = attr.href;
        attr.href = null;
        (that._hrefs || (that._hrefs = {}))[href] = attr;
      });
    }
  }
  return null;
};

prototype$46.mark = function(scene) {
  var renderer = this,
      mdef = marks[scene.marktype],
      tag  = mdef.tag,
      defs = this._defs,
      str = '',
      style;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag('g', {
    'class': cssClass(scene),
    'clip-path': scene.clip ? clip(renderer, scene, scene.group) : null
  }, style);

  // render contained elements
  function process(item) {
    var href = renderer.href(item);
    if (href) str += openTag('a', href);

    style = (tag !== 'g') ? applyStyles(item, scene, tag, defs) : null;
    str += openTag(tag, renderer.attributes(mdef.attr, item), style);

    if (tag === 'text') {
      str += escape_text(textValue(item));
    } else if (tag === 'g') {
      str += openTag('path', renderer.attributes(mdef.background, item),
        applyStyles(item, scene, 'bgrect', defs)) + closeTag('path');

      str += openTag('g', renderer.attributes(mdef.foreground, item))
        + renderer.markGroup(item)
        + closeTag('g');
    }

    str += closeTag(tag);
    if (href) str += closeTag('a');
  }

  if (mdef.nested) {
    if (scene.items && scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  // render closing group tag
  return str + closeTag('g');
};

prototype$46.markGroup = function(scene) {
  var renderer = this,
      str = '';

  visit(scene, function(item) {
    str += renderer.mark(item);
  });

  return str;
};

function applyStyles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none;';
  }

  if (tag === 'text') {
    s += 'font: ' + font(o) + ';';
  }

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        s += (s.length ? ' ' : '') + 'fill: none;';
      }
    } else {
      if (value.id) {
        // ensure definition is included
        defs.gradient[value.id] = value;
        value = 'url(#' + value.id + ')';
      }
      s += (s.length ? ' ' : '') + name + ': ' + value + ';';
    }
  }

  return s ? 'style="' + s + '"' : null;
}

function escape_text(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

var Canvas$2 = 'canvas';
var PNG = 'png';
var SVG = 'svg';
var None$1 = 'none';

var RenderType = {
  Canvas: Canvas$2,
  PNG:    PNG,
  SVG:    SVG,
  None:   None$1
};

var modules = {};

modules[Canvas$2] = modules[PNG] = {
  renderer: CanvasRenderer,
  headless: CanvasRenderer,
  handler:  CanvasHandler
};

modules[SVG] = {
  renderer: SVGRenderer,
  headless: SVGStringRenderer,
  handler:  SVGHandler
};

modules[None$1] = {};

function renderModule(name, _$$1) {
  name = String(name || '').toLowerCase();
  if (arguments.length > 1) {
    modules[name] = _$$1;
    return this;
  } else {
    return modules[name];
  }
}

var TOLERANCE = 1e-9;

function sceneEqual(a, b, key$$1) {
  return (a === b) ? true
    : (key$$1 === 'path') ? pathEqual(a, b)
    : (a instanceof Date && b instanceof Date) ? +a === +b
    : (isNumber(a) && isNumber(b)) ? Math.abs(a - b) <= TOLERANCE
    : (!a || !b || !isObject(a) && !isObject(b)) ? a == b
    : (a == null || b == null) ? false
    : objectEqual(a, b);
}

function pathEqual(a, b) {
  return sceneEqual(pathParse(a), pathParse(b));
}

function objectEqual(a, b) {
  var ka = Object.keys(a),
      kb = Object.keys(b),
      key$$1, i;

  if (ka.length !== kb.length) return false;

  ka.sort();
  kb.sort();

  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i]) return false;
  }

  for (i = ka.length - 1; i >= 0; i--) {
    key$$1 = ka[i];
    if (!sceneEqual(a[key$$1], b[key$$1], key$$1)) return false;
  }

  return typeof a === typeof b;
}

/**
 * Calculate bounding boxes for scenegraph items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - The scenegraph mark instance to bound.
 */
function Bound(params) {
  Transform.call(this, null, params);
}

var prototype$36 = inherits(Bound, Transform);
var temp = new Bounds();

prototype$36.transform = function(_$$1, pulse) {
  var view = pulse.dataflow,
      mark = _$$1.mark,
      type = mark.marktype,
      entry = marks[type],
      bound = entry.bound,
      clip = mark.clip,
      markBounds = mark.bounds, rebound;

  if (entry.nested) {
    // multi-item marks have a single bounds instance
    if (mark.items.length) view.dirty(mark.items[0]);
    markBounds = boundItem(mark, bound);
    mark.items.forEach(function(item) {
      item.bounds.clear().union(markBounds);
    });
  }

  else if (type === 'group' || _$$1.modified()) {
    // operator parameters modified -> re-bound all items
    // updates group bounds in response to modified group content
    pulse.visit(pulse.MOD, function(item) { view.dirty(item); });
    markBounds.clear();
    mark.items.forEach(function(item) {
      markBounds.union(boundItem(item, bound));
    });
  }

  else {
    // incrementally update bounds, re-bound mark as needed
    rebound = pulse.changed(pulse.REM);

    pulse.visit(pulse.ADD, function(item) {
      markBounds.union(boundItem(item, bound));
    });

    pulse.visit(pulse.MOD, function(item) {
      rebound = rebound || markBounds.alignsWith(item.bounds);
      view.dirty(item);
      markBounds.union(boundItem(item, bound));
    });

    if (rebound && !clip) {
      markBounds.clear();
      mark.items.forEach(function(item) { markBounds.union(item.bounds); });
    }
  }

  if (clip) {
    markBounds.intersect(temp.set(0, 0, mark.group.width, mark.group.height));
  }

  return pulse.modifies('bounds');
};

function boundItem(item, bound, opt) {
  return bound(item.bounds.clear(), item, opt);
}

var COUNTER_NAME = ':vega_identifier:';

/**
 * Adds a unique identifier to all added tuples.
 * This transform creates a new signal that serves as an id counter.
 * As a result, the id counter is shared across all instances of this
 * transform, generating unique ids across multiple data streams. In
 * addition, this signal value can be included in a snapshot of the
 * dataflow state, enabling correct resumption of id allocation.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.as - The field name for the generated identifier.
 */
function Identifier(params) {
  Transform.call(this, 0, params);
}

Identifier.Definition = {
  "type": "Identifier",
  "metadata": {"modifies": true},
  "params": [
    { "name": "as", "type": "string", "required": true }
  ]
};

var prototype$47 = inherits(Identifier, Transform);

prototype$47.transform = function(_$$1, pulse) {
  var counter = getCounter(pulse.dataflow),
      id$$1 = counter.value,
      as = _$$1.as;

  pulse.visit(pulse.ADD, function(t) {
    if (!t[as]) t[as] = ++id$$1;
  });

  counter.set(this.value = id$$1);
  return pulse;
};

function getCounter(view) {
  var counter = view._signals[COUNTER_NAME];
  if (!counter) {
    view._signals[COUNTER_NAME] = (counter = view.add(0));
  }
  return counter;
}

/**
 * Bind scenegraph items to a scenegraph mark instance.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.markdef - The mark definition for creating the mark.
 *   This is an object of legal scenegraph mark properties which *must* include
 *   the 'marktype' property.
 * @param {Array<number>} params.scenepath - Scenegraph tree coordinates for the mark.
 *   The path is an array of integers, each indicating the index into
 *   a successive chain of items arrays.
 */
function Mark(params) {
  Transform.call(this, null, params);
}

var prototype$48 = inherits(Mark, Transform);

prototype$48.transform = function(_$$1, pulse) {
  var mark = this.value;

  // acquire mark on first invocation, bind context and group
  if (!mark) {
    mark = pulse.dataflow.scenegraph().mark(_$$1.markdef, lookup$1(_$$1), _$$1.index);
    mark.group.context = _$$1.context;
    if (!_$$1.context.group) _$$1.context.group = mark.group;
    mark.source = this;
    this.value = mark;
  }

  // initialize entering items
  var Init = mark.marktype === 'group' ? GroupItem : Item;
  pulse.visit(pulse.ADD, function(item) { Init.call(item, mark); });

  // bind items array to scenegraph mark
  mark.items = pulse.source;
  return pulse;
};

function lookup$1(_$$1) {
  var g = _$$1.groups, p = _$$1.parent;
  return g && g.size === 1 ? g.get(Object.keys(g.object)[0])
    : g && p ? g.lookup(p)
    : null;
}

var Top = 'top';
var Left = 'left';
var Right = 'right';
var Bottom = 'bottom';

/**
 * Analyze items for overlap, changing opacity to hide items with
 * overlapping bounding boxes. This transform will preserve at least
 * two items (e.g., first and last) even if overlap persists.
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - A comparator
 *   function for sorting items.
 * @param {object} [params.method] - The overlap removal method to apply.
 *   One of 'parity' (default, hide every other item until there is no
 *   more overlap) or 'greedy' (sequentially scan and hide and items that
 *   overlap with the last visible item).
 * @param {object} [params.boundScale] - A scale whose range should be used
 *   to bound the items. Items exceeding the bounds of the scale range
 *   will be treated as overlapping. If null or undefined, no bounds check
 *   will be applied.
 * @param {object} [params.boundOrient] - The orientation of the scale
 *   (top, bottom, left, or right) used to bound items. This parameter is
 *   ignored if boundScale is null or undefined.
 * @param {object} [params.boundTolerance] - The tolerance in pixels for
 *   bound inclusion testing (default 1). This specifies by how many pixels
 *   an item's bounds may exceed the scale range bounds and not be culled.
 * @constructor
 */
function Overlap(params) {
  Transform.call(this, null, params);
}

var prototype$49 = inherits(Overlap, Transform);

var methods = {
  parity: function(items) {
    return items.filter(function(item, i) {
      return i % 2 ? (item.opacity = 0) : 1;
    });
  },
  greedy: function(items) {
    var a;
    return items.filter(function(b, i) {
      if (!i || !intersect(a.bounds, b.bounds)) {
        a = b;
        return 1;
      } else {
        return b.opacity = 0;
      }
    });
  }
};

// compute bounding box intersection
// allow 1 pixel of overlap tolerance
function intersect(a, b) {
  return !(
    a.x2 - 1 < b.x1 ||
    a.x1 + 1 > b.x2 ||
    a.y2 - 1 < b.y1 ||
    a.y1 + 1 > b.y2
  );
}

function hasOverlap(items) {
  for (var i=1, n=items.length, a=items[0].bounds, b; i<n; a=b, ++i) {
    if (intersect(a, b = items[i].bounds)) return true;
  }
}

function hasBounds(item) {
  var b = item.bounds;
  return b.width() > 1 && b.height() > 1;
}

function boundTest(scale, orient, tolerance) {
  var range$$1 = scale.range(),
      b = new Bounds();

  if (orient === Top || orient === Bottom) {
    b.set(range$$1[0], -Infinity, range$$1[1], +Infinity);
  } else {
    b.set(-Infinity, range$$1[0], +Infinity, range$$1[1]);
  }
  b.expand(tolerance || 1);

  return function(item) {
    return b.encloses(item.bounds);
  };
}

prototype$49.transform = function(_$$1, pulse) {
  var reduce = methods[_$$1.method] || methods.parity,
      source = pulse.materialize(pulse.SOURCE).source;

  if (!source) return;

  if (_$$1.sort) {
    source = source.slice().sort(_$$1.sort);
  }

  if (_$$1.method === 'greedy') {
    source = source.filter(hasBounds);
  }

  // reset all items to be fully opaque
  source.forEach(function(item) { item.opacity = 1; });

  var items = source;

  if (items.length >= 3 && hasOverlap(items)) {
    pulse = pulse.reflow(_$$1.modified()).modifies('opacity');
    do {
      items = reduce(items);
    } while (items.length >= 3 && hasOverlap(items));

    if (items.length < 3 && !peek(source).opacity) {
      if (items.length > 1) peek(items).opacity = 0;
      peek(source).opacity = 1;
    }
  }

  if (_$$1.boundScale) {
    var test = boundTest(_$$1.boundScale, _$$1.boundOrient, _$$1.boundTolerance);
    source.forEach(function(item) {
      if (!test(item)) item.opacity = 0;
    });
  }

  return pulse;
};

/**
 * Queue modified scenegraph items for rendering.
 * @constructor
 */
function Render(params) {
  Transform.call(this, null, params);
}

var prototype$50 = inherits(Render, Transform);

prototype$50.transform = function(_$$1, pulse) {
  var view = pulse.dataflow;

  pulse.visit(pulse.ALL, function(item) { view.dirty(item); });

  // set z-index dirty flag as needed
  if (pulse.fields && pulse.fields['zindex']) {
    var item = pulse.source && pulse.source[0];
    if (item) item.mark.zdirty = true;
  }
};

var AxisRole$1 = 'axis';
var LegendRole$1 = 'legend';
var RowHeader$1 = 'row-header';
var RowFooter$1 = 'row-footer';
var RowTitle  = 'row-title';
var ColHeader$1 = 'column-header';
var ColFooter$1 = 'column-footer';
var ColTitle  = 'column-title';

function extractGroups(group) {
  var groups = group.items,
      n = groups.length,
      i = 0, mark, items;

  var views = {
    marks:      [],
    rowheaders: [],
    rowfooters: [],
    colheaders: [],
    colfooters: [],
    rowtitle: null,
    coltitle: null
  };

  // layout axes, gather legends, collect bounds
  for (; i<n; ++i) {
    mark = groups[i];
    items = mark.items;
    if (mark.marktype === 'group') {
      switch (mark.role) {
        case AxisRole$1:
        case LegendRole$1:
          break;
        case RowHeader$1: addAll(items, views.rowheaders); break;
        case RowFooter$1: addAll(items, views.rowfooters); break;
        case ColHeader$1: addAll(items, views.colheaders); break;
        case ColFooter$1: addAll(items, views.colfooters); break;
        case RowTitle:  views.rowtitle = items[0]; break;
        case ColTitle:  views.coltitle = items[0]; break;
        default:        addAll(items, views.marks);
      }
    }
  }

  return views;
}

function addAll(items, array$$1) {
  for (var i=0, n=items.length; i<n; ++i) {
    array$$1.push(items[i]);
  }
}

function bboxFlush(item) {
  return {x1: 0, y1: 0, x2: item.width || 0, y2: item.height || 0};
}

function bboxFull(item) {
  var b = item.bounds.clone();
  return b.empty()
    ? b.set(0, 0, 0, 0)
    : b.translate(-(item.x||0), -(item.y||0));
}

function boundFlush(item, field$$1) {
  return field$$1 === 'x1' ? (item.x || 0)
    : field$$1 === 'y1' ? (item.y || 0)
    : field$$1 === 'x2' ? (item.x || 0) + (item.width || 0)
    : field$$1 === 'y2' ? (item.y || 0) + (item.height || 0)
    : undefined;
}

function boundFull(item, field$$1) {
  return item.bounds[field$$1];
}

function get(opt, key$$1, d) {
  var v = isObject(opt) ? opt[key$$1] : opt;
  return v != null ? v : (d !== undefined ? d : 0);
}

function offsetValue(v) {
  return v < 0 ? Math.ceil(-v) : 0;
}

function gridLayout(view, group, opt) {
  var views = extractGroups(group, opt),
      groups = views.marks,
      flush = opt.bounds === 'flush',
      bbox = flush ? bboxFlush : bboxFull,
      bounds = new Bounds(0, 0, 0, 0),
      alignCol = get(opt.align, 'column'),
      alignRow = get(opt.align, 'row'),
      padCol = get(opt.padding, 'column'),
      padRow = get(opt.padding, 'row'),
      off = opt.offset,
      ncols = group.columns || opt.columns || groups.length,
      nrows = ncols < 0 ? 1 : Math.ceil(groups.length / ncols),
      cells = nrows * ncols,
      xOffset = [], xExtent = [], xInit = 0,
      yOffset = [], yExtent = [], yInit = 0,
      n = groups.length,
      m, i, c, r, b, g, px, py, x, y, band, extent$$1, offset;

  for (i=0; i<ncols; ++i) {
    xExtent[i] = 0;
  }
  for (i=0; i<nrows; ++i) {
    yExtent[i] = 0;
  }

  // determine offsets for each group
  for (i=0; i<n; ++i) {
    b = bbox(groups[i]);
    c = i % ncols;
    r = ~~(i / ncols);
    px = c ? Math.ceil(bbox(groups[i-1]).x2): 0;
    py = r ? Math.ceil(bbox(groups[i-ncols]).y2): 0;
    xExtent[c] = Math.max(xExtent[c], px);
    yExtent[r] = Math.max(yExtent[r], py);
    xOffset.push(padCol + offsetValue(b.x1));
    yOffset.push(padRow + offsetValue(b.y1));
    view.dirty(groups[i]);
  }

  // set initial alignment offsets
  for (i=0; i<n; ++i) {
    if (i % ncols === 0) xOffset[i] = xInit;
    if (i < ncols) yOffset[i] = yInit;
  }

  // enforce column alignment constraints
  if (alignCol === 'each') {
    for (c=1; c<ncols; ++c) {
      for (offset=0, i=c; i<n; i += ncols) {
        if (offset < xOffset[i]) offset = xOffset[i];
      }
      for (i=c; i<n; i += ncols) {
        xOffset[i] = offset + xExtent[c];
      }
    }
  } else if (alignCol === 'all') {
    for (extent$$1=0, c=1; c<ncols; ++c) {
      if (extent$$1 < xExtent[c]) extent$$1 = xExtent[c];
    }
    for (offset=0, i=0; i<n; ++i) {
      if (i % ncols && offset < xOffset[i]) offset = xOffset[i];
    }
    for (i=0; i<n; ++i) {
      if (i % ncols) xOffset[i] = offset + extent$$1;
    }
  } else {
    for (c=1; c<ncols; ++c) {
      for (i=c; i<n; i += ncols) {
        xOffset[i] += xExtent[c];
      }
    }
  }

  // enforce row alignment constraints
  if (alignRow === 'each') {
    for (r=1; r<nrows; ++r) {
      for (offset=0, i=r*ncols, m=i+ncols; i<m; ++i) {
        if (offset < yOffset[i]) offset = yOffset[i];
      }
      for (i=r*ncols; i<m; ++i) {
        yOffset[i] = offset + yExtent[r];
      }
    }
  } else if (alignRow === 'all') {
    for (extent$$1=0, r=1; r<nrows; ++r) {
      if (extent$$1 < yExtent[r]) extent$$1 = yExtent[r];
    }
    for (offset=0, i=ncols; i<n; ++i) {
      if (offset < yOffset[i]) offset = yOffset[i];
    }
    for (i=ncols; i<n; ++i) {
      yOffset[i] = offset + extent$$1;
    }
  } else {
    for (r=1; r<nrows; ++r) {
      for (i=r*ncols, m=i+ncols; i<m; ++i) {
        yOffset[i] += yExtent[r];
      }
    }
  }

  // perform horizontal grid layout
  for (x=0, i=0; i<n; ++i) {
    g = groups[i];
    px = g.x || 0;
    g.x = (x = xOffset[i] + (i % ncols ? x : 0));
    g.bounds.translate(x - px, 0);
  }

  // perform vertical grid layout
  for (c=0; c<ncols; ++c) {
    for (y=0, i=c; i<n; i += ncols) {
      g = groups[i];
      py = g.y || 0;
      g.y = (y += yOffset[i]);
      g.bounds.translate(0, y - py);
    }
  }

  // update mark bounds, mark dirty
  for (i=0; i<n; ++i) groups[i].mark.bounds.clear();
  for (i=0; i<n; ++i) {
    g = groups[i];
    view.dirty(g);
    bounds.union(g.mark.bounds.union(g.bounds));
  }

  // -- layout grid headers and footers --

  // aggregation functions for grid margin determination
  function min$$1(a, b) { return Math.floor(Math.min(a, b)); }
  function max$$1(a, b) { return Math.ceil(Math.max(a, b)); }

  // bounding box calculation methods
  bbox = flush ? boundFlush : boundFull;

  // perform row header layout
  band = get(opt.headerBand, 'row', null);
  x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get(off, 'rowHeader'),    min$$1, 0, bbox, 'x1', 0, ncols, 1, band);

  // perform column header layout
  band = get(opt.headerBand, 'column', null);
  y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get(off, 'columnHeader'), min$$1, 1, bbox, 'y1', 0, 1, ncols, band);

  // perform row footer layout
  band = get(opt.footerBand, 'row', null);
  layoutHeaders(    view, views.rowfooters, groups, ncols, nrows,  get(off, 'rowFooter'),    max$$1, 0, bbox, 'x2', ncols-1, ncols, 1, band);

  // perform column footer layout
  band = get(opt.footerBand, 'column', null);
  layoutHeaders(    view, views.colfooters, groups, ncols, ncols,  get(off, 'columnFooter'), max$$1, 1, bbox, 'y2', cells-ncols, 1, ncols, band);

  // perform row title layout
  if (views.rowtitle) {
    offset = x - get(off, 'rowTitle');
    band = get(opt.titleBand, 'row', 0.5);
    layoutTitle$1(view, views.rowtitle, offset, 0, bounds, band);
  }

  // perform column title layout
  if (views.coltitle) {
    offset = y - get(off, 'columnTitle');
    band = get(opt.titleBand, 'column', 0.5);
    layoutTitle$1(view, views.coltitle, offset, 1, bounds, band);
  }
}

function layoutHeaders(view, headers, groups, ncols, limit, offset, agg, isX, bound, bf, start, stride, back, band) {
  var n = groups.length,
      init = 0,
      edge = 0,
      i, j, k, m, b, h, g, x, y;

  // if no groups, early exit and return 0
  if (!n) return init;

  // compute margin
  for (i=start; i<n; i+=stride) {
    if (groups[i]) init = agg(init, bound(groups[i], bf));
  }

  // if no headers, return margin calculation
  if (!headers.length) return init;

  // check if number of headers exceeds number of rows or columns
  if (headers.length > limit) {
    view.warn('Grid headers exceed limit: ' + limit);
    headers = headers.slice(0, limit);
  }

  // apply offset
  init += offset;

  // clear mark bounds for all headers
  for (j=0, m=headers.length; j<m; ++j) {
    view.dirty(headers[j]);
    headers[j].mark.bounds.clear();
  }

  // layout each header
  for (i=start, j=0, m=headers.length; j<m; ++j, i+=stride) {
    h = headers[j];
    b = h.mark.bounds;

    // search for nearest group to align to
    // necessary if table has empty cells
    for (k=i; k >= 0 && (g = groups[k]) == null; k-=back);

    // assign coordinates and update bounds
    if (isX) {
      x = band == null ? g.x : Math.round(g.bounds.x1 + band * g.bounds.width());
      y = init;
    } else {
      x = init;
      y = band == null ? g.y : Math.round(g.bounds.y1 + band * g.bounds.height());
    }
    b.union(h.bounds.translate(x - (h.x || 0), y - (h.y || 0)));
    h.x = x;
    h.y = y;
    view.dirty(h);

    // update current edge of layout bounds
    edge = agg(edge, b[bf]);
  }

  return edge;
}

function layoutTitle$1(view, g, offset, isX, bounds, band) {
  if (!g) return;
  view.dirty(g);

  // compute title coordinates
  var x = offset, y = offset;
  isX
    ? (x = Math.round(bounds.x1 + band * bounds.width()))
    : (y = Math.round(bounds.y1 + band * bounds.height()));

  // assign coordinates and update bounds
  g.bounds.translate(x - (g.x || 0), y - (g.y || 0));
  g.mark.bounds.clear().union(g.bounds);
  g.x = x;
  g.y = y;

  // queue title for redraw
  view.dirty(g);
}

var Fit = 'fit';
var Pad = 'pad';
var None$2 = 'none';
var Padding = 'padding';

var AxisRole = 'axis';
var TitleRole = 'title';
var FrameRole = 'frame';
var LegendRole = 'legend';
var ScopeRole = 'scope';
var RowHeader = 'row-header';
var RowFooter = 'row-footer';
var ColHeader = 'column-header';
var ColFooter = 'column-footer';

var AxisOffset = 0.5;
var tempBounds$2 = new Bounds();

/**
 * Layout view elements such as axes and legends.
 * Also performs size adjustments.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - Scenegraph mark of groups to layout.
 */
function ViewLayout(params) {
  Transform.call(this, null, params);
}

var prototype$51 = inherits(ViewLayout, Transform);

prototype$51.transform = function(_$$1, pulse) {
  // TODO incremental update, output?
  var view = pulse.dataflow;
  _$$1.mark.items.forEach(function(group) {
    if (_$$1.layout) gridLayout(view, group, _$$1.layout);
    layoutGroup(view, group, _$$1);
  });
  return pulse;
};

function layoutGroup(view, group, _$$1) {
  var items = group.items,
      width = Math.max(0, group.width || 0),
      height = Math.max(0, group.height || 0),
      viewBounds = new Bounds().set(0, 0, width, height),
      axisBounds = viewBounds.clone(),
      xBounds = viewBounds.clone(),
      yBounds = viewBounds.clone(),
      legends = [], title,
      mark, flow, b, i, n;

  // layout axes, gather legends, collect bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole:
        axisBounds.union(b = layoutAxis(view, mark, width, height));
        (isYAxis(mark) ? xBounds : yBounds).union(b);
        break;
      case TitleRole:
        title = mark; break;
      case LegendRole:
        legends.push(mark); break;
      case FrameRole:
      case ScopeRole:
      case RowHeader:
      case RowFooter:
      case ColHeader:
      case ColFooter:
        xBounds.union(mark.bounds);
        yBounds.union(mark.bounds);
        break;
      default:
        viewBounds.union(mark.bounds);
    }
  }

  // layout title, adjust bounds
  if (title) {
    axisBounds.union(b = layoutTitle(view, title, axisBounds));
    (isYAxis(title) ? xBounds : yBounds).union(b);
  }

  // layout legends, adjust viewBounds
  if (legends.length) {
    flow = {left: 0, right: 0, top: 0, bottom: 0, margin: _$$1.legendMargin || 8};

    for (i=0, n=legends.length; i<n; ++i) {
      b = layoutLegend(view, legends[i], flow, xBounds, yBounds, width, height);
      if (_$$1.autosize && _$$1.autosize.type === Fit) {
        // for autosize fit, incorporate the orthogonal dimension only
        // legends that overrun the chart area will then be clipped
        // otherwise the chart area gets reduced to nothing!
        var orient = legends[i].items[0].datum.orient;
        if (orient === Left || orient === Right) {
          viewBounds.add(b.x1, 0).add(b.x2, 0);
        } else if (orient === Top || orient === Bottom) {
          viewBounds.add(0, b.y1).add(0, b.y2);
        }
      } else {
        viewBounds.union(b);
      }
    }
  }

  // perform size adjustment
  viewBounds.union(xBounds).union(yBounds).union(axisBounds);
  layoutSize(view, group, viewBounds, _$$1);
}

function set(item, property, value) {
  if (item[property] === value) {
    return 0;
  } else {
    item[property] = value;
    return 1;
  }
}

function isYAxis(mark) {
  var orient = mark.items[0].datum.orient;
  return orient === Left || orient === Right;
}

function axisIndices(datum) {
  var index = +datum.grid;
  return [
    datum.ticks  ? index++ : -1, // ticks index
    datum.labels ? index++ : -1, // labels index
    index + (+datum.domain)      // title index
  ];
}

function layoutAxis(view, axis, width, height) {
  var item = axis.items[0],
      datum = item.datum,
      orient = datum.orient,
      indices = axisIndices(datum),
      range$$1 = item.range,
      offset = item.offset,
      position = item.position,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = datum.title && item.items[indices[2]].items[0],
      titlePadding = item.titlePadding,
      bounds = item.bounds,
      x = 0, y = 0, i, s;

  tempBounds$2.clear().union(bounds);
  bounds.clear();
  if ((i=indices[0]) > -1) bounds.union(item.items[i].bounds);
  if ((i=indices[1]) > -1) bounds.union(item.items[i].bounds);

  // position axis group and title
  switch (orient) {
    case Top:
      x = position || 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
      if (title) {
        if (title.auto) {
          s += titlePadding;
          title.y = -s;
          s += title.bounds.height();
        } else {
          bounds.union(title.bounds);
        }
      }
      bounds.add(0, -s).add(range$$1, 0);
      break;
    case Left:
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) {
        if (title.auto) {
          s += titlePadding;
          title.x = -s;
          s += title.bounds.width();
        } else {
          bounds.union(title.bounds);
        }
      }
      bounds.add(-s, 0).add(0, range$$1);
      break;
    case Right:
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) {
        if (title.auto) {
          s += titlePadding;
          title.x = s;
          s += title.bounds.width();
        } else {
          bounds.union(title.bounds);
        }
      }
      bounds.add(0, 0).add(s, range$$1);
      break;
    case Bottom:
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) if (title.auto) {
        s += titlePadding;
        title.y = s;
        s += title.bounds.height();
      } else {
        bounds.union(title.bounds);
      }
      bounds.add(0, 0).add(range$$1, s);
      break;
    default:
      x = item.x;
      y = item.y;
  }

  // update bounds
  boundStroke(bounds.translate(x, y), item);

  if (set(item, 'x', x + AxisOffset) | set(item, 'y', y + AxisOffset)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  return item.mark.bounds.clear().union(bounds);
}

function layoutTitle(view, title, axisBounds) {
  var item = title.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0, y = 0;

  tempBounds$2.clear().union(bounds);

  // position axis group and title
  switch (orient) {
    case Top:
      x = item.x;
      y = axisBounds.y1 - offset;
      break;
    case Left:
      x = axisBounds.x1 - offset;
      y = item.y;
      break;
    case Right:
      x = axisBounds.x2 + offset;
      y = item.y;
      break;
    case Bottom:
      x = item.x;
      y = axisBounds.y2 + offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }

  bounds.translate(x - item.x, y - item.y);
  if (set(item, 'x', x) | set(item, 'y', y)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  // update bounds
  return title.bounds.clear().union(bounds);
}

function layoutLegend(view, legend, flow, xBounds, yBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds,
      x = 0,
      y = 0,
      w, h, axisBounds;

  if (orient === Top || orient === Bottom) {
    axisBounds = yBounds,
    x = flow[orient];
  } else if (orient === Left || orient === Right) {
    axisBounds = xBounds;
    y = flow[orient];
  }

  tempBounds$2.clear().union(bounds);
  bounds.clear();

  // aggregate bounds to determine size
  // shave off 1 pixel because it looks better...
  item.items.forEach(function(_$$1) { bounds.union(_$$1.bounds); });
  w = Math.round(bounds.width()) + 2 * item.padding - 1;
  h = Math.round(bounds.height()) + 2 * item.padding - 1;

  switch (orient) {
    case Left:
      x -= w + offset - Math.floor(axisBounds.x1);
      flow.left += h + flow.margin;
      break;
    case Right:
      x += offset + Math.ceil(axisBounds.x2);
      flow.right += h + flow.margin;
      break;
    case Top:
      y -= h + offset - Math.floor(axisBounds.y1);
      flow.top += w + flow.margin;
      break;
    case Bottom:
      y += offset + Math.ceil(axisBounds.y2);
      flow.bottom += w + flow.margin;
      break;
    case 'top-left':
      x += offset;
      y += offset;
      break;
    case 'top-right':
      x += width - w - offset;
      y += offset;
      break;
    case 'bottom-left':
      x += offset;
      y += height - h - offset;
      break;
    case 'bottom-right':
      x += width - w - offset;
      y += height - h - offset;
      break;
    default:
      x = item.x;
      y = item.y;
  }

  // update bounds
  boundStroke(bounds.set(x, y, x + w, y + h), item);

  // update legend layout
  if (set(item, 'x', x) | set(item, 'width', w) |
      set(item, 'y', y) | set(item, 'height', h)) {
    item.bounds = tempBounds$2;
    view.dirty(item);
    item.bounds = bounds;
    view.dirty(item);
  }

  return item.mark.bounds.clear().union(bounds);
}

function layoutSize(view, group, viewBounds, _$$1) {
  var auto = _$$1.autosize || {},
      type = auto.type,
      viewWidth = view._width,
      viewHeight = view._height,
      padding = view.padding();

  if (view._autosize < 1 || !type) return;

  var width  = Math.max(0, group.width || 0),
      left   = Math.max(0, Math.ceil(-viewBounds.x1)),
      right  = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      height = Math.max(0, group.height || 0),
      top    = Math.max(0, Math.ceil(-viewBounds.y1)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));

  if (auto.contains === Padding) {
    viewWidth -= padding.left + padding.right;
    viewHeight -= padding.top + padding.bottom;
  }

  if (type === None$2) {
    left = 0;
    top = 0;
    width = viewWidth;
    height = viewHeight;
  }

  else if (type === Fit) {
    width = Math.max(0, viewWidth - left - right);
    height = Math.max(0, viewHeight - top - bottom);
  }

  else if (type === Pad) {
    viewWidth = width + left + right;
    viewHeight = height + top + bottom;
  }

  view._resizeView(
    viewWidth, viewHeight,
    width, height,
    [left, top],
    auto.resize
  );
}



var vtx = Object.freeze({
	bound: Bound,
	identifier: Identifier,
	mark: Mark,
	overlap: Overlap,
	render: Render,
	viewlayout: ViewLayout
});

var Log = 'log';
var Pow = 'pow';
var Utc = 'utc';
var Sqrt = 'sqrt';
var Band = 'band';
var Time = 'time';
var Point = 'point';
var Linear = 'linear';
var Ordinal = 'ordinal';
var Quantile = 'quantile';
var Quantize = 'quantize';
var Threshold = 'threshold';
var BinLinear = 'bin-linear';
var BinOrdinal = 'bin-ordinal';
var Sequential = 'sequential';

var invertRange = function(scale) {
  return function(_$$1) {
    var lo = _$$1[0],
        hi = _$$1[1],
        t;

    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }

    return [
      scale.invert(lo),
      scale.invert(hi)
    ];
  }
};

var invertRangeExtent = function(scale) {
  return function(_$$1) {
    var range$$1 = scale.range(),
        lo = _$$1[0],
        hi = _$$1[1],
        min$$1 = -1, max$$1, t, i, n;

    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }

    for (i=0, n=range$$1.length; i<n; ++i) {
      if (range$$1[i] >= lo && range$$1[i] <= hi) {
        if (min$$1 < 0) min$$1 = i;
        max$$1 = i;
      }
    }

    if (min$$1 < 0) return undefined;

    lo = scale.invertExtent(range$$1[min$$1]);
    hi = scale.invertExtent(range$$1[max$$1]);

    return [
      lo[0] === undefined ? lo[1] : lo[0],
      hi[1] === undefined ? hi[0] : hi[1]
    ];
  }
};

var bandSpace = function(count, paddingInner, paddingOuter) {
  var space = count - paddingInner + paddingOuter * 2;
  return count ? (space > 0 ? space : 1) : 0;
};

function band() {
  var scale = $.scaleOrdinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range$$1 = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range$$1[1] < range$$1[0],
        start = range$$1[reverse - 0],
        stop = range$$1[1 - reverse],
        space = bandSpace(n, paddingInner, paddingOuter);

    step = (stop - start) / (space || 1);
    if (round) {
      step = Math.floor(step);
    }
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) {
      start = Math.round(start);
      bandwidth = Math.round(bandwidth);
    }
    var values = d3Array.range(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_$$1) {
    if (arguments.length) {
      domain(_$$1);
      return rescale();
    } else {
      return domain();
    }
  };

  scale.range = function(_$$1) {
    if (arguments.length) {
      range$$1 = [+_$$1[0], +_$$1[1]];
      return rescale();
    } else {
      return range$$1.slice();
    }
  };

  scale.rangeRound = function(_$$1) {
    range$$1 = [+_$$1[0], +_$$1[1]];
    round = true;
    return rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_$$1) {
    if (arguments.length) {
      round = !!_$$1;
      return rescale();
    } else {
      return round;
    }
  };

  scale.padding = function(_$$1) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _$$1));
      paddingInner = paddingOuter;
      return rescale();
    } else {
      return paddingInner;
    }
  };

  scale.paddingInner = function(_$$1) {
    if (arguments.length) {
      paddingInner = Math.max(0, Math.min(1, _$$1));
      return rescale();
    } else {
      return paddingInner;
    }
  };

  scale.paddingOuter = function(_$$1) {
    if (arguments.length) {
      paddingOuter = Math.max(0, Math.min(1, _$$1));
      return rescale();
    } else {
      return paddingOuter;
    }
  };

  scale.align = function(_$$1) {
    if (arguments.length) {
      align = Math.max(0, Math.min(1, _$$1));
      return rescale();
    } else {
      return align;
    }
  };

  scale.invertRange = function(_$$1) {
    // bail if range has null or undefined values
    if (_$$1[0] == null || _$$1[1] == null) return;

    var lo = +_$$1[0],
        hi = +_$$1[1],
        reverse = range$$1[1] < range$$1[0],
        values = reverse ? ordinalRange().reverse() : ordinalRange(),
        n = values.length - 1, a, b, t;

    // bail if either range endpoint is invalid
    if (lo !== lo || hi !== hi) return;

    // order range inputs, bail if outside of scale range
    if (hi < lo) {
      t = lo;
      lo = hi;
      hi = t;
    }
    if (hi < values[0] || lo > range$$1[1-reverse]) return;

    // binary search to index into scale range
    a = Math.max(0, d3Array.bisectRight(values, lo) - 1);
    b = lo===hi ? a : d3Array.bisectRight(values, hi) - 1;

    // increment index a if lo is within padding gap
    if (lo - values[a] > bandwidth + 1e-10) ++a;

    if (reverse) {
      // map + swap
      t = a;
      a = n - b;
      b = n - t;
    }
    return (a > b) ? undefined : domain().slice(a, b+1);
  };

  scale.invert = function(_$$1) {
    var value = scale.invertRange([_$$1, _$$1]);
    return value ? value[0] : value;
  };

  scale.copy = function() {
    return band()
        .domain(domain())
        .range(range$$1)
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };

  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;

  scale.copy = function() {
    return pointish(copy());
  };

  return scale;
}

function point$1() {
  return pointish(band().paddingInner(1));
}

var map = Array.prototype.map;
var slice = Array.prototype.slice;

function numbers$1(_$$1) {
  return map.call(_$$1, function(x) { return +x; });
}

function binLinear() {
  var linear = $.scaleLinear(),
      domain = [];

  function scale(x) {
    return linear(x);
  }

  function setDomain(_$$1) {
    domain = numbers$1(_$$1);
    linear.domain([domain[0], peek(domain)]);
  }

  scale.domain = function(_$$1) {
    return arguments.length ? (setDomain(_$$1), scale) : domain.slice();
  };

  scale.range = function(_$$1) {
    return arguments.length ? (linear.range(_$$1), scale) : linear.range();
  };

  scale.rangeRound = function(_$$1) {
    return arguments.length ? (linear.rangeRound(_$$1), scale) : linear.rangeRound();
  };

  scale.interpolate = function(_$$1) {
    return arguments.length ? (linear.interpolate(_$$1), scale) : linear.interpolate();
  };

  scale.invert = function(_$$1) {
    return linear.invert(_$$1);
  };

  scale.ticks = function(count) {
    var n = domain.length,
        stride = ~~(n / (count || n));

    return stride < 2
      ? scale.domain()
      : domain.filter(function(x, i) { return !(i % stride); });
  };

  scale.tickFormat = function() {
    return linear.tickFormat.apply(linear, arguments);
  };

  scale.copy = function() {
    return binLinear().domain(scale.domain()).range(scale.range());
  };

  return scale;
}

function binOrdinal() {
  var domain = [],
      range$$1 = [];

  function scale(x) {
    return x == null || x !== x
      ? undefined
      : range$$1[(d3Array.bisect(domain, x) - 1) % range$$1.length];
  }

  scale.domain = function(_$$1) {
    if (arguments.length) {
      domain = numbers$1(_$$1);
      return scale;
    } else {
      return domain.slice();
    }
  };

  scale.range = function(_$$1) {
    if (arguments.length) {
      range$$1 = slice.call(_$$1);
      return scale;
    } else {
      return range$$1.slice();
    }
  };

  scale.copy = function() {
    return binOrdinal().domain(scale.domain()).range(scale.range());
  };

  return scale;
}

function sequential(interpolator) {
  var linear = $.scaleLinear(),
      x0 = 0,
      dx = 1,
      clamp = false;

  function update() {
    var domain = linear.domain();
    x0 = domain[0];
    dx = peek(domain) - x0;
  }

  function scale(x) {
    var t = (x - x0) / dx;
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.clamp = function(_$$1) {
    if (arguments.length) {
      clamp = !!_$$1;
      return scale;
    } else {
      return clamp;
    }
  };

  scale.domain = function(_$$1) {
    return arguments.length ? (linear.domain(_$$1), update(), scale) : linear.domain();
  };

  scale.interpolator = function(_$$1) {
    if (arguments.length) {
      interpolator = _$$1;
      return scale;
    } else {
      return interpolator;
    }
  };

  scale.copy = function() {
    return sequential().domain(linear.domain()).clamp(clamp).interpolator(interpolator);
  };

  scale.ticks = function(count) {
    return linear.ticks(count);
  };

  scale.tickFormat = function(count, specifier) {
    return linear.tickFormat(count, specifier);
  };

  scale.nice = function(count) {
    return linear.nice(count), update(), scale;
  };

  return scale;
}

/**
 * Augment scales with their type and needed inverse methods.
 */
function create(type, constructor) {
  return function scale() {
    var s = constructor();

    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s)
        : s.invertExtent ? invertRangeExtent(s)
        : undefined;
    }

    s.type = type;
    return s;
  };
}

function scale$1(type, scale) {
  if (arguments.length > 1) {
    scales[type] = create(type, scale);
    return this;
  } else {
    return scales.hasOwnProperty(type) ? scales[type] : undefined;
  }
}

var scales = {
  // base scale types
  identity:      $.scaleIdentity,
  linear:        $.scaleLinear,
  log:           $.scaleLog,
  ordinal:       $.scaleOrdinal,
  pow:           $.scalePow,
  sqrt:          $.scaleSqrt,
  quantile:      $.scaleQuantile,
  quantize:      $.scaleQuantize,
  threshold:     $.scaleThreshold,
  time:          $.scaleTime,
  utc:           $.scaleUtc,

  // extended scale types
  band:          band,
  point:         point$1,
  sequential:    sequential,
  'bin-linear':  binLinear,
  'bin-ordinal': binOrdinal
};

for (var key$1 in scales) {
  scale$1(key$1, scales[key$1]);
}

function colors(specifier) {
  var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
  while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
  return colors;
}

var tableau10 = colors(
  '4c78a8f58518e4575672b7b254a24beeca3bb279a2ff9da69d755dbab0ac'
);

var tableau20 = colors(
  '4c78a89ecae9f58518ffbf7954a24b88d27ab79a20f2cf5b43989483bcb6e45756ff9d9879706ebab0acd67195fcbfd2b279a2d6a5c99e765fd8b5a5'
);

var blueOrange = new Array(3).concat(
  "67a9cff7f7f7f1a340",
  "0571b092c5defdb863e66101",
  "0571b092c5def7f7f7fdb863e66101",
  "2166ac67a9cfd1e5f0fee0b6f1a340b35806",
  "2166ac67a9cfd1e5f0f7f7f7fee0b6f1a340b35806",
  "2166ac4393c392c5ded1e5f0fee0b6fdb863e08214b35806",
  "2166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b35806",
  "0530612166ac4393c392c5ded1e5f0fee0b6fdb863e08214b358067f3b08",
  "0530612166ac4393c392c5ded1e5f0f7f7f7fee0b6fdb863e08214b358067f3b08"
).map(colors);

var discrete = {
  blueorange:  blueOrange
};

var schemes = {
  // d3 built-in categorical palettes
  category10:  $.schemeCategory10,
  category20:  $.schemeCategory20,
  category20b: $.schemeCategory20b,
  category20c: $.schemeCategory20c,

  // extended categorical palettes
  accent:      _.schemeAccent,
  dark2:       _.schemeDark2,
  paired:      _.schemePaired,
  pastel1:     _.schemePastel1,
  pastel2:     _.schemePastel2,
  set1:        _.schemeSet1,
  set2:        _.schemeSet2,
  set3:        _.schemeSet3,
  tableau10:   tableau10,
  tableau20:   tableau20,

  // d3 built-in interpolators
  viridis:     $.interpolateViridis,
  magma:       $.interpolateMagma,
  inferno:     $.interpolateInferno,
  plasma:      $.interpolatePlasma,

  // extended interpolators
  blueorange:  $$1.interpolateRgbBasis(peek(blueOrange))
};

function add$2(name, suffix) {
  schemes[name] = _['interpolate' + suffix];
  discrete[name] = _['scheme' + suffix];
}

// sequential single-hue
add$2('blues',    'Blues');
add$2('greens',   'Greens');
add$2('greys',    'Greys');
add$2('purples',  'Purples');
add$2('reds',     'Reds');
add$2('oranges',  'Oranges');

// diverging
add$2('brownbluegreen',    'BrBG');
add$2('purplegreen',       'PRGn');
add$2('pinkyellowgreen',   'PiYG');
add$2('purpleorange',      'PuOr');
add$2('redblue',           'RdBu');
add$2('redgrey',           'RdGy');
add$2('redyellowblue',     'RdYlBu');
add$2('redyellowgreen',    'RdYlGn');
add$2('spectral',          'Spectral');

// sequential multi-hue
add$2('bluegreen',         'BuGn');
add$2('bluepurple',        'BuPu');
add$2('greenblue',         'GnBu');
add$2('orangered',         'OrRd');
add$2('purplebluegreen',   'PuBuGn');
add$2('purpleblue',        'PuBu');
add$2('purplered',         'PuRd');
add$2('redpurple',         'RdPu');
add$2('yellowgreenblue',   'YlGnBu');
add$2('yellowgreen',       'YlGn');
add$2('yelloworangebrown', 'YlOrBr');
add$2('yelloworangered',   'YlOrRd');

var getScheme = function(name, scheme) {
  if (arguments.length > 1) {
    schemes[name] = scheme;
    return this;
  }

  var part = name.split('-');
  name = part[0];
  part = +part[1] + 1;

  return part && discrete.hasOwnProperty(name) ? discrete[name][part-1]
    : !part && schemes.hasOwnProperty(name) ? schemes[name]
    : undefined;
};

function interpolateRange(interpolator, range$$1) {
  var start = range$$1[0],
      span = peek(range$$1) - start;
  return function(i) { return interpolator(start + i * span); };
}

function scaleFraction(scale, min$$1, max$$1) {
  var delta = max$$1 - min$$1;
  return !delta ? constant(0)
    : scale.type === 'linear' || scale.type === 'sequential'
      ? function(_$$1) { return (_$$1 - min$$1) / delta; }
      : scale.copy().domain([min$$1, max$$1]).range([0, 1]).interpolate(lerp);
}

function lerp(a, b) {
  var span = b - a;
  return function(i) { return a + i * span; }
}

function interpolate$1(type, gamma) {
  var interp = $$1[method(type)];
  return (gamma != null && interp && interp.gamma)
    ? interp.gamma(gamma)
    : interp;
}

function method(type) {
  return 'interpolate' + type.toLowerCase()
    .split('-')
    .map(function(s) { return s[0].toUpperCase() + s.slice(1); })
    .join('');
}

var time = {
  millisecond: d3Time.timeMillisecond,
  second:      d3Time.timeSecond,
  minute:      d3Time.timeMinute,
  hour:        d3Time.timeHour,
  day:         d3Time.timeDay,
  week:        d3Time.timeWeek,
  month:       d3Time.timeMonth,
  year:        d3Time.timeYear
};

var utc = {
  millisecond: d3Time.utcMillisecond,
  second:      d3Time.utcSecond,
  minute:      d3Time.utcMinute,
  hour:        d3Time.utcHour,
  day:         d3Time.utcDay,
  week:        d3Time.utcWeek,
  month:       d3Time.utcMonth,
  year:        d3Time.utcYear
};

function timeInterval(name) {
  return time.hasOwnProperty(name) && time[name];
}

function utcInterval(name) {
  return utc.hasOwnProperty(name) && utc[name];
}

/**
 * Determine the tick count or interval function.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} count - The desired tick count or interval specifier.
 * @return {*} - The tick count or interval function.
 */
function tickCount(scale$$1, count) {
  var step;

  if (isObject(count)) {
    step = count.step;
    count = count.interval;
  }

  if (isString(count)) {
    count = scale$$1.type === 'time' ? timeInterval(count)
      : scale$$1.type === 'utc' ? utcInterval(count)
      : error$1('Only time and utc scales accept interval strings.');
    if (step) count = count.every(step);
  }

  return count;
}

/**
 * Filter a set of candidate tick values, ensuring that only tick values
 * that lie within the scale range are included.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {Array<*>} ticks - The candidate tick values.
 * @param {*} count - The tick count or interval function.
 * @return {Array<*>} - The filtered tick values.
 */
function validTicks(scale$$1, ticks, count) {
  var range$$1 = scale$$1.range(),
      lo = range$$1[0],
      hi = peek(range$$1);
  if (lo > hi) {
    range$$1 = hi;
    hi = lo;
    lo = range$$1;
  }

  ticks = ticks.filter(function(v) {
    v = scale$$1(v);
    return !(v < lo || v > hi)
  });

  if (count > 0 && ticks.length > 1) {
    var endpoints = [ticks[0], peek(ticks)];
    while (ticks.length > count && ticks.length >= 3) {
      ticks = ticks.filter(function(_$$1, i) { return !(i % 2); });
    }
    if (ticks.length < 3) {
      ticks = endpoints;
    }
  }

  return ticks;
}

/**
 * Generate tick values for the given scale and approximate tick count or
 * interval value. If the scale has a 'ticks' method, it will be used to
 * generate the ticks, with the count argument passed as a parameter. If the
 * scale lacks a 'ticks' method, the full scale domain will be returned.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} [count] - The approximate number of desired ticks.
 * @return {Array<*>} - The generated tick values.
 */
function tickValues(scale$$1, count) {
  return scale$$1.ticks ? scale$$1.ticks(count) : scale$$1.domain();
}

/**
 * Generate a label format function for a scale. If the scale has a
 * 'tickFormat' method, it will be used to generate the formatter, with the
 * count and specifier arguments passed as parameters. If the scale lacks a
 * 'tickFormat' method, the returned formatter performs simple string coercion.
 * If the input scale is a logarithmic scale and the format specifier does not
 * indicate a desired decimal precision, a special variable precision formatter
 * that automatically trims trailing zeroes will be generated.
 * @param {Scale} scale - The scale for which to generate the label formatter.
 * @param {*} [count] - The approximate number of desired ticks.
 * @param {string} [specifier] - The format specifier. Must be a legal d3 4.0
 *   specifier string (see https://github.com/d3/d3-format#formatSpecifier).
 * @return {function(*):string} - The generated label formatter.
 */
function tickFormat(scale$$1, count, specifier) {
  var format$$1 = scale$$1.tickFormat
    ? scale$$1.tickFormat(count, specifier)
    : String;

  return (scale$$1.type === Log)
    ? filter$1(format$$1, variablePrecision(specifier))
    : format$$1;
}

function filter$1(sourceFormat, targetFormat) {
  return function(_$$1) {
    return sourceFormat(_$$1) ? targetFormat(_$$1) : '';
  };
}

function variablePrecision(specifier) {
  var s = d3Format.formatSpecifier(specifier || ',');

  if (s.precision == null) {
    s.precision = 12;
    switch (s.type) {
      case '%': s.precision -= 2; break;
      case 'e': s.precision -= 1; break;
    }
    return trimZeroes(
      d3Format.format(s),          // number format
      d3Format.format('.1f')(1)[1] // decimal point character
    );
  } else {
    return d3Format.format(s);
  }
}

function trimZeroes(format$$1, decimalChar) {
  return function(x) {
    var str = format$$1(x),
        dec = str.indexOf(decimalChar),
        idx, end;

    if (dec < 0) return str;

    idx = rightmostDigit(str, dec);
    end = idx < str.length ? str.slice(idx) : '';
    while (--idx > dec) if (str[idx] !== '0') { ++idx; break; }

    return str.slice(0, idx) + end;
  };
}

function rightmostDigit(str, dec) {
  var i = str.lastIndexOf('e'), c;
  if (i > 0) return i;
  for (i=str.length; --i > dec;) {
    c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return i + 1; // is digit
  }
}

/**
 * Generates axis ticks for visualizing a spatial scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate ticks for.
 * @param {*} [params.count=10] - The approximate number of ticks, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function AxisTicks(params) {
  Transform.call(this, null, params);
}

var prototype$52 = inherits(AxisTicks, Transform);

prototype$52.transform = function(_$$1, pulse) {
  if (this.value && !_$$1.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      ticks = this.value,
      scale = _$$1.scale,
      count = _$$1.tickCount ? _$$1.tickCount : (_$$1.values ? _$$1.values.length : tickCount(scale, _$$1.count)),
      format$$1 = _$$1.format || tickFormat(scale, count, _$$1.formatSpecifier),
      values = _$$1.values ? validTicks(scale, _$$1.values, count) : tickValues(scale, count);

  if (ticks) out.rem = ticks;

  ticks = values.map(function(value, i) {
    return ingest({
      index: i / (values.length - 1),
      value: value,
      label: format$$1(value)
    });
  });

  if (_$$1.extra) {
    // add an extra tick pegged to the initial domain value
    // this is used to generate axes with 'binned' domains
    ticks.push(ingest({
      index: -1,
      extra: {value: ticks[0].value},
      label: ''
    }));
  }

  out.source = ticks;
  out.add = ticks;
  this.value = ticks;

  return out;
};

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} [params.item] - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
function DataJoin(params) {
  Transform.call(this, null, params);
}

var prototype$53 = inherits(DataJoin, Transform);

function defaultItemCreate() {
  return ingest({});
}

function isExit(t) {
  return t.exit;
}

prototype$53.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _$$1.item || defaultItemCreate,
      key$$1 = _$$1.key || tupleid,
      map = this.value;

  // prevent transient (e.g., hover) requests from
  // cascading across marks derived from marks
  if (isArray(out.encode)) {
    out.encode = null;
  }

  if (!map) {
    pulse = pulse.addAll();
    this.value = map = fastmap().test(isExit);
    map.lookup = function(t) { return map.get(key$$1(t)); };
  }

  if (_$$1.modified('key') || pulse.modified(key$$1)) {
    error$1('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key$$1(t),
        x = map.get(k);

    if (x) {
      if (x.exit) {
        map.empty--;
        out.add.push(x);
      } else {
        out.mod.push(x);
      }
    } else {
      map.set(k, (x = item(t)));
      out.add.push(x);
    }

    x.datum = t;
    x.exit = false;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key$$1(t),
        x = map.get(k);

    if (x) {
      x.datum = t;
      out.mod.push(x);
    }
  });

  pulse.visit(pulse.REM, function(t) {
    var k = key$$1(t),
        x = map.get(k);

    if (t === x.datum && !x.exit) {
      out.rem.push(x);
      x.exit = true;
      ++map.empty;
    }
  });

  if (pulse.changed(pulse.ADD_MOD)) out.modifies('datum');

  if (_$$1.clean && map.empty > df.cleanThreshold) df.runAfter(map.clean);

  return out;
};

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 * @param {object} param.encoders - The encoding functions
 * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
 * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
 * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
 */
function Encode(params) {
  Transform.call(this, null, params);
}

var prototype$54 = inherits(Encode, Transform);

prototype$54.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ADD_REM),
      encoders = _$$1.encoders,
      encode = pulse.encode;

  // if an array, the encode directive includes additional sets
  // that must be defined in order for the primary set to be invoked
  // e.g., only run the update set if the hover set is defined
  if (isArray(encode)) {
    if (out.changed() || encode.every(function(e) { return encoders[e]; })) {
      encode = encode[0];
    } else {
      return pulse.StopPropagation;
    }
  }

  // marshall encoder functions
  var reenter = encode === 'enter',
      update = encoders.update || falsy,
      enter = encoders.enter || falsy,
      exit = encoders.exit || falsy,
      set = (encode && !reenter ? encoders[encode] : update) || falsy;

  if (pulse.changed(pulse.ADD)) {
    pulse.visit(pulse.ADD, function(t) {
      enter(t, _$$1);
      update(t, _$$1);
      if (set !== falsy && set !== update) set(t, _$$1);
    });
    out.modifies(enter.output);
    out.modifies(update.output);
    if (set !== falsy && set !== update) out.modifies(set.output);
  }

  if (pulse.changed(pulse.REM) && exit !== falsy) {
    pulse.visit(pulse.REM, function(t) { exit(t, _$$1); });
    out.modifies(exit.output);
  }

  if (reenter || set !== falsy) {
    var flag = pulse.MOD | (_$$1.modified() ? pulse.REFLOW : 0);
    if (reenter) {
      pulse.visit(flag, function(t) {
        var mod = enter(t, _$$1);
        if (set(t, _$$1) || mod) out.mod.push(t);
      });
      if (out.mod.length) out.modifies(enter.output);
    } else {
      pulse.visit(flag, function(t) {
        if (set(t, _$$1)) out.mod.push(t);
      });
    }
    if (out.mod.length) out.modifies(set.output);
  }

  return out.changed() ? out : pulse.StopPropagation;
};

var discrete$1 = {};
discrete$1[Quantile] = quantile$1;
discrete$1[Quantize] = quantize;
discrete$1[Threshold] = threshold;
discrete$1[BinLinear] = bin$1;
discrete$1[BinOrdinal] = bin$1;

function labelValues(scale, count, gradient) {
  if (gradient) return scale.domain();
  var values = discrete$1[scale.type];
  return values ? values(scale) : tickValues(scale, count);
}

function quantize(scale) {
  var domain = scale.domain(),
      x0 = domain[0],
      x1 = peek(domain),
      n = scale.range().length,
      values = new Array(n),
      i = 0;

  values[0] = -Infinity;
  while (++i < n) values[i] = (i * x1 - (i - n) * x0) / n;
  values.max = +Infinity;

  return values;
}

function quantile$1(scale) {
  var values = [-Infinity].concat(scale.quantiles());
  values.max = +Infinity;

  return values;
}

function threshold(scale) {
  var values = [-Infinity].concat(scale.domain());
  values.max = +Infinity;

  return values;
}

function bin$1(scale) {
  var values = scale.domain();
  values.max = values.pop();

  return values;
}

function labelFormat(scale, format$$1) {
  return discrete$1[scale.type] ? formatRange(format$$1) : formatPoint(format$$1);
}

function formatRange(format$$1) {
  return function(value, index, array$$1) {
    var limit = array$$1[index + 1] || array$$1.max || +Infinity,
        lo = formatValue(value, format$$1),
        hi = formatValue(limit, format$$1);
    return lo && hi ? lo + '\u2013' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
  };
}

function formatValue(value, format$$1) {
  return isFinite(value) ? format$$1(value) : null;
}

function formatPoint(format$$1) {
  return function(value) {
    return format$$1(value);
  };
}

/**
 * Generates legend entries for visualizing a scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate items for.
 * @param {*} [params.count=10] - The approximate number of items, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function LegendEntries(params) {
  Transform.call(this, [], params);
}

var prototype$55 = inherits(LegendEntries, Transform);

prototype$55.transform = function(_$$1, pulse) {
  if (this.value != null && !_$$1.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      total = 0,
      items = this.value,
      grad  = _$$1.type === 'gradient',
      scale = _$$1.scale,
      count = _$$1.count == null ? 5 : tickCount(scale, _$$1.count),
      format$$1 = _$$1.format || tickFormat(scale, count, _$$1.formatSpecifier),
      values = _$$1.values || labelValues(scale, count, grad);

  format$$1 = labelFormat(scale, format$$1);
  if (items) out.rem = items;

  if (grad) {
    var domain = _$$1.values ? scale.domain() : values,
        fraction = scaleFraction(scale, domain[0], peek(domain));
  } else {
    var size = _$$1.size,
        offset;
    if (isFunction(size)) {
      // if first value maps to size zero, remove from list (vega#717)
      if (!_$$1.values && scale(values[0]) === 0) {
        values = values.slice(1);
      }
      // compute size offset for legend entries
      offset = values.reduce(function(max$$1, value) {
        return Math.max(max$$1, size(value, _$$1));
      }, 0);
    } else {
      size = constant(offset = size || 8);
    }
  }

  items = values.map(function(value, index) {
    var t = ingest({
      index: index,
      label: format$$1(value, index, values),
      value: value
    });

    if (grad) {
      t.perc = fraction(value);
    } else {
      t.offset = offset;
      t.size = size(value, _$$1);
      t.total = Math.round(total);
      total += t.size;
    }
    return t;
  });

  out.source = items;
  out.add = items;
  this.value = items;

  return out;
};

var Paths = fastmap({
  'line': line$3,
  'line-radial': lineR,
  'arc': arc$3,
  'arc-radial': arcR,
  'curve': curve,
  'curve-radial': curveR,
  'orthogonal-horizontal': orthoX,
  'orthogonal-vertical': orthoY,
  'orthogonal-radial': orthoR,
  'diagonal-horizontal': diagonalX,
  'diagonal-vertical': diagonalY,
  'diagonal-radial': diagonalR
});

function sourceX(t) { return t.source.x; }
function sourceY(t) { return t.source.y; }
function targetX(t) { return t.target.x; }
function targetY(t) { return t.target.y; }

 /**
  * Layout paths linking source and target elements.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
function LinkPath(params) {
  Transform.call(this, {}, params);
}

LinkPath.Definition = {
  "type": "LinkPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sourceX", "type": "field", "default": "source.x" },
    { "name": "sourceY", "type": "field", "default": "source.y" },
    { "name": "targetX", "type": "field", "default": "target.x" },
    { "name": "targetY", "type": "field", "default": "target.y" },
    { "name": "orient", "type": "enum", "default": "vertical",
      "values": ["horizontal", "vertical", "radial"] },
    { "name": "shape", "type": "enum", "default": "line",
      "values": ["line", "arc", "curve", "diagonal", "orthogonal"] },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

var prototype$56 = inherits(LinkPath, Transform);

prototype$56.transform = function(_$$1, pulse) {
  var sx = _$$1.sourceX || sourceX,
      sy = _$$1.sourceY || sourceY,
      tx = _$$1.targetX || targetX,
      ty = _$$1.targetY || targetY,
      as = _$$1.as || 'path',
      orient = _$$1.orient || 'vertical',
      shape = _$$1.shape || 'line',
      path$$1 = Paths.get(shape + '-' + orient) || Paths.get(shape);

  if (!path$$1) {
    error$1('LinkPath unsupported type: ' + _$$1.shape
      + (_$$1.orient ? '-' + _$$1.orient : ''));
  }

  pulse.visit(pulse.SOURCE, function(t) {
    t[as] = path$$1(sx(t), sy(t), tx(t), ty(t));
  });

  return pulse.reflow(_$$1.modified()).modifies(as);
};

// -- Link Path Generation Methods -----

function line$3(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}

function lineR(sa, sr, ta, tr) {
  return line$3(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function arc$3(sx, sy, tx, ty) {
  var dx = tx - sx,
      dy = ty - sy,
      rr = Math.sqrt(dx * dx + dy * dy) / 2,
      ra = 180 * Math.atan2(dy, dx) / Math.PI;
  return 'M' + sx + ',' + sy +
         'A' + rr + ',' + rr +
         ' ' + ra + ' 0 1' +
         ' ' + tx + ',' + ty;
}

function arcR(sa, sr, ta, tr) {
  return arc$3(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function curve(sx, sy, tx, ty) {
  var dx = tx - sx,
      dy = ty - sy,
      ix = 0.2 * (dx + dy),
      iy = 0.2 * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}

function curveR(sa, sr, ta, tr) {
  return curve(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function orthoX(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'V' + ty + 'H' + tx;
}

function orthoY(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'H' + tx + 'V' + ty;
}

function orthoR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      sf = Math.abs(ta - sa) > Math.PI ? ta <= sa : ta > sa;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'A' + sr + ',' + sr + ' 0 0,' + (sf?1:0) +
         ' ' + (sr*tc) + ',' + (sr*ts) +
         'L' + (tr*tc) + ',' + (tr*ts);
}

function diagonalX(sx, sy, tx, ty) {
  var m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
}

function diagonalY(sx, sy, tx, ty) {
  var m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy +
         'C' + sx + ',' + m +
         ' ' + tx + ',' + m +
         ' ' + tx + ',' + ty;
}

function diagonalR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      mr = (sr + tr) / 2;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'C' + (mr*sc) + ',' + (mr*ss) +
         ' ' + (mr*tc) + ',' + (mr*ts) +
         ' ' + (tr*tc) + ',' + (tr*ts);
}

/**
 * Pie and donut chart layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size pie segments.
 * @param {number} [params.startAngle=0] - The start angle (in radians) of the layout.
 * @param {number} [params.endAngle=2π] - The end angle (in radians) of the layout.
 * @param {boolean} [params.sort] - Boolean flag for sorting sectors by value.
 */
function Pie(params) {
  Transform.call(this, null, params);
}

Pie.Definition = {
  "type": "Pie",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "startAngle", "type": "number", "default": 0 },
    { "name": "endAngle", "type": "number", "default": 6.283185307179586 },
    { "name": "sort", "type": "boolean", "default": false },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["startAngle", "endAngle"] }
  ]
};

var prototype$57 = inherits(Pie, Transform);

prototype$57.transform = function(_$$1, pulse) {
  var as = _$$1.as || ['startAngle', 'endAngle'],
      startAngle = as[0],
      endAngle = as[1],
      field$$1 = _$$1.field || one,
      start = _$$1.startAngle || 0,
      stop = _$$1.endAngle != null ? _$$1.endAngle : 2 * Math.PI,
      data = pulse.source,
      values = data.map(field$$1),
      n = values.length,
      a = start,
      k = (stop - start) / d3Array.sum(values),
      index = d3Array.range(n),
      i, t, v;

  if (_$$1.sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<n; ++i) {
    v = values[index[i]];
    t = data[index[i]];
    t[startAngle] = a;
    t[endAngle] = (a += v * k);
  }

  this.value = values;
  return pulse.reflow(_$$1.modified()).modifies(as);
};

var DEFAULT_COUNT = 5;

var INCLUDE_ZERO = toSet([Linear, Pow, Sqrt]);

var INCLUDE_PAD = toSet([Linear, Log, Pow, Sqrt, Time, Utc]);

var SKIP$2 = toSet([
  'set', 'modified', 'clear', 'type', 'scheme', 'schemeExtent', 'schemeCount',
  'domain', 'domainMin', 'domainMid', 'domainMax', 'domainRaw', 'nice', 'zero',
  'range', 'rangeStep', 'round', 'reverse', 'interpolate', 'interpolateGamma'
]);

/**
 * Maintains a scale function mapping data values to visual channels.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Scale(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$58 = inherits(Scale, Transform);

prototype$58.transform = function(_$$1, pulse) {
  var df = pulse.dataflow,
      scale = this.value,
      prop;

  if (!scale || _$$1.modified('type')) {
    this.value = scale = scale$1((_$$1.type || Linear).toLowerCase())();
  }

  for (prop in _$$1) if (!SKIP$2[prop]) {
    // padding is a scale property for band/point but not others
    if (prop === 'padding' && INCLUDE_PAD[scale.type]) continue;
    // invoke scale property setter, raise warning if not found
    isFunction(scale[prop])
      ? scale[prop](_$$1[prop])
      : df.warn('Unsupported scale property: ' + prop);
  }

  configureRange(scale, _$$1, configureDomain(scale, _$$1, df));

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function configureDomain(scale, _$$1, df) {
  // check raw domain, if provided use that and exit early
  var raw = rawDomain(scale, _$$1.domainRaw);
  if (raw > -1) return raw;

  var domain = _$$1.domain,
      type = scale.type,
      zero$$1 = _$$1.zero || (_$$1.zero === undefined && INCLUDE_ZERO[type]),
      n, mid;

  if (!domain) return 0;

  // adjust continuous domain for minimum pixel padding
  if (INCLUDE_PAD[type] && _$$1.padding && domain[0] !== peek(domain)) {
    domain = padDomain(type, domain, _$$1.range, _$$1.padding, _$$1.exponent);
  }

  // adjust domain based on zero, min, max settings
  if (zero$$1 || _$$1.domainMin != null || _$$1.domainMax != null || _$$1.domainMid != null) {
    n = ((domain = domain.slice()).length - 1) || 1;
    if (zero$$1) {
      if (domain[0] > 0) domain[0] = 0;
      if (domain[n] < 0) domain[n] = 0;
    }
    if (_$$1.domainMin != null) domain[0] = _$$1.domainMin;
    if (_$$1.domainMax != null) domain[n] = _$$1.domainMax;

    if (_$$1.domainMid != null) {
      mid = _$$1.domainMid;
      if (mid < domain[0] || mid > domain[n]) {
        df.warn('Scale domainMid exceeds domain min or max.', mid);
      }
      domain.splice(n, 0, mid);
    }
  }

  // set the scale domain
  scale.domain(domain);

  // perform 'nice' adjustment as requested
  if (_$$1.nice && scale.nice) {
    scale.nice((_$$1.nice !== true && tickCount(scale, _$$1.nice)) || null);
  }

  // return the cardinality of the domain
  return domain.length;
}

function rawDomain(scale, raw) {
  if (raw) {
    scale.domain(raw);
    return raw.length;
  } else {
    return -1;
  }
}

function padDomain(type, domain, range$$1, pad$$1, exponent) {
  var span = Math.abs(peek(range$$1) - range$$1[0]),
      frac = span / (span - 2 * pad$$1),
      d = type === Log  ? zoomLog(domain, null, frac)
        : type === Sqrt ? zoomPow(domain, null, frac, 0.5)
        : type === Pow  ? zoomPow(domain, null, frac, exponent)
        : zoomLinear(domain, null, frac);

  domain = domain.slice();
  domain[0] = d[0];
  domain[domain.length-1] = d[1];
  return domain;
}

function configureRange(scale, _$$1, count) {
  var round = _$$1.round || false,
      range$$1 = _$$1.range;

  // if range step specified, calculate full range extent
  if (_$$1.rangeStep != null) {
    range$$1 = configureRangeStep(scale.type, _$$1, count);
  }

  // else if a range scheme is defined, use that
  else if (_$$1.scheme) {
    range$$1 = configureScheme(scale.type, _$$1, count);
    if (isFunction(range$$1)) return scale.interpolator(range$$1);
  }

  // given a range array for a sequential scale, convert to interpolator
  else if (range$$1 && scale.type === Sequential) {
    return scale.interpolator($$1.interpolateRgbBasis(flip(range$$1, _$$1.reverse)));
  }

  // configure rounding / interpolation
  if (range$$1 && _$$1.interpolate && scale.interpolate) {
    scale.interpolate(interpolate$1(_$$1.interpolate, _$$1.interpolateGamma));
  } else if (isFunction(scale.round)) {
    scale.round(round);
  } else if (isFunction(scale.rangeRound)) {
    scale.interpolate(round ? $$1.interpolateRound : $$1.interpolate);
  }

  if (range$$1) scale.range(flip(range$$1, _$$1.reverse));
}

function configureRangeStep(type, _$$1, count) {
  if (type !== Band && type !== Point) {
    error$1('Only band and point scales support rangeStep.');
  }

  // calculate full range based on requested step size and padding
  var outer = (_$$1.paddingOuter != null ? _$$1.paddingOuter : _$$1.padding) || 0,
      inner = type === Point ? 1
            : ((_$$1.paddingInner != null ? _$$1.paddingInner : _$$1.padding) || 0);
  return [0, _$$1.rangeStep * bandSpace(count, inner, outer)];
}

function configureScheme(type, _$$1, count) {
  var name = _$$1.scheme.toLowerCase(),
      scheme = getScheme(name),
      extent$$1 = _$$1.schemeExtent,
      discrete;

  if (!scheme) {
    error$1('Unrecognized scheme name: ' + _$$1.scheme);
  }

  // determine size for potential discrete range
  count = (type === Threshold) ? count + 1
    : (type === BinOrdinal) ? count - 1
    : (type === Quantile || type === Quantize) ? (+_$$1.schemeCount || DEFAULT_COUNT)
    : count;

  // adjust and/or quantize scheme as appropriate
  return type === Sequential ? adjustScheme(scheme, extent$$1, _$$1.reverse)
    : !extent$$1 && (discrete = getScheme(name + '-' + count)) ? discrete
    : isFunction(scheme) ? quantize$1(adjustScheme(scheme, extent$$1), count)
    : type === Ordinal ? scheme : scheme.slice(0, count);
}

function adjustScheme(scheme, extent$$1, reverse) {
  return (isFunction(scheme) && (extent$$1 || reverse))
    ? interpolateRange(scheme, flip(extent$$1 || [0, 1], reverse))
    : scheme;
}

function flip(array$$1, reverse) {
  return reverse ? array$$1.slice().reverse() : array$$1;
}

function quantize$1(interpolator, count) {
  var samples = new Array(count),
      n = (count - 1) || 1;
  for (var i = 0; i < count; ++i) samples[i] = interpolator(i / n);
  return samples;
}

/**
 * Sorts scenegraph items in the pulse source array.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - A comparator
 *   function for sorting tuples.
 */
function SortItems(params) {
  Transform.call(this, null, params);
}

var prototype$59 = inherits(SortItems, Transform);

prototype$59.transform = function(_$$1, pulse) {
  var mod = _$$1.modified('sort')
         || pulse.changed(pulse.ADD)
         || pulse.modified(_$$1.sort.fields)
         || pulse.modified('datum');

  if (mod) pulse.source.sort(_$$1.sort);

  this.modified(mod);
  return pulse;
};

var Center = 'center';
var Normalize = 'normalize';

/**
 * Stack layout for visualization elements.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to stack.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {function(object,object): number} [params.sort] - A comparator for stack sorting.
 * @param {string} [offset='zero'] - One of 'zero', 'center', 'normalize'.
 */
function Stack(params) {
  Transform.call(this, null, params);
}

Stack.Definition = {
  "type": "Stack",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "sort", "type": "compare" },
    { "name": "offset", "type": "enum", "default": "zero", "values": ["zero", "center", "normalize"] },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["y0", "y1"] }
  ]
};

var prototype$60 = inherits(Stack, Transform);

prototype$60.transform = function(_$$1, pulse) {
  var as = _$$1.as || ['y0', 'y1'],
      y0 = as[0],
      y1 = as[1],
      field$$1 = _$$1.field || one,
      stack = _$$1.offset === Center ? stackCenter
            : _$$1.offset === Normalize ? stackNormalize
            : stackZero,
      groups, i, n, max$$1;

  // partition, sum, and sort the stack groups
  groups = partition$2(pulse.source, _$$1.groupby, _$$1.sort, field$$1);

  // compute stack layouts per group
  for (i=0, n=groups.length, max$$1=groups.max; i<n; ++i) {
    stack(groups[i], max$$1, field$$1, y0, y1);
  }

  return pulse.reflow(_$$1.modified()).modifies(as);
};

function stackCenter(group, max$$1, field$$1, y0, y1) {
  var last = (max$$1 - group.sum) / 2,
      m = group.length,
      j = 0, t;

  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = (last += Math.abs(field$$1(t)));
  }
}

function stackNormalize(group, max$$1, field$$1, y0, y1) {
  var scale = 1 / group.sum,
      last = 0,
      m = group.length,
      j = 0, v = 0, t;

  for (; j<m; ++j) {
    t = group[j];
    t[y0] = last;
    t[y1] = last = scale * (v += Math.abs(field$$1(t)));
  }
}

function stackZero(group, max$$1, field$$1, y0, y1) {
  var lastPos = 0,
      lastNeg = 0,
      m = group.length,
      j = 0, v, t;

  for (; j<m; ++j) {
    t = group[j];
    v = field$$1(t);
    if (v < 0) {
      t[y0] = lastNeg;
      t[y1] = (lastNeg += v);
    } else {
      t[y0] = lastPos;
      t[y1] = (lastPos += v);
    }
  }
}

function partition$2(data, groupby, sort, field$$1) {
  var groups = [],
      get = function(f) { return f(t); },
      map, i, n, m, t, k, g, s, max$$1;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k];
      if (!g) {
        map[k] = (g = []);
        groups.push(g);
      }
      g.push(t);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max$$1=0, m=groups.length; k<m; ++k) {
    g = groups[k];
    for (i=0, s=0, n=g.length; i<n; ++i) {
      s += Math.abs(field$$1(g[i]));
    }
    g.sum = s;
    if (s > max$$1) max$$1 = s;
    if (sort) g.sort(sort);
  }
  groups.max = max$$1;

  return groups;
}



var encode = Object.freeze({
	axisticks: AxisTicks,
	datajoin: DataJoin,
	encode: Encode,
	legendentries: LegendEntries,
	linkpath: LinkPath,
	pie: Pie,
	scale: Scale,
	sortitems: SortItems,
	stack: Stack,
	validTicks: validTicks
});

var array$1 = Array.prototype;

var slice$1 = array$1.slice;

var ascending$1 = function(a, b) {
  return a - b;
};

var area$3 = function(ring) {
  var i = 0, n = ring.length, area$$1 = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area$$1 += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area$$1;
};

var constant$2 = function(x) {
  return function() {
    return x;
  };
};

var contains = function(ring, hole) {
  var i = -1, n = hole.length, c;
  while (++i < n) if (c = ringContains(ring, hole[i])) return c;
  return 0;
};

function ringContains(ring, point) {
  var x = point[0], y = point[1], contains = -1;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi = ring[i], xi = pi[0], yi = pi[1], pj = ring[j], xj = pj[0], yj = pj[1];
    if (segmentContains(pi, pj, point)) return 0;
    if (((yi > y) !== (yj > y)) && ((x < (xj - xi) * (y - yi) / (yj - yi) + xi))) contains = -contains;
  }
  return contains;
}

function segmentContains(a, b, c) {
  var i; return collinear(a, b, c) && within(a[i = +(a[0] === b[0])], c[i], b[i]);
}

function collinear(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1]);
}

function within(p, q, r) {
  return p <= q && q <= r || r <= q && q <= p;
}

var noop$1 = function() {};

var cases = [
  [],
  [[[1,1.5],[0.5,1]]],
  [[[1.5,1],[1,1.5]]],
  [[[1.5,1],[0.5,1]]],
  [[[1,0.5],[1.5,1]]],
  [[[1,0.5],[0.5,1]],[[1,1.5],[1.5,1]]],
  [[[1,0.5],[1,1.5]]],
  [[[1,0.5],[0.5,1]]],
  [[[0.5,1],[1,0.5]]],
  [[[1,1.5],[1,0.5]]],
  [[[0.5,1],[1,1.5]],[[1.5,1],[1,0.5]]],
  [[[1.5,1],[1,0.5]]],
  [[[0.5,1],[1.5,1]]],
  [[[1,1.5],[1.5,1]]],
  [[[0.5,1],[1,1.5]]],
  []
];

var contours = function() {
  var dx = 1,
      dy = 1,
      threshold = d3Array.thresholdSturges,
      smooth = smoothLinear;

  function contours(values) {
    var tz = threshold(values);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      var domain = d3Array.extent(values), start = domain[0], stop = domain[1];
      tz = d3Array.tickStep(start, stop, tz);
      tz = d3Array.range(Math.floor(start / tz) * tz, Math.floor(stop / tz) * tz, tz);
    } else {
      tz = tz.slice().sort(ascending$1);
    }

    // Accumulate, smooth contour rings, assign holes to exterior rings.
    // Based on https://github.com/mbostock/shapefile/blob/v0.6.2/shp/polygon.js
    var layers = tz.map(function(value) {
      var polygons = [],
          holes = [];

      isorings(values, value, function(ring) {
        smooth(ring, values, value);
        if (area$3(ring) > 0) polygons.push([ring]);
        else holes.push(ring);
      });

      holes.forEach(function(hole) {
        for (var i = 0, n = polygons.length, polygon; i < n; ++i) {
          if (contains((polygon = polygons[i])[0], hole) !== -1) {
            polygon.push(hole);
            return;
          }
        }
      });

      return polygons;
    });

    return layers.map(function(polygons, i) {
      return {
        type: "MultiPolygon",
        value: tz[i],
        coordinates: polygons
      };
    });
  }

  // Marching squares with isolines stitched into rings.
  // Based on https://github.com/topojson/topojson-client/blob/v3.0.0/src/stitch.js
  function isorings(values, value, callback) {
    var fragmentByStart = new Array,
        fragmentByEnd = new Array,
        x, y, t0, t1, t2, t3;

    // Special case for the first row (y = -1, t2 = t3 = 0).
    x = y = -1;
    t1 = values[0] >= value;
    cases[t1 << 1].forEach(stitch);
    while (++x < dx - 1) {
      t0 = t1, t1 = values[x + 1] >= value;
      cases[t0 | t1 << 1].forEach(stitch);
    }
    cases[t1 << 0].forEach(stitch);

    // General case for the intermediate rows.
    while (++y < dy - 1) {
      x = -1;
      t1 = values[y * dx + dx] >= value;
      t2 = values[y * dx] >= value;
      cases[t1 << 1 | t2 << 2].forEach(stitch);
      while (++x < dx - 1) {
        t0 = t1, t1 = values[y * dx + dx + x + 1] >= value;
        t3 = t2, t2 = values[y * dx + x + 1] >= value;
        cases[t0 | t1 << 1 | t2 << 2 | t3 << 3].forEach(stitch);
      }
      cases[t1 | t2 << 3].forEach(stitch);
    }

    // Special case for the last row (y = dy - 1, t0 = t1 = 0).
    x = -1;
    t2 = values[y * dx] >= value;
    cases[t2 << 2].forEach(stitch);
    while (++x < dx - 1) {
      t3 = t2, t2 = values[y * dx + x + 1] >= value;
      cases[t2 << 2 | t3 << 3].forEach(stitch);
    }
    cases[t2 << 3].forEach(stitch);

    function stitch(line$$1) {
      var start = [line$$1[0][0] + x, line$$1[0][1] + y],
          end = [line$$1[1][0] + x, line$$1[1][1] + y],
          startIndex = index(start),
          endIndex = index(end),
          f, g;
      if (f = fragmentByEnd[startIndex]) {
        if (g = fragmentByStart[endIndex]) {
          delete fragmentByEnd[f.end];
          delete fragmentByStart[g.start];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[f.start] = fragmentByEnd[g.end] = {start: f.start, end: g.end, ring: f.ring.concat(g.ring)};
          }
        } else {
          delete fragmentByEnd[f.end];
          f.ring.push(end);
          fragmentByEnd[f.end = endIndex] = f;
        }
      } else if (f = fragmentByStart[endIndex]) {
        if (g = fragmentByEnd[startIndex]) {
          delete fragmentByStart[f.start];
          delete fragmentByEnd[g.end];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[g.start] = fragmentByEnd[f.end] = {start: g.start, end: f.end, ring: g.ring.concat(f.ring)};
          }
        } else {
          delete fragmentByStart[f.start];
          f.ring.unshift(start);
          fragmentByStart[f.start = startIndex] = f;
        }
      } else {
        fragmentByStart[startIndex] = fragmentByEnd[endIndex] = {start: startIndex, end: endIndex, ring: [start, end]};
      }
    }
  }

  function index(point) {
    return point[0] * 2 + point[1] * (dx + 1) * 4;
  }

  function smoothLinear(ring, values, value) {
    ring.forEach(function(point) {
      var x = point[0],
          y = point[1],
          xt = x | 0,
          yt = y | 0,
          v0,
          v1 = values[yt * dx + xt];
      if (x > 0 && x < dx && xt === x) {
        v0 = values[yt * dx + xt - 1];
        point[0] = x + (value - v0) / (v1 - v0) - 0.5;
      }
      if (y > 0 && y < dy && yt === y) {
        v0 = values[(yt - 1) * dx + xt];
        point[1] = y + (value - v0) / (v1 - v0) - 0.5;
      }
    });
  }

  contours.size = function(_$$1) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.ceil(_$$1[0]), _1 = Math.ceil(_$$1[1]);
    if (!(_0 > 0) || !(_1 > 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, contours;
  };

  contours.thresholds = function(_$$1) {
    return arguments.length ? (threshold = typeof _$$1 === "function" ? _$$1 : Array.isArray(_$$1) ? constant$2(slice$1.call(_$$1)) : constant$2(_$$1), contours) : threshold;
  };

  contours.smooth = function(_$$1) {
    return arguments.length ? (smooth = _$$1 ? smoothLinear : noop$1, contours) : smooth === smoothLinear;
  };

  return contours;
};

// TODO Optimize edge cases.
// TODO Optimize index calculation.
// TODO Optimize arguments.
function blurX(source, target, r) {
  var n = source.width,
      m = source.height,
      w = (r << 1) + 1;
  for (var j = 0; j < m; ++j) {
    for (var i = 0, sr = 0; i < n + r; ++i) {
      if (i < n) {
        sr += source.data[i + j * n];
      }
      if (i >= r) {
        if (i >= w) {
          sr -= source.data[i - w + j * n];
        }
        target.data[i - r + j * n] = sr / Math.min(i + 1, n - 1 + w - i, w);
      }
    }
  }
}

// TODO Optimize edge cases.
// TODO Optimize index calculation.
// TODO Optimize arguments.
function blurY(source, target, r) {
  var n = source.width,
      m = source.height,
      w = (r << 1) + 1;
  for (var i = 0; i < n; ++i) {
    for (var j = 0, sr = 0; j < m + r; ++j) {
      if (j < m) {
        sr += source.data[i + j * n];
      }
      if (j >= r) {
        if (j >= w) {
          sr -= source.data[i + (j - w) * n];
        }
        target.data[i + (j - r) * n] = sr / Math.min(j + 1, m - 1 + w - j, w);
      }
    }
  }
}

function defaultX(d) {
  return d[0];
}

function defaultY(d) {
  return d[1];
}

var contourDensity = function() {
  var x = defaultX,
      y = defaultY,
      dx = 960,
      dy = 500,
      r = 20, // blur radius
      k = 2, // log2(grid cell size)
      o = r * 3, // grid offset, to pad for blur
      n = (dx + o * 2) >> k, // grid width
      m = (dy + o * 2) >> k, // grid height
      threshold = constant$2(20);

  function density(data) {
    var values0 = new Float32Array(n * m),
        values1 = new Float32Array(n * m);

    data.forEach(function(d, i, data) {
      var xi = (x(d, i, data) + o) >> k,
          yi = (y(d, i, data) + o) >> k;
      if (xi >= 0 && xi < n && yi >= 0 && yi < m) {
        ++values0[xi + yi * n];
      }
    });

    // TODO Optimize.
    blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
    blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);
    blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
    blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);
    blurX({width: n, height: m, data: values0}, {width: n, height: m, data: values1}, r >> k);
    blurY({width: n, height: m, data: values1}, {width: n, height: m, data: values0}, r >> k);

    var tz = threshold(values0);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      var stop = d3Array.max(values0);
      tz = d3Array.tickStep(0, stop, tz);
      tz = d3Array.range(0, Math.floor(stop / tz) * tz, tz);
      tz.shift();
    }

    return contours()
        .thresholds(tz)
        .size([n, m])
      (values0)
        .map(transform);
  }

  function transform(geometry) {
    geometry.value *= Math.pow(2, -2 * k); // Density in points per square pixel.
    geometry.coordinates.forEach(transformPolygon);
    return geometry;
  }

  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing);
  }

  function transformRing(coordinates) {
    coordinates.forEach(transformPoint);
  }

  // TODO Optimize.
  function transformPoint(coordinates) {
    coordinates[0] = coordinates[0] * Math.pow(2, k) - o;
    coordinates[1] = coordinates[1] * Math.pow(2, k) - o;
  }

  function resize() {
    o = r * 3;
    n = (dx + o * 2) >> k;
    m = (dy + o * 2) >> k;
    return density;
  }

  density.x = function(_$$1) {
    return arguments.length ? (x = typeof _$$1 === "function" ? _$$1 : constant$2(+_$$1), density) : x;
  };

  density.y = function(_$$1) {
    return arguments.length ? (y = typeof _$$1 === "function" ? _$$1 : constant$2(+_$$1), density) : y;
  };

  density.size = function(_$$1) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.ceil(_$$1[0]), _1 = Math.ceil(_$$1[1]);
    if (!(_0 >= 0) && !(_0 >= 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, resize();
  };

  density.cellSize = function(_$$1) {
    if (!arguments.length) return 1 << k;
    if (!((_$$1 = +_$$1) >= 1)) throw new Error("invalid cell size");
    return k = Math.floor(Math.log(_$$1) / Math.LN2), resize();
  };

  density.thresholds = function(_$$1) {
    return arguments.length ? (threshold = typeof _$$1 === "function" ? _$$1 : Array.isArray(_$$1) ? constant$2(slice$1.call(_$$1)) : constant$2(_$$1), density) : threshold;
  };

  density.bandwidth = function(_$$1) {
    if (!arguments.length) return Math.sqrt(r * (r + 1));
    if (!((_$$1 = +_$$1) >= 0)) throw new Error("invalid bandwidth");
    return r = Math.round((Math.sqrt(4 * _$$1 * _$$1 + 1) - 1) / 2), resize();
  };

  return density;
};

var CONTOUR_PARAMS = ['values', 'size'];
var DENSITY_PARAMS = ['x', 'y', 'size', 'cellSize', 'bandwidth'];

/**
 * Generate contours based on kernel-density estimation of point data.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<number>} params.size - The dimensions [width, height] over which to compute contours.
 *  If the values parameter is provided, this must be the dimensions of the input data.
 *  If density estimation is performed, this is the output view dimensions in pixels.
 * @param {Array<number>} [params.values] - An array of numeric values representing an
 *  width x height grid of values over which to compute contours. If unspecified, this
 *  transform will instead attempt to compute contours for the kernel density estimate
 *  using values drawn from data tuples in the input pulse.
 * @param {function(object): number} [params.x] - The pixel x-coordinate accessor for density estimation.
 * @param {function(object): number} [params.y] - The pixel y-coordinate accessor for density estimation.
 * @param {number} [params.cellSize] - Contour density calculation cell size.
 * @param {number} [params.bandwidth] - Kernel density estimation bandwidth.
 * @param {Array<number>} [params.thresholds] - Contour threshold array. If
 *   this parameter is set, the count and nice parameters will be ignored.
 * @param {number} [params.count] - The desired number of contours.
 * @param {boolean} [params.nice] - Boolean flag indicating if the contour
 *   threshold values should be automatically aligned to "nice"
 *   human-friendly values. Setting this flag may cause the number of
 *   thresholds to deviate from the specified count.
 */
function Contour(params) {
  Transform.call(this, null, params);
}

Contour.Definition = {
  "type": "Contour",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "values", "type": "number", "array": true },
    { "name": "x", "type": "field" },
    { "name": "y", "type": "field" },
    { "name": "cellSize", "type": "number" },
    { "name": "bandwidth", "type": "number" },
    { "name": "count", "type": "number" },
    { "name": "nice", "type": "number", "default": false },
    { "name": "thresholds", "type": "number", "array": true }
  ]
};

var prototype$61 = inherits(Contour, Transform);

prototype$61.transform = function(_$$1, pulse) {
  if (this.value && !pulse.changed() && !_$$1.modified())
    return pulse.StopPropagation;

  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      count = _$$1.count || 10,
      contour, params, values;

  if (_$$1.values) {
    contour = contours();
    params = CONTOUR_PARAMS;
    values = _$$1.values;
  } else {
    contour = contourDensity();
    params = DENSITY_PARAMS;
    values = pulse.materialize(pulse.SOURCE).source;
  }

  // set threshold parameter
  contour.thresholds(_$$1.thresholds || (_$$1.nice ? count : quantize$2(count)));

  // set all other parameters
  params.forEach(function(param) {
    if (_$$1[param] != null) contour[param](_$$1[param]);
  });

  if (this.value) out.rem = this.value;
  this.value = out.source = out.add = contour(values).map(ingest);

  return out;
};

function quantize$2(k) {
  return function(values) {
    var ex = d3Array.extent(values), x0 = ex[0], dx = ex[1] - x0,
        t = [], i = 1;
    for (; i<=k; ++i) t.push(x0 + dx * i / (k + 1));
    return t;
  };
}

var Feature = 'Feature';
var FeatureCollection = 'FeatureCollection';
var MultiPoint = 'MultiPoint';

/**
 * Consolidate an array of [longitude, latitude] points or GeoJSON features
 * into a combined GeoJSON object. This transform is particularly useful for
 * combining geo data for a Projection's fit argument. The resulting GeoJSON
 * data is available as this transform's value. Input pulses are unchanged.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} [params.fields] - A two-element array
 *   of field accessors for the longitude and latitude values.
 * @param {function(object): *} params.geojson - A field accessor for
 *   retrieving GeoJSON feature data.
 */
function GeoJSON(params) {
  Transform.call(this, null, params);
}

GeoJSON.Definition = {
  "type": "GeoJSON",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "length": 2 },
    { "name": "geojson", "type": "field" },
  ]
};

var prototype$62 = inherits(GeoJSON, Transform);

prototype$62.transform = function(_$$1, pulse) {
  var features = this._features,
      points = this._points,
      fields = _$$1.fields,
      lon = fields && fields[0],
      lat = fields && fields[1],
      geojson = _$$1.geojson,
      flag = pulse.ADD,
      mod;

  mod = _$$1.modified()
    || pulse.changed(pulse.REM)
    || pulse.modified(accessorFields(geojson))
    || (lon && (pulse.modified(accessorFields(lon))))
    || (lat && (pulse.modified(accessorFields(lat))));

  if (!this.value || mod) {
    flag = pulse.SOURCE;
    this._features = (features = []);
    this._points = (points = []);
  }

  if (geojson) {
    pulse.visit(flag, function(t) {
      features.push(geojson(t));
    });
  }

  if (lon && lat) {
    pulse.visit(flag, function(t) {
      var x = lon(t),
          y = lat(t);
      if (x != null && y != null && (x = +x) === x && (y = +y) === y) {
        points.push([x, y]);
      }
    });
    features = features.concat({
      type: Feature,
      geometry: {
        type: MultiPoint,
        coordinates: points
      }
    });
  }

  this.value = {
    type: FeatureCollection,
    features: features
  };
};

var defaultPath = d3Geo.geoPath();

var projectionProperties = [
  // standard properties in d3-geo
  'clipAngle',
  'clipExtent',
  'scale',
  'translate',
  'center',
  'rotate',
  'parallels',
  'precision',

  // extended properties in d3-geo-projections
  'coefficient',
  'distance',
  'fraction',
  'lobes',
  'parallel',
  'radius',
  'ratio',
  'spacing',
  'tilt'
];

/**
 * Augment projections with their type and a copy method.
 */
function create$1(type, constructor) {
  return function projection() {
    var p = constructor();

    p.type = type;

    p.path = d3Geo.geoPath().projection(p);

    p.copy = p.copy || function() {
      var c = projection();
      projectionProperties.forEach(function(prop) {
        if (p.hasOwnProperty(prop)) c[prop](p[prop]());
      });
      c.path.pointRadius(p.path.pointRadius());
      return c;
    };

    return p;
  };
}

function projection(type, proj) {
  if (arguments.length > 1) {
    projections[type] = create$1(type, proj);
    return this;
  } else {
    return projections.hasOwnProperty(type) ? projections[type] : null;
  }
}

function getProjectionPath(proj) {
  return (proj && proj.path) || defaultPath;
}

var projections = {
  // base d3-geo projection types
  albers:               d3Geo.geoAlbers,
  albersusa:            d3Geo.geoAlbersUsa,
  azimuthalequalarea:   d3Geo.geoAzimuthalEqualArea,
  azimuthalequidistant: d3Geo.geoAzimuthalEquidistant,
  conicconformal:       d3Geo.geoConicConformal,
  conicequalarea:       d3Geo.geoConicEqualArea,
  conicequidistant:     d3Geo.geoConicEquidistant,
  equirectangular:      d3Geo.geoEquirectangular,
  gnomonic:             d3Geo.geoGnomonic,
  mercator:             d3Geo.geoMercator,
  orthographic:         d3Geo.geoOrthographic,
  stereographic:        d3Geo.geoStereographic,
  transversemercator:   d3Geo.geoTransverseMercator
};

for (var key$2 in projections) {
  projection(key$2, projections[key$2]);
}

/**
 * Map GeoJSON data to an SVG path string.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
function GeoPath(params) {
  Transform.call(this, null, params);
}

GeoPath.Definition = {
  "type": "GeoPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field" },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

var prototype$63 = inherits(GeoPath, Transform);

prototype$63.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      path$$1 = this.value,
      field$$1 = _$$1.field || identity,
      as = _$$1.as || 'path',
      mod;

  function set(t) { t[as] = path$$1(field$$1(t)); }

  if (!path$$1 || _$$1.modified()) {
    // parameters updated, reset and reflow
    this.value = path$$1 = getProjectionPath(_$$1.projection).context(null);
    out.materialize().reflow().visit(out.SOURCE, set);
  } else {
    path$$1.context(null);
    mod = field$$1 === identity || pulse.modified(field$$1.fields);
    out.visit(mod ? out.ADD_MOD : out.ADD, set);
  }

  return out.modifies(as);
};

/**
 * Geo-code a longitude/latitude point to an x/y coordinate.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {Array<function(object): *>} params.fields - A two-element array of
 *   field accessors for the longitude and latitude values.
 * @param {Array<string>} [params.as] - A two-element array of field names
 *   under which to store the result. Defaults to ['x','y'].
 */
function GeoPoint(params) {
  Transform.call(this, null, params);
}

GeoPoint.Definition = {
  "type": "GeoPoint",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "fields", "type": "field", "array": true, "required": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["x", "y"] }
  ]
};

var prototype$64 = inherits(GeoPoint, Transform);

prototype$64.transform = function(_$$1, pulse) {
  var proj = _$$1.projection,
      lon = _$$1.fields[0],
      lat = _$$1.fields[1],
      as = _$$1.as || ['x', 'y'],
      x = as[0],
      y = as[1],
      mod;

  function set(t) {
    var xy = proj([lon(t), lat(t)]);
    if (xy) {
      t[x] = xy[0];
      t[y] = xy[1];
    } else {
      t[x] = undefined;
      t[y] = undefined;
    }
  }

  if (_$$1.modified()) {
    // parameters updated, reflow
    pulse = pulse.materialize().reflow(true).visit(pulse.SOURCE, set);
  } else {
    mod = pulse.modified(lon.fields) || pulse.modified(lat.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }

  return pulse.modifies(as);
};

/**
 * Annotate items with a geopath shape generator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='shape'] - The output field in which to store
 *   the generated path data (default 'shape').
 */
function GeoShape(params) {
  Transform.call(this, null, params);
}

GeoShape.Definition = {
  "type": "GeoShape",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection" },
    { "name": "field", "type": "field", "default": "datum" },
    { "name": "as", "type": "string", "default": "shape" }
  ]
};

var prototype$65 = inherits(GeoShape, Transform);

prototype$65.transform = function(_$$1, pulse) {
  var out = pulse.fork(pulse.ALL),
      shape = this.value,
      datum = _$$1.field || field('datum'),
      as = _$$1.as || 'shape',
      flag = out.ADD_MOD;

  if (!shape || _$$1.modified()) {
    // parameters updated, reset and reflow
    this.value = shape = shapeGenerator(
      getProjectionPath(_$$1.projection), datum);
    out.materialize().reflow();
    flag = out.SOURCE;
  }

  out.visit(flag, function(t) { t[as] = shape; });

  return out.modifies(as);
};

function shapeGenerator(path$$1, field$$1) {
  var shape = function(_$$1) {
    return path$$1(field$$1(_$$1));
  };
  shape.context = function(_$$1) {
    path$$1.context(_$$1);
    return shape;
  };

  return shape;
}

/**
 * GeoJSON feature generator for creating graticules.
 * @constructor
 */
function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = d3Geo.geoGraticule();
}

Graticule.Definition = {
  "type": "Graticule",
  "metadata": {"source": true, "generates": true, "changes": true},
  "params": [
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMajor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMinor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "step", "type": "number", "array": true, "length": 2 },
    { "name": "stepMajor", "type": "number", "array": true, "length": 2, "default": [90, 360] },
    { "name": "stepMinor", "type": "number", "array": true, "length": 2, "default": [10, 10] },
    { "name": "precision", "type": "number", "default": 2.5 }
  ]
};

var prototype$66 = inherits(Graticule, Transform);

prototype$66.transform = function(_$$1, pulse) {
  var out = pulse.fork(),
      src = this.value,
      gen = this.generator, t;

  if (!src.length || _$$1.modified()) {
    for (var prop in _$$1) {
      if (isFunction(gen[prop])) {
        gen[prop](_$$1[prop]);
      }
    }
  }

  t = gen();
  if (src.length) {
    out.mod.push(replace(src[0], t));
  } else {
    out.add.push(ingest(t));
  }
  src[0] = t;
  out.source = src;

  return out;
};

/**
 * Maintains a cartographic projection.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Projection(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$67 = inherits(Projection, Transform);

prototype$67.transform = function(_$$1, pulse) {
  var proj = this.value;

  if (!proj || _$$1.modified('type')) {
    this.value = (proj = create$2(_$$1.type));
    projectionProperties.forEach(function(prop) {
      if (_$$1[prop] != null) set$1(proj, prop, _$$1[prop]);
    });
  } else {
    projectionProperties.forEach(function(prop) {
      if (_$$1.modified(prop)) set$1(proj, prop, _$$1[prop]);
    });
  }

  if (_$$1.pointRadius != null) proj.path.pointRadius(_$$1.pointRadius);
  if (_$$1.fit) fit(proj, _$$1);

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function fit(proj, _$$1) {
  var data = collectGeoJSON(_$$1.fit);
  _$$1.extent ? proj.fitExtent(_$$1.extent, data)
    : _$$1.size ? proj.fitSize(_$$1.size, data) : 0;
}

function create$2(type) {
  var constructor = projection((type || 'mercator').toLowerCase());
  if (!constructor) error$1('Unrecognized projection type: ' + type);
  return constructor();
}

function set$1(proj, key$$1, value) {
   if (isFunction(proj[key$$1])) proj[key$$1](value);
}

function collectGeoJSON(features) {
  features = array(features);
  return features.length === 1
    ? features[0]
    : {
        type: FeatureCollection,
        features: features.reduce(function(list, f) {
            (f && f.type === FeatureCollection) ? list.push.apply(list, f.features)
              : isArray(f) ? list.push.apply(list, f)
              : list.push(f);
            return list;
          }, [])
      };
}



var geo = Object.freeze({
	contour: Contour,
	geojson: GeoJSON,
	geopath: GeoPath,
	geopoint: GeoPoint,
	geoshape: GeoShape,
	graticule: Graticule,
	projection: Projection
});

var ForceMap = {
  center: d3Force.forceCenter,
  collide: d3Force.forceCollide,
  nbody: d3Force.forceManyBody,
  link: d3Force.forceLink,
  x: d3Force.forceX,
  y: d3Force.forceY
};

var Forces = 'forces';
var ForceParams = [
      'alpha', 'alphaMin', 'alphaTarget',
      'velocityDecay', 'forces'
    ];
var ForceConfig = ['static', 'iterations'];
var ForceOutput = ['x', 'y', 'vx', 'vy'];

/**
 * Force simulation layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<object>} params.forces - The forces to apply.
 */
function Force(params) {
  Transform.call(this, null, params);
}

Force.Definition = {
  "type": "Force",
  "metadata": {"modifies": true},
  "params": [
    { "name": "static", "type": "boolean", "default": false },
    { "name": "restart", "type": "boolean", "default": false },
    { "name": "iterations", "type": "number", "default": 300 },
    { "name": "alpha", "type": "number", "default": 1 },
    { "name": "alphaMin", "type": "number", "default": 0.001 },
    { "name": "alphaTarget", "type": "number", "default": 0 },
    { "name": "velocityDecay", "type": "number", "default": 0.4 },
    { "name": "forces", "type": "param", "array": true,
      "params": [
        {
          "key": {"force": "center"},
          "params": [
            { "name": "x", "type": "number", "default": 0 },
            { "name": "y", "type": "number", "default": 0 }
          ]
        },
        {
          "key": {"force": "collide"},
          "params": [
            { "name": "radius", "type": "number", "expr": true },
            { "name": "strength", "type": "number", "default": 0.7 },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "nbody"},
          "params": [
            { "name": "strength", "type": "number", "default": -30 },
            { "name": "theta", "type": "number", "default": 0.9 },
            { "name": "distanceMin", "type": "number", "default": 1 },
            { "name": "distanceMax", "type": "number" }
          ]
        },
        {
          "key": {"force": "link"},
          "params": [
            { "name": "links", "type": "data" },
            { "name": "id", "type": "field" },
            { "name": "distance", "type": "number", "default": 30, "expr": true },
            { "name": "strength", "type": "number", "expr": true },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "x"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "x", "type": "field" }
          ]
        },
        {
          "key": {"force": "y"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "y", "type": "field" }
          ]
        }
      ] },
    {
      "name": "as", "type": "string", "array": true, "modify": false,
      "default": ForceOutput
    }
  ]
};

var prototype$68 = inherits(Force, Transform);

prototype$68.transform = function(_$$1, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _$$1.modified(ForceParams),
      iters = _$$1.iterations || 300;

  // configure simulation
  if (!sim) {
    this.value = sim = simulation(pulse.source, _$$1);
    sim.on('tick', rerun(pulse.dataflow, this));
    if (!_$$1.static) {
      change = true;
      sim.tick(); // ensure we run on init
    }
    pulse.modifies('index');
  } else {
    if (change) {
      pulse.modifies('index');
      sim.nodes(pulse.source);
    }
    if (params || pulse.changed(pulse.MOD)) {
      setup(sim, _$$1, 0, pulse);
    }
  }

  // run simulation
  if (params || change || _$$1.modified(ForceConfig)
      || (pulse.changed() && _$$1.restart))
  {
    sim.alpha(Math.max(sim.alpha(), _$$1.alpha || 1))
       .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));

    if (_$$1.static) {
      for (sim.stop(); --iters >= 0;) sim.tick();
    } else {
      if (sim.stopped()) sim.restart();
      if (!change) return pulse.StopPropagation; // defer to sim ticks
    }
  }

  return this.finish(_$$1, pulse);
};

prototype$68.finish = function(_$$1, pulse) {
  var dataflow = pulse.dataflow;

  // inspect dependencies, touch link source data
  for (var args=this._argops, j=0, m=args.length, arg; j<m; ++j) {
    arg = args[j];
    if (arg.name !== Forces || arg.op._argval.force !== 'link') {
      continue;
    }
    for (var ops=arg.op._argops, i=0, n=ops.length, op; i<n; ++i) {
      if (ops[i].name === 'links' && (op = ops[i].op.source)) {
        dataflow.pulse(op, dataflow.changeset().reflow());
        break;
      }
    }
  }

  // reflow all nodes
  return pulse.reflow(_$$1.modified()).modifies(ForceOutput);
};

function rerun(df, op) {
  return function() { df.touch(op).run(); }
}

function simulation(nodes, _$$1) {
  var sim = d3Force.forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;

  sim.stopped = function() {
    return stopped;
  };
  sim.restart = function() {
    stopped = false;
    return restart();
  };
  sim.stop = function() {
    stopped = true;
    return stop();
  };

  return setup(sim, _$$1, true).on('end', function() { stopped = true; });
}

function setup(sim, _$$1, init, pulse) {
  var f = array(_$$1.forces), i, n, p, name;

  for (i=0, n=ForceParams.length; i<n; ++i) {
    p = ForceParams[i];
    if (p !== Forces && _$$1.modified(p)) sim[p](_$$1[p]);
  }

  for (i=0, n=f.length; i<n; ++i) {
    name = Forces + i;
    p = init || _$$1.modified(Forces, i) ? getForce(f[i])
      : pulse && modified(f[i], pulse) ? sim.force(name)
      : null;
    if (p) sim.force(name, p);
  }

  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(Forces + i, null); // remove
  }

  sim.numForces = f.length;
  return sim;
}

function modified(f, pulse) {
  var k, v;
  for (k in f) {
    if (isFunction(v = f[k]) && pulse.modified(accessorFields(v)))
      return 1;
  }
  return 0;
}

function getForce(_$$1) {
  var f, p;

  if (!ForceMap.hasOwnProperty(_$$1.force)) {
    error$1('Unrecognized force: ' + _$$1.force);
  }
  f = ForceMap[_$$1.force]();

  for (p in _$$1) {
    if (isFunction(f[p])) setForceParam(f[p], _$$1[p], _$$1);
  }

  return f;
}

function setForceParam(f, v, _$$1) {
  f(isFunction(v) ? function(d) { return v(d, _$$1); } : v);
}



var force = Object.freeze({
	force: Force
});

/**
  * Nest tuples into a tree structure, grouped by key values.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {Array<function(object): *>} params.keys - The key fields to nest by, in order.
  * @param {function(object): *} [params.key] - Unique key field for each tuple.
  *   If not provided, the tuple id field is used.
  * @param {boolean} [params.generate=false] - A boolean flag indicating if
  *   non-leaf nodes generated by this transform should be included in the
  *   output. The default (false) includes only the input data (leaf nodes)
  *   in the data stream.
  */
function Nest(params) {
  Transform.call(this, null, params);
}

Nest.Definition = {
  "type": "Nest",
  "metadata": {"treesource": true, "source": true, "generates": true, "changes": true},
  "params": [
    { "name": "keys", "type": "field", "array": true },
    { "name": "key", "type": "field" },
    { "name": "generate", "type": "boolean" }
  ]
};

var prototype$69 = inherits(Nest, Transform);

function children(n) {
  return n.values;
}

prototype$69.transform = function(_$$1, pulse) {
  if (!pulse.source) {
    error$1('Nest transform requires an upstream data source.');
  }

  var key$$1 = _$$1.key || tupleid,
      gen = _$$1.generate,
      mod = _$$1.modified(),
      out = gen || mod ? pulse.fork(pulse.ALL) : pulse,
      root, tree$$1, map;

  if (!this.value || mod || pulse.changed()) {
    // collect nodes to remove
    if (gen && this.value) {
      out.materialize(out.REM);
      this.value.each(function(node) {
        if (node.children) out.rem.push(node);
      });
    }

    // generate new tree structure
    root = array(_$$1.keys)
      .reduce(function(n, k) { n.key(k); return n; }, d3Collection.nest())
      .entries(pulse.source);
    this.value = tree$$1 = d3Hierarchy.hierarchy({values: root}, children);

    // collect nodes to add
    if (gen) {
      out.materialize(out.ADD);
      out.source = out.source.slice();
      tree$$1.each(function(node) {
        if (node.children) {
          node = ingest(node.data);
          out.add.push(node);
          out.source.push(node);
        }
      });
    }

    // build lookup table
    map = tree$$1.lookup = {};
    tree$$1.each(function(node) {
      if (tupleid(node.data) != null) {
        map[key$$1(node.data)] = node;
      }
    });
  }

  out.source.root = this.value;
  return out;
};

/**
 * Abstract class for tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function HierarchyLayout(params) {
  Transform.call(this, null, params);
}

var prototype$71 = inherits(HierarchyLayout, Transform);

prototype$71.transform = function(_$$1, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error$1(this.constructor.name
      + ' transform requires a backing tree data source.');
  }

  var layout = this.layout(_$$1.method),
      fields = this.fields,
      root = pulse.source.root,
      as = _$$1.as || fields;

  if (_$$1.field) root.sum(_$$1.field);
  if (_$$1.sort) root.sort(_$$1.sort);

  setParams(layout, this.params, _$$1);
  try {
    this.value = layout(root);
  } catch (err) {
    error$1(err);
  }
  root.each(function(node) { setFields(node, fields, as); });

  return pulse.reflow(_$$1.modified()).modifies(as).modifies('leaf');
};

function setParams(layout, params, _$$1) {
  for (var p, i=0, n=params.length; i<n; ++i) {
    p = params[i];
    if (p in _$$1) layout[p](_$$1[p]);
  }
}

function setFields(node, fields, as) {
  var t = node.data;
  for (var i=0, n=fields.length-1; i<n; ++i) {
    t[as[i]] = node[fields[i]];
  }
  t[as[n]] = node.children ? node.children.length : 0;
}

var Output = ['x', 'y', 'r', 'depth', 'children'];

/**
 * Packed circle tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Pack(params) {
  HierarchyLayout.call(this, params);
}

Pack.Definition = {
  "type": "Pack",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "radius", "type": "field", "default": null },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 3, "default": Output }
  ]
};

var prototype$70 = inherits(Pack, HierarchyLayout);

prototype$70.layout = d3Hierarchy.pack;

prototype$70.params = ['size', 'padding'];

prototype$70.fields = Output;

var Output$1 = ["x0", "y0", "x1", "y1", "depth", "children"];

/**
 * Partition tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Partition(params) {
  HierarchyLayout.call(this, params);
}

Partition.Definition = {
  "type": "Partition",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": Output$1 }
  ]
};

var prototype$72 = inherits(Partition, HierarchyLayout);

prototype$72.layout = d3Hierarchy.partition;

prototype$72.params = ['size', 'round', 'padding'];

prototype$72.fields = Output$1;

/**
  * Stratify a collection of tuples into a tree structure based on
  * id and parent id fields.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {function(object): *} params.key - Unique key field for each tuple.
  * @param {function(object): *} params.parentKey - Field with key for parent tuple.
  */
function Stratify(params) {
  Transform.call(this, null, params);
}

Stratify.Definition = {
  "type": "Stratify",
  "metadata": {"treesource": true},
  "params": [
    { "name": "key", "type": "field", "required": true },
    { "name": "parentKey", "type": "field", "required": true  }
  ]
};

var prototype$73 = inherits(Stratify, Transform);

prototype$73.transform = function(_$$1, pulse) {
  if (!pulse.source) {
    error$1('Stratify transform requires an upstream data source.');
  }

  var mod = _$$1.modified(), tree$$1, map,
      run = !this.value
         || mod
         || pulse.changed(pulse.ADD_REM)
         || pulse.modified(_$$1.key.fields)
         || pulse.modified(_$$1.parentKey.fields);

  if (run) {
    tree$$1 = d3Hierarchy.stratify().id(_$$1.key).parentId(_$$1.parentKey)(pulse.source);
    map = tree$$1.lookup = {};
    tree$$1.each(function(node) { map[_$$1.key(node.data)] = node; });
    this.value = tree$$1;
  }

  pulse.source.root = this.value;
  return mod ? pulse.fork(pulse.ALL) : pulse;
};

var Layouts = {
  tidy: d3Hierarchy.tree,
  cluster: d3Hierarchy.cluster
};

var Output$2 = ["x", "y", "depth", "children"];

/**
 * Tree layout. Depending on the method parameter, performs either
 * Reingold-Tilford 'tidy' layout or dendrogram 'cluster' layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Tree(params) {
  HierarchyLayout.call(this, params);
}

Tree.Definition = {
  "type": "Tree",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "tidy", "values": ["tidy", "cluster"] },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "nodeSize", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": Output$2 }
  ]
};

var prototype$74 = inherits(Tree, HierarchyLayout);

/**
 * Tree layout generator. Supports both 'tidy' and 'cluster' layouts.
 */
prototype$74.layout = function(method) {
  var m = method || 'tidy';
  if (Layouts.hasOwnProperty(m)) return Layouts[m]();
  else error$1('Unrecognized Tree layout method: ' + m);
};

prototype$74.params = ['size', 'nodeSize', 'separation'];

prototype$74.fields = Output$2;

/**
  * Generate tuples representing links between tree nodes.
  * The resulting tuples will contain 'source' and 'target' fields,
  * which point to parent and child node tuples, respectively.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {function(object): *} [params.key] - Unique key field for each tuple.
  *   If not provided, the tuple id field is used.
  */
function TreeLinks(params) {
  Transform.call(this, {}, params);
}

TreeLinks.Definition = {
  "type": "TreeLinks",
  "metadata": {"tree": true, "generates": true, "changes": true},
  "params": [
    { "name": "key", "type": "field" }
  ]
};

var prototype$75 = inherits(TreeLinks, Transform);

function parentTuple(node) {
  var p;
  return node.parent
      && (p=node.parent.data)
      && (tupleid(p) != null) && p;
}

prototype$75.transform = function(_$$1, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error$1('TreeLinks transform requires a backing tree data source.');
  }

  var root = pulse.source.root,
      nodes = root.lookup,
      links = this.value,
      key$$1 = _$$1.key || tupleid,
      mods = {},
      out = pulse.fork();

  function modify(id$$1) {
    var link = links[id$$1];
    if (link) {
      mods[id$$1] = 1;
      out.mod.push(link);
    }
  }

  // process removed tuples
  // assumes that if a parent node is removed the child will be, too.
  pulse.visit(pulse.REM, function(t) {
    var id$$1 = key$$1(t),
        link = links[id$$1];
    if (link) {
      delete links[id$$1];
      out.rem.push(link);
    }
  });

  // create new link instances for added nodes with valid parents
  pulse.visit(pulse.ADD, function(t) {
    var id$$1 = key$$1(t), p;
    if (p = parentTuple(nodes[id$$1])) {
      out.add.push(links[id$$1] = ingest({source: p, target: t}));
      mods[id$$1] = 1;
    }
  });

  // process modified nodes and their children
  pulse.visit(pulse.MOD, function(t) {
    var id$$1 = key$$1(t),
        node = nodes[id$$1],
        kids = node.children;

    modify(id$$1);
    if (kids) for (var i=0, n=kids.length; i<n; ++i) {
      if (!mods[(id$$1=key$$1(kids[i].data))]) modify(id$$1);
    }
  });

  return out;
};

var Tiles = {
  binary: d3Hierarchy.treemapBinary,
  dice: d3Hierarchy.treemapDice,
  slice: d3Hierarchy.treemapSlice,
  slicedice: d3Hierarchy.treemapSliceDice,
  squarify: d3Hierarchy.treemapSquarify,
  resquarify: d3Hierarchy.treemapResquarify
};

var Output$3 = ["x0", "y0", "x1", "y1", "depth", "children"];

/**
 * Treemap layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Treemap(params) {
  HierarchyLayout.call(this, params);
}

Treemap.Definition = {
  "type": "Treemap",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "squarify",
      "values": ["squarify", "resquarify", "binary", "dice", "slice", "slicedice"] },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "paddingInner", "type": "number", "default": 0 },
    { "name": "paddingOuter", "type": "number", "default": 0 },
    { "name": "paddingTop", "type": "number", "default": 0 },
    { "name": "paddingRight", "type": "number", "default": 0 },
    { "name": "paddingBottom", "type": "number", "default": 0 },
    { "name": "paddingLeft", "type": "number", "default": 0 },
    { "name": "ratio", "type": "number", "default": 1.618033988749895 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": Output$3 }
  ]
};

var prototype$76 = inherits(Treemap, HierarchyLayout);

/**
 * Treemap layout generator. Adds 'method' and 'ratio' parameters
 * to configure the underlying tile method.
 */
prototype$76.layout = function() {
  var x = d3Hierarchy.treemap();
  x.ratio = function(_$$1) {
    var t = x.tile();
    if (t.ratio) x.tile(t.ratio(_$$1));
  };
  x.method = function(_$$1) {
    if (Tiles.hasOwnProperty(_$$1)) x.tile(Tiles[_$$1]);
    else error$1('Unrecognized Treemap layout method: ' + _$$1);
  };
  return x;
};

prototype$76.params = [
  'method', 'ratio', 'size', 'round',
  'padding', 'paddingInner', 'paddingOuter',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
];

prototype$76.fields = Output$3;



var tree$1 = Object.freeze({
	nest: Nest,
	pack: Pack,
	partition: Partition,
	stratify: Stratify,
	tree: Tree,
	treelinks: TreeLinks,
	treemap: Treemap
});

function Voronoi(params) {
  Transform.call(this, null, params);
}

Voronoi.Definition = {
  "type": "Voronoi",
  "metadata": {"modifies": true},
  "params": [
    { "name": "x", "type": "field", "required": true },
    { "name": "y", "type": "field", "required": true },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "default": [[-1e5, -1e5], [1e5, 1e5]],
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

var prototype$77 = inherits(Voronoi, Transform);

var defaultExtent = [[-1e5, -1e5], [1e5, 1e5]];

prototype$77.transform = function(_$$1, pulse) {
  var as = _$$1.as || 'path',
      data = pulse.source,
      diagram, polygons, i, n;

  // configure and construct voronoi diagram
  diagram = d3Voronoi.voronoi().x(_$$1.x).y(_$$1.y);
  if (_$$1.size) diagram.size(_$$1.size);
  else diagram.extent(_$$1.extent || defaultExtent);

  this.value = (diagram = diagram(data));

  // map polygons to paths
  polygons = diagram.polygons();
  for (i=0, n=data.length; i<n; ++i) {
    data[i][as] = polygons[i]
      ? 'M' + polygons[i].join('L') + 'Z'
      : null;
  }

  return pulse.reflow(_$$1.modified()).modifies(as);
};



var voronoi$1 = Object.freeze({
	voronoi: Voronoi
});

/*
Copyright (c) 2013, Jason Davies.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.

  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.

  * The name Jason Davies may not be used to endorse or promote products
    derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL JASON DAVIES BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE
OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

// Word cloud layout by Jason Davies, https://www.jasondavies.com/wordcloud/
// Algorithm due to Jonathan Feinberg, http://static.mrfeinberg.com/bv_ch03.pdf

var cloudRadians = Math.PI / 180;
var cw = 1 << 11 >> 5;
var ch = 1 << 11;

var cloud = function() {
  var size = [256, 256],
      text,
      font,
      fontSize,
      fontStyle,
      fontWeight,
      rotate,
      padding,
      spiral = archimedeanSpiral,
      words = [],
      random = Math.random,
      cloud = {},
      canvas = cloudCanvas;

  cloud.layout = function() {
    var contextAndRatio = getContext(canvas()),
        board = zeroArray((size[0] >> 5) * size[1]),
        bounds = null,
        n = words.length,
        i = -1,
        tags = [],
        data = words.map(function(d) {
          return {
            text: text(d),
            font: font(d),
            style: fontStyle(d),
            weight: fontWeight(d),
            rotate: rotate(d),
            size: ~~fontSize(d),
            padding: padding(d),
            xoff: 0,
            yoff: 0,
            x1: 0,
            y1: 0,
            x0: 0,
            y0: 0,
            hasText: false,
            sprite: null,
            datum: d
          };
        }).sort(function(a, b) { return b.size - a.size; });

    while (++i < n) {
      var d = data[i];
      d.x = (size[0] * (random() + .5)) >> 1;
      d.y = (size[1] * (random() + .5)) >> 1;
      cloudSprite(contextAndRatio, d, data, i);
      if (d.hasText && place(board, d, bounds)) {
        tags.push(d);
        if (bounds) cloudBounds(bounds, d);
        else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
        // Temporary hack
        d.x -= size[0] >> 1;
        d.y -= size[1] >> 1;
      }
    }

    return tags;
  };

  function getContext(canvas) {
    canvas.width = canvas.height = 1;
    var ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas.width = (cw << 5) / ratio;
    canvas.height = ch / ratio;

    var context = canvas.getContext("2d");
    context.fillStyle = context.strokeStyle = "red";
    context.textAlign = "center";

    return {context: context, ratio: ratio};
  }

  function place(board, tag, bounds) {
    var startX = tag.x,
        startY = tag.y,
        maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
        s = spiral(size),
        dt = random() < .5 ? 1 : -1,
        t = -dt,
        dxdy,
        dx,
        dy;

    while (dxdy = s(t += dt)) {
      dx = ~~dxdy[0];
      dy = ~~dxdy[1];

      if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break;

      tag.x = startX + dx;
      tag.y = startY + dy;

      if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
          tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
      // TODO only check for collisions within current bounds.
      if (!bounds || !cloudCollide(tag, board, size[0])) {
        if (!bounds || collideRects(tag, bounds)) {
          var sprite = tag.sprite,
              w = tag.width >> 5,
              sw = size[0] >> 5,
              lx = tag.x - (w << 4),
              sx = lx & 0x7f,
              msx = 32 - sx,
              h = tag.y1 - tag.y0,
              x = (tag.y + tag.y0) * sw + (lx >> 5),
              last;
          for (var j = 0; j < h; j++) {
            last = 0;
            for (var i = 0; i <= w; i++) {
              board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
            }
            x += sw;
          }
          tag.sprite = null;
          return true;
        }
      }
    }
    return false;
  }

  cloud.words = function(_$$1) {
    if (arguments.length) {
      words = _$$1;
      return cloud;
    } else {
      return words;
    }
  };

  cloud.size = function(_$$1) {
    if (arguments.length) {
      size = [+_$$1[0], +_$$1[1]];
      return cloud;
    } else {
      return size;
    }
  };

  cloud.font = function(_$$1) {
    if (arguments.length) {
      font = functor(_$$1);
      return cloud;
    } else {
      return font;
    }
  };

  cloud.fontStyle = function(_$$1) {
    if (arguments.length) {
      fontStyle = functor(_$$1);
      return cloud;
    } else {
      return fontStyle;
    }
  };

  cloud.fontWeight = function(_$$1) {
    if (arguments.length) {
      fontWeight = functor(_$$1);
      return cloud;
    } else {
      return fontWeight;
    }
  };

  cloud.rotate = function(_$$1) {
    if (arguments.length) {
      rotate = functor(_$$1);
      return cloud;
    } else {
      return rotate;
    }
  };

  cloud.text = function(_$$1) {
    if (arguments.length) {
      text = functor(_$$1);
      return cloud;
    } else {
      return text;
    }
  };

  cloud.spiral = function(_$$1) {
    if (arguments.length) {
      spiral = spirals[_$$1] || _$$1;
      return cloud;
    } else {
      return spiral;
    }
  };

  cloud.fontSize = function(_$$1) {
    if (arguments.length) {
      fontSize = functor(_$$1);
      return cloud;
    } else {
      return fontSize;
    }
  };

  cloud.padding = function(_$$1) {
    if (arguments.length) {
      padding = functor(_$$1);
      return cloud;
    } else {
      return padding;
    }
  };

  cloud.random = function(_$$1) {
    if (arguments.length) {
      random = _$$1;
      return cloud;
    } else {
      return random;
    }
  };

  return cloud;
};

// Fetches a monochrome sprite bitmap for the specified text.
// Load in batches for speed.
function cloudSprite(contextAndRatio, d, data, di) {
  if (d.sprite) return;
  var c = contextAndRatio.context,
      ratio = contextAndRatio.ratio;

  c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
  var x = 0,
      y = 0,
      maxh = 0,
      n = data.length,
      w, w32, h, i, j;
  --di;
  while (++di < n) {
    d = data[di];
    c.save();
    c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
    w = c.measureText(d.text + "m").width * ratio;
    h = d.size << 1;
    if (d.rotate) {
      var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
      w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
    } else {
      w = (w + 0x1f) >> 5 << 5;
    }
    if (h > maxh) maxh = h;
    if (x + w >= (cw << 5)) {
      x = 0;
      y += maxh;
      maxh = 0;
    }
    if (y + h >= ch) break;
    c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
    if (d.rotate) c.rotate(d.rotate * cloudRadians);
    c.fillText(d.text, 0, 0);
    if (d.padding) {
      c.lineWidth = 2 * d.padding;
      c.strokeText(d.text, 0, 0);
    }
    c.restore();
    d.width = w;
    d.height = h;
    d.xoff = x;
    d.yoff = y;
    d.x1 = w >> 1;
    d.y1 = h >> 1;
    d.x0 = -d.x1;
    d.y0 = -d.y1;
    d.hasText = true;
    x += w;
  }
  var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
      sprite = [];
  while (--di >= 0) {
    d = data[di];
    if (!d.hasText) continue;
    w = d.width;
    w32 = w >> 5;
    h = d.y1 - d.y0;
    // Zero the buffer
    for (i = 0; i < h * w32; i++) sprite[i] = 0;
    x = d.xoff;
    if (x == null) return;
    y = d.yoff;
    var seen = 0,
        seenRow = -1;
    for (j = 0; j < h; j++) {
      for (i = 0; i < w; i++) {
        var k = w32 * j + (i >> 5),
            m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
        sprite[k] |= m;
        seen |= m;
      }
      if (seen) seenRow = j;
      else {
        d.y0++;
        h--;
        j--;
        y++;
      }
    }
    d.y1 = d.y0 + seenRow;
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
  }
}

// Use mask-based collision detection.
function cloudCollide(tag, board, sw) {
  sw >>= 5;
  var sprite = tag.sprite,
      w = tag.width >> 5,
      lx = tag.x - (w << 4),
      sx = lx & 0x7f,
      msx = 32 - sx,
      h = tag.y1 - tag.y0,
      x = (tag.y + tag.y0) * sw + (lx >> 5),
      last;
  for (var j = 0; j < h; j++) {
    last = 0;
    for (var i = 0; i <= w; i++) {
      if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
          & board[x + i]) return true;
    }
    x += sw;
  }
  return false;
}

function cloudBounds(bounds, d) {
  var b0 = bounds[0],
      b1 = bounds[1];
  if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
  if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
  if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
  if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
}

function collideRects(a, b) {
  return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
}

function archimedeanSpiral(size) {
  var e = size[0] / size[1];
  return function(t) {
    return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
  };
}

function rectangularSpiral(size) {
  var dy = 4,
      dx = dy * size[0] / size[1],
      x = 0,
      y = 0;
  return function(t) {
    var sign = t < 0 ? -1 : 1;
    // See triangular numbers: T_n = n * (n + 1) / 2.
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:  x += dx; break;
      case 1:  y += dy; break;
      case 2:  x -= dx; break;
      default: y -= dy; break;
    }
    return [x, y];
  };
}

// TODO reuse arrays?
function zeroArray(n) {
  var a = [],
      i = -1;
  while (++i < n) a[i] = 0;
  return a;
}

function cloudCanvas() {
  try {
    var canvas = typeof document !== 'undefined' && document.createElement
      ? document.createElement('canvas')
      : 0;

    if (canvas && canvas.getContext) {
      return canvas;
    }
    try {
      return new (require('canvas'))();
    } catch (e) {
      return new (require('canvas-prebuilt'))()
    }
  } catch (e) {
    error$1('Canvas unavailable. Run in browser or install node-canvas.');
  }
}

function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}

var spirals = {
  archimedean: archimedeanSpiral,
  rectangular: rectangularSpiral
};

var Output$4 = ['x', 'y', 'font', 'fontSize', 'fontStyle', 'fontWeight', 'angle'];

var Params$1 = ['text', 'font', 'rotate', 'fontSize', 'fontStyle', 'fontWeight'];

function Wordcloud(params) {
  Transform.call(this, cloud(), params);
}

Wordcloud.Definition = {
  "type": "Wordcloud",
  "metadata": {"modifies": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "font", "type": "string", "expr": true, "default": "sans-serif" },
    { "name": "fontStyle", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontWeight", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontSize", "type": "number", "expr": true, "default": 14 },
    { "name": "fontSizeRange", "type": "number", "array": "nullable", "default": [10, 50] },
    { "name": "rotate", "type": "number", "expr": true, "default": 0 },
    { "name": "text", "type": "field" },
    { "name": "spiral", "type": "string", "values": ["archimedean", "rectangular"] },
    { "name": "padding", "type": "number", "expr": true },
    { "name": "as", "type": "string", "array": true, "length": 7, "default": Output$4 }
  ]
};

var prototype$78 = inherits(Wordcloud, Transform);

prototype$78.transform = function(_$$1, pulse) {
  function modp(param) {
    var p = _$$1[param];
    return isFunction(p) && pulse.modified(p.fields);
  }

  var mod = _$$1.modified();
  if (!(mod || pulse.changed(pulse.ADD_REM) || Params$1.some(modp))) return;

  var data = pulse.materialize(pulse.SOURCE).source,
      layout = this.value,
      as = _$$1.as || Output$4,
      fontSize = _$$1.fontSize || 14,
      range$$1;

  isFunction(fontSize)
    ? (range$$1 = _$$1.fontSizeRange)
    : (fontSize = constant(fontSize));

  // create font size scaling function as needed
  if (range$$1) {
    var fsize = fontSize,
        sizeScale = scale$1('sqrt')()
          .domain(extent$1(fsize, data))
          .range(range$$1);
    fontSize = function(x) { return sizeScale(fsize(x)); };
  }

  data.forEach(function(t) {
    t[as[0]] = NaN;
    t[as[1]] = NaN;
    t[as[3]] = 0;
  });

  // configure layout
  var words = layout
    .words(data)
    .text(_$$1.text)
    .size(_$$1.size || [500, 500])
    .padding(_$$1.padding || 1)
    .spiral(_$$1.spiral || 'archimedean')
    .rotate(_$$1.rotate || 0)
    .font(_$$1.font || 'sans-serif')
    .fontStyle(_$$1.fontStyle || 'normal')
    .fontWeight(_$$1.fontWeight || 'normal')
    .fontSize(fontSize)
    .random(exports.random)
    .layout();

  var size = layout.size(),
      dx = size[0] >> 1,
      dy = size[1] >> 1,
      i = 0,
      n = words.length,
      w, t;

  for (; i<n; ++i) {
    w = words[i];
    t = w.datum;
    t[as[0]] = w.x + dx;
    t[as[1]] = w.y + dy;
    t[as[2]] = w.font;
    t[as[3]] = w.size;
    t[as[4]] = w.style;
    t[as[5]] = w.weight;
    t[as[6]] = w.rotate;
  }

  return pulse.reflow(mod).modifies(as);
};

function extent$1(field$$1, data) {
  var min$$1 = +Infinity,
      max$$1 = -Infinity,
      i = 0,
      n = data.length,
      v;

  for (; i<n; ++i) {
    v = field$$1(data[i]);
    if (v < min$$1) min$$1 = v;
    if (v > max$$1) max$$1 = v;
  }

  return [min$$1, max$$1];
}



var wordcloud = Object.freeze({
	wordcloud: Wordcloud
});

function array8(n) { return new Uint8Array(n); }

function array16(n) { return new Uint16Array(n); }

function array32(n) { return new Uint32Array(n); }

/**
 * Maintains CrossFilter state.
 */
function Bitmaps() {

  var width = 8,
      data = [],
      seen = array32(0),
      curr = array$2(0, width),
      prev = array$2(0, width);

  return {

    data: function() { return data; },

    seen: function() {
      return (seen = lengthen(seen, data.length));
    },

    add: function(array) {
      for (var i=0, j=data.length, n=array.length, t; i<n; ++i) {
        t = array[i];
        t._index = j++;
        data.push(t);
      }
    },

    remove: function(num, map) { // map: index -> boolean (true => remove)
      var n = data.length,
          copy = Array(n - num),
          reindex = data, // reuse old data array for index map
          t, i, j;

      // seek forward to first removal
      for (i=0; !map[i] && i<n; ++i) {
        copy[i] = data[i];
        reindex[i] = i;
      }

      // condense arrays
      for (j=i; i<n; ++i) {
        t = data[i];
        if (!map[i]) {
          reindex[i] = j;
          curr[j] = curr[i];
          prev[j] = prev[i];
          copy[j] = t;
          t._index = j++;
        } else {
          reindex[i] = -1;
        }
        curr[i] = 0; // clear unused bits
      }

      data = copy;
      return reindex;
    },

    size: function() { return data.length; },

    curr: function() { return curr; },

    prev: function() { return prev; },

    reset: function(k) { prev[k] = curr[k]; },

    all: function() {
      return width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff;
    },

    set: function(k, one) { curr[k] |= one; },

    clear: function(k, one) { curr[k] &= ~one; },

    resize: function(n, m) {
      var k = curr.length;
      if (n > k || m > width) {
        width = Math.max(m, width);
        curr = array$2(n, width, curr);
        prev = array$2(n, width);
      }
    }
  };
}

function lengthen(array, length, copy) {
  if (array.length >= length) return array;
  copy = copy || new array.constructor(length);
  copy.set(array);
  return copy;
}

function array$2(n, m, array) {
  var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
  if (array) copy.set(array);
  return copy;
}

var Dimension = function(index, i, query) {
  var bit = (1 << i);

  return {
    one:     bit,
    zero:    ~bit,
    range:   query.slice(),
    bisect:  index.bisect,
    index:   index.index,
    size:    index.size,

    onAdd: function(added, curr) {
      var dim = this,
          range$$1 = dim.bisect(dim.range, added.value),
          idx = added.index,
          lo = range$$1[0],
          hi = range$$1[1],
          n1 = idx.length, i;

      for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
      for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
      return dim;
    }
  };
};

/**
 * Maintains a list of values, sorted by key.
 */
function SortedIndex() {
  var index = array32(0),
      value = [],
      size = 0;

  function insert(key, data, base) {
    if (!data.length) return [];

    var n0 = size,
        n1 = data.length,
        addv = Array(n1),
        addi = array32(n1),
        oldv, oldi, i;

    for (i=0; i<n1; ++i) {
      addv[i] = key(data[i]);
      addi[i] = i;
    }
    addv = sort(addv, addi);

    if (n0) {
      oldv = value;
      oldi = index;
      value = Array(n0 + n1);
      index = array32(n0 + n1);
      merge$1(base, oldv, oldi, n0, addv, addi, n1, value, index);
    } else {
      if (base > 0) for (i=0; i<n1; ++i) {
        addi[i] += base;
      }
      value = addv;
      index = addi;
    }
    size = n0 + n1;

    return {index: addi, value: addv};
  }

  function remove(num, map) {
    // map: index -> remove
    var n = size,
        idx, i, j;

    // seek forward to first removal
    for (i=0; !map[index[i]] && i<n; ++i);

    // condense index and value arrays
    for (j=i; i<n; ++i) {
      if (!map[idx=index[i]]) {
        index[j] = idx;
        value[j] = value[i];
        ++j;
      }
    }

    size = n - num;
  }

  function reindex(map) {
    for (var i=0, n=size; i<n; ++i) {
      index[i] = map[index[i]];
    }
  }

  function bisect$$1(range$$1, array) {
    var n;
    if (array) {
      n = array.length;
    } else {
      array = value;
      n = size;
    }
    return [
      d3Array.bisectLeft(array, range$$1[0], 0, n),
      d3Array.bisectRight(array, range$$1[1], 0, n)
    ];
  }

  return {
    insert:  insert,
    remove:  remove,
    bisect:  bisect$$1,
    reindex: reindex,
    index:   function() { return index; },
    size:    function() { return size; }
  };
}

function sort(values, index) {
  values.sort.call(index, function(a, b) {
    var x = values[a],
        y = values[b];
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return d3Array.permute(values, index);
}

function merge$1(base, value0, index0, n0, value1, index1, n1, value, index) {
  var i0 = 0, i1 = 0, i;

  for (i=0; i0 < n0 && i1 < n1; ++i) {
    if (value0[i0] < value1[i1]) {
      value[i] = value0[i0];
      index[i] = index0[i0++];
    } else {
      value[i] = value1[i1];
      index[i] = index1[i1++] + base;
    }
  }

  for (; i0 < n0; ++i0, ++i) {
    value[i] = value0[i0];
    index[i] = index0[i0];
  }

  for (; i1 < n1; ++i1, ++i) {
    value[i] = value1[i1];
    index[i] = index1[i1] + base;
  }
}

/**
 * An indexed multi-dimensional filter.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.fields - An array of dimension accessors to filter.
 * @param {Array} params.query - An array of per-dimension range queries.
 */
function CrossFilter(params) {
  Transform.call(this, Bitmaps(), params);
  this._indices = null;
  this._dims = null;
}

CrossFilter.Definition = {
  "type": "CrossFilter",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "query", "type": "array", "array": true, "required": true,
      "content": {"type": "number", "array": true, "length": 2} }
  ]
};

var prototype$79 = inherits(CrossFilter, Transform);

prototype$79.transform = function(_$$1, pulse) {
  if (!this._dims) {
    return this.init(_$$1, pulse);
  } else {
    var init = _$$1.modified('fields')
          || _$$1.fields.some(function(f) { return pulse.modified(f.fields); });

    return init
      ? this.reinit(_$$1, pulse)
      : this.eval(_$$1, pulse);
  }
};

prototype$79.init = function(_$$1, pulse) {
  var fields = _$$1.fields,
      query = _$$1.query,
      indices = this._indices = {},
      dims = this._dims = [],
      m = query.length,
      i = 0, key$$1, index;

  // instantiate indices and dimensions
  for (; i<m; ++i) {
    key$$1 = fields[i].fname;
    index = indices[key$$1] || (indices[key$$1] = SortedIndex());
    dims.push(Dimension(index, i, query[i]));
  }

  return this.eval(_$$1, pulse);
};

prototype$79.reinit = function(_$$1, pulse) {
  var output = pulse.materialize().fork(),
      fields = _$$1.fields,
      query = _$$1.query,
      indices = this._indices,
      dims = this._dims,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all = bits.all(),
      out = (output.rem = output.add),
      mod = output.mod,
      m = query.length,
      adds = {}, add, index, key$$1,
      mods, remMap, modMap, i, n, f;

  // set prev to current state
  prev.set(curr);

  // if pulse has remove tuples, process them first
  if (pulse.rem.length) {
    remMap = this.remove(_$$1, pulse, output);
  }

  // if pulse has added tuples, add them to state
  if (pulse.add.length) {
    bits.add(pulse.add);
  }

  // if pulse has modified tuples, create an index map
  if (pulse.mod.length) {
    modMap = {};
    for (mods=pulse.mod, i=0, n=mods.length; i<n; ++i) {
      modMap[mods[i]._index] = 1;
    }
  }

  // re-initialize indices as needed, update curr bitmap
  for (i=0; i<m; ++i) {
    f = fields[i];
    if (!dims[i] || _$$1.modified('fields', i) || pulse.modified(f.fields)) {
      key$$1 = f.fname;
      if (!(add = adds[key$$1])) {
        indices[key$$1] = index = SortedIndex();
        adds[key$$1] = add = index.insert(f, pulse.source, 0);
      }
      dims[i] = Dimension(index, i, query[i]).onAdd(add, curr);
    }
  }

  // visit each tuple
  // if filter state changed, push index to add/rem
  // else if in mod and passes a filter, push index to mod
  for (i=0, n=bits.data().length; i<n; ++i) {
    if (remMap[i]) { // skip if removed tuple
      continue;
    } else if (prev[i] !== curr[i]) { // add if state changed
      out.push(i);
    } else if (modMap[i] && curr[i] !== all) { // otherwise, pass mods through
      mod.push(i);
    }
  }

  bits.mask = (1 << m) - 1;
  return output;
};

prototype$79.eval = function(_$$1, pulse) {
  var output = pulse.materialize().fork(),
      m = this._dims.length,
      mask = 0;

  if (pulse.rem.length) {
    this.remove(_$$1, pulse, output);
    mask |= (1 << m) - 1;
  }

  if (_$$1.modified('query') && !_$$1.modified('fields')) {
    mask |= this.update(_$$1, pulse, output);
  }

  if (pulse.add.length) {
    this.insert(_$$1, pulse, output);
    mask |= (1 << m) - 1;
  }

  if (pulse.mod.length) {
    this.modify(pulse, output);
    mask |= (1 << m) - 1;
  }

  this.value.mask = mask;
  return output;
};

prototype$79.insert = function(_$$1, pulse, output) {
  var tuples = pulse.add,
      bits = this.value,
      dims = this._dims,
      indices = this._indices,
      fields = _$$1.fields,
      adds = {},
      out = output.add,
      k = bits.size(),
      n = k + tuples.length,
      m = dims.length, j, key$$1, add;

  // resize bitmaps and add tuples as needed
  bits.resize(n, m);
  bits.add(tuples);

  var curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all();

  // add to dimensional indices
  for (j=0; j<m; ++j) {
    key$$1 = fields[j].fname;
    add = adds[key$$1] || (adds[key$$1] = indices[key$$1].insert(fields[j], tuples, k));
    dims[j].onAdd(add, curr);
  }

  // set previous filters, output if passes at least one filter
  for (; k<n; ++k) {
    prev[k] = all;
    if (curr[k] !== all) out.push(k);
  }
};

prototype$79.modify = function(pulse, output) {
  var out = output.mod,
      bits = this.value,
      curr = bits.curr(),
      all  = bits.all(),
      tuples = pulse.mod,
      i, n, k;

  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    if (curr[k] !== all) out.push(k);
  }
};

prototype$79.remove = function(_$$1, pulse, output) {
  var indices = this._indices,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all(),
      map = {},
      out = output.rem,
      tuples = pulse.rem,
      i, n, k, f;

  // process tuples, output if passes at least one filter
  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    map[k] = 1; // build index map
    prev[k] = (f = curr[k]);
    curr[k] = all;
    if (f !== all) out.push(k);
  }

  // remove from dimensional indices
  for (k in indices) {
    indices[k].remove(n, map);
  }

  this.reindex(pulse, n, map);
  return map;
};

// reindex filters and indices after propagation completes
prototype$79.reindex = function(pulse, num, map) {
  var indices = this._indices,
      bits = this.value;

  pulse.runAfter(function() {
    var indexMap = bits.remove(num, map);
    for (var key$$1 in indices) indices[key$$1].reindex(indexMap);
  });
};

prototype$79.update = function(_$$1, pulse, output) {
  var dims = this._dims,
      query = _$$1.query,
      stamp = pulse.stamp,
      m = dims.length,
      mask = 0, i, q;

  // survey how many queries have changed
  output.filters = 0;
  for (q=0; q<m; ++q) {
    if (_$$1.modified('query', q)) { i = q; ++mask; }
  }

  if (mask === 1) {
    // only one query changed, use more efficient update
    mask = dims[i].one;
    this.incrementOne(dims[i], query[i], output.add, output.rem);
  } else {
    // multiple queries changed, perform full record keeping
    for (q=0, mask=0; q<m; ++q) {
      if (!_$$1.modified('query', q)) continue;
      mask |= dims[q].one;
      this.incrementAll(dims[q], query[q], stamp, output.add);
      output.rem = output.add; // duplicate add/rem for downstream resolve
    }
  }

  return mask;
};

prototype$79.incrementAll = function(dim, query, stamp, out) {
  var bits = this.value,
      seen = bits.seen(),
      curr = bits.curr(),
      prev = bits.prev(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range$$1 = dim.bisect(query),
      lo1 = range$$1[0],
      hi1 = range$$1[1],
      lo0 = old[0],
      hi0 = old[1],
      one$$1 = dim.one,
      i, j, k;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one$$1;
    }
  }

  dim.range = query.slice();
};

prototype$79.incrementOne = function(dim, query, add, rem) {
  var bits = this.value,
      curr = bits.curr(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range$$1 = dim.bisect(query),
      lo1 = range$$1[0],
      hi1 = range$$1[1],
      lo0 = old[0],
      hi0 = old[1],
      one$$1 = dim.one,
      i, j, k;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      add.push(k);
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      rem.push(k);
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      add.push(k);
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      curr[k] ^= one$$1;
      rem.push(k);
    }
  }

  dim.range = query.slice();
};

/**
 * Selectively filters tuples by resolving against a filter bitmap.
 * Useful for processing the output of a cross-filter transform.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.ignore - A bit mask indicating which filters to ignore.
 * @param {object} params.filter - The per-tuple filter bitmaps. Typically this
 *   parameter value is a reference to a {@link CrossFilter} transform.
 */
function ResolveFilter(params) {
  Transform.call(this, null, params);
}

ResolveFilter.Definition = {
  "type": "ResolveFilter",
  "metadata": {},
  "params": [
    { "name": "ignore", "type": "number", "required": true,
      "description": "A bit mask indicating which filters to ignore." },
    { "name": "filter", "type": "object", "required": true,
      "description": "Per-tuple filter bitmaps from a CrossFilter transform." }
  ]
};

var prototype$80 = inherits(ResolveFilter, Transform);

prototype$80.transform = function(_$$1, pulse) {
  var ignore = ~(_$$1.ignore || 0), // bit mask where zeros -> dims to ignore
      bitmap = _$$1.filter,
      mask = bitmap.mask;

  // exit early if no relevant filter changes
  if ((mask & ignore) === 0) return pulse.StopPropagation;

  var output = pulse.fork(pulse.ALL),
      data = bitmap.data(),
      curr = bitmap.curr(),
      prev = bitmap.prev(),
      pass = function(k) {
        return !(curr[k] & ignore) ? data[k] : null;
      };

  // propagate all mod tuples that pass the filter
  output.filter(output.MOD, pass);

  // determine add & rem tuples via filter functions
  // for efficiency, we do *not* populate new arrays,
  // instead we add filter functions applied downstream

  if (!(mask & (mask-1))) { // only one filter changed
    output.filter(output.ADD, pass);
    output.filter(output.REM, function(k) {
      return (curr[k] & ignore) === mask ? data[k] : null;
    });

  } else { // multiple filters changed
    output.filter(output.ADD, function(k) {
      var c = curr[k] & ignore,
          f = !c && (c ^ (prev[k] & ignore));
      return f ? data[k] : null;
    });
    output.filter(output.REM, function(k) {
      var c = curr[k] & ignore,
          f = c && !(c ^ (c ^ (prev[k] & ignore)));
      return f ? data[k] : null;
    });
  }

  // add filter to source data in case of reflow...
  return output.filter(output.SOURCE, function(t) { return pass(t._index); });
};



var xf = Object.freeze({
	crossfilter: CrossFilter,
	resolvefilter: ResolveFilter
});

var version = "3.0.3";

var Default = 'default';

var cursor = function(view) {
  var cursor = view._signals.cursor;

  // add cursor signal to dataflow, if needed
  if (!cursor) {
    view._signals.cursor = (cursor = view.add({user: Default, item: null}));
  }

  // evaluate cursor on each mousemove event
  view.on(view.events('view', 'mousemove'), cursor,
    function(_$$1, event) {
      var value = cursor.value,
          user = value ? (isString(value) ? value : value.user) : Default,
          item = event.item && event.item.cursor || null;

      return (value && user === value.user && item == value.item) ? value
        : {user: user, item: item};
    }
  );

  // when cursor signal updates, set visible cursor
  view.add(null, function(_$$1) {
    var user = _$$1.cursor,
        item = this.value;

    if (!isString(user)) {
      item = user.item;
      user = user.user;
    }

    setCursor(user && user !== Default ? user : (item || user));

    return item;
  }, {cursor: cursor});
};

function setCursor(cursor) {
  // set cursor on document body
  // this ensures cursor applies even if dragging out of view
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.cursor = cursor;
  }
}

function dataref(view, name) {
  var data = view._runtime.data;
  if (!data.hasOwnProperty(name)) {
    error$1('Unrecognized data set: ' + name);
  }
  return data[name];
}

function data(name) {
  return dataref(this, name).values.value;
}

function change(name, changes) {
  if (!isChangeSet(changes)) {
    error$1('Second argument to changes must be a changeset.');
  }
  var dataset = dataref(this, name);
  dataset.modified = true;
  return this.pulse(dataset.input, changes);
}

function insert(name, _$$1) {
  return change.call(this, name, changeset().insert(_$$1));
}

function remove(name, _$$1) {
  return change.call(this, name, changeset().remove(_$$1));
}

function width(view) {
  var padding = view.padding();
  return Math.max(0, view._viewWidth + padding.left + padding.right);
}

function height$1(view) {
  var padding = view.padding();
  return Math.max(0, view._viewHeight + padding.top + padding.bottom);
}

function offset$1(view) {
  var padding = view.padding(),
      origin = view._origin;
  return [
    padding.left + origin[0],
    padding.top + origin[1]
  ];
}

function resizeRenderer(view) {
  var origin = offset$1(view);
  view._renderer.background(view._background);
  view._renderer.resize(width(view), height$1(view), origin);
  view._handler.origin(origin);
}

/**
 * Extend an event with additional view-specific methods.
 * Adds a new property ('vega') to an event that provides a number
 * of methods for querying information about the current interaction.
 * The vega object provides the following methods:
 *   view - Returns the backing View instance.
 *   item - Returns the currently active scenegraph item (if any).
 *   group - Returns the currently active scenegraph group (if any).
 *     This method accepts a single string-typed argument indicating the name
 *     of the desired parent group. The scenegraph will be traversed from
 *     the item up towards the root to search for a matching group. If no
 *     argument is provided the enclosing group for the active item is
 *     returned, unless the item it itself a group, in which case it is
 *     returned directly.
 *   xy - Returns a two-element array containing the x and y coordinates for
 *     mouse or touch events. For touch events, this is based on the first
 *     elements in the changedTouches array. This method accepts a single
 *     argument: either an item instance or mark name that should serve as
 *     the reference coordinate system. If no argument is provided the
 *     top-level view coordinate system is assumed.
 *   x - Returns the current x-coordinate, accepts the same arguments as xy.
 *   y - Returns the current y-coordinate, accepts the same arguments as xy.
 * @param {Event} event - The input event to extend.
 * @param {Item} item - The currently active scenegraph item (if any).
 * @return {Event} - The extended input event.
 */
var eventExtend = function(view, event, item) {
  var el = view._renderer.scene(),
      p, e, translate;

  if (el) {
    translate = offset$1(view);
    e = event.changedTouches ? event.changedTouches[0] : event;
    p = point(e, el);
    p[0] -= translate[0];
    p[1] -= translate[1];
  }

  event.dataflow = view;
  event.vega = extension(view, item, p);
  event.item = item;
  return event;
};

function extension(view, item, point$$1) {
  var itemGroup = item
    ? item.mark.marktype === 'group' ? item : item.mark.group
    : null;

  function group(name) {
    var g = itemGroup, i;
    if (name) for (i = item; i; i = i.mark.group) {
      if (i.mark.name === name) { g = i; break; }
    }
    return g && g.mark && g.mark.interactive ? g : {};
  }

  function xy(item) {
    if (!item) return point$$1;
    if (isString(item)) item = group(item);

    var p = point$$1.slice();
    while (item) {
      p[0] -= item.x || 0;
      p[1] -= item.y || 0;
      item = item.mark && item.mark.group;
    }
    return p;
  }

  return {
    view:  constant(view),
    item:  constant(item || {}),
    group: group,
    xy:    xy,
    x:     function(item) { return xy(item)[0]; },
    y:     function(item) { return xy(item)[1]; }
  };
}

var VIEW = 'view';
var WINDOW = 'window';

/**
 * Initialize event handling configuration.
 * @param {object} config - The configuration settings.
 * @return {object}
 */
function initializeEventConfig(config) {
  config = extend({}, config);

  var def = config.defaults;
  if (def) {
    if (isArray(def.prevent)) {
      def.prevent = toSet(def.prevent);
    }
    if (isArray(def.allow)) {
      def.allow = toSet(def.allow);
    }
  }

  return config;
}

function prevent(view, type) {
  var def = view._eventConfig.defaults,
      prevent = def && def.prevent,
      allow = def && def.allow;

  return prevent === false || allow === true ? false
    : prevent === true || allow === false ? true
    : prevent ? prevent[type]
    : allow ? !allow[type]
    : view.preventDefault();
}

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @return {EventStream}
 */
function events$1(source, type, filter) {
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        if (source === VIEW && prevent(view, type)) {
          e.preventDefault();
        }
        try {
          s.receive(eventExtend(view, e, item));
        } catch (error) {
          view.error(error);
        } finally {
          view.run();
        }
      },
      sources;

  if (source === VIEW) {
    view.addEventListener(type, send);
    return s;
  }

  if (source === WINDOW) {
    if (typeof window !== 'undefined') sources = [window];
  } else if (typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  }

  if (!sources) {
    view.warn('Can not resolve event source: ' + source);
    return s;
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  view._eventListeners.push({
    type:    type,
    sources: sources,
    handler: send
  });

  return s;
}

function itemFilter(event) {
  return event.item;
}

function markTarget(event) {
  // grab upstream collector feeding the mark operator
  var source = event.item.mark.source;
  return source.source || source;
}

function invoke(name) {
  return function(_$$1, event) {
    return event.vega.view()
      .changeset()
      .encode(event.item, name);
  };
}

var hover = function(hoverSet, leaveSet) {
  hoverSet = [hoverSet || 'hover'];
  leaveSet = [leaveSet || 'update', hoverSet];

  // invoke hover set upon mouseover
  this.on(
    this.events('view', 'mouseover', itemFilter),
    markTarget,
    invoke(hoverSet)
  );

  // invoke leave set upon mouseout
  this.on(
    this.events('view', 'mouseout', itemFilter),
    markTarget,
    invoke(leaveSet)
  );

  return this;
};

/**
 * Remove all external event listeners.
 */
var finalize = function() {
  var listeners = this._eventListeners,
      n = listeners.length, m, e;

  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }
};

var element$1 = function(tag, attr, text) {
  var el = document.createElement(tag);
  for (var key in attr) el.setAttribute(key, attr[key]);
  if (text != null) el.textContent = text;
  return el;
};

var BindClass = 'vega-bind';
var NameClass = 'vega-bind-name';
var RadioClass = 'vega-bind-radio';
var OptionClass = 'vega-option-';

/**
 * Bind a signal to an external HTML input element. The resulting two-way
 * binding will propagate input changes to signals, and propagate signal
 * changes to the input element state. If this view instance has no parent
 * element, we assume the view is headless and no bindings are created.
 * @param {Element|string} el - The parent DOM element to which the input
 *   element should be appended as a child. If string-valued, this argument
 *   will be treated as a CSS selector. If null or undefined, the parent
 *   element of this view will be used as the element.
 * @param {object} param - The binding parameters which specify the signal
 *   to bind to, the input element type, and type-specific configuration.
 * @return {View} - This view instance.
 */
var bind$1 = function(view, el, binding) {
  if (!el) return;

  var param = binding.param,
      bind = binding.state;

  if (!bind) {
    bind = binding.state = {
      elements: null,
      active: false,
      set: null,
      update: function(value) {
        bind.source = true;
        view.signal(param.signal, value).run();
      }
    };
    if (param.debounce) {
      bind.update = debounce(param.debounce, bind.update);
    }
  }

  if (isString(el)) el = document.querySelector(el);
  generate(bind, el, param, view.signal(param.signal));

  if (!bind.active) {
    view.on(view._signals[param.signal], null, function() {
      bind.source
        ? (bind.source = false)
        : bind.set(view.signal(param.signal));
    });
    bind.active = true;
  }

  return bind;
};

/**
 * Generate an HTML input form element and bind it to a signal.
 */
function generate(bind, el, param, value) {
  var div = element$1('div', {'class': BindClass});

  div.appendChild(element$1('span',
    {'class': NameClass},
    (param.name || param.signal)
  ));

  el.appendChild(div);

  var input = form;
  switch (param.input) {
    case 'checkbox': input = checkbox; break;
    case 'select':   input = select; break;
    case 'radio':    input = radio; break;
    case 'range':    input = range$1; break;
  }

  input(bind, div, param, value);
}

/**
 * Generates an arbitrary input form element.
 * The input type is controlled via user-provided parameters.
 */
function form(bind, el, param, value) {
  var node = element$1('input');

  for (var key$$1 in param) {
    if (key$$1 !== 'signal' && key$$1 !== 'element') {
      node.setAttribute(key$$1 === 'input' ? 'type' : key$$1, param[key$$1]);
    }
  }
  node.setAttribute('name', param.signal);
  node.value = value;

  el.appendChild(node);

  node.addEventListener('input', function() {
    bind.update(node.value);
  });

  bind.elements = [node];
  bind.set = function(value) { node.value = value; };
}

/**
 * Generates a checkbox input element.
 */
function checkbox(bind, el, param, value) {
  var attr = {type: 'checkbox', name: param.signal};
  if (value) attr.checked = true;
  var node = element$1('input', attr);

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(node.checked);
  });

  bind.elements = [node];
  bind.set = function(value) { node.checked = !!value || null; };
}

/**
 * Generates a selection list input element.
 */
function select(bind, el, param, value) {
  var node = element$1('select', {name: param.signal});

  param.options.forEach(function(option) {
    var attr = {value: option};
    if (valuesEqual(option, value)) attr.selected = true;
    node.appendChild(element$1('option', attr, option+''));
  });

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(param.options[node.selectedIndex]);
  });

  bind.elements = [node];
  bind.set = function(value) {
    for (var i=0, n=param.options.length; i<n; ++i) {
      if (valuesEqual(param.options[i], value)) {
        node.selectedIndex = i; return;
      }
    }
  };
}

/**
 * Generates a radio button group.
 */
function radio(bind, el, param, value) {
  var group = element$1('span', {'class': RadioClass});

  el.appendChild(group);

  bind.elements = param.options.map(function(option) {
    var id$$1 = OptionClass + param.signal + '-' + option;

    var attr = {
      id:    id$$1,
      type:  'radio',
      name:  param.signal,
      value: option
    };
    if (valuesEqual(option, value)) attr.checked = true;

    var input = element$1('input', attr);

    input.addEventListener('change', function() {
      bind.update(option);
    });

    group.appendChild(input);
    group.appendChild(element$1('label', {'for': id$$1}, option+''));

    return input;
  });

  bind.set = function(value) {
    var nodes = bind.elements,
        i = 0,
        n = nodes.length;
    for (; i<n; ++i) {
      if (valuesEqual(nodes[i].value, value)) nodes[i].checked = true;
    }
  };
}

/**
 * Generates a slider input element.
 */
function range$1(bind, el, param, value) {
  value = value !== undefined ? value : ((+param.max) + (+param.min)) / 2;

  var min$$1 = param.min || Math.min(0, +value) || 0,
      max$$1 = param.max || Math.max(100, +value) || 100,
      step = param.step || d3Array.tickStep(min$$1, max$$1, 100);

  var node = element$1('input', {
    type:  'range',
    name:  param.signal,
    min:   min$$1,
    max:   max$$1,
    step:  step
  });
  node.value = value;

  var label = element$1('label', {}, +value);

  el.appendChild(node);
  el.appendChild(label);

  function update() {
    label.textContent = node.value;
    bind.update(+node.value);
  }

  // subscribe to both input and change
  // signal updates halt redundant values, maintaining performance
  node.addEventListener('input', update);
  node.addEventListener('change', update);

  bind.elements = [node];
  bind.set = function(value) {
    node.value = value;
    label.textContent = value;
  };
}

function valuesEqual(a, b) {
  return a === b || (a+'' === b+'');
}

var initializeRenderer = function(view, r, el, constructor) {
  r = r || new constructor(view.loader());
  return r
    .initialize(el, width(view), height$1(view), offset$1(view))
    .background(view._background);
};

var initializeHandler = function(view, prevHandler, el, constructor) {
  var handler = new constructor()
    .scene(view.scenegraph().root)
    .initialize(el, offset$1(view), view);

  if (prevHandler) {
    handler.handleTooltip = prevHandler.handleTooltip;
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
};

var initialize$1 = function(el, elBind) {
  var view = this,
      type = view._renderType,
      module = renderModule(type),
      Handler$$1, Renderer$$1;

  // containing dom element
  el = view._el = el ? lookup$2(view, el) : null;

  // select appropriate renderer & handler
  if (!module) view.error('Unrecognized renderer type: ' + type);
  Handler$$1 = module.handler || CanvasHandler;
  Renderer$$1 = (el ? module.renderer : module.headless);

  // initialize renderer and input handler
  view._renderer = !Renderer$$1 ? null
    : initializeRenderer(view, view._renderer, el, Renderer$$1);
  view._handler = initializeHandler(view, view._handler, el, Handler$$1);
  view._redraw = true;

  // initialize signal bindings
  if (el) {
    elBind = elBind ? lookup$2(view, elBind)
      : el.appendChild(element$1('div', {'class': 'vega-bindings'}));

    view._bind.forEach(function(_$$1) {
      if (_$$1.param.element) lookup$2(view, _$$1.param.element);
    });

    view._bind.forEach(function(_$$1) {
      bind$1(view, _$$1.param.element || elBind, _$$1);
    });
  }

  return view;
};

function lookup$2(view, el) {
  if (typeof el === 'string') {
    if (typeof document !== 'undefined') {
      el = document.querySelector(el);
    } else {
      view.error('DOM document instance not found.');
      return null;
    }
  }
  el.innerHTML = '';
  return el;
}

/**
 * Render the current scene in a headless fashion.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
var renderHeadless = function(view, type) {
  var module = renderModule(type);
  return !(module && module.headless)
    ? Promise.reject('Unrecognized renderer type: ' + type)
    : view.runAsync().then(function() {
        return initializeRenderer(view, null, null, module.headless)
          .renderAsync(view._scenegraph.root);
      });
};

/**
 * Produce an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @return {Promise} - A promise that resolves to an image URL.
 */
var renderToImageURL = function(type) {
  return (type !== RenderType.Canvas && type !== RenderType.SVG && type !== RenderType.PNG)
    ? Promise.reject('Unrecognized image type: ' + type)
    : renderHeadless(this, type).then(function(renderer) {
        return type === RenderType.SVG
          ? toBlobURL(renderer.svg(), 'image/svg+xml')
          : renderer.canvas().toDataURL('image/png');
      });
};

function toBlobURL(data, mime) {
  var blob = new Blob([data], {type: mime});
  return window.URL.createObjectURL(blob);
}

/**
 * Produce a Canvas instance containing a rendered visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to a Canvas instance.
 */
var renderToCanvas = function() {
  return renderHeadless(this, RenderType.Canvas)
    .then(function(renderer) { return renderer.canvas(); });
};

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
var renderToSVG = function() {
  return renderHeadless(this, RenderType.SVG)
    .then(function(renderer) { return renderer.svg(); });
};

var parseAutosize = function(spec, config) {
  spec = spec || config.autosize;
  if (isObject(spec)) {
    return spec;
  } else {
    spec = spec || 'pad';
    return {type: spec};
  }
};

var parsePadding = function(spec, config) {
  spec = spec || config.padding;
  if (isObject(spec)) {
    return spec;
  } else {
    spec = +spec || 0;
    return {top: spec, bottom: spec, left: spec, right: spec};
  }
};

var OUTER = 'outer';
var OUTER_INVALID = ['value', 'update', 'react', 'bind'];

function outerError(prefix, name) {
  error$1(prefix + ' for "outer" push: ' + $$2(name));
}

var parseSignal = function(signal, scope) {
  var name = signal.name;

  if (signal.push === OUTER) {
    // signal must already be defined, raise error if not
    if (!scope.signals[name]) outerError('No prior signal definition', name);
    // signal push must not use properties reserved for standard definition
    OUTER_INVALID.forEach(function(prop) {
      if (signal[prop] !== undefined) outerError('Invalid property ', prop);
    });
  } else {
    // define a new signal in the current scope
    var op = scope.addSignal(name, signal.value);
    if (signal.react === false) op.react = false;
    if (signal.bind) scope.addBinding(name, signal.bind);
  }
};

function ASTNode(type) {
  this.type = type;
}

ASTNode.prototype.visit = function(visitor) {
  var node = this, c, i, n;

  if (visitor(node)) return 1;

  for (c=children$1(node), i=0, n=c.length; i<n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
};

function children$1(node) {
  switch (node.type) {
    case 'ArrayExpression':
      return node.elements;
    case 'BinaryExpression':
    case 'LogicalExpression':
      return [node.left, node.right];
    case 'CallExpression':
      var args = node.arguments.slice();
      args.unshift(node.callee);
      return args;
    case 'ConditionalExpression':
      return [node.test, node.consequent, node.alternate];
    case 'MemberExpression':
      return [node.object, node.property];
    case 'ObjectExpression':
      return node.properties;
    case 'Property':
      return [node.key, node.value];
    case 'UnaryExpression':
      return [node.argument];
    case 'Identifier':
    case 'Literal':
    case 'RawCode':
    default:
      return [];
  }
}

/*
  The following expression parser is based on Esprima (http://esprima.org/).
  Original header comment and license for Esprima is included here:

  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var source$1;
var index;
var length;
var lookahead;

var TokenBooleanLiteral = 1;
var TokenEOF = 2;
var TokenIdentifier = 3;
var TokenKeyword = 4;
var TokenNullLiteral = 5;
var TokenNumericLiteral = 6;
var TokenPunctuator = 7;
var TokenStringLiteral = 8;

var SyntaxArrayExpression = 'ArrayExpression';
var SyntaxBinaryExpression = 'BinaryExpression';
var SyntaxCallExpression = 'CallExpression';
var SyntaxConditionalExpression = 'ConditionalExpression';
var SyntaxIdentifier = 'Identifier';
var SyntaxLiteral = 'Literal';
var SyntaxLogicalExpression = 'LogicalExpression';
var SyntaxMemberExpression = 'MemberExpression';
var SyntaxObjectExpression = 'ObjectExpression';
var SyntaxProperty = 'Property';
var SyntaxUnaryExpression = 'UnaryExpression';

// Error messages should be identical to V8.
var MessageUnexpectedToken = 'Unexpected token %0';
var MessageUnexpectedNumber = 'Unexpected number';
var MessageUnexpectedString = 'Unexpected string';
var MessageUnexpectedIdentifier = 'Unexpected identifier';
var MessageUnexpectedReserved = 'Unexpected reserved word';
var MessageUnexpectedEOS = 'Unexpected end of input';
var MessageInvalidRegExp = 'Invalid regular expression';
var MessageUnterminatedRegExp = 'Invalid regular expression: missing /';
var MessageStrictOctalLiteral = 'Octal literals are not allowed in strict mode.';
var MessageStrictDuplicateProperty = 'Duplicate data property in object literal not allowed in strict mode';

var ILLEGAL = 'ILLEGAL';
var DISABLED = 'Disabled.';

// See also tools/generate-unicode-regex.py.
var RegexNonAsciiIdentifierStart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]');
var RegexNonAsciiIdentifierPart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]');

// Ensure the condition is true, otherwise throw an error.
// This is only to have a better contract semantic, i.e. another safety net
// to catch a logic error. The condition shall be fulfilled in normal case.
// Do NOT use this to enforce a certain condition on any user input.

function assert(condition, message) {
  /* istanbul ignore next */
  if (!condition) {
    throw new Error('ASSERT: ' + message);
  }
}

function isDecimalDigit(ch) {
  return (ch >= 0x30 && ch <= 0x39); // 0..9
}

function isHexDigit(ch) {
  return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
}

function isOctalDigit(ch) {
  return '01234567'.indexOf(ch) >= 0;
}

// 7.2 White Space

function isWhiteSpace(ch) {
  return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
    (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
}

// 7.3 Line Terminators

function isLineTerminator(ch) {
  return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
}

// 7.6 Identifier Names and Identifiers

function isIdentifierStart(ch) {
  return (ch === 0x24) || (ch === 0x5F) || // $ (dollar) and _ (underscore)
    (ch >= 0x41 && ch <= 0x5A) || // A..Z
    (ch >= 0x61 && ch <= 0x7A) || // a..z
    (ch === 0x5C) || // \ (backslash)
    ((ch >= 0x80) && RegexNonAsciiIdentifierStart.test(String.fromCharCode(ch)));
}

function isIdentifierPart(ch) {
  return (ch === 0x24) || (ch === 0x5F) || // $ (dollar) and _ (underscore)
    (ch >= 0x41 && ch <= 0x5A) || // A..Z
    (ch >= 0x61 && ch <= 0x7A) || // a..z
    (ch >= 0x30 && ch <= 0x39) || // 0..9
    (ch === 0x5C) || // \ (backslash)
    ((ch >= 0x80) && RegexNonAsciiIdentifierPart.test(String.fromCharCode(ch)));
}

// 7.6.1.1 Keywords

var keywords$1 = {
  'if':1, 'in':1, 'do':1,
  'var':1, 'for':1, 'new':1, 'try':1, 'let':1,
  'this':1, 'else':1, 'case':1, 'void':1, 'with':1, 'enum':1,
  'while':1, 'break':1, 'catch':1, 'throw':1, 'const':1, 'yield':1, 'class':1, 'super':1,
  'return':1, 'typeof':1, 'delete':1, 'switch':1, 'export':1, 'import':1, 'public':1, 'static':1,
  'default':1, 'finally':1, 'extends':1, 'package':1, 'private':1,
  'function':1, 'continue':1, 'debugger':1,
  'interface':1, 'protected':1,
  'instanceof':1, 'implements':1
};

function skipComment() {
  var ch;

  while (index < length) {
    ch = source$1.charCodeAt(index);

    if (isWhiteSpace(ch) || isLineTerminator(ch)) {
      ++index;
    } else {
      break;
    }
  }
}

function scanHexEscape(prefix) {
  var i, len, ch, code = 0;

  len = (prefix === 'u') ? 4 : 2;
  for (i = 0; i < len; ++i) {
    if (index < length && isHexDigit(source$1[index])) {
      ch = source$1[index++];
      code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  return String.fromCharCode(code);
}

function scanUnicodeCodePointEscape() {
  var ch, code, cu1, cu2;

  ch = source$1[index];
  code = 0;

  // At least, one hex digit is required.
  if (ch === '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  while (index < length) {
    ch = source$1[index++];
    if (!isHexDigit(ch)) {
      break;
    }
    code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
  }

  if (code > 0x10FFFF || ch !== '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  // UTF-16 Encoding
  if (code <= 0xFFFF) {
    return String.fromCharCode(code);
  }
  cu1 = ((code - 0x10000) >> 10) + 0xD800;
  cu2 = ((code - 0x10000) & 1023) + 0xDC00;
  return String.fromCharCode(cu1, cu2);
}

function getEscapedIdentifier() {
  var ch, id;

  ch = source$1.charCodeAt(index++);
  id = String.fromCharCode(ch);

  // '\u' (U+005C, U+0075) denotes an escaped character.
  if (ch === 0x5C) {
    if (source$1.charCodeAt(index) !== 0x75) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    ++index;
    ch = scanHexEscape('u');
    if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    id = ch;
  }

  while (index < length) {
    ch = source$1.charCodeAt(index);
    if (!isIdentifierPart(ch)) {
      break;
    }
    ++index;
    id += String.fromCharCode(ch);

    // '\u' (U+005C, U+0075) denotes an escaped character.
    if (ch === 0x5C) {
      id = id.substr(0, id.length - 1);
      if (source$1.charCodeAt(index) !== 0x75) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      ++index;
      ch = scanHexEscape('u');
      if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      id += ch;
    }
  }

  return id;
}

function getIdentifier() {
  var start, ch;

  start = index++;
  while (index < length) {
    ch = source$1.charCodeAt(index);
    if (ch === 0x5C) {
      // Blackslash (U+005C) marks Unicode escape sequence.
      index = start;
      return getEscapedIdentifier();
    }
    if (isIdentifierPart(ch)) {
      ++index;
    } else {
      break;
    }
  }

  return source$1.slice(start, index);
}

function scanIdentifier() {
  var start, id, type;

  start = index;

  // Backslash (U+005C) starts an escaped character.
  id = (source$1.charCodeAt(index) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

  // There is no keyword or literal with only one character.
  // Thus, it must be an identifier.
  if (id.length === 1) {
    type = TokenIdentifier;
  } else if (keywords$1.hasOwnProperty(id)) {
    type = TokenKeyword;
  } else if (id === 'null') {
    type = TokenNullLiteral;
  } else if (id === 'true' || id === 'false') {
    type = TokenBooleanLiteral;
  } else {
    type = TokenIdentifier;
  }

  return {
    type: type,
    value: id,
    start: start,
    end: index
  };
}

// 7.7 Punctuators

function scanPunctuator() {
  var start = index,
    code = source$1.charCodeAt(index),
    code2,
    ch1 = source$1[index],
    ch2,
    ch3,
    ch4;

  switch (code) {

    // Check for most common single-character punctuators.
    case 0x2E: // . dot
    case 0x28: // ( open bracket
    case 0x29: // ) close bracket
    case 0x3B: // ; semicolon
    case 0x2C: // , comma
    case 0x7B: // { open curly brace
    case 0x7D: // } close curly brace
    case 0x5B: // [
    case 0x5D: // ]
    case 0x3A: // :
    case 0x3F: // ?
    case 0x7E: // ~
      ++index;
      return {
        type: TokenPunctuator,
        value: String.fromCharCode(code),
        start: start,
        end: index
      };

    default:
      code2 = source$1.charCodeAt(index + 1);

      // '=' (U+003D) marks an assignment or comparison operator.
      if (code2 === 0x3D) {
        switch (code) {
          case 0x2B: // +
          case 0x2D: // -
          case 0x2F: // /
          case 0x3C: // <
          case 0x3E: // >
          case 0x5E: // ^
          case 0x7C: // |
          case 0x25: // %
          case 0x26: // &
          case 0x2A: // *
            index += 2;
            return {
              type: TokenPunctuator,
              value: String.fromCharCode(code) + String.fromCharCode(code2),
              start: start,
              end: index
            };

          case 0x21: // !
          case 0x3D: // =
            index += 2;

            // !== and ===
            if (source$1.charCodeAt(index) === 0x3D) {
              ++index;
            }
            return {
              type: TokenPunctuator,
              value: source$1.slice(start, index),
              start: start,
              end: index
            };
        }
      }
  }

  // 4-character punctuator: >>>=

  ch4 = source$1.substr(index, 4);

  if (ch4 === '>>>=') {
    index += 4;
    return {
      type: TokenPunctuator,
      value: ch4,
      start: start,
      end: index
    };
  }

  // 3-character punctuators: === !== >>> <<= >>=

  ch3 = ch4.substr(0, 3);

  if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
    index += 3;
    return {
      type: TokenPunctuator,
      value: ch3,
      start: start,
      end: index
    };
  }

  // Other 2-character punctuators: ++ -- << >> && ||
  ch2 = ch3.substr(0, 2);

  if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
    index += 2;
    return {
      type: TokenPunctuator,
      value: ch2,
      start: start,
      end: index
    };
  }

  // 1-character punctuators: < > = ! + - * % & | ^ /

  if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
    ++index;
    return {
      type: TokenPunctuator,
      value: ch1,
      start: start,
      end: index
    };
  }

  throwError({}, MessageUnexpectedToken, ILLEGAL);
}

// 7.8.3 Numeric Literals

function scanHexLiteral(start) {
  var number = '';

  while (index < length) {
    if (!isHexDigit(source$1[index])) {
      break;
    }
    number += source$1[index++];
  }

  if (number.length === 0) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  if (isIdentifierStart(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt('0x' + number, 16),
    start: start,
    end: index
  };
}

function scanOctalLiteral(start) {
  var number = '0' + source$1[index++];
  while (index < length) {
    if (!isOctalDigit(source$1[index])) {
      break;
    }
    number += source$1[index++];
  }

  if (isIdentifierStart(source$1.charCodeAt(index)) || isDecimalDigit(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt(number, 8),
    octal: true,
    start: start,
    end: index
  };
}

function scanNumericLiteral() {
  var number, start, ch;

  ch = source$1[index];
  assert(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
    'Numeric literal must start with a decimal digit or a decimal point');

  start = index;
  number = '';
  if (ch !== '.') {
    number = source$1[index++];
    ch = source$1[index];

    // Hex number starts with '0x'.
    // Octal number starts with '0'.
    if (number === '0') {
      if (ch === 'x' || ch === 'X') {
        ++index;
        return scanHexLiteral(start);
      }
      if (isOctalDigit(ch)) {
        return scanOctalLiteral(start);
      }

      // decimal number starts with '0' such as '09' is illegal.
      if (ch && isDecimalDigit(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
    }

    while (isDecimalDigit(source$1.charCodeAt(index))) {
      number += source$1[index++];
    }
    ch = source$1[index];
  }

  if (ch === '.') {
    number += source$1[index++];
    while (isDecimalDigit(source$1.charCodeAt(index))) {
      number += source$1[index++];
    }
    ch = source$1[index];
  }

  if (ch === 'e' || ch === 'E') {
    number += source$1[index++];

    ch = source$1[index];
    if (ch === '+' || ch === '-') {
      number += source$1[index++];
    }
    if (isDecimalDigit(source$1.charCodeAt(index))) {
      while (isDecimalDigit(source$1.charCodeAt(index))) {
        number += source$1[index++];
      }
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }

  if (isIdentifierStart(source$1.charCodeAt(index))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseFloat(number),
    start: start,
    end: index
  };
}

// 7.8.4 String Literals

function scanStringLiteral() {
  var str = '',
    quote, start, ch, code, octal = false;

  quote = source$1[index];
  assert((quote === '\'' || quote === '"'),
    'String literal must starts with a quote');

  start = index;
  ++index;

  while (index < length) {
    ch = source$1[index++];

    if (ch === quote) {
      quote = '';
      break;
    } else if (ch === '\\') {
      ch = source$1[index++];
      if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
        switch (ch) {
          case 'u':
          case 'x':
            if (source$1[index] === '{') {
              ++index;
              str += scanUnicodeCodePointEscape();
            } else {
              str += scanHexEscape(ch);
            }
            break;
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case 'v':
            str += '\x0B';
            break;

          default:
            if (isOctalDigit(ch)) {
              code = '01234567'.indexOf(ch);

              // \0 is not octal escape sequence
              if (code !== 0) {
                octal = true;
              }

              if (index < length && isOctalDigit(source$1[index])) {
                octal = true;
                code = code * 8 + '01234567'.indexOf(source$1[index++]);

                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ('0123'.indexOf(ch) >= 0 &&
                  index < length &&
                  isOctalDigit(source$1[index])) {
                  code = code * 8 + '01234567'.indexOf(source$1[index++]);
                }
              }
              str += String.fromCharCode(code);
            } else {
              str += ch;
            }
            break;
        }
      } else {
        if (ch === '\r' && source$1[index] === '\n') {
          ++index;
        }
      }
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      break;
    } else {
      str += ch;
    }
  }

  if (quote !== '') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenStringLiteral,
    value: str,
    octal: octal,
    start: start,
    end: index
  };
}

function testRegExp(pattern, flags) {
  var tmp = pattern;

  if (flags.indexOf('u') >= 0) {
    // Replace each astral symbol and every Unicode code point
    // escape sequence with a single ASCII symbol to avoid throwing on
    // regular expressions that are only valid in combination with the
    // `/u` flag.
    // Note: replacing with the ASCII symbol `x` might cause false
    // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
    // perfectly valid pattern that is equivalent to `[a-b]`, but it
    // would be replaced by `[x-b]` which throws an error.
    tmp = tmp
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, function($0, $1) {
        if (parseInt($1, 16) <= 0x10FFFF) {
          return 'x';
        }
        throwError({}, MessageInvalidRegExp);
      })
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
  }

  // First, detect invalid regular expressions.
  try {
    new RegExp(tmp);
  } catch (e) {
    throwError({}, MessageInvalidRegExp);
  }

  // Return a regular expression object for this pattern-flag pair, or
  // `null` in case the current environment doesn't support the flags it
  // uses.
  try {
    return new RegExp(pattern, flags);
  } catch (exception) {
    return null;
  }
}

function scanRegExpBody() {
  var ch, str, classMarker, terminated, body;

  ch = source$1[index];
  assert(ch === '/', 'Regular expression literal must start with a slash');
  str = source$1[index++];

  classMarker = false;
  terminated = false;
  while (index < length) {
    ch = source$1[index++];
    str += ch;
    if (ch === '\\') {
      ch = source$1[index++];
      // ECMA-262 7.8.5
      if (isLineTerminator(ch.charCodeAt(0))) {
        throwError({}, MessageUnterminatedRegExp);
      }
      str += ch;
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      throwError({}, MessageUnterminatedRegExp);
    } else if (classMarker) {
      if (ch === ']') {
        classMarker = false;
      }
    } else {
      if (ch === '/') {
        terminated = true;
        break;
      } else if (ch === '[') {
        classMarker = true;
      }
    }
  }

  if (!terminated) {
    throwError({}, MessageUnterminatedRegExp);
  }

  // Exclude leading and trailing slash.
  body = str.substr(1, str.length - 2);
  return {
    value: body,
    literal: str
  };
}

function scanRegExpFlags() {
  var ch, str, flags;

  str = '';
  flags = '';
  while (index < length) {
    ch = source$1[index];
    if (!isIdentifierPart(ch.charCodeAt(0))) {
      break;
    }

    ++index;
    if (ch === '\\' && index < length) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    } else {
      flags += ch;
      str += ch;
    }
  }

  if (flags.search(/[^gimuy]/g) >= 0) {
    throwError({}, MessageInvalidRegExp, flags);
  }

  return {
    value: flags,
    literal: str
  };
}

function scanRegExp() {
  var start, body, flags, value;

  lookahead = null;
  skipComment();
  start = index;

  body = scanRegExpBody();
  flags = scanRegExpFlags();
  value = testRegExp(body.value, flags.value);

  return {
    literal: body.literal + flags.literal,
    value: value,
    regex: {
      pattern: body.value,
      flags: flags.value
    },
    start: start,
    end: index
  };
}

function isIdentifierName(token) {
  return token.type === TokenIdentifier ||
    token.type === TokenKeyword ||
    token.type === TokenBooleanLiteral ||
    token.type === TokenNullLiteral;
}

function advance() {
  var ch;

  skipComment();

  if (index >= length) {
    return {
      type: TokenEOF,
      start: index,
      end: index
    };
  }

  ch = source$1.charCodeAt(index);

  if (isIdentifierStart(ch)) {
    return scanIdentifier();
  }

  // Very common: ( and ) and ;
  if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
    return scanPunctuator();
  }

  // String literal starts with single quote (U+0027) or double quote (U+0022).
  if (ch === 0x27 || ch === 0x22) {
    return scanStringLiteral();
  }


  // Dot (.) U+002E can also start a floating-point number, hence the need
  // to check the next character.
  if (ch === 0x2E) {
    if (isDecimalDigit(source$1.charCodeAt(index + 1))) {
      return scanNumericLiteral();
    }
    return scanPunctuator();
  }

  if (isDecimalDigit(ch)) {
    return scanNumericLiteral();
  }

  return scanPunctuator();
}

function lex() {
  var token;

  token = lookahead;
  index = token.end;

  lookahead = advance();

  index = token.end;

  return token;
}

function peek$1() {
  var pos;

  pos = index;

  lookahead = advance();
  index = pos;
}

function finishArrayExpression(elements) {
  var node = new ASTNode(SyntaxArrayExpression);
  node.elements = elements;
  return node;
}

function finishBinaryExpression(operator, left, right) {
  var node = new ASTNode((operator === '||' || operator === '&&') ? SyntaxLogicalExpression : SyntaxBinaryExpression);
  node.operator = operator;
  node.left = left;
  node.right = right;
  return node;
}

function finishCallExpression(callee, args) {
  var node = new ASTNode(SyntaxCallExpression);
  node.callee = callee;
  node.arguments = args;
  return node;
}

function finishConditionalExpression(test, consequent, alternate) {
  var node = new ASTNode(SyntaxConditionalExpression);
  node.test = test;
  node.consequent = consequent;
  node.alternate = alternate;
  return node;
}

function finishIdentifier(name) {
  var node = new ASTNode(SyntaxIdentifier);
  node.name = name;
  return node;
}

function finishLiteral(token) {
  var node = new ASTNode(SyntaxLiteral);
  node.value = token.value;
  node.raw = source$1.slice(token.start, token.end);
  if (token.regex) {
    if (node.raw === '//') {
      node.raw = '/(?:)/';
    }
    node.regex = token.regex;
  }
  return node;
}

function finishMemberExpression(accessor, object, property) {
  var node = new ASTNode(SyntaxMemberExpression);
  node.computed = accessor === '[';
  node.object = object;
  node.property = property;
  if (!node.computed) property.member = true;
  return node;
}

function finishObjectExpression(properties) {
  var node = new ASTNode(SyntaxObjectExpression);
  node.properties = properties;
  return node;
}

function finishProperty(kind, key, value) {
  var node = new ASTNode(SyntaxProperty);
  node.key = key;
  node.value = value;
  node.kind = kind;
  return node;
}

function finishUnaryExpression(operator, argument) {
  var node = new ASTNode(SyntaxUnaryExpression);
  node.operator = operator;
  node.argument = argument;
  node.prefix = true;
  return node;
}

// Throw an exception

function throwError(token, messageFormat) {
  var error,
    args = Array.prototype.slice.call(arguments, 2),
    msg = messageFormat.replace(
      /%(\d)/g,
      function(whole, index) {
        assert(index < args.length, 'Message reference must be in range');
        return args[index];
      }
    );


  error = new Error(msg);
  error.index = index;
  error.description = msg;
  throw error;
}

// Throw an exception because of the token.

function throwUnexpected(token) {
  if (token.type === TokenEOF) {
    throwError(token, MessageUnexpectedEOS);
  }

  if (token.type === TokenNumericLiteral) {
    throwError(token, MessageUnexpectedNumber);
  }

  if (token.type === TokenStringLiteral) {
    throwError(token, MessageUnexpectedString);
  }

  if (token.type === TokenIdentifier) {
    throwError(token, MessageUnexpectedIdentifier);
  }

  if (token.type === TokenKeyword) {
    throwError(token, MessageUnexpectedReserved);
  }

  // BooleanLiteral, NullLiteral, or Punctuator.
  throwError(token, MessageUnexpectedToken, token.value);
}

// Expect the next token to match the specified punctuator.
// If not, an exception will be thrown.

function expect(value) {
  var token = lex();
  if (token.type !== TokenPunctuator || token.value !== value) {
    throwUnexpected(token);
  }
}

// Return true if the next token matches the specified punctuator.

function match(value) {
  return lookahead.type === TokenPunctuator && lookahead.value === value;
}

// Return true if the next token matches the specified keyword

function matchKeyword(keyword) {
  return lookahead.type === TokenKeyword && lookahead.value === keyword;
}

// 11.1.4 Array Initialiser

function parseArrayInitialiser() {
  var elements = [];

  index = lookahead.start;
  expect('[');

  while (!match(']')) {
    if (match(',')) {
      lex();
      elements.push(null);
    } else {
      elements.push(parseConditionalExpression());

      if (!match(']')) {
        expect(',');
      }
    }
  }

  lex();

  return finishArrayExpression(elements);
}

// 11.1.5 Object Initialiser

function parseObjectPropertyKey() {
  var token;

  index = lookahead.start;
  token = lex();

  // Note: This function is called only from parseObjectProperty(), where
  // EOF and Punctuator tokens are already filtered out.

  if (token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
    if (token.octal) {
      throwError(token, MessageStrictOctalLiteral);
    }
    return finishLiteral(token);
  }

  return finishIdentifier(token.value);
}

function parseObjectProperty() {
  var token, key, id, value;

  index = lookahead.start;
  token = lookahead;

  if (token.type === TokenIdentifier) {
    id = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', id, value);
  }
  if (token.type === TokenEOF || token.type === TokenPunctuator) {
    throwUnexpected(token);
  } else {
    key = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', key, value);
  }
}

function parseObjectInitialiser() {
  var properties = [],
    property, name, key, map = {},
    toString = String;

  index = lookahead.start;
  expect('{');

  while (!match('}')) {
    property = parseObjectProperty();

    if (property.key.type === SyntaxIdentifier) {
      name = property.key.name;
    } else {
      name = toString(property.key.value);
    }

    key = '$' + name;
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throwError({}, MessageStrictDuplicateProperty);
    } else {
      map[key] = true;
    }

    properties.push(property);

    if (!match('}')) {
      expect(',');
    }
  }

  expect('}');

  return finishObjectExpression(properties);
}

// 11.1.6 The Grouping Operator

function parseGroupExpression() {
  var expr;

  expect('(');

  expr = parseExpression$1();

  expect(')');

  return expr;
}


// 11.1 Primary Expressions

var legalKeywords = {
  "if": 1,
  "this": 1
};

function parsePrimaryExpression() {
  var type, token, expr;

  if (match('(')) {
    return parseGroupExpression();
  }

  if (match('[')) {
    return parseArrayInitialiser();
  }

  if (match('{')) {
    return parseObjectInitialiser();
  }

  type = lookahead.type;
  index = lookahead.start;


  if (type === TokenIdentifier || legalKeywords[lookahead.value]) {
    expr = finishIdentifier(lex().value);
  } else if (type === TokenStringLiteral || type === TokenNumericLiteral) {
    if (lookahead.octal) {
      throwError(lookahead, MessageStrictOctalLiteral);
    }
    expr = finishLiteral(lex());
  } else if (type === TokenKeyword) {
    throw new Error(DISABLED);
  } else if (type === TokenBooleanLiteral) {
    token = lex();
    token.value = (token.value === 'true');
    expr = finishLiteral(token);
  } else if (type === TokenNullLiteral) {
    token = lex();
    token.value = null;
    expr = finishLiteral(token);
  } else if (match('/') || match('/=')) {
    expr = finishLiteral(scanRegExp());
    peek$1();
  } else {
    throwUnexpected(lex());
  }

  return expr;
}

// 11.2 Left-Hand-Side Expressions

function parseArguments() {
  var args = [];

  expect('(');

  if (!match(')')) {
    while (index < length) {
      args.push(parseConditionalExpression());
      if (match(')')) {
        break;
      }
      expect(',');
    }
  }

  expect(')');

  return args;
}

function parseNonComputedProperty() {
  var token;
  index = lookahead.start;
  token = lex();

  if (!isIdentifierName(token)) {
    throwUnexpected(token);
  }

  return finishIdentifier(token.value);
}

function parseNonComputedMember() {
  expect('.');

  return parseNonComputedProperty();
}

function parseComputedMember() {
  var expr;

  expect('[');

  expr = parseExpression$1();

  expect(']');

  return expr;
}

function parseLeftHandSideExpressionAllowCall() {
  var expr, args, property;

  expr = parsePrimaryExpression();

  for (;;) {
    if (match('.')) {
      property = parseNonComputedMember();
      expr = finishMemberExpression('.', expr, property);
    } else if (match('(')) {
      args = parseArguments();
      expr = finishCallExpression(expr, args);
    } else if (match('[')) {
      property = parseComputedMember();
      expr = finishMemberExpression('[', expr, property);
    } else {
      break;
    }
  }

  return expr;
}

// 11.3 Postfix Expressions

function parsePostfixExpression() {
  var expr = parseLeftHandSideExpressionAllowCall();

  if (lookahead.type === TokenPunctuator) {
    if ((match('++') || match('--'))) {
      throw new Error(DISABLED);
    }
  }

  return expr;
}

// 11.4 Unary Operators

function parseUnaryExpression() {
  var token, expr;

  if (lookahead.type !== TokenPunctuator && lookahead.type !== TokenKeyword) {
    expr = parsePostfixExpression();
  } else if (match('++') || match('--')) {
    throw new Error(DISABLED);
  } else if (match('+') || match('-') || match('~') || match('!')) {
    token = lex();
    expr = parseUnaryExpression();
    expr = finishUnaryExpression(token.value, expr);
  } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
    throw new Error(DISABLED);
  } else {
    expr = parsePostfixExpression();
  }

  return expr;
}

function binaryPrecedence(token) {
  var prec = 0;

  if (token.type !== TokenPunctuator && token.type !== TokenKeyword) {
    return 0;
  }

  switch (token.value) {
    case '||':
      prec = 1;
      break;

    case '&&':
      prec = 2;
      break;

    case '|':
      prec = 3;
      break;

    case '^':
      prec = 4;
      break;

    case '&':
      prec = 5;
      break;

    case '==':
    case '!=':
    case '===':
    case '!==':
      prec = 6;
      break;

    case '<':
    case '>':
    case '<=':
    case '>=':
    case 'instanceof':
    case 'in':
      prec = 7;
      break;

    case '<<':
    case '>>':
    case '>>>':
      prec = 8;
      break;

    case '+':
    case '-':
      prec = 9;
      break;

    case '*':
    case '/':
    case '%':
      prec = 11;
      break;

    default:
      break;
  }

  return prec;
}

// 11.5 Multiplicative Operators
// 11.6 Additive Operators
// 11.7 Bitwise Shift Operators
// 11.8 Relational Operators
// 11.9 Equality Operators
// 11.10 Binary Bitwise Operators
// 11.11 Binary Logical Operators

function parseBinaryExpression() {
  var marker, markers, expr, token, prec, stack, right, operator, left, i;

  marker = lookahead;
  left = parseUnaryExpression();

  token = lookahead;
  prec = binaryPrecedence(token);
  if (prec === 0) {
    return left;
  }
  token.prec = prec;
  lex();

  markers = [marker, lookahead];
  right = parseUnaryExpression();

  stack = [left, token, right];

  while ((prec = binaryPrecedence(lookahead)) > 0) {

    // Reduce: make a binary expression from the three topmost entries.
    while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
      right = stack.pop();
      operator = stack.pop().value;
      left = stack.pop();
      markers.pop();
      expr = finishBinaryExpression(operator, left, right);
      stack.push(expr);
    }

    // Shift.
    token = lex();
    token.prec = prec;
    stack.push(token);
    markers.push(lookahead);
    expr = parseUnaryExpression();
    stack.push(expr);
  }

  // Final reduce to clean-up the stack.
  i = stack.length - 1;
  expr = stack[i];
  markers.pop();
  while (i > 1) {
    markers.pop();
    expr = finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
    i -= 2;
  }

  return expr;
}

// 11.12 Conditional Operator

function parseConditionalExpression() {
  var expr, consequent, alternate;

  expr = parseBinaryExpression();

  if (match('?')) {
    lex();
    consequent = parseConditionalExpression();
    expect(':');
    alternate = parseConditionalExpression();

    expr = finishConditionalExpression(expr, consequent, alternate);
  }

  return expr;
}

// 11.14 Comma Operator

function parseExpression$1() {
  var expr = parseConditionalExpression();

  if (match(',')) {
    throw new Error(DISABLED); // no sequence expressions
  }

  return expr;
}

var parse$3 = function(code) {
  source$1 = code;
  index = 0;
  length = source$1.length;
  lookahead = null;

  peek$1();

  var expr = parseExpression$1();

  if (lookahead.type !== TokenEOF) {
    throw new Error("Unexpect token after expression.");
  }
  return expr;
};

var Constants = {
  NaN:       'NaN',
  E:         'Math.E',
  LN2:       'Math.LN2',
  LN10:      'Math.LN10',
  LOG2E:     'Math.LOG2E',
  LOG10E:    'Math.LOG10E',
  PI:        'Math.PI',
  SQRT1_2:   'Math.SQRT1_2',
  SQRT2:     'Math.SQRT2',
  MIN_VALUE: 'Number.MIN_VALUE',
  MAX_VALUE: 'Number.MAX_VALUE'
};

var Functions = function(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + '(' + obj + ')';
      if (cast.lastIndexOf('new ', 0) === 0) obj = '(' + obj + ')';
    }
    return obj + '.' + name + (type < 0 ? '' : type === 0 ?
      '()' :
      '(' + args.slice(1).map(codegen).join(',') + ')');
  }

  function fn(name, cast, type) {
    return function(args) {
      return fncall(name, args, cast, type);
    };
  }

  var DATE = 'new Date',
      STRING = 'String',
      REGEXP = 'RegExp';

  return {
    // MATH functions
    isNaN:    'isNaN',
    isFinite: 'isFinite',
    abs:      'Math.abs',
    acos:     'Math.acos',
    asin:     'Math.asin',
    atan:     'Math.atan',
    atan2:    'Math.atan2',
    ceil:     'Math.ceil',
    cos:      'Math.cos',
    exp:      'Math.exp',
    floor:    'Math.floor',
    log:      'Math.log',
    max:      'Math.max',
    min:      'Math.min',
    pow:      'Math.pow',
    random:   'Math.random',
    round:    'Math.round',
    sin:      'Math.sin',
    sqrt:     'Math.sqrt',
    tan:      'Math.tan',

    clamp: function(args) {
      if (args.length < 3) error$1('Missing arguments to clamp function.');
      if (args.length > 3) error$1('Too many arguments to clamp function.');
      var a = args.map(codegen);
      return 'Math.max('+a[1]+', Math.min('+a[2]+','+a[0]+'))';
    },

    // DATE functions
    now:             'Date.now',
    utc:             'Date.UTC',
    datetime:        DATE,
    date:            fn('getDate', DATE, 0),
    day:             fn('getDay', DATE, 0),
    year:            fn('getFullYear', DATE, 0),
    month:           fn('getMonth', DATE, 0),
    hours:           fn('getHours', DATE, 0),
    minutes:         fn('getMinutes', DATE, 0),
    seconds:         fn('getSeconds', DATE, 0),
    milliseconds:    fn('getMilliseconds', DATE, 0),
    time:            fn('getTime', DATE, 0),
    timezoneoffset:  fn('getTimezoneOffset', DATE, 0),
    utcdate:         fn('getUTCDate', DATE, 0),
    utcday:          fn('getUTCDay', DATE, 0),
    utcyear:         fn('getUTCFullYear', DATE, 0),
    utcmonth:        fn('getUTCMonth', DATE, 0),
    utchours:        fn('getUTCHours', DATE, 0),
    utcminutes:      fn('getUTCMinutes', DATE, 0),
    utcseconds:      fn('getUTCSeconds', DATE, 0),
    utcmilliseconds: fn('getUTCMilliseconds', DATE, 0),

    // shared sequence functions
    length:      fn('length', null, -1),
    indexof:     fn('indexOf', null),
    lastindexof: fn('lastIndexOf', null),
    slice:       fn('slice', null),

    // STRING functions
    parseFloat:  'parseFloat',
    parseInt:    'parseInt',
    upper:       fn('toUpperCase', STRING, 0),
    lower:       fn('toLowerCase', STRING, 0),
    substring:   fn('substring', STRING),
    replace:     fn('replace', STRING),

    // REGEXP functions
    regexp:  REGEXP,
    test:    fn('test', REGEXP),

    // Control Flow functions
    if: function(args) {
        if (args.length < 3) error$1('Missing arguments to if function.');
        if (args.length > 3) error$1('Too many arguments to if function.');
        var a = args.map(codegen);
        return '('+a[0]+'?'+a[1]+':'+a[2]+')';
      }
  };
};

var codegen = function(opt) {
  opt = opt || {};

  var whitelist = opt.whitelist ? toSet(opt.whitelist) : {},
      blacklist = opt.blacklist ? toSet(opt.blacklist) : {},
      constants = opt.constants || Constants,
      functions = (opt.functions || Functions)(visit),
      globalvar = opt.globalvar,
      fieldvar = opt.fieldvar,
      globals = {},
      fields = {},
      memberDepth = 0;

  var outputGlobal = isFunction(globalvar)
    ? globalvar
    : function (id$$1) { return globalvar + '["' + id$$1 + '"]'; };

  function visit(ast) {
    if (isString(ast)) return ast;
    var generator = Generators[ast.type];
    if (generator == null) error$1('Unsupported type: ' + ast.type);
    return generator(ast);
  }

  var Generators = {
    Literal: function(n) {
        return n.raw;
      },

    Identifier: function(n) {
      var id$$1 = n.name;
      if (memberDepth > 0) {
        return id$$1;
      } else if (blacklist.hasOwnProperty(id$$1)) {
        return error$1('Illegal identifier: ' + id$$1);
      } else if (constants.hasOwnProperty(id$$1)) {
        return constants[id$$1];
      } else if (whitelist.hasOwnProperty(id$$1)) {
        return id$$1;
      } else {
        globals[id$$1] = 1;
        return outputGlobal(id$$1);
      }
    },

    MemberExpression: function(n) {
        var d = !n.computed;
        var o = visit(n.object);
        if (d) memberDepth += 1;
        var p = visit(n.property);
        if (o === fieldvar) { fields[p] = 1; } // HACKish...
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },

    CallExpression: function(n) {
        if (n.callee.type !== 'Identifier') {
          error$1('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) error$1('Unrecognized function: ' + callee);
        return isFunction(fn)
          ? fn(args)
          : fn + '(' + args.map(visit).join(',') + ')';
      },

    ArrayExpression: function(n) {
        return '[' + n.elements.map(visit).join(',') + ']';
      },

    BinaryExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },

    UnaryExpression: function(n) {
        return '(' + n.operator + visit(n.argument) + ')';
      },

    ConditionalExpression: function(n) {
        return '(' + visit(n.test) +
          '?' + visit(n.consequent) +
          ':' + visit(n.alternate) +
          ')';
      },

    LogicalExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },

    ObjectExpression: function(n) {
        return '{' + n.properties.map(visit).join(',') + '}';
      },

    Property: function(n) {
        memberDepth += 1;
        var k = visit(n.key);
        memberDepth -= 1;
        return k + ':' + visit(n.value);
      }
  };

  function codegen(ast) {
    var result = {
      code:    visit(ast),
      globals: Object.keys(globals),
      fields:  Object.keys(fields)
    };
    globals = {};
    fields = {};
    return result;
  }

  codegen.functions = functions;
  codegen.constants = constants;

  return codegen;
};

var formatCache = {};

function formatter(type, method, specifier) {
  var k = type + ':' + specifier,
      e = formatCache[k];
  if (!e || e[0] !== method) {
    formatCache[k] = (e = [method, method(specifier)]);
  }
  return e[1];
}

function format$1(_$$1, specifier) {
  return formatter('format', d3Format.format, specifier)(_$$1);
}

function timeFormat$1(_$$1, specifier) {
  return formatter('timeFormat', d3TimeFormat.timeFormat, specifier)(_$$1);
}

function utcFormat$1(_$$1, specifier) {
  return formatter('utcFormat', d3TimeFormat.utcFormat, specifier)(_$$1);
}

function timeParse$1(_$$1, specifier) {
  return formatter('timeParse', d3TimeFormat.timeParse, specifier)(_$$1);
}

function utcParse$1(_$$1, specifier) {
  return formatter('utcParse', d3TimeFormat.utcParse, specifier)(_$$1);
}

var dateObj = new Date(2000, 0, 1);

function time$1(month, day, specifier) {
  dateObj.setMonth(month);
  dateObj.setDate(day);
  return timeFormat$1(dateObj, specifier);
}

function monthFormat(month) {
  return time$1(month, 1, '%B');
}

function monthAbbrevFormat(month) {
  return time$1(month, 1, '%b');
}

function dayFormat(day) {
  return time$1(0, 2 + day, '%A');
}

function dayAbbrevFormat(day) {
  return time$1(0, 2 + day, '%a');
}

function quarter(date) {
  return 1 + ~~(new Date(date).getMonth() / 3);
}

function utcquarter(date) {
  return 1 + ~~(new Date(date).getUTCMonth() / 3);
}

function log$2(df, method, args) {
  try {
    df[method].apply(df, ['EXPRESSION'].concat([].slice.call(args)));
  } catch (err) {
    df.warn(err);
  }
  return args[args.length-1];
}

function warn() {
  return log$2(this.context.dataflow, 'warn', arguments);
}

function info() {
  return log$2(this.context.dataflow, 'info', arguments);
}

function debug() {
  return log$2(this.context.dataflow, 'debug', arguments);
}

var inScope = function(item) {
  var group = this.context.group,
      value = false;

  if (group) while (item) {
    if (item === group) { value = true; break; }
    item = item.mark.group;
  }
  return value;
};

/**
 * Span-preserving range clamp. If the span of the input range is less
 * than (max - min) and an endpoint exceeds either the min or max value,
 * the range is translated such that the span is preserved and one
 * endpoint touches the boundary of the min/max range.
 * If the span exceeds (max - min), the range [min, max] is returned.
 */
var clampRange = function(range$$1, min$$1, max$$1) {
  var lo = range$$1[0],
      hi = range$$1[1],
      span;

  if (hi < lo) {
    span = hi;
    hi = lo;
    lo = span;
  }
  span = hi - lo;

  return span >= (max$$1 - min$$1)
    ? [min$$1, max$$1]
    : [
        Math.min(Math.max(lo, min$$1), max$$1 - span),
        Math.min(Math.max(hi, span), max$$1)
      ];
};

function pinchDistance(event) {
  var t = event.touches,
      dx = t[0].clientX - t[1].clientX,
      dy = t[0].clientY - t[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function pinchAngle(event) {
  var t = event.touches;
  return Math.atan2(
    t[0].clientY - t[1].clientY,
    t[0].clientX - t[1].clientX
  );
}

var _window = (typeof window !== 'undefined' && window) || null;

function screen() {
  return _window ? _window.screen : {};
}

function windowSize() {
  return _window
    ? [_window.innerWidth, _window.innerHeight]
    : [undefined, undefined];
}

function containerSize() {
  var view = this.context.dataflow,
      el = view.container && view.container();
  return el
    ? [el.clientWidth, el.clientHeight]
    : [undefined, undefined];
}

var span = function(array) {
  return (array[array.length-1] - array[0]) || 0;
};

var Literal = 'Literal';
var Identifier$1 = 'Identifier';

var indexPrefix  = '@';
var scalePrefix  = '%';
var dataPrefix   = ':';

function getScale(name, ctx) {
  var s;
  return isFunction(name) ? name
    : isString(name) ? (s = ctx.scales[name]) && s.value
    : undefined;
}

function addScaleDependency(scope, params, name) {
  var scaleName = scalePrefix + name;
  if (!params.hasOwnProperty(scaleName)) {
    try {
      params[scaleName] = scope.scaleRef(name);
    } catch (err) {
      // TODO: error handling? warning?
    }
  }
}

function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal) {
    // add scale dependency
    addScaleDependency(scope, params, args[0].value);
  }
  else if (args[0].type === Identifier$1) {
    // indirect scale lookup; add all scales as parameters
    for (name in scope.scales) {
      addScaleDependency(scope, params, name);
    }
  }
}

function range$2(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.range ? s.range() : [];
}

function domain(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.domain() : [];
}

function bandwidth(name, group) {
  var s = getScale(name, (group || this).context);
  return s && s.bandwidth ? s.bandwidth() : 0;
}

function bandspace(count, paddingInner, paddingOuter) {
  return bandSpace(count || 0, paddingInner || 0, paddingOuter || 0);
}

function copy(name, group) {
  var s = getScale(name, (group || this).context);
  return s ? s.copy() : undefined;
}

function scale$2(name, value, group) {
  var s = getScale(name, (group || this).context);
  return s ? s(value) : undefined;
}

function invert(name, range$$1, group) {
  var s = getScale(name, (group || this).context);
  return !s ? undefined
    : isArray(range$$1) ? (s.invertRange || s.invert)(range$$1)
    : (s.invert || s.invertExtent)(range$$1);
}

var scaleGradient = function(scale, p0, p1, count) {
  var gradient = Gradient(p0, p1),
      stops = scale.domain(),
      min$$1 = stops[0],
      max$$1 = stops[stops.length-1],
      fraction = scaleFraction(scale, min$$1, max$$1);

  if (scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min$$1 !== stops[0]) stops.unshift(min$$1);
    if (max$$1 !== stops[stops.length-1]) stops.push(max$$1);
  }

  for (var i=0, n=stops.length; i<n; ++i) {
    gradient.stop(fraction(stops[i]), scale(stops[i]));
  }

  return gradient;
};

function geoMethod(method) {
  return function(projection, geojson, group) {
    var p = getScale(projection, (group || this).context);
    return p && p.path[method](geojson);
  };
}

var geoArea = geoMethod('area');
var geoBounds = geoMethod('bounds');
var geoCentroid = geoMethod('centroid');

function data$1(name) {
  var data = this.context.data[name];
  return data ? data.values.value : [];
}

function dataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) {
    error$1('First argument to data functions must be a string literal.');
  }

  var data = args[0].value,
      dataName = dataPrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}

function indata(name, field$$1, value) {
  var index = this.context.data[name]['index:' + field$$1],
      entry = index ? index.value.get(value) : undefined;
  return entry ? entry.count : entry;
}

function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error$1('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error$1('Second argument to indata must be a string literal.');

  var data = args[0].value,
      field$$1 = args[1].value,
      indexName = indexPrefix + field$$1;

  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field$$1);
  }
}

function setdata(name, tuples) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input;

  df.pulse(input, df.changeset().remove(truthy).insert(tuples));
  return 1;
}

var EMPTY = {};

function datum(d) { return d.data; }

function treeNodes(name, context) {
  var tree$$1 = data$1.call(context, name);
  return tree$$1.root && tree$$1.root.lookup || EMPTY;
}

function treePath(name, source, target) {
  var nodes = treeNodes(name, this),
      s = nodes[source],
      t = nodes[target];
  return s && t ? s.path(t).map(datum) : undefined;
}

function treeAncestors(name, node) {
  var n = treeNodes(name, this)[node];
  return n ? n.ancestors().map(datum) : undefined;
}

var inrange = function(value, range$$1, left, right) {
  var r0 = range$$1[0], r1 = range$$1[range$$1.length-1], t;
  if (r0 > r1) {
    t = r0;
    r0 = r1;
    r1 = t;
  }
  left = left === undefined || left;
  right = right === undefined || right;

  return (left ? r0 <= value : r0 < value) &&
    (right ? value <= r1 : value < r1);
};

var encode$1 = function(item, name, retval) {
  if (item) {
    var df = this.context.dataflow,
        target = item.mark.source;
    df.pulse(target, df.changeset().encode(item, name));
  }
  return retval !== undefined ? retval : item;
};

function equal(a, b) {
  return a === b || a !== a && b !== b ? true
    : isArray(a) && isArray(b) && a.length === b.length ? equalArray(a, b)
    : false;
}

function equalArray(a, b) {
  for (var i=0, n=a.length; i<n; ++i) {
    if (!equal(a[i], b[i])) return false;
  }
  return true;
}

function removePredicate(props) {
  return function(_$$1) {
    for (var key$$1 in props) {
      if (!equal(_$$1[key$$1], props[key$$1])) return false;
    }
    return true;
  };
}

var modify = function(name, insert, remove, toggle, modify, values) {
  var df = this.context.dataflow,
      data = this.context.data[name],
      input = data.input,
      changes = data.changes,
      stamp = df.stamp(),
      predicate, key$$1;

  if (df._trigger === false || !(input.value.length || insert || toggle)) {
    // nothing to do!
    return 0;
  }

  if (!changes || changes.stamp < stamp) {
    data.changes = (changes = df.changeset());
    changes.stamp = stamp;
    df.runAfter(function() {
      data.modified = true;
      df.pulse(input, changes).run();
    }, true);
  }

  if (remove) {
    predicate = remove === true ? truthy
      : (isArray(remove) || isTuple(remove)) ? remove
      : removePredicate(remove);
    changes.remove(predicate);
  }

  if (insert) {
    changes.insert(insert);
  }

  if (toggle) {
    predicate = removePredicate(toggle);
    if (input.value.some(predicate)) {
      changes.remove(predicate);
    } else {
      changes.insert(toggle);
    }
  }

  if (modify) {
    for (key$$1 in values) {
      changes.modify(modify, key$$1, values[key$$1]);
    }
  }

  return 1;
};

var BIN = 'bin_';
var INTERSECT = 'intersect';
var UNION = 'union';
var UNIT_INDEX = 'index:unit';

function testPoint(datum, entry) {
  var fields = entry.fields,
      values = entry.values,
      getter = entry.getter || (entry.getter = []),
      n = fields.length,
      i = 0, dval;

  for (; i<n; ++i) {
    getter[i] = getter[i] || field(fields[i]);
    dval = getter[i](datum);
    if (isDate(dval)) dval = toNumber(dval);
    if (isDate(values[i])) values[i] = toNumber(values[i]);
    if (entry[BIN + fields[i]]) {
      if (isDate(values[i][0])) values[i] = values[i].map(toNumber);
      if (!inrange(dval, values[i], true, false)) return false;
    } else if (dval !== values[i]) {
      return false;
    }
  }

  return true;
}

// TODO: revisit date coercion?
// have selections populate with consistent types upon write?

function testInterval(datum, entry) {
  var ivals = entry.intervals,
      n = ivals.length,
      i = 0,
      getter, extent$$1, value;

  for (; i<n; ++i) {
    extent$$1 = ivals[i].extent;
    getter = ivals[i].getter || (ivals[i].getter = field(ivals[i].field));
    value = getter(datum);
    if (!extent$$1 || extent$$1[0] === extent$$1[1]) return false;
    if (isDate(value)) value = toNumber(value);
    if (isDate(extent$$1[0])) extent$$1 = ivals[i].extent = extent$$1.map(toNumber);
    if (isNumber(extent$$1[0]) && !inrange(value, extent$$1)) return false;
    else if (isString(extent$$1[0]) && extent$$1.indexOf(value) < 0) return false;
  }

  return true;
}

/**
 * Tests if a tuple is contained within an interactive selection.
 * @param {string} name - The name of the data set representing the selection.
 * @param {object} datum - The tuple to test for inclusion.
 * @param {string} op - The set operation for combining selections.
 *   One of 'intersect' or 'union' (default).
 * @param {function(object,object):boolean} test - A boolean-valued test
 *   predicate for determining selection status within a single unit chart.
 * @return {boolean} - True if the datum is in the selection, false otherwise.
 */
function vlSelection(name, datum, op, test) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      unitIdx = data ? data[UNIT_INDEX] && data[UNIT_INDEX].value : undefined,
      intersect = op === INTERSECT,
      n = entries.length,
      i = 0,
      entry, miss, count, unit, b;

  for (; i<n; ++i) {
    entry = entries[i];

    if (unitIdx && intersect) {
      // multi selections union within the same unit and intersect across units.
      miss = miss || {};
      count = miss[unit=entry.unit] || 0;

      // if we've already matched this unit, skip.
      if (count === -1) continue;

      b = test(datum, entry);
      miss[unit] = b ? -1 : ++count;

      // if we match and there are no other units return true
      // if we've missed against all tuples in this unit return false
      if (b && unitIdx.size === 1) return true;
      if (!b && count === unitIdx.get(unit).count) return false;
    } else {
      b = test(datum, entry);

      // if we find a miss and we do require intersection return false
      // if we find a match and we don't require intersection return true
      if (intersect ^ b) return b;
    }
  }

  // if intersecting and we made it here, then we saw no misses
  // if not intersecting, then we saw no matches
  // if no active selections, return false
  return n && intersect;
}

// Assumes point selection tuples are of the form:
// {unit: string, encodings: array<string>, fields: array<string>, values: array<*>, bins: object}
function vlPoint(name, datum, op) {
  return vlSelection.call(this, name, datum, op, testPoint);
}

// Assumes interval selection typles are of the form:
// {unit: string, intervals: array<{encoding: string, field:string, extent:array<number>}>}
function vlInterval(name, datum, op) {
  return vlSelection.call(this, name, datum, op, testInterval);
}

function vlMultiVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error$1('First argument to indata must be a string literal.');

  var data = args[0].value,
      // vlMulti, vlMultiDomain have different # of params, but op is always last.
      op = args.length >= 2 && args[args.length-1].value,
      field$$1 = 'unit',
      indexName = indexPrefix + field$$1;

  if (op === INTERSECT && !params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field$$1);
  }

  dataVisitor(name, args, scope, params);
}

/**
 * Materializes a point selection as a scale domain.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='intersect'] - The set operation for combining selections.
 * One of 'intersect' (default) or 'union'.
 * @returns {array} An array of values to serve as a scale domain.
 */
function vlPointDomain(name, encoding, field$$1, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      unitIdx = data ? data[UNIT_INDEX] && data[UNIT_INDEX].value : undefined,
      entry = entries[0],
      i = 0, n, index, values, continuous, units;

  if (!entry) return undefined;

  for (n = encoding ? entry.encodings.length : entry.fields.length; i<n; ++i) {
    if ((encoding && entry.encodings[i] === encoding) ||
        (field$$1 && entry.fields[i] === field$$1)) {
      index = i;
      continuous = entry[BIN + entry.fields[i]];
      break;
    }
  }

  // multi selections union within the same unit and intersect across units.
  // if we've got only one unit, enforce union for more efficient materialization.
  if (unitIdx && unitIdx.size === 1) {
    op = UNION;
  }

  if (unitIdx && op === INTERSECT) {
    units = entries.reduce(function(acc, entry) {
      var u = acc[entry.unit] || (acc[entry.unit] = []);
      u.push({unit: entry.unit, value: entry.values[index]});
      return acc;
    }, {});

    values = Object.keys(units).map(function(unit) {
      return {
        unit: unit,
        value: continuous
          ? continuousDomain(units[unit], UNION)
          : discreteDomain(units[unit], UNION)
      };
    });
  } else {
    values = entries.map(function(entry) {
      return {unit: entry.unit, value: entry.values[index]};
    });
  }

  return continuous ? continuousDomain(values, op) : discreteDomain(values, op);
}

/**
 * Materializes an interval selection as a scale domain.
 * @param {string} name - The name of the dataset representing the selection.
 * @param {string} [encoding] - A particular encoding channel to materialize.
 * @param {string} [field] - A particular field to materialize.
 * @param {string} [op='union'] - The set operation for combining selections.
 * One of 'intersect' or 'union' (default).
 * @returns {array} An array of values to serve as a scale domain.
 */
function vlIntervalDomain(name, encoding, field$$1, op) {
  var data = this.context.data[name],
      entries = data ? data.values.value : [],
      entry = entries[0],
      i = 0, n, interval, index, values, discrete;

  if (!entry) return undefined;

  for (n = entry.intervals.length; i<n; ++i) {
    interval = entry.intervals[i];
    if ((encoding && interval.encoding === encoding) ||
        (field$$1 && interval.field === field$$1)) {
      if (!interval.extent) return undefined;
      index = i;
      discrete = interval.extent.length > 2;
      break;
    }
  }

  values = entries.reduce(function(acc, entry) {
    var extent$$1 = entry.intervals[index].extent,
        value = discrete
           ? extent$$1.map(function (d) { return {unit: entry.unit, value: d}; })
           : {unit: entry.unit, value: extent$$1};

    if (discrete) {
      acc.push.apply(acc, value);
    } else {
      acc.push(value);
    }
    return acc;
  }, []);


  return discrete ? discreteDomain(values, op) : continuousDomain(values, op);
}

function discreteDomain(entries, op) {
  var units = {}, count = 0,
      values = {}, domain = [],
      i = 0, n = entries.length,
      entry, unit, v, key$$1;

  for (; i<n; ++i) {
    entry = entries[i];
    unit  = entry.unit;
    key$$1   = entry.value;

    if (!units[unit]) units[unit] = ++count;
    if (!(v = values[key$$1])) {
      values[key$$1] = v = {value: key$$1, units: {}, count: 0};
    }
    if (!v.units[unit]) v.units[unit] = ++v.count;
  }

  for (key$$1 in values) {
    v = values[key$$1];
    if (op === INTERSECT && v.count !== count) continue;
    domain.push(v.value);
  }

  return domain.length ? domain : undefined;
}

function continuousDomain(entries, op) {
  var merge$$1 = op === INTERSECT ? intersectInterval : unionInterval,
      i = 0, n = entries.length,
      extent$$1, domain, lo, hi;

  for (; i<n; ++i) {
    extent$$1 = entries[i].value;
    if (isDate(extent$$1[0])) extent$$1 = extent$$1.map(toNumber);
    lo = extent$$1[0];
    hi = extent$$1[1];
    if (lo > hi) {
      hi = extent$$1[0];
      lo = extent$$1[1];
    }
    domain = domain ? merge$$1(domain, lo, hi) : [lo, hi];
  }

  return domain && domain.length && (+domain[0] !== +domain[1])
    ? domain
    : undefined;
}

function unionInterval(domain, lo, hi) {
  if (domain[0] > lo) domain[0] = lo;
  if (domain[1] < hi) domain[1] = hi;
  return domain;
}

function intersectInterval(domain, lo, hi) {
  if (hi < domain[0] || domain[1] < lo) {
    return [];
  } else {
    if (domain[0] < lo) domain[0] = lo;
    if (domain[1] > hi) domain[1] = hi;
  }
  return domain;
}

// Expression function context object
var functionContext = {
  random: function() { return exports.random(); }, // override default
  isArray: isArray,
  isBoolean: isBoolean,
  isDate: isDate,
  isNumber: isNumber,
  isObject: isObject,
  isRegExp: isRegExp,
  isString: isString,
  isTuple: isTuple,
  toBoolean: toBoolean,
  toDate: toDate,
  toNumber: toNumber,
  toString: toString,
  pad: pad,
  peek: peek,
  truncate: truncate,
  rgb: d3Color.rgb,
  lab: d3Color.lab,
  hcl: d3Color.hcl,
  hsl: d3Color.hsl,
  sequence: d3Array.range,
  format: format$1,
  utcFormat: utcFormat$1,
  utcParse: utcParse$1,
  timeFormat: timeFormat$1,
  timeParse: timeParse$1,
  monthFormat: monthFormat,
  monthAbbrevFormat: monthAbbrevFormat,
  dayFormat: dayFormat,
  dayAbbrevFormat: dayAbbrevFormat,
  quarter: quarter,
  utcquarter: utcquarter,
  warn: warn,
  info: info,
  debug: debug,
  inScope: inScope,
  clampRange: clampRange,
  pinchDistance: pinchDistance,
  pinchAngle: pinchAngle,
  screen: screen,
  containerSize: containerSize,
  windowSize: windowSize,
  span: span,
  bandspace: bandspace,
  inrange: inrange,
  setdata: setdata,
  panLinear: panLinear,
  panLog: panLog,
  panPow: panPow,
  zoomLinear: zoomLinear,
  zoomLog: zoomLog,
  zoomPow: zoomPow,
  encode: encode$1,
  modify: modify
};

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];
var eventPrefix = 'event.vega.';
var thisPrefix = 'this.';
var astVisitors = {}; // AST visitors for dependency analysis

function expressionFunction(name, fn, visitor) {
  if (arguments.length === 1) {
    return functionContext[name];
  }

  // register with the functionContext
  functionContext[name] = fn;

  // if there is an astVisitor register that, too
  if (visitor) astVisitors[name] = visitor;

  // if the code generator has already been initialized,
  // we need to also register the function with it
  if (codeGenerator) codeGenerator.functions[name] = thisPrefix + name;
  return this;
}

// register expression functions with ast visitors
expressionFunction('bandwidth', bandwidth, scaleVisitor);
expressionFunction('copy', copy, scaleVisitor);
expressionFunction('domain', domain, scaleVisitor);
expressionFunction('range', range$2, scaleVisitor);
expressionFunction('invert', invert, scaleVisitor);
expressionFunction('scale', scale$2, scaleVisitor);
expressionFunction('gradient', scaleGradient, scaleVisitor);
expressionFunction('geoArea', geoArea, scaleVisitor);
expressionFunction('geoBounds', geoBounds, scaleVisitor);
expressionFunction('geoCentroid', geoCentroid, scaleVisitor);
expressionFunction('indata', indata, indataVisitor);
expressionFunction('data', data$1, dataVisitor);
expressionFunction('vlSingle', vlPoint, dataVisitor);
expressionFunction('vlSingleDomain', vlPointDomain, dataVisitor);
expressionFunction('vlMulti', vlPoint, vlMultiVisitor);
expressionFunction('vlMultiDomain', vlPointDomain, vlMultiVisitor);
expressionFunction('vlInterval', vlInterval, dataVisitor);
expressionFunction('vlIntervalDomain', vlIntervalDomain, dataVisitor);
expressionFunction('treePath', treePath, dataVisitor);
expressionFunction('treeAncestors', treeAncestors, dataVisitor);

// Build expression function registry
function buildFunctions(codegen$$1) {
  var fn = Functions(codegen$$1);
  eventFunctions.forEach(function(name) { fn[name] = eventPrefix + name; });
  for (var name in functionContext) { fn[name] = thisPrefix + name; }
  return fn;
}

// Export code generator and parameters
var codegenParams = {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event', 'item'],
  fieldvar:   'datum',
  globalvar:  function(id$$1) { return '_[' + $$2('$' + id$$1) + ']'; },
  functions:  buildFunctions,
  constants:  Constants,
  visitors:   astVisitors
};

var codeGenerator = codegen(codegenParams);

var signalPrefix = '$';

var parseExpression = function(expr, scope, preamble) {
  var params = {}, ast, gen;

  // parse the expression to an abstract syntax tree (ast)
  try {
    ast = parse$3(expr);
  } catch (err) {
    error$1('Expression parse error: ' + $$2(expr));
  }

  // analyze ast function calls for dependencies
  ast.visit(function visitor(node) {
    if (node.type !== 'CallExpression') return;
    var name = node.callee.name,
        visit = codegenParams.visitors[name];
    if (visit) visit(name, node.arguments, scope, params);
  });

  // perform code generation
  gen = codeGenerator(ast);

  // collect signal dependencies
  gen.globals.forEach(function(name) {
    var signalName = signalPrefix + name;
    if (!params.hasOwnProperty(signalName) && scope.getSignal(name)) {
      params[signalName] = scope.signalRef(name);
    }
  });

  // return generated expression code and dependencies
  return {
    $expr:   preamble ? preamble + 'return(' + gen.code + ');' : gen.code,
    $fields: gen.fields,
    $params: params
  };
};

var VIEW$1 = 'view';
var SCOPE = 'scope';

var parseStream = function(stream, scope) {
  return stream.signal ? scope.getSignal(stream.signal).id
    : stream.scale ? scope.getScale(stream.scale).id
    : parseStream$1(stream, scope);
};

function eventSource(source) {
   return source === SCOPE ? VIEW$1 : (source || VIEW$1);
}

function parseStream$1(stream, scope) {
  var method = stream.merge ? mergeStream
    : stream.stream ? nestedStream
    : stream.type ? eventStream
    : error$1('Invalid stream specification: ' + $$2(stream));

  return method(stream, scope);
}

function mergeStream(stream, scope) {
  var list = stream.merge.map(function(s) {
    return parseStream$1(s, scope);
  });

  var entry = streamParameters({merge: list}, stream, scope);
  return scope.addStream(entry).id;
}

function nestedStream(stream, scope) {
  var id$$1 = parseStream$1(stream.stream, scope),
      entry = streamParameters({stream: id$$1}, stream, scope);
  return scope.addStream(entry).id;
}

function eventStream(stream, scope) {
  var id$$1 = scope.event(eventSource(stream.source), stream.type),
      entry = streamParameters({stream: id$$1}, stream, scope);
  return Object.keys(entry).length === 1 ? id$$1
    : scope.addStream(entry).id;
}

function streamParameters(entry, stream, scope) {
  var param = stream.between;

  if (param) {
    if (param.length !== 2) {
      error$1('Stream "between" parameter must have 2 entries: ' + $$2(stream));
    }
    entry.between = [
      parseStream$1(param[0], scope),
      parseStream$1(param[1], scope)
    ];
  }

  param = stream.filter ? array(stream.filter) : [];
  if (stream.marktype || stream.markname || stream.markrole) {
    // add filter for mark type, name and/or role
    param.push(filterMark(stream.marktype, stream.markname, stream.markrole));
  }
  if (stream.source === SCOPE) {
    // add filter to limit events from sub-scope only
    param.push('inScope(event.item)');
  }
  if (param.length) {
    entry.filter = parseExpression('(' + param.join(')&&(') + ')').$expr;
  }

  if ((param = stream.throttle) != null) {
    entry.throttle = +param;
  }

  if ((param = stream.debounce) != null) {
    entry.debounce = +param;
  }

  if (stream.consume) {
    entry.consume = true;
  }

  return entry;
}

function filterMark(type, name, role) {
  var item = 'event.item';
  return item
    + (type && type !== '*' ? '&&' + item + '.mark.marktype===\'' + type + '\'' : '')
    + (role ? '&&' + item + '.mark.role===\'' + role + '\'' : '')
    + (name ? '&&' + item + '.mark.name===\'' + name + '\'' : '');
}

/**
 * Parse an event selector string.
 * Returns an array of event stream definitions.
 */
var selector = function(selector, source, marks) {
  DEFAULT_SOURCE = source || VIEW$2;
  MARKS = marks || DEFAULT_MARKS;
  return parseMerge(selector.trim()).map(parseSelector);
};

var VIEW$2    = 'view';
var LBRACK  = '[';
var RBRACK  = ']';
var LBRACE  = '{';
var RBRACE  = '}';
var COLON   = ':';
var COMMA   = ',';
var NAME    = '@';
var GT      = '>';
var ILLEGAL$1 = /[[\]{}]/;
var DEFAULT_SOURCE;
var MARKS;
var DEFAULT_MARKS = {
      '*': 1,
      arc: 1,
      area: 1,
      group: 1,
      image: 1,
      line: 1,
      path: 1,
      rect: 1,
      rule: 1,
      shape: 1,
      symbol: 1,
      text: 1,
      trail: 1
    };

function isMarkType(type) {
  return MARKS.hasOwnProperty(type);
}

function find(s, i, endChar, pushChar, popChar) {
  var count = 0,
      n = s.length,
      c;
  for (; i<n; ++i) {
    c = s[i];
    if (!count && c === endChar) return i;
    else if (popChar && popChar.indexOf(c) >= 0) --count;
    else if (pushChar && pushChar.indexOf(c) >= 0) ++count;
  }
  return i;
}

function parseMerge(s) {
  var output = [],
      start = 0,
      n = s.length,
      i = 0;

  while (i < n) {
    i = find(s, i, COMMA, LBRACK + LBRACE, RBRACK + RBRACE);
    output.push(s.substring(start, i).trim());
    start = ++i;
  }

  if (output.length === 0) {
    throw 'Empty event selector: ' + s;
  }
  return output;
}

function parseSelector(s) {
  return s[0] === '['
    ? parseBetween(s)
    : parseStream$2(s);
}

function parseBetween(s) {
  var n = s.length,
      i = 1,
      b, stream;

  i = find(s, i, RBRACK, LBRACK, RBRACK);
  if (i === n) {
    throw 'Empty between selector: ' + s;
  }

  b = parseMerge(s.substring(1, i));
  if (b.length !== 2) {
    throw 'Between selector must have two elements: ' + s;
  }

  s = s.slice(i + 1).trim();
  if (s[0] !== GT) {
    throw 'Expected \'>\' after between selector: ' + s;
  }

  b = b.map(parseSelector);

  stream = parseSelector(s.slice(1).trim());
  if (stream.between) {
    return {
      between: b,
      stream: stream
    };
  } else {
    stream.between = b;
  }

  return stream;
}

function parseStream$2(s) {
  var stream = {source: DEFAULT_SOURCE},
      source = [],
      throttle = [0, 0],
      markname = 0,
      start = 0,
      n = s.length,
      i = 0, j,
      filter;

  // extract throttle from end
  if (s[n-1] === RBRACE) {
    i = s.lastIndexOf(LBRACE);
    if (i >= 0) {
      try {
        throttle = parseThrottle(s.substring(i+1, n-1));
      } catch (e) {
        throw 'Invalid throttle specification: ' + s;
      }
      s = s.slice(0, i).trim();
      n = s.length;
    } else throw 'Unmatched right brace: ' + s;
    i = 0;
  }

  if (!n) throw s;

  // set name flag based on first char
  if (s[0] === NAME) markname = ++i;

  // extract first part of multi-part stream selector
  j = find(s, i, COLON);
  if (j < n) {
    source.push(s.substring(start, j).trim());
    start = i = ++j;
  }

  // extract remaining part of stream selector
  i = find(s, i, LBRACK);
  if (i === n) {
    source.push(s.substring(start, n).trim());
  } else {
    source.push(s.substring(start, i).trim());
    filter = [];
    start = ++i;
    if (start === n) throw 'Unmatched left bracket: ' + s;
  }

  // extract filters
  while (i < n) {
    i = find(s, i, RBRACK);
    if (i === n) throw 'Unmatched left bracket: ' + s;
    filter.push(s.substring(start, i).trim());
    if (i < n-1 && s[++i] !== LBRACK) throw 'Expected left bracket: ' + s;
    start = ++i;
  }

  // marshall event stream specification
  if (!(n = source.length) || ILLEGAL$1.test(source[n-1])) {
    throw 'Invalid event selector: ' + s;
  }

  if (n > 1) {
    stream.type = source[1];
    if (markname) {
      stream.markname = source[0].slice(1);
    } else if (isMarkType(source[0])) {
      stream.marktype = source[0];
    } else {
      stream.source = source[0];
    }
  } else {
    stream.type = source[0];
  }
  if (stream.type.slice(-1) === '!') {
    stream.consume = true;
    stream.type = stream.type.slice(0, -1);
  }
  if (filter != null) stream.filter = filter;
  if (throttle[0]) stream.throttle = throttle[0];
  if (throttle[1]) stream.debounce = throttle[1];

  return stream;
}

function parseThrottle(s) {
  var a = s.split(COMMA);
  if (!s.length || a.length > 2) throw s;
  return a.map(function(_$$1) {
    var x = +_$$1;
    if (x !== x) throw s;
    return x;
  });
}

var preamble = 'var datum=event.item&&event.item.datum;';

var parseUpdate = function(spec, scope, target) {
  var events = spec.events,
      update = spec.update,
      encode = spec.encode,
      sources = [],
      value = '', entry;

  if (!events) {
    error$1('Signal update missing events specification.');
  }

  // interpret as an event selector string
  if (isString(events)) {
    events = selector(events);
  }

  // separate event streams from signal updates
  events = array(events).filter(function(stream) {
    if (stream.signal || stream.scale) {
      sources.push(stream);
      return 0;
    } else {
      return 1;
    }
  });

  // merge event streams, include as source
  if (events.length) {
    sources.push(events.length > 1 ? {merge: events} : events[0]);
  }

  if (encode != null) {
    if (update) error$1('Signal encode and update are mutually exclusive.');
    update = 'encode(item(),' + $$2(encode) + ')';
  }

  // resolve update value
  value = isString(update) ? parseExpression(update, scope, preamble)
    : update.expr != null ? parseExpression(update.expr, scope, preamble)
    : update.value != null ? update.value
    : update.signal != null ? {
        $expr:   '_.value',
        $params: {value: scope.signalRef(update.signal)}
      }
    : error$1('Invalid signal update specification.');

  entry = {
    target: target,
    update: value
  };

  if (spec.force) {
    entry.options = {force: true};
  }

  sources.forEach(function(source) {
    source = {source: parseStream(source, scope)};
    scope.addUpdate(extend(source, entry));
  });
};

var parseSignalUpdates = function(signal, scope) {
  var op = scope.getSignal(signal.name);

  if (signal.update) {
    var expr = parseExpression(signal.update, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }

  if (signal.on) {
    signal.on.forEach(function(_$$1) {
      parseUpdate(_$$1, scope, op.id);
    });
  }
};

function Entry(type, value, params, parent) {
  this.id = -1;
  this.type = type;
  this.value = value;
  this.params = params;
  if (parent) this.parent = parent;
}

function entry(type, value, params, parent) {
  return new Entry(type, value, params, parent);
}

function operator(value, params) {
  return entry('operator', value, params);
}

// -----

function ref(op) {
  var ref = {$ref: op.id};
  // if operator not yet registered, cache ref to resolve later
  if (op.id < 0) (op.refs = op.refs || []).push(ref);
  return ref;
}

var tupleidRef = {
  $tupleid: 1,
  toString: function() { return ':_tupleid_:'; }
};

function fieldRef$1(field$$1, name) {
  return name ? {$field: field$$1, $name: name} : {$field: field$$1};
}

var keyFieldRef = fieldRef$1('key');

function compareRef(fields, orders) {
  return {$compare: fields, $order: orders};
}

function keyRef(fields) {
  return {$key: fields};
}

// -----

var Ascending  = 'ascending';

var Descending = 'descending';

function sortKey(sort) {
  return !isObject(sort) ? ''
    : (sort.order === Descending ? '-' : '+')
      + aggrField(sort.op, sort.field);
}

function aggrField(op, field$$1) {
  return (op && op.signal ? '$' + op.signal : op || '')
    + (op && field$$1 ? '_' : '')
    + (field$$1 && field$$1.signal ? '$' + field$$1.signal : field$$1 || '');
}

// -----

function isSignal(_$$1) {
  return _$$1 && _$$1.signal;
}

function value(specValue, defaultValue) {
  return specValue != null ? specValue : defaultValue;
}

function transform$1(name) {
  return function(params, value$$1, parent) {
    return entry(name, value$$1, params || undefined, parent);
  };
}

var Aggregate$1 = transform$1('aggregate');
var AxisTicks$1 = transform$1('axisticks');
var Bound$1 = transform$1('bound');
var Collect$1 = transform$1('collect');
var Compare$1 = transform$1('compare');
var DataJoin$1 = transform$1('datajoin');
var Encode$1 = transform$1('encode');

var Facet$1 = transform$1('facet');
var Field$1 = transform$1('field');
var Key$1 = transform$1('key');
var LegendEntries$1 = transform$1('legendentries');
var Mark$1 = transform$1('mark');
var MultiExtent$1 = transform$1('multiextent');
var MultiValues$1 = transform$1('multivalues');
var Overlap$1 = transform$1('overlap');
var Params$2 = transform$1('params');
var PreFacet$1 = transform$1('prefacet');
var Projection$1 = transform$1('projection');
var Proxy$1 = transform$1('proxy');
var Relay$1 = transform$1('relay');
var Render$1 = transform$1('render');
var Scale$1 = transform$1('scale');
var Sieve$1 = transform$1('sieve');
var SortItems$1 = transform$1('sortitems');
var ViewLayout$1 = transform$1('viewlayout');
var Values$1 = transform$1('values');

var FIELD_REF_ID = 0;

var types = [
  'identity',
  'ordinal', 'band', 'point',
  'bin-linear', 'bin-ordinal',
  'linear', 'pow', 'sqrt', 'log', 'sequential',
  'time', 'utc',
  'quantize', 'quantile', 'threshold'
];

var allTypes = toSet(types);
var ordinalTypes = toSet(types.slice(1, 6));

function isOrdinal(type) {
  return ordinalTypes.hasOwnProperty(type);
}

function isQuantile(type) {
  return type === 'quantile';
}

function initScale(spec, scope) {
  var type = spec.type || 'linear';

  if (!allTypes.hasOwnProperty(type)) {
    error$1('Unrecognized scale type: ' + $$2(type));
  }

  scope.addScale(spec.name, {
    type:   type,
    domain: undefined
  });
}

function parseScale(spec, scope) {
  var params = scope.getScale(spec.name).params,
      key$$1;

  params.domain = parseScaleDomain(spec.domain, spec, scope);

  if (spec.range != null) {
    params.range = parseScaleRange(spec, scope, params);
  }

  if (spec.interpolate != null) {
    parseScaleInterpolate(spec.interpolate, params);
  }

  if (spec.nice != null) {
    parseScaleNice(spec.nice, params);
  }

  for (key$$1 in spec) {
    if (params.hasOwnProperty(key$$1) || key$$1 === 'name') continue;
    params[key$$1] = parseLiteral(spec[key$$1], scope);
  }
}

function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error$1('Unsupported object: ' + $$2(v));
}

function parseArray(v, scope) {
  return v.signal
    ? scope.signalRef(v.signal)
    : v.map(function(v) { return parseLiteral(v, scope); });
}

function dataLookupError(name) {
  error$1('Can not find data set: ' + $$2(name));
}

// -- SCALE DOMAIN ----

function parseScaleDomain(domain, spec, scope) {
  if (!domain) {
    if (spec.domainMin != null || spec.domainMax != null) {
      error$1('No scale domain defined for domainMin/domainMax to override.');
    }
    return; // default domain
  }

  return domain.signal ? scope.signalRef(domain.signal)
    : (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(domain, spec, scope);
}

function explicitDomain(domain, spec, scope) {
  return domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function singularDomain(domain, spec, scope) {
  var data = scope.getData(domain.data);
  if (!data) dataLookupError(domain.data);

  return isOrdinal(spec.type)
      ? data.valuesRef(scope, domain.field, parseSort(domain.sort, false))
      : isQuantile(spec.type) ? data.domainRef(scope, domain.field)
      : data.extentRef(scope, domain.field);
}

function multipleDomain(domain, spec, scope) {
  var data = domain.data,
      fields = domain.fields.reduce(function(dom, d) {
        d = isString(d) ? {data: data, field: d}
          : (isArray(d) || d.signal) ? fieldRef(d, scope)
          : d;
        dom.push(d);
        return dom;
      }, []);

  return (isOrdinal(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(domain, scope, fields);
}

function fieldRef(data, scope) {
  var name = '_:vega:_' + (FIELD_REF_ID++),
      coll = Collect$1({});

  if (isArray(data)) {
    coll.value = {$ingest: data};
  } else if (data.signal) {
    scope.signalRef('setdata(' + $$2(name) + ',' + data.signal + ')');
  }
  scope.addDataPipeline(name, [coll, Sieve$1({})]);
  return {data: name, field: 'data'};
}

function ordinalMultipleDomain(domain, scope, fields) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.countsRef(scope, f.field);
  });

  // sum counts from all fields
  a = scope.add(Aggregate$1({
    groupby: keyFieldRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));

  // collect aggregate output
  c = scope.add(Collect$1({pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(Values$1({
    field: keyFieldRef,
    sort:  scope.sortRef(parseSort(domain.sort, true)),
    pulse: ref(c)
  }));

  return ref(v);
}

function parseSort(sort, multidomain) {
  if (sort) {
    if (!sort.field && !sort.op) {
      if (isObject(sort)) sort.field = 'key';
      else sort = {field: 'key'};
    } else if (!sort.field && sort.op !== 'count') {
      error$1('No field provided for sort aggregate op: ' + sort.op);
    } else if (multidomain && sort.field) {
      error$1('Multiple domain scales can not sort by field.');
    } else if (multidomain && sort.op && sort.op !== 'count') {
      error$1('Multiple domain scales support op count only.');
    }
  }
  return sort;
}

function quantileMultipleDomain(domain, scope, fields) {
  // get value arrays for each domain field
  var values = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.domainRef(scope, f.field);
  });

  // combine value arrays
  return ref(scope.add(MultiValues$1({values: values})));
}

function numericMultipleDomain(domain, scope, fields) {
  // get extents for each domain field
  var extents = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) dataLookupError(f.data);
    return data.extentRef(scope, f.field);
  });

  // combine extents
  return ref(scope.add(MultiExtent$1({extents: extents})));
}

// -- SCALE NICE -----

function parseScaleNice(nice, params) {
  params.nice = isObject(nice)
    ? {
        interval: parseLiteral(nice.interval),
        step: parseLiteral(nice.step)
      }
    : parseLiteral(nice);
}

// -- SCALE INTERPOLATION -----

function parseScaleInterpolate(interpolate$$1, params) {
  params.interpolate = parseLiteral(interpolate$$1.type || interpolate$$1);
  if (interpolate$$1.gamma != null) {
    params.interpolateGamma = parseLiteral(interpolate$$1.gamma);
  }
}

// -- SCALE RANGE -----

function parseScaleRange(spec, scope, params) {
  var range$$1 = spec.range,
      config = scope.config.range;

  if (range$$1.signal) {
    return scope.signalRef(range$$1.signal);
  } else if (isString(range$$1)) {
    if (config && config.hasOwnProperty(range$$1)) {
      spec = extend({}, spec, {range: config[range$$1]});
      return parseScaleRange(spec, scope, params);
    } else if (range$$1 === 'width') {
      range$$1 = [0, {signal: 'width'}];
    } else if (range$$1 === 'height') {
      range$$1 = isOrdinal(spec.type)
        ? [0, {signal: 'height'}]
        : [{signal: 'height'}, 0];
    } else {
      error$1('Unrecognized scale range value: ' + $$2(range$$1));
    }
  } else if (range$$1.scheme) {
    params.scheme = parseLiteral(range$$1.scheme, scope);
    if (range$$1.extent) params.schemeExtent = parseArray(range$$1.extent, scope);
    if (range$$1.count) params.schemeCount = parseLiteral(range$$1.count, scope);
    return;
  } else if (range$$1.step) {
    params.rangeStep = parseLiteral(range$$1.step, scope);
    return;
  } else if (isOrdinal(spec.type) && !isArray(range$$1)) {
    return parseScaleDomain(range$$1, spec, scope);
  } else if (!isArray(range$$1)) {
    error$1('Unsupported range type: ' + $$2(range$$1));
  }

  return range$$1.map(function(v) {
    return parseLiteral(v, scope);
  });
}

var parseProjection = function(proj, scope) {
  var params = {};

  for (var name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], scope);
  }

  scope.addProjection(proj.name, params);
};

function parseParameter(_$$1, scope) {
  return isArray(_$$1) ? _$$1.map(function(_$$1) { return parseParameter(_$$1, scope); })
    : !isObject(_$$1) ? _$$1
    : _$$1.signal ? scope.signalRef(_$$1.signal)
    : error$1('Unsupported parameter object: ' + $$2(_$$1));
}

var Top$1 = 'top';
var Left$1 = 'left';
var Right$1 = 'right';
var Bottom$1 = 'bottom';

var Index  = 'index';
var Label  = 'label';
var Offset = 'offset';
var Perc   = 'perc';
var Size   = 'size';
var Total  = 'total';
var Value  = 'value';

var GuideLabelStyle = 'guide-label';
var GuideTitleStyle = 'guide-title';
var GroupTitleStyle = 'group-title';

var LegendScales = [
  'shape',
  'size',
  'fill',
  'stroke',
  'strokeDash',
  'opacity'
];

var Skip = {
  name: 1,
  interactive: 1
};

var Skip$1 = toSet(['rule']);
var Swap = toSet(['group', 'image', 'rect']);

var adjustSpatial = function(encode, marktype) {
  var code = '';

  if (Skip$1[marktype]) return code;

  if (encode.x2) {
    if (encode.x) {
      if (Swap[marktype]) {
        code += 'if(o.x>o.x2)$=o.x,o.x=o.x2,o.x2=$;';
      }
      code += 'o.width=o.x2-o.x;';
    } else {
      code += 'o.x=o.x2-(o.width||0);';
    }
  }

  if (encode.xc) {
    code += 'o.x=o.xc-(o.width||0)/2;';
  }

  if (encode.y2) {
    if (encode.y) {
      if (Swap[marktype]) {
        code += 'if(o.y>o.y2)$=o.y,o.y=o.y2,o.y2=$;';
      }
      code += 'o.height=o.y2-o.y;';
    } else {
      code += 'o.y=o.y2-(o.height||0);';
    }
  }

  if (encode.yc) {
    code += 'o.y=o.yc-(o.height||0)/2;';
  }

  return code;
};

var color$1 = function(enc, scope, params, fields) {
  function color(type, x, y, z) {
    var a = entry$1(null, x, scope, params, fields),
        b = entry$1(null, y, scope, params, fields),
        c = entry$1(null, z, scope, params, fields);
    return 'this.' + type + '(' + [a, b, c].join(',') + ').toString()';
  }

  return (enc.c) ? color('hcl', enc.h, enc.c, enc.l)
    : (enc.h || enc.s) ? color('hsl', enc.h, enc.s, enc.l)
    : (enc.l || enc.a) ? color('lab', enc.l, enc.a, enc.b)
    : (enc.r || enc.g || enc.b) ? color('rgb', enc.r, enc.g, enc.b)
    : null;
};

var expression = function(code, scope, params, fields) {
  var expr = parseExpression(code, scope);
  expr.$fields.forEach(function(name) { fields[name] = 1; });
  extend(params, expr.$params);
  return expr.$expr;
};

var field$1 = function(ref, scope, params, fields) {
  return resolve$1(isObject(ref) ? ref : {datum: ref}, scope, params, fields);
};

function resolve$1(ref, scope, params, fields) {
  var object, level, field$$1;

  if (ref.signal) {
    object = 'datum';
    field$$1 = expression(ref.signal, scope, params, fields);
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';

    while (level-- > 0) {
      object += '.mark.group';
    }

    if (ref.parent) {
      field$$1 = ref.parent;
      object += '.datum';
    } else {
      field$$1 = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field$$1 = ref.datum;
  } else {
    error$1('Invalid field reference: ' + $$2(ref));
  }

  if (!ref.signal) {
    if (isString(field$$1)) {
      fields[field$$1] = 1; // TODO review field tracking?
      field$$1 = splitAccessPath(field$$1).map($$2).join('][');
    } else {
      field$$1 = resolve$1(field$$1, scope, params, fields);
    }
  }

  return object + '[' + field$$1 + ']';
}

var scale$3 = function(enc, value, scope, params, fields) {
  var scale = getScale$1(enc.scale, scope, params, fields),
      interp, func, flag;

  if (enc.range != null) {
    // pull value from scale range
    interp = +enc.range;
    func = scale + '.range()';
    value = (interp === 0) ? (func + '[0]')
      : '($=' + func + ',' + ((interp === 1) ? '$[$.length-1]'
      : '$[0]+' + interp + '*($[$.length-1]-$[0])') + ')';
  } else {
    // run value through scale and/or pull scale bandwidth
    if (value !== undefined) value = scale + '(' + value + ')';

    if (enc.band && (flag = hasBandwidth(enc.scale, scope))) {
      func = scale + '.bandwidth';
      interp = +enc.band;
      interp = func + '()' + (interp===1 ? '' : '*' + interp);

      // if we don't know the scale type, check for bandwidth
      if (flag < 0) interp = '(' + func + '?' + interp + ':0)';

      value = (value ? value + '+' : '') + interp;

      if (enc.extra) {
        // include logic to handle extraneous elements
        value = '(datum.extra?' + scale + '(datum.extra.value):' + value + ')';
      }
    }

    if (value == null) value = '0';
  }

  return value;
};

function hasBandwidth(name, scope) {
  if (!isString(name)) return -1;
  var type = scope.scaleType(name);
  return type === 'band' || type === 'point' ? 1 : 0;
}

function getScale$1(name, scope, params, fields) {
  var scaleName;

  if (isString(name)) {
    // direct scale lookup; add scale as parameter
    scaleName = scalePrefix + name;
    if (!params.hasOwnProperty(scaleName)) {
      params[scaleName] = scope.scaleRef(name);
    }
    scaleName = $$2(scaleName);
  } else {
    // indirect scale lookup; add all scales as parameters
    for (scaleName in scope.scales) {
      params[scalePrefix + scaleName] = scope.scaleRef(scaleName);
    }
    scaleName = $$2(scalePrefix) + '+'
      + (name.signal
        ? '(' + expression(name.signal, scope, params, fields) + ')'
        : field$1(name, scope, params, fields));
  }

  return '_[' + scaleName + ']';
}

var gradient$1 = function(enc, scope, params, fields) {
  return 'this.gradient('
    + getScale$1(enc.gradient, scope, params, fields)
    + ',' + $$2(enc.start)
    + ',' + $$2(enc.stop)
    + ',' + $$2(enc.count)
    + ')';
};

var property = function(property, scope, params, fields) {
  return isObject(property)
      ? '(' + entry$1(null, property, scope, params, fields) + ')'
      : property;
};

var entry$1 = function(channel, enc, scope, params, fields) {
  if (enc.gradient != null) {
    return gradient$1(enc, scope, params, fields);
  }

  var value = enc.signal ? expression(enc.signal, scope, params, fields)
    : enc.color ? color$1(enc.color, scope, params, fields)
    : enc.field != null ? field$1(enc.field, scope, params, fields)
    : enc.value !== undefined ? $$2(enc.value)
    : undefined;

  if (enc.scale != null) {
    value = scale$3(enc, value, scope, params, fields);
  }

  if (value === undefined) {
    value = null;
  }

  if (enc.exponent != null) {
    value = 'Math.pow(' + value + ','
      + property(enc.exponent, scope, params, fields) + ')';
  }

  if (enc.mult != null) {
    value += '*' + property(enc.mult, scope, params, fields);
  }

  if (enc.offset != null) {
    value += '+' + property(enc.offset, scope, params, fields);
  }

  if (enc.round) {
    value = 'Math.round(' + value + ')';
  }

  return value;
};

var set$2 = function(obj, key$$1, value) {
  return obj + '[' + $$2(key$$1) + ']=' + value + ';';
};

var rule$1 = function(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule) {
    var value = entry$1(channel, rule, scope, params, fields);
    code += rule.test
      ? expression(rule.test, scope, params, fields) + '?' + value + ':'
      : value;
  });

  return set$2('o', channel, code);
};

function parseEncode(encode, marktype, params, scope) {
  var fields = {},
      code = 'var o=item,datum=o.datum,$;',
      channel, enc, value;

  for (channel in encode) {
    enc = encode[channel];
    if (isArray(enc)) { // rule
      code += rule$1(channel, enc, scope, params, fields);
    } else {
      value = entry$1(channel, enc, scope, params, fields);
      code += set$2('o', channel, value);
    }
  }

  code += adjustSpatial(encode, marktype);
  code += 'return 1;';

  return {
    $expr:   code,
    $fields: Object.keys(fields),
    $output: Object.keys(encode)
  };
}

var MarkRole = 'mark';
var FrameRole$1 = 'frame';
var ScopeRole$1 = 'scope';

var AxisRole$2 = 'axis';
var AxisDomainRole = 'axis-domain';
var AxisGridRole = 'axis-grid';
var AxisLabelRole = 'axis-label';
var AxisTickRole = 'axis-tick';
var AxisTitleRole = 'axis-title';

var LegendRole$2 = 'legend';
var LegendEntryRole = 'legend-entry';
var LegendGradientRole = 'legend-gradient';
var LegendLabelRole = 'legend-label';
var LegendSymbolRole = 'legend-symbol';
var LegendTitleRole = 'legend-title';

var TitleRole$1 = 'title';

function encoder(_$$1) {
  return isObject(_$$1) ? _$$1 : {value: _$$1};
}

function addEncode(object, name, value) {
  if (value != null) {
    object[name] = isObject(value) && !isArray(value) ? value : {value: value};
    return 1;
  } else {
    return 0;
  }
}

function extendEncode(encode, extra, skip) {
  for (var name in extra) {
    if (skip && skip.hasOwnProperty(name)) continue;
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}

function encoders(encode, type, role, style, scope, params) {
  var enc, key$$1;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  encode = applyDefaults(encode, type, role, style, scope.config);

  for (key$$1 in encode) {
    enc[key$$1] = parseEncode(encode[key$$1], type, params, scope);
  }

  return params;
}

function applyDefaults(encode, type, role, style, config) {
  var enter = {}, key$$1, skip, props;

  // ignore legend and axis
  if (role == 'legend' || String(role).indexOf('axis') === 0) {
    role = null;
  }

  // resolve mark config
  props = role === FrameRole$1 ? config.group
    : (role === MarkRole) ? extend({}, config.mark, config[type])
    : null;

  for (key$$1 in props) {
    // do not apply defaults if relevant fields are defined
    skip = has(key$$1, encode)
      || (key$$1 === 'fill' || key$$1 === 'stroke')
      && (has('fill', encode) || has('stroke', encode));

    if (!skip) enter[key$$1] = {value: props[key$$1]};
  }

  // resolve styles, apply with increasing precedence
  array(style).forEach(function(name) {
    var props = config.style && config.style[name];
    for (var key$$1 in props) {
      if (!has(key$$1, encode)) {
        enter[key$$1] = {value: props[key$$1]};
      }
    }
  });

  encode = extend({}, encode); // defensive copy
  encode.enter = extend(enter, encode.enter);

  return encode;
}

function has(key$$1, encode) {
  return encode && (
    (encode.enter && encode.enter[key$$1]) ||
    (encode.update && encode.update[key$$1])
  );
}

var guideMark = function(type, role, style, key, dataRef, encode, extras) {
  return {
    type:  type,
    name:  extras ? extras.name : undefined,
    role:  role,
    style: (extras && extras.style) || style,
    key:   key,
    from:  dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras, Skip)
  };
};

var GroupMark = 'group';
var RectMark = 'rect';
var RuleMark = 'rule';
var SymbolMark = 'symbol';
var TextMark = 'text';

var legendGradient = function(spec, scale, config, userEncode) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    x: zero,
    y: zero
  };
  addEncode(enter, 'width', config.gradientWidth);
  addEncode(enter, 'height', config.gradientHeight);
  addEncode(enter, 'stroke', config.gradientStrokeColor);
  addEncode(enter, 'strokeWidth', config.gradientStrokeWidth);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    x: zero,
    y: zero,
    fill: {gradient: scale},
    opacity: {value: 1}
  };
  addEncode(update, 'width', config.gradientWidth);
  addEncode(update, 'height', config.gradientHeight);

  return guideMark(RectMark, LegendGradientRole, null, undefined, undefined, encode, userEncode);
};

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

var legendGradientLabels = function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'baseline', config.gradientLabelBaseline);
  addEncode(enter, 'limit', config.gradientLabelLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };

  enter.x = update.x = {
    field: Perc,
    mult: config.gradientWidth
  };

  enter.y = update.y = {
    value: config.gradientHeight,
    offset: config.gradientLabelOffset
  };

  enter.align = update.align = {signal: alignExpr};

  return guideMark(TextMark, LegendLabelRole, GuideLabelStyle, Perc, dataRef, encode, userEncode);
};

var legendLabels = function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'align', config.labelAlign);
  addEncode(enter, 'baseline', config.labelBaseline);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'limit', config.labelLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };

  enter.x = update.x = {
    field:  Offset,
    offset: config.labelOffset
  };

  enter.y = update.y = {
    field:  Size,
    mult:   0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  return guideMark(TextMark, LegendLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
};

var legendSymbols = function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'shape', config.symbolType);
  addEncode(enter, 'size', config.symbolSize);
  addEncode(enter, 'strokeWidth', config.symbolStrokeWidth);
  if (!spec.fill) {
    addEncode(enter, 'fill', config.symbolFillColor);
    addEncode(enter, 'stroke', config.symbolStrokeColor);
  }

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field: Offset,
    mult:  0.5
  };

  enter.y = update.y = {
    field: Size,
    mult:  0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  LegendScales.forEach(function(scale) {
    if (spec[scale]) {
      update[scale] = enter[scale] = {scale: spec[scale], field: Value};
    }
  });

  return guideMark(SymbolMark, LegendSymbolRole, null, Value, dataRef, encode, userEncode);
};

var legendTitle = function(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      title = spec.title,
      encode = {}, enter;

  encode.enter = enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'baseline', config.titleBaseline);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };

  return guideMark(TextMark, LegendTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
};

var guideGroup = function(role, style, name, dataRef, interactive, encode, marks) {
  return {
    type: GroupMark,
    name: name,
    role: role,
    style: style,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
};

var role = function(spec) {
  var role = spec.role || '';
  return (!role.indexOf('axis') || !role.indexOf('legend'))
    ? role
    : spec.type === GroupMark ? ScopeRole$1 : (role || MarkRole);
};

var definition$1 = function(spec) {
  return {
    clip:        spec.clip || false,
    interactive: spec.interactive === false ? false : true,
    marktype:    spec.type,
    name:        spec.name || undefined,
    role:        spec.role || role(spec),
    zindex:      +spec.zindex || undefined
  };
};

/**
 * Parse a data transform specification.
 */
var parseTransform = function(spec, scope) {
  var def = definition(spec.type);
  if (!def) error$1('Unrecognized transform type: ' + $$2(spec.type));

  var t = entry(def.type.toLowerCase(), null, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, scope.proxy(t));
  t.metadata = def.metadata || {};

  return t;
};

/**
 * Parse all parameters of a data transform.
 */
function parseParameters(def, spec, scope) {
  var params = {}, pdef, i, n;
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    params[pdef.name] = parseParameter$1(pdef, spec, scope);
  }
  return params;
}

/**
 * Parse a data transform parameter.
 */
function parseParameter$1(def, spec, scope) {
  var type = def.type,
      value$$1 = spec[def.name];

  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (value$$1 === undefined) {
    if (def.required) {
      error$1('Missing required ' + $$2(spec.type)
          + ' parameter: ' + $$2(def.name));
    }
    return;
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  }

  return def.array && !isSignal(value$$1)
    ? value$$1.map(function(v) { return parameterValue(def, v, scope); })
    : parameterValue(def, value$$1, scope);
}

/**
 * Parse a single parameter value.
 */
function parameterValue(def, value$$1, scope) {
  var type = def.type;

  if (isSignal(value$$1)) {
    return isExpr(type) ? error$1('Expression references can not be signals.')
         : isField(type) ? scope.fieldRef(value$$1)
         : isCompare(type) ? scope.compareRef(value$$1)
         : scope.signalRef(value$$1.signal);
  } else {
    var expr = def.expr || isField(type);
    return expr && outerExpr(value$$1) ? parseExpression(value$$1.expr, scope)
         : expr && outerField(value$$1) ? fieldRef$1(value$$1.field)
         : isExpr(type) ? parseExpression(value$$1, scope)
         : isData(type) ? ref(scope.getData(value$$1).values)
         : isField(type) ? fieldRef$1(value$$1)
         : isCompare(type) ? scope.compareRef(value$$1)
         : value$$1;
  }
}

/**
 * Parse parameter for accessing an index of another data set.
 */
function parseIndexParameter(def, spec, scope) {
  if (!isString(spec.from)) {
    error$1('Lookup "from" parameter must be a string literal.');
  }
  return scope.getData(spec.from).lookupRef(scope, spec.key);
}

/**
 * Parse a parameter that contains one or more sub-parameter objects.
 */
function parseSubParameters(def, spec, scope) {
  var value$$1 = spec[def.name];

  if (def.array) {
    if (!isArray(value$$1)) { // signals not allowed!
      error$1('Expected an array of sub-parameters. Instead: ' + $$2(value$$1));
    }
    return value$$1.map(function(v) {
      return parseSubParameter(def, v, scope);
    });
  } else {
    return parseSubParameter(def, value$$1, scope);
  }
}

/**
 * Parse a sub-parameter object.
 */
function parseSubParameter(def, value$$1, scope) {
  var params, pdef, k, i, n;

  // loop over defs to find matching key
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    for (k in pdef.key) {
      if (pdef.key[k] !== value$$1[k]) { pdef = null; break; }
    }
    if (pdef) break;
  }
  // raise error if matching key not found
  if (!pdef) error$1('Unsupported parameter: ' + $$2(value$$1));

  // parse params, create Params transform, return ref
  params = extend(parseParameters(pdef, value$$1, scope), pdef.key);
  return ref(scope.add(Params$2(params)));
}

// -- Utilities -----

function outerExpr(_$$1) {
  return _$$1 && _$$1.expr;
}

function outerField(_$$1) {
  return _$$1 && _$$1.field;
}

function isData(_$$1) {
  return _$$1 === 'data';
}

function isExpr(_$$1) {
  return _$$1 === 'expr';
}

function isField(_$$1) {
  return _$$1 === 'field';
}

function isCompare(_$$1) {
  return _$$1 === 'compare'
}

var parseData = function(from, group, scope) {
  var facet, key$$1, op, dataRef, parent;

  // if no source data, generate singleton datum
  if (!from) {
    dataRef = ref(scope.add(Collect$1(null, [{}])));
  }

  // if faceted, process facet specification
  else if (facet = from.facet) {
    if (!group) error$1('Only group marks can be faceted.');

    // use pre-faceted source data, if available
    if (facet.field != null) {
      dataRef = parent = ref(scope.getData(facet.data).output);
    } else {
      key$$1 = scope.keyRef(facet.groupby);

      // generate facet aggregates if no direct data specification
      if (!from.data) {
        op = parseTransform(extend({
          type:    'aggregate',
          groupby: array(facet.groupby)
        }, facet.aggregate));
        op.params.key = key$$1;
        op.params.pulse = ref(scope.getData(facet.data).output);
        dataRef = parent = ref(scope.add(op));
      } else {
        parent = ref(scope.getData(from.data).aggregate);
      }
    }
  }

  // if not yet defined, get source data reference
  if (!dataRef) {
    dataRef = from.$ref ? from
      : ref(scope.getData(from.data).output);
  }

  return {
    key: key$$1,
    pulse: dataRef,
    parent: parent
  };
};

function DataScope(scope, input, output, values, aggr) {
  this.scope = scope;   // parent scope object
  this.input = input;   // first operator in pipeline (tuple input)
  this.output = output; // last operator in pipeline (tuple output)
  this.values = values; // operator for accessing tuples (but not tuple flow)

  // last aggregate in transform pipeline
  this.aggregate = aggr;

  // lookup table of field indices
  this.index = {};
}

DataScope.fromEntries = function(scope, entries) {
  var n = entries.length,
      i = 1,
      input  = entries[0],
      values = entries[n-1],
      output = entries[n-2],
      aggr = null;

  // add operator entries to this scope, wire up pulse chain
  scope.add(entries[0]);
  for (; i<n; ++i) {
    entries[i].params.pulse = ref(entries[i-1]);
    scope.add(entries[i]);
    if (entries[i].type === 'aggregate') aggr = entries[i];
  }

  return new DataScope(scope, input, output, values, aggr);
};

var prototype$82 = DataScope.prototype;

prototype$82.countsRef = function(scope, field$$1, sort) {
  var ds = this,
      cache = ds.counts || (ds.counts = {}),
      k = fieldKey(field$$1), v, a, p;

  if (k != null) {
    scope = ds.scope;
    v = cache[k];
  }

  if (!v) {
    p = {
      groupby: scope.fieldRef(field$$1, 'key'),
      pulse: ref(ds.output)
    };
    if (sort && sort.field) addSortField(scope, p, sort);
    a = scope.add(Aggregate$1(p));
    v = scope.add(Collect$1({pulse: ref(a)}));
    v = {agg: a, ref: ref(v)};
    if (k != null) cache[k] = v;
  } else if (sort && sort.field) {
    addSortField(scope, v.agg.params, sort);
  }

  return v.ref;
};

function fieldKey(field$$1) {
  return isString(field$$1) ? field$$1 : null;
}

function addSortField(scope, p, sort) {
  var as = aggrField(sort.op, sort.field), s;

  if (p.ops) {
    for (var i=0, n=p.as.length; i<n; ++i) {
      if (p.as[i] === as) return;
    }
  } else {
    p.ops = ['count'];
    p.fields = [null];
    p.as = ['count'];
  }
  if (sort.op) {
    p.ops.push((s=sort.op.signal) ? scope.signalRef(s) : sort.op);
    p.fields.push(scope.fieldRef(sort.field));
    p.as.push(as);
  }
}

function cache(scope, ds, name, optype, field$$1, counts, index) {
  var cache = ds[name] || (ds[name] = {}),
      sort = sortKey(counts),
      k = fieldKey(field$$1), v, op;

  if (k != null) {
    scope = ds.scope;
    k = k + (sort ? '|' + sort : '');
    v = cache[k];
  }

  if (!v) {
    var params = counts
      ? {field: keyFieldRef, pulse: ds.countsRef(scope, field$$1, counts)}
      : {field: scope.fieldRef(field$$1), pulse: ref(ds.output)};
    if (sort) params.sort = scope.sortRef(counts);
    op = scope.add(entry(optype, undefined, params));
    if (index) ds.index[field$$1] = op;
    v = ref(op);
    if (k != null) cache[k] = v;
  }
  return v;
}

prototype$82.tuplesRef = function() {
  return ref(this.values);
};

prototype$82.extentRef = function(scope, field$$1) {
  return cache(scope, this, 'extent', 'extent', field$$1, false);
};

prototype$82.domainRef = function(scope, field$$1) {
  return cache(scope, this, 'domain', 'values', field$$1, false);
};

prototype$82.valuesRef = function(scope, field$$1, sort) {
  return cache(scope, this, 'vals', 'values', field$$1, sort || true);
};

prototype$82.lookupRef = function(scope, field$$1) {
  return cache(scope, this, 'lookup', 'tupleindex', field$$1, false);
};

prototype$82.indataRef = function(scope, field$$1) {
  return cache(scope, this, 'indata', 'tupleindex', field$$1, true, true);
};

var parseFacet = function(spec, scope, group) {
  var facet = spec.from.facet,
      name = facet.name,
      data = ref(scope.getData(facet.data).output),
      subscope, source, values, op;

  if (!facet.name) {
    error$1('Facet must have a name: ' + $$2(facet));
  }
  if (!facet.data) {
    error$1('Facet must reference a data set: ' + $$2(facet));
  }

  if (facet.field) {
    op = scope.add(PreFacet$1({
      field: scope.fieldRef(facet.field),
      pulse: data
    }));
  } else if (facet.groupby) {
    op = scope.add(Facet$1({
      key:   scope.keyRef(facet.groupby),
      group: ref(scope.proxy(group.parent)),
      pulse: data
    }));
  } else {
    error$1('Facet must specify groupby or field: ' + $$2(facet));
  }

  // initialize facet subscope
  subscope = scope.fork();
  source = subscope.add(Collect$1());
  values = subscope.add(Sieve$1({pulse: ref(source)}));
  subscope.addData(name, new DataScope(subscope, source, source, values));
  subscope.addSignal('parent', null);

  // parse faceted subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
};

var parseSubflow = function(spec, scope, input) {
  var op = scope.add(PreFacet$1({pulse: input.pulse})),
      subscope = scope.fork();

  subscope.add(Sieve$1());
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
};

var parseTrigger = function(spec, scope, name) {
  var remove = spec.remove,
      insert = spec.insert,
      toggle = spec.toggle,
      modify = spec.modify,
      values = spec.values,
      op = scope.add(operator()),
      update, expr;

  update = 'if(' + spec.trigger + ',modify("'
    + name + '",'
    + [insert, remove, toggle, modify, values]
        .map(function(_$$1) { return _$$1 == null ? 'null' : _$$1; })
        .join(',')
    + '),0)';

  expr = parseExpression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
};

var parseMark = function(spec, scope) {
  var role$$1 = role(spec),
      group = spec.type === GroupMark,
      facet = spec.from && spec.from.facet,
      layout = spec.layout || role$$1 === ScopeRole$1 || role$$1 === FrameRole$1,
      nested = role$$1 === MarkRole || layout || facet,
      overlap = spec.overlap,
      ops, op, input, store, bound, render, sieve, name,
      joinRef, markRef, encodeRef, layoutRef, boundRef;

  // resolve input data
  input = parseData(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(DataJoin$1({
    key:   input.key || (spec.key ? fieldRef$1(spec.key) : undefined),
    pulse: input.pulse,
    clean: !group
  }));
  joinRef = ref(op);

  // collect visual items
  op = store = scope.add(Collect$1({pulse: joinRef}));

  // connect visual items to scenegraph
  op = scope.add(Mark$1({
    markdef:   definition$1(spec),
    context:   {$context: true},
    groups:    scope.lookup(),
    parent:    scope.signals.parent ? scope.signalRef('parent') : null,
    index:     scope.markpath(),
    pulse:     ref(op)
  }));
  markRef = ref(op);

  // add visual encoders
  op = scope.add(Encode$1(
    encoders(spec.encode, spec.type, role$$1, spec.style, scope, {pulse: markRef})
  ));

  // monitor parent marks to propagate changes
  op.params.parent = scope.encode();

  // add post-encoding transforms, if defined
  if (spec.transform) {
    spec.transform.forEach(function(_$$1) {
      var tx = parseTransform(_$$1, scope);
      if (tx.metadata.generates || tx.metadata.changes) {
        error$1('Mark transforms should not generate new data.');
      }
      tx.params.pulse = ref(op);
      scope.add(op = tx);
    });
  }

  // if item sort specified, perform post-encoding
  if (spec.sort) {
    op = scope.add(SortItems$1({
      sort:  scope.compareRef(spec.sort),
      pulse: ref(op)
    }));
  }

  encodeRef = ref(op);

  // add view layout operator if needed
  if (facet || layout) {
    layout = scope.add(ViewLayout$1({
      layout:       scope.objectProperty(spec.layout),
      legendMargin: scope.config.legendMargin,
      mark:         markRef,
      pulse:        encodeRef
    }));
    layoutRef = ref(layout);
  }

  // compute bounding boxes
  bound = scope.add(Bound$1({mark: markRef, pulse: layoutRef || encodeRef}));
  boundRef = ref(bound);

  // if group mark, recurse to parse nested content
  if (group) {
    // juggle layout & bounds to ensure they run *after* any faceting transforms
    if (nested) { ops = scope.operators; ops.pop(); if (layout) ops.pop(); }

    scope.pushState(encodeRef, layoutRef || boundRef, joinRef);
    facet ? parseFacet(spec, scope, input)          // explicit facet
        : nested ? parseSubflow(spec, scope, input) // standard mark group
        : parseSpec(spec, scope); // guide group, we can avoid nested scopes
    scope.popState();

    if (nested) { if (layout) ops.push(layout); ops.push(bound); }
  }

  if (overlap) {
    op = {
      method: overlap.method === true ? 'parity' : overlap.method,
      pulse:  boundRef
    };
    if (overlap.order) {
      op.sort = scope.compareRef({field: overlap.order});
    }
    if (overlap.bound) {
      op.boundScale = scope.scaleRef(overlap.bound.scale);
      op.boundOrient = overlap.bound.orient;
      op.boundTolerance = overlap.bound.tolerance;
    }
    boundRef = ref(scope.add(Overlap$1(op)));
  }

  // render / sieve items
  render = scope.add(Render$1({pulse: boundRef}));
  sieve = scope.add(Sieve$1({pulse: ref(render)}, undefined, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  // add trigger updates if defined
  if (spec.name != null) {
    name = spec.name;
    scope.addData(name, new DataScope(scope, store, render, sieve));
    if (spec.on) spec.on.forEach(function(on) {
      if (on.insert || on.remove || on.toggle) {
        error$1('Marks only support modify triggers.');
      }
      parseTrigger(on, scope, name);
    });
  }
};

var parseLegend = function(spec, scope) {
  var type = spec.type || 'symbol',
      config = scope.config.legend,
      encode = spec.encode || {},
      legendEncode = encode.legend || {},
      name = legendEncode.name || undefined,
      interactive = !!legendEncode.interactive,
      style = legendEncode.style,
      datum, dataRef, entryRef, group, title,
      entryEncode, params, children;

  // resolve 'canonical' scale name
  var scale = spec.size || spec.shape || spec.fill || spec.stroke
           || spec.strokeDash || spec.opacity;

  if (!scale) {
    error$1('Missing valid scale for legend.');
  }

  // single-element data source for axis group
  datum = {
    orient: value(spec.orient, config.orient),
    title:  spec.title != null
  };
  dataRef = ref(scope.add(Collect$1(null, [datum])));

  // encoding properties for legend group

  legendEncode = extendEncode({
    enter: legendEnter(config),
    update: {
      offset:        encoder(value(spec.offset, config.offset)),
      padding:       encoder(value(spec.padding, config.padding)),
      titlePadding:  encoder(value(spec.titlePadding, config.titlePadding))
    }
  }, legendEncode, Skip);

  // encoding properties for legend entry sub-group
  entryEncode = {
    update: {
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      entryPadding: encoder(value(spec.entryPadding, config.entryPadding))
    }
  };

  if (type === 'gradient') {
    // data source for gradient labels
    entryRef = ref(scope.add(LegendEntries$1({
      type:   'gradient',
      scale:  scope.scaleRef(scale),
      count:  scope.objectProperty(spec.tickCount),
      values: scope.objectProperty(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendGradient(spec, scale, config, encode.gradient),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
  }

  else {
    // data source for legend entries
    entryRef = ref(scope.add(LegendEntries$1(params = {
      scale:  scope.scaleRef(scale),
      count:  scope.objectProperty(spec.tickCount),
      values: scope.objectProperty(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendSymbols(spec, config, encode.symbols, entryRef),
      legendLabels(spec, config, encode.labels, entryRef)
    ];

    params.size = sizeExpression(spec, scope, children);
  }

  // generate legend marks
  children = [
    guideGroup(LegendEntryRole, null, null, dataRef, interactive, entryEncode, children)
  ];

  // include legend title if defined
  if (datum.title) {
    title = legendTitle(spec, config, encode.title, dataRef);
    entryEncode.update.y.offset = {
      field: {group: 'titlePadding'},
      offset: getValue$1(scope, title.encode, 'fontSize', GuideTitleStyle)
    };
    children.push(title);
  }

  // build legend specification
  group = guideGroup(LegendRole$2, style, name, dataRef, interactive, legendEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse legend specification
  return parseMark(group, scope);
};

function sizeExpression(spec, scope, marks) {
  var fontSize = getValue$1(scope, marks[1].encode, 'fontSize', GuideLabelStyle);
  if (spec.size) {
    return {$expr: 'Math.max(Math.ceil(Math.sqrt(_.scale(datum))),' + fontSize + ')'};
  } else {
    var symbolSize = getValue$1(scope, marks[0].encode, 'size');
    return Math.max(Math.ceil(Math.sqrt(symbolSize)), fontSize);
  }
}

function legendEnter(config) {
  var enter = {},
      count = addEncode(enter, 'fill', config.fillColor)
            + addEncode(enter, 'stroke', config.strokeColor)
            + addEncode(enter, 'strokeWidth', config.strokeWidth)
            + addEncode(enter, 'strokeDash', config.strokeDash)
            + addEncode(enter, 'cornerRadius', config.cornerRadius);
  return count ? enter : undefined;
}

function getValue$1(scope, encode, name, style) {
  var v = encode && (
    (encode.update && encode.update[name]) ||
    (encode.enter && encode.enter[name])
  );
  return +(v ? v.value // TODO support signal?
    : (style && (v = scope.config.style[style]) && v[name]));
}

var parseTitle = function(spec, scope) {
  spec = isString(spec) ? {text: spec} : spec;

  var config = scope.config.title,
      encode = extend({}, spec.encode),
      datum, dataRef, title;

  // single-element data source for group title
  datum = {
    orient: spec.orient != null ? spec.orient : config.orient
  };
  dataRef = ref(scope.add(Collect$1(null, [datum])));

  // build title specification
  encode.name = spec.name;
  encode.interactive = spec.interactive;
  title = buildTitle(spec, config, encode, dataRef);
  if (spec.zindex) title.zindex = spec.zindex;

  // parse title specification
  return parseMark(title, scope);
};

function buildTitle(spec, config, userEncode, dataRef) {
  var title = spec.text,
      orient = spec.orient || config.orient,
      anchor = spec.anchor || config.anchor,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      horizontal = (orient === Top$1 || orient === Bottom$1),
      extent$$1 = {group: (horizontal ? 'width' : 'height')},
      encode = {}, enter, update, pos, opp, mult, align;

  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'fill', config.color);
  addEncode(enter, 'font', config.font);
  addEncode(enter, 'fontSize', config.fontSize);
  addEncode(enter, 'fontWeight', config.fontWeight);

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: isObject(title) ? title : {value: title + ''},
    offset: encoder((spec.offset != null ? spec.offset : config.offset) || 0)
  };

  if (anchor === 'start') {
    mult = 0;
    align = 'left';
  } else {
    if (anchor === 'end') {
      mult = 1;
      align = 'right';
    } else {
      mult = 0.5;
      align = 'center';
    }
  }

  pos = {field: extent$$1, mult: mult};

  opp = sign < 0 ? {value: 0}
    : horizontal ? {field: {group: 'height'}}
    : {field: {group: 'width'}};

  if (horizontal) {
    update.x = pos;
    update.y = opp;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top$1 ? 'bottom' : 'top'};
  } else {
    update.x = opp;
    update.y = pos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }
  update.align = {value: align};
  update.limit = {field: extent$$1};

  addEncode(update, 'angle', config.angle);
  addEncode(update, 'baseline', config.baseline);
  addEncode(update, 'limit', config.limit);

  return guideMark(TextMark, TitleRole$1, spec.style || GroupTitleStyle, null, dataRef, encode, userEncode);
}

function parseData$1(data, scope) {
  var transforms = [];

  if (data.transform) {
    data.transform.forEach(function(tx) {
      transforms.push(parseTransform(tx, scope));
    });
  }

  if (data.on) {
    data.on.forEach(function(on) {
      parseTrigger(on, scope, data.name);
    });
  }

  scope.addDataPipeline(data.name, analyze(data, scope, transforms));
}

/**
 * Analyze a data pipeline, add needed operators.
 */
function analyze(data, scope, ops) {
  // POSSIBLE TODOs:
  // - error checking for treesource on tree operators (BUT what if tree is upstream?)
  // - this is local analysis, perhaps some tasks better for global analysis...

  var output = [],
      source = null,
      modify = false,
      generate = false,
      upstream, i, n, t, m;

  if (data.values) {
    // hard-wired input data set
    output.push(source = collect({$ingest: data.values, $format: data.format}));
  } else if (data.url) {
    // load data from external source
    output.push(source = collect({$request: data.url, $format: data.format}));
  } else if (data.source) {
    // derives from one or more other data sets
    source = upstream = array(data.source).map(function(d) {
      return ref(scope.getData(d).output);
    });
    output.push(null); // populate later
  }

  // scan data transforms, add collectors as needed
  for (i=0, n=ops.length; i<n; ++i) {
    t = ops[i];
    m = t.metadata;

    if (!source && !m.source) {
      output.push(source = collect());
    }
    output.push(t);

    if (m.generates) generate = true;
    if (m.modifies && !generate) modify = true;

    if (m.source) source = t;
    else if (m.changes) source = null;
  }

  if (upstream) {
    n = upstream.length - 1;
    output[0] = Relay$1({
      derive: modify,
      pulse: n ? upstream : upstream[0]
    });
    if (modify || n) {
      // collect derived and multi-pulse tuples
      output.splice(1, 0, collect());
    }
  }

  if (!source) output.push(collect());
  output.push(Sieve$1({}));
  return output;
}

function collect(values) {
  var s = Collect$1({}, values);
  s.metadata = {source: true};
  return s;
}

var axisConfig = function(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy = (orient === Top$1 || orient === Bottom$1) ? config.axisX : config.axisY,
      or = config['axis' + orient[0].toUpperCase() + orient.slice(1)],
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
};

var axisDomain = function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      zero = {value: 0},
      encode = {}, enter, update, u, u2, v;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.domainColor);
  addEncode(enter, 'strokeWidth', config.domainWidth);

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  if (orient === Top$1 || orient === Bottom$1) {
    u = 'x';
    v = 'y';
  } else {
    u = 'y';
    v = 'x';
  }
  u2 = u + '2';

  enter[v] = zero;
  update[u] = enter[u] = position(spec, 0);
  update[u2] = enter[u2] = position(spec, 1);

  return guideMark(RuleMark, AxisDomainRole, null, null, dataRef, encode, userEncode);
};

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}

var axisGrid = function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      vscale = spec.gridScale,
      sign = (orient === Left$1 || orient === Top$1) ? 1 : -1,
      offset = sign * spec.offset || 0,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickPos, u, v, v2, s;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.gridColor);
  addEncode(enter, 'strokeWidth', config.gridWidth);
  addEncode(enter, 'strokeDash', config.gridDash);

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {};
  addEncode(update, 'opacity', config.gridOpacity);

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra,
    offset: config.tickOffset
  };

  if (orient === Top$1 || orient === Bottom$1) {
    u = 'x';
    v = 'y';
    s = 'height';
  } else {
    u = 'y';
    v = 'x';
    s = 'width';
  }
  v2 = v + '2';

  update[u] = enter[u] = exit[u] = tickPos;

  if (vscale) {
    enter[v] = {scale: vscale, range: 0, mult: sign, offset: offset};
    update[v2] = enter[v2] = {scale: vscale, range: 1, mult: sign, offset: offset};
  } else {
    enter[v] = {value: offset};
    update[v2] = enter[v2] = {signal: s, mult: sign, offset: offset};
  }

  return guideMark(RuleMark, AxisGridRole, null, Value, dataRef, encode, userEncode);
};

var axisTicks = function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero
  };
  addEncode(enter, 'stroke', config.tickColor);
  addEncode(enter, 'strokeWidth', config.tickWidth);

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra,
    offset: config.tickOffset
  };

  if (orient === Top$1 || orient === Bottom$1) {
    update.y = enter.y = zero;
    update.y2 = enter.y2 = tickSize;
    update.x = enter.x = exit.x = tickPos;
  } else {
    update.x = enter.x = zero;
    update.x2 = enter.x2 = tickSize;
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark(RuleMark, AxisTickRole, null, Value, dataRef, encode, userEncode);
};

function flushExpr(a, b, c) {
  return {
    signal: 'datum.index===0 ? ' + a + ' : datum.index===1 ? ' + b + ' : ' + c
  };
}

var axisLabels = function(spec, config, userEncode, dataRef, size) {
  var orient = spec.orient,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      scale = spec.scale,
      pad$$1 = value(spec.labelPadding, config.labelPadding),
      bound = value(spec.labelBound, config.labelBound),
      flush = value(spec.labelFlush, config.labelFlush),
      overlap = value(spec.labelOverlap, config.labelOverlap),
      zero$$1 = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero$$1
  };
  addEncode(enter, 'angle', config.labelAngle);
  addEncode(enter, 'fill', config.labelColor);
  addEncode(enter, 'font', config.labelFont);
  addEncode(enter, 'fontSize', config.labelFontSize);
  addEncode(enter, 'limit', config.labelLimit);

  encode.exit = exit = {
    opacity: zero$$1
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: Label}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(pad$$1);
  tickSize.offset.mult = sign;

  tickPos = {
    scale:  scale,
    field:  Value,
    band:   0.5,
    offset: config.tickOffset
  };

  if (orient === Top$1 || orient === Bottom$1) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    addEncode(update, 'align', flush
      ? flushExpr('"left"', '"right"', '"center"')
      : 'center');
    if (flush && isNumber(flush)) {
      flush = Math.abs(+flush);
      addEncode(update, 'dx', flushExpr(-flush, flush, 0));
    }

    addEncode(update, 'baseline', orient === Top$1 ? 'bottom' : 'top');
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    addEncode(update, 'align', orient === Right$1 ? 'left' : 'right');
    addEncode(update, 'baseline', flush
      ? flushExpr('"bottom"', '"top"', '"middle"')
      : 'middle');
    if (flush && isNumber(flush)) {
      flush = Math.abs(+flush);
      addEncode(update, 'dy', flushExpr(flush, -flush, 0));
    }
  }

  spec = guideMark(TextMark, AxisLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
  if (overlap || bound) {
    spec.overlap = {
      method: overlap,
      order:  'datum.index',
      bound:  bound ? {scale: scale, orient: orient, tolerance: +bound} : null
    };
  }
  return spec;
};

var axisTitle = function(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      title = spec.title,
      sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
      horizontal = (orient === Top$1 || orient === Bottom$1),
      encode = {}, enter, update, titlePos;

  encode.enter = enter = {
    opacity: {value: 0}
  };
  addEncode(enter, 'align', config.titleAlign);
  addEncode(enter, 'fill', config.titleColor);
  addEncode(enter, 'font', config.titleFont);
  addEncode(enter, 'fontSize', config.titleFontSize);
  addEncode(enter, 'fontWeight', config.titleFontWeight);
  addEncode(enter, 'limit', config.titleLimit);

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: title && title.signal ? {signal: title.signal} : {value: title + ''}
  };

  titlePos = {
    scale: spec.scale,
    range: 0.5
  };

  if (horizontal) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top$1 ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  addEncode(update, 'angle', config.titleAngle);
  addEncode(update, 'baseline', config.titleBaseline);

  !addEncode(update, 'x', config.titleX)
    && horizontal && !has('x', userEncode)
    && (encode.enter.auto = {value: true});

  !addEncode(update, 'y', config.titleY)
    && !horizontal && !has('y', userEncode)
    && (encode.enter.auto = {value: true});

  return guideMark(TextMark, AxisTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
};

var parseAxis = function(spec, scope) {
  var config = axisConfig(spec, scope),
      encode = spec.encode || {},
      axisEncode = encode.axis || {},
      name = axisEncode.name || undefined,
      interactive = !!axisEncode.interactive,
      style = axisEncode.style,
      datum, dataRef, ticksRef, size, group, children;

  // single-element data source for axis group
  datum = {
    orient: spec.orient,
    ticks:  !!value(spec.ticks, config.ticks),
    labels: !!value(spec.labels, config.labels),
    grid:   !!value(spec.grid, config.grid),
    domain: !!value(spec.domain, config.domain),
    title:  !!value(spec.title, false)
  };
  dataRef = ref(scope.add(Collect$1({}, [datum])));

  // encoding properties for axis group item
  axisEncode = extendEncode({
    update: {
      range:        {signal: 'abs(span(range("' + spec.scale + '")))'},
      offset:       encoder(value(spec.offset, 0)),
      position:     encoder(value(spec.position, 0)),
      titlePadding: encoder(value(spec.titlePadding, config.titlePadding)),
      minExtent:    encoder(value(spec.minExtent, config.minExtent)),
      maxExtent:    encoder(value(spec.maxExtent, config.maxExtent))
    }
  }, encode.axis, Skip);

  // data source for axis ticks
  ticksRef = ref(scope.add(AxisTicks$1({
    scale:  scope.scaleRef(spec.scale),
    extra:  config.tickExtra,
    count:  scope.objectProperty(spec.tickCount),
    values: scope.objectProperty(spec.values),
    formatSpecifier: scope.property(spec.format)
  })));

  // generate axis marks
  children = [];

  // include axis gridlines if requested
  if (datum.grid) {
    children.push(axisGrid(spec, config, encode.grid, ticksRef));
  }

  // include axis ticks if requested
  if (datum.ticks) {
    size = value(spec.tickSize, config.tickSize);
    children.push(axisTicks(spec, config, encode.ticks, ticksRef, size));
  }

  // include axis labels if requested
  if (datum.labels) {
    size = datum.ticks ? size : 0;
    children.push(axisLabels(spec, config, encode.labels, ticksRef, size));
  }

  // include axis domain path if requested
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, dataRef));
  }

  // include axis title if defined
  if (datum.title) {
    children.push(axisTitle(spec, config, encode.title, dataRef));
  }

  // build axis specification
  group = guideGroup(AxisRole$2, style, name, dataRef, interactive, axisEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse axis specification
  return parseMark(group, scope);
};

var parseSpec = function(spec, scope, preprocessed) {
  var signals = array(spec.signals),
      scales = array(spec.scales);

  if (!preprocessed) signals.forEach(function(_$$1) {
    parseSignal(_$$1, scope);
  });

  array(spec.projections).forEach(function(_$$1) {
    parseProjection(_$$1, scope);
  });

  scales.forEach(function(_$$1) {
    initScale(_$$1, scope);
  });

  array(spec.data).forEach(function(_$$1) {
    parseData$1(_$$1, scope);
  });

  scales.forEach(function(_$$1) {
    parseScale(_$$1, scope);
  });

  signals.forEach(function(_$$1) {
    parseSignalUpdates(_$$1, scope);
  });

  array(spec.axes).forEach(function(_$$1) {
    parseAxis(_$$1, scope);
  });

  array(spec.marks).forEach(function(_$$1) {
    parseMark(_$$1, scope);
  });

  array(spec.legends).forEach(function(_$$1) {
    parseLegend(_$$1, scope);
  });

  if (spec.title) {
    parseTitle(spec.title, scope);
  }

  scope.parseLambdas();
  return scope;
};

var defined = toSet(['width', 'height', 'padding', 'autosize']);

function parseView(spec, scope) {
  var config = scope.config,
      op, input, encode, parent, root;

  scope.background = spec.background || config.background;
  scope.eventConfig = config.events;
  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || 0);
  scope.addSignal('height', spec.height || 0);
  scope.addSignal('padding', parsePadding(spec.padding, config));
  scope.addSignal('autosize', parseAutosize(spec.autosize, config));

  array(spec.signals).forEach(function(_$$1) {
    if (!defined[_$$1.name]) parseSignal(_$$1, scope);
  });

  // Store root group item
  input = scope.add(Collect$1());

  // Encode root group item
  encode = extendEncode({
    enter: { x: {value: 0}, y: {value: 0} },
    update: { width: {signal: 'width'}, height: {signal: 'height'} }
  }, spec.encode);

  encode = scope.add(Encode$1(
    encoders(encode, GroupMark, FrameRole$1, spec.style, scope, {pulse: ref(input)}))
  );

  // Perform view layout
  parent = scope.add(ViewLayout$1({
    layout:       scope.objectProperty(spec.layout),
    legendMargin: config.legendMargin,
    autosize:     scope.signalRef('autosize'),
    mark:         root,
    pulse:        ref(encode)
  }));
  scope.operators.pop();

  // Parse remainder of specification
  scope.pushState(ref(encode), ref(parent), null);
  parseSpec(spec, scope, true);
  scope.operators.push(parent);

  // Bound / render / sieve root item
  op = scope.add(Bound$1({mark: root, pulse: ref(parent)}));
  op = scope.add(Render$1({pulse: ref(op)}));
  op = scope.add(Sieve$1({pulse: ref(op)}));

  // Track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));

  return scope;
}

function Scope(config) {
  this.config = config;

  this.bindings = [];
  this.field = {};
  this.signals = {};
  this.lambdas = {};
  this.scales = {};
  this.events = {};
  this.data = {};

  this.streams = [];
  this.updates = [];
  this.operators = [];
  this.background = null;
  this.eventConfig = null;

  this._id = 0;
  this._subid = 0;
  this._nextsub = [0];

  this._parent = [];
  this._encode = [];
  this._lookup = [];
  this._markpath = [];
}

function Subscope(scope) {
  this.config = scope.config;

  this.field = Object.create(scope.field);
  this.signals = Object.create(scope.signals);
  this.lambdas = Object.create(scope.lambdas);
  this.scales = Object.create(scope.scales);
  this.events = Object.create(scope.events);
  this.data = Object.create(scope.data);

  this.streams = [];
  this.updates = [];
  this.operators = [];

  this._id = 0;
  this._subid = ++scope._nextsub[0];
  this._nextsub = scope._nextsub;

  this._parent = scope._parent.slice();
  this._encode = scope._encode.slice();
  this._lookup = scope._lookup.slice();
  this._markpath = scope._markpath;
}

var prototype$83 = Scope.prototype = Subscope.prototype;

// ----

prototype$83.fork = function() {
  return new Subscope(this);
};

prototype$83.toRuntime = function() {
  this.finish();
  return {
    background:  this.background,
    operators:   this.operators,
    streams:     this.streams,
    updates:     this.updates,
    bindings:    this.bindings,
    eventConfig: this.eventConfig
  };
};

prototype$83.id = function() {
  return (this._subid ? this._subid + ':' : 0) + this._id++;
};

prototype$83.add = function(op) {
  this.operators.push(op);
  op.id = this.id();
  // if pre-registration references exist, resolve them now
  if (op.refs) {
    op.refs.forEach(function(ref$$1) { ref$$1.$ref = op.id; });
    op.refs = null;
  }
  return op;
};

prototype$83.proxy = function(op) {
  var vref = op instanceof Entry ? ref(op) : op;
  return this.add(Proxy$1({value: vref}));
};

prototype$83.addStream = function(stream) {
  this.streams.push(stream);
  stream.id = this.id();
  return stream;
};

prototype$83.addUpdate = function(update) {
  this.updates.push(update);
  return update;
};

// Apply metadata
prototype$83.finish = function() {
  var name, ds;

  // annotate root
  if (this.root) this.root.root = true;

  // annotate signals
  for (name in this.signals) {
    this.signals[name].signal = name;
  }

  // annotate scales
  for (name in this.scales) {
    this.scales[name].scale = name;
  }

  // annotate data sets
  function annotate(op, name, type) {
    var data, list;
    if (op) {
      data = op.data || (op.data = {});
      list = data[name] || (data[name] = []);
      list.push(type);
    }
  }
  for (name in this.data) {
    ds = this.data[name];
    annotate(ds.input,  name, 'input');
    annotate(ds.output, name, 'output');
    annotate(ds.values, name, 'values');
    for (var field$$1 in ds.index) {
      annotate(ds.index[field$$1], name, 'index:' + field$$1);
    }
  }

  return this;
};

// ----

prototype$83.pushState = function(encode, parent, lookup) {
  this._encode.push(ref(this.add(Sieve$1({pulse: encode}))));
  this._parent.push(parent);
  this._lookup.push(lookup ? ref(this.proxy(lookup)) : null);
  this._markpath.push(-1);
};

prototype$83.popState = function() {
  this._encode.pop();
  this._parent.pop();
  this._lookup.pop();
  this._markpath.pop();
};

prototype$83.parent = function() {
  return peek(this._parent);
};

prototype$83.encode = function() {
  return peek(this._encode);
};

prototype$83.lookup = function() {
  return peek(this._lookup);
};

prototype$83.markpath = function() {
  var p = this._markpath;
  return ++p[p.length-1];
};

// ----

prototype$83.fieldRef = function(field$$1, name) {
  if (isString(field$$1)) return fieldRef$1(field$$1, name);
  if (!field$$1.signal) {
    error$1('Unsupported field reference: ' + $$2(field$$1));
  }

  var s = field$$1.signal,
      f = this.field[s],
      params;

  if (!f) { // TODO: replace with update signalRef?
    params = {name: this.signalRef(s)};
    if (name) params.as = name;
    this.field[s] = f = ref(this.add(Field$1(params)));
  }
  return f;
};

prototype$83.compareRef = function(cmp) {
  function check(_$$1) {
    if (isSignal(_$$1)) {
      signal = true;
      return ref(sig[_$$1.signal]);
    } else {
      return _$$1;
    }
  }

  var sig = this.signals,
      signal = false,
      fields = array(cmp.field).map(check),
      orders = array(cmp.order).map(check);

  return signal
    ? ref(this.add(Compare$1({fields: fields, orders: orders})))
    : compareRef(fields, orders);
};

prototype$83.keyRef = function(fields) {
  function check(_$$1) {
    if (isSignal(_$$1)) {
      signal = true;
      return ref(sig[_$$1.signal]);
    } else {
      return _$$1;
    }
  }

  var sig = this.signals,
      signal = false;
  fields = array(fields).map(check);

  return signal
    ? ref(this.add(Key$1({fields: fields})))
    : keyRef(fields);
};

prototype$83.sortRef = function(sort) {
  if (!sort) return sort;

  // including id ensures stable sorting
  var a = [aggrField(sort.op, sort.field), tupleidRef],
      o = sort.order || Ascending;

  return o.signal
    ? ref(this.add(Compare$1({
        fields: a,
        orders: [o = this.signalRef(o.signal), o]
      })))
    : compareRef(a, [o, o]);
};

// ----

prototype$83.event = function(source, type) {
  var key$$1 = source + ':' + type;
  if (!this.events[key$$1]) {
    var id$$1 = this.id();
    this.streams.push({
      id: id$$1,
      source: source,
      type: type
    });
    this.events[key$$1] = id$$1;
  }
  return this.events[key$$1];
};

// ----

prototype$83.addSignal = function(name, value$$1) {
  if (this.signals.hasOwnProperty(name)) {
    error$1('Duplicate signal name: ' + $$2(name));
  }
  var op = value$$1 instanceof Entry ? value$$1 : this.add(operator(value$$1));
  return this.signals[name] = op;
};

prototype$83.getSignal = function(name) {
  if (!this.signals[name]) {
    error$1('Unrecognized signal name: ' + $$2(name));
  }
  return this.signals[name];
};

prototype$83.signalRef = function(s) {
  if (this.signals[s]) {
    return ref(this.signals[s]);
  } else if (!this.lambdas.hasOwnProperty(s)) {
    this.lambdas[s] = this.add(operator(null));
  }
  return ref(this.lambdas[s]);
};

prototype$83.parseLambdas = function() {
  var code = Object.keys(this.lambdas);
  for (var i=0, n=code.length; i<n; ++i) {
    var s = code[i],
        e = parseExpression(s, this),
        op = this.lambdas[s];
    op.params = e.$params;
    op.update = e.$expr;
  }
};

prototype$83.property = function(spec) {
  return spec && spec.signal ? this.signalRef(spec.signal) : spec;
};

prototype$83.objectProperty = function(spec) {
  return (!spec || !isObject(spec)) ? spec
    : this.signalRef(spec.signal || propertyLambda(spec));
};

function propertyLambda(spec) {
  return (isArray(spec) ? arrayLambda : objectLambda)(spec);
}

function arrayLambda(array$$1) {
  var code = '[',
      i = 0,
      n = array$$1.length,
      value$$1;

  for (; i<n; ++i) {
    value$$1 = array$$1[i];
    code += (i > 0 ? ',' : '')
      + (isObject(value$$1)
        ? (value$$1.signal || propertyLambda(value$$1))
        : $$2(value$$1));
  }
  return code + ']';
}

function objectLambda(obj) {
  var code = '{',
      i = 0,
      key$$1, value$$1;

  for (key$$1 in obj) {
    value$$1 = obj[key$$1];
    code += (++i > 1 ? ',' : '')
      + $$2(key$$1) + ':'
      + (isObject(value$$1)
        ? (value$$1.signal || propertyLambda(value$$1))
        : $$2(value$$1));
  }
  return code + '}';
}

prototype$83.addBinding = function(name, bind) {
  if (!this.bindings) {
    error$1('Nested signals do not support binding: ' + $$2(name));
  }
  this.bindings.push(extend({signal: name}, bind));
};

// ----

prototype$83.addScaleProj = function(name, transform) {
  if (this.scales.hasOwnProperty(name)) {
    error$1('Duplicate scale or projection name: ' + $$2(name));
  }
  this.scales[name] = this.add(transform);
};

prototype$83.addScale = function(name, params) {
  this.addScaleProj(name, Scale$1(params));
};

prototype$83.addProjection = function(name, params) {
  this.addScaleProj(name, Projection$1(params));
};

prototype$83.getScale = function(name) {
  if (!this.scales[name]) {
    error$1('Unrecognized scale name: ' + $$2(name));
  }
  return this.scales[name];
};

prototype$83.projectionRef =
prototype$83.scaleRef = function(name) {
  return ref(this.getScale(name));
};

prototype$83.projectionType =
prototype$83.scaleType = function(name) {
  return this.getScale(name).params.type;
};

// ----

prototype$83.addData = function(name, dataScope) {
  if (this.data.hasOwnProperty(name)) {
    error$1('Duplicate data set name: ' + $$2(name));
  }
  return (this.data[name] = dataScope);
};

prototype$83.getData = function(name) {
  if (!this.data[name]) {
    error$1('Undefined data set name: ' + $$2(name));
  }
  return this.data[name];
};

prototype$83.addDataPipeline = function(name, entries) {
  if (this.data.hasOwnProperty(name)) {
    error$1('Duplicate data set name: ' + $$2(name));
  }
  return this.addData(name, DataScope.fromEntries(this, entries));
};

var defaults = function(configs) {
  var output = defaults$1();
  (configs || []).forEach(function(config) {
    var key$$1, style;
    if (config) {
      for (key$$1 in config) {
        if (key$$1 === 'style') {
          style = output.style || (output.style = {});
          for (key$$1 in config.style) {
            style[key$$1] = extend(style[key$$1] || {}, config.style[key$$1]);
          }
        } else {
          output[key$$1] = extend(output[key$$1] || {}, config[key$$1]);
        }
      }
    }
  });
  return output;
};

var defaultFont = 'sans-serif';
var defaultSymbolSize = 30;
var defaultStrokeWidth = 2;
var defaultColor = '#4c78a8';
var black = "#000";
var gray = '#888';
var lightGray = '#ddd';

/**
 * Standard configuration defaults for Vega specification parsing.
 * Users can provide their own (sub-)set of these default values
 * by passing in a config object to the top-level parse method.
 */
function defaults$1() {
  return {
    // default padding around visualization
    padding: 0,

    // default for automatic sizing; options: "none", "pad", "fit"
    // or provide an object (e.g., {"type": "pad", "resize": true})
    autosize: 'pad',

    // default view background color
    // covers the entire view component
    background: null,

    // default event handling configuration
    // preventDefault for view-sourced event types except 'wheel'
    events: {
      defaults: {allow: ['wheel']}
    },

    // defaults for top-level group marks
    // accepts mark properties (fill, stroke, etc)
    // covers the data rectangle within group width/height
    group: null,

    // defaults for basic mark types
    // each subset accepts mark properties (fill, stroke, etc)
    mark: null,
    arc: { fill: defaultColor },
    area: { fill: defaultColor },
    image: null,
    line: {
      stroke: defaultColor,
      strokeWidth: defaultStrokeWidth
    },
    path: { stroke: defaultColor },
    rect: { fill: defaultColor },
    rule: { stroke: black },
    shape: { stroke: defaultColor },
    symbol: {
      fill: defaultColor,
      size: 64
    },
    text: {
      fill: black,
      font: defaultFont,
      fontSize: 11
    },

    // style definitions
    style: {
      // axis & legend labels
      "guide-label": {
        fill: black,
        font: defaultFont,
        fontSize: 10
      },
      // axis & legend titles
      "guide-title": {
        fill: black,
        font: defaultFont,
        fontSize: 11,
        fontWeight: 'bold'
      },
      // headers, including chart title
      "group-title": {
        fill: black,
        font: defaultFont,
        fontSize: 13,
        fontWeight: 'bold'
      },
      // defaults for styled point marks in Vega-Lite
      point: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'circle'
      },
      circle: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth
      },
      square: {
        size: defaultSymbolSize,
        strokeWidth: defaultStrokeWidth,
        shape: 'square'
      },
      // defaults for styled group marks in Vega-Lite
      cell: {
        fill: 'transparent',
        stroke: lightGray
      }
    },

    // defaults for axes
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domain: true,
      domainWidth: 1,
      domainColor: gray,
      grid: false,
      gridWidth: 1,
      gridColor: lightGray,
      gridDash: [],
      gridOpacity: 1,
      labels: true,
      labelAngle: 0,
      labelLimit: 180,
      labelPadding: 2,
      ticks: true,
      tickColor: gray,
      tickOffset: 0,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      titleAlign: 'center',
      titlePadding: 2
    },

    // correction for centering bias
    axisBand: {
      tickOffset: -1
    },

    // defaults for legends
    legend: {
      orient: 'right',
      offset: 18,
      padding: 0,
      entryPadding: 5,
      titlePadding: 5,
      gradientWidth: 100,
      gradientHeight: 20,
      gradientStrokeColor: lightGray,
      gradientStrokeWidth: 0,
      gradientLabelBaseline: 'top',
      gradientLabelOffset: 2,
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelOffset: 8,
      labelLimit: 160,
      symbolType: 'circle',
      symbolSize: 100,
      symbolFillColor: 'transparent',
      symbolStrokeColor: gray,
      symbolStrokeWidth: 1.5,
      titleAlign: 'left',
      titleBaseline: 'top',
      titleLimit: 180
    },

    // defaults for group title
    title: {
      orient: 'top',
      anchor: 'middle',
      offset: 2
    },

    // defaults for scale ranges
    range: {
      category: {
        scheme: 'tableau10'
      },
      ordinal: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      heatmap: {
        scheme: 'viridis'
      },
      ramp: {
        scheme: 'blues',
        extent: [0.2, 1]
      },
      diverging: {
        scheme: 'blueorange'
      },
      symbol: [
        'circle',
        'square',
        'triangle-up',
        'cross',
        'diamond',
        'triangle-right',
        'triangle-down',
        'triangle-left'
      ]
    }
  };
}

var parse$2 = function(spec, config) {
  if (!isObject(spec)) error$1('Input Vega specification must be an object.');
  return parseView(spec, new Scope(defaults([config, spec.config])))
    .toRuntime();
};

/**
 * Parse an expression given the argument signature and body code.
 */
function expression$1(args, code, ctx) {
  // wrap code in return statement if expression does not terminate
  if (code[code.length-1] !== ';') {
    code = 'return(' + code + ');';
  }
  var fn = Function.apply(null, args.concat(code));
  return ctx && ctx.functions ? fn.bind(ctx.functions) : fn;
}

/**
 * Parse an expression used to update an operator value.
 */
function operatorExpression(code, ctx) {
  return expression$1(['_'], code, ctx);
}

/**
 * Parse an expression provided as an operator parameter value.
 */
function parameterExpression(code, ctx) {
  return expression$1(['datum', '_'], code, ctx);
}

/**
 * Parse an expression applied to an event stream.
 */
function eventExpression(code, ctx) {
  return expression$1(['event'], code, ctx);
}

/**
 * Parse an expression used to handle an event-driven operator update.
 */
function handlerExpression(code, ctx) {
  return expression$1(['_', 'event'], code, ctx);
}

/**
 * Parse an expression that performs visual encoding.
 */
function encodeExpression(code, ctx) {
  return expression$1(['item', '_'], code, ctx);
}

/**
 * Parse a set of operator parameters.
 */
function parseParameters$1(spec, ctx, params) {
  params = params || {};
  var key$$1, value;

  for (key$$1 in spec) {
    value = spec[key$$1];

    if (value && value.$expr && value.$params) {
      // if expression, parse its parameters
      parseParameters$1(value.$params, ctx, params);
    }

    params[key$$1] = isArray(value)
      ? value.map(function(v) { return parseParameter$2(v, ctx); })
      : parseParameter$2(value, ctx);
  }
  return params;
}

/**
 * Parse a single parameter.
 */
function parseParameter$2(spec, ctx) {
  if (!spec || !isObject(spec)) return spec;

  for (var i=0, n=PARSERS.length, p; i<n; ++i) {
    p = PARSERS[i];
    if (spec.hasOwnProperty(p.key)) {
      return p.parse(spec, ctx);
    }
  }
  return spec;
}

/** Reference parsers. */
var PARSERS = [
  {key: '$ref',      parse: getOperator},
  {key: '$key',      parse: getKey},
  {key: '$expr',     parse: getExpression},
  {key: '$field',    parse: getField$1},
  {key: '$encode',   parse: getEncode},
  {key: '$compare',  parse: getCompare},
  {key: '$context',  parse: getContext},
  {key: '$subflow',  parse: getSubflow},
  {key: '$tupleid',  parse: getTupleId}
];

/**
 * Resolve an operator reference.
 */
function getOperator(_$$1, ctx) {
  return ctx.get(_$$1.$ref) || error$1('Operator not defined: ' + _$$1.$ref);
}

/**
 * Resolve an expression reference.
 */
function getExpression(_$$1, ctx) {
  var k = 'e:' + _$$1.$expr;
  return ctx.fn[k]
    || (ctx.fn[k] = accessor(parameterExpression(_$$1.$expr, ctx), _$$1.$fields, _$$1.$name));
}

/**
 * Resolve a key accessor reference.
 */
function getKey(_$$1, ctx) {
  var k = 'k:' + _$$1.$key;
  return ctx.fn[k] || (ctx.fn[k] = key(_$$1.$key));
}

/**
 * Resolve a field accessor reference.
 */
function getField$1(_$$1, ctx) {
  if (!_$$1.$field) return null;
  var k = 'f:' + _$$1.$field + '_' + _$$1.$name;
  return ctx.fn[k] || (ctx.fn[k] = field(_$$1.$field, _$$1.$name));
}

/**
 * Resolve a comparator function reference.
 */
function getCompare(_$$1, ctx) {
  var k = 'c:' + _$$1.$compare + '_' + _$$1.$order,
      c = array(_$$1.$compare).map(function(_$$1) {
        return (_$$1 && _$$1.$tupleid) ? tupleid : _$$1;
      });
  return ctx.fn[k] || (ctx.fn[k] = compare(c, _$$1.$order));
}

/**
 * Resolve an encode operator reference.
 */
function getEncode(_$$1, ctx) {
  var spec = _$$1.$encode,
      encode = {}, name, enc;

  for (name in spec) {
    enc = spec[name];
    encode[name] = accessor(encodeExpression(enc.$expr, ctx), enc.$fields);
    encode[name].output = enc.$output;
  }
  return encode;
}

/**
 * Resolve an context reference.
 */
function getContext(_$$1, ctx) {
  return ctx;
}

/**
 * Resolve a recursive subflow specification.
 */
function getSubflow(_$$1, ctx) {
  var spec = _$$1.$subflow;
  return function(dataflow, key$$1, parent) {
    var subctx = parseDataflow(spec, ctx.fork()),
        op = subctx.get(spec.operators[0].id),
        p = subctx.signals.parent;
    if (p) p.set(parent);
    return op;
  };
}

/**
 * Resolve a tuple id reference.
 */
function getTupleId() {
  return tupleid;
}

function canonicalType(type) {
  return (type + '').toLowerCase();
}
function isOperator(type) {
   return canonicalType(type) === 'operator';
}

function isCollect(type) {
  return canonicalType(type) === 'collect';
}

/**
 * Parse a dataflow operator.
 */
var parseOperator = function(spec, ctx) {
  if (isOperator(spec.type) || !spec.type) {
    ctx.operator(spec,
      spec.update ? operatorExpression(spec.update, ctx) : null);
  } else {
    ctx.transform(spec, spec.type);
  }
};

/**
 * Parse and assign operator parameters.
 */
function parseOperatorParameters(spec, ctx) {
  var op, params;
  if (spec.params) {
    if (!(op = ctx.get(spec.id))) {
      error$1('Invalid operator id: ' + spec.id);
    }
    params = parseParameters$1(spec.params, ctx);
    ctx.dataflow.connect(op, op.parameters(params));
  }
}

/**
 * Parse an event stream specification.
 */
var parseStream$3 = function(spec, ctx) {
  var filter = spec.filter != null ? eventExpression(spec.filter, ctx) : undefined,
      stream = spec.stream != null ? ctx.get(spec.stream) : undefined,
      args;

  if (spec.source) {
    stream = ctx.events(spec.source, spec.type, filter);
  }
  else if (spec.merge) {
    args = spec.merge.map(ctx.get.bind(ctx));
    stream = args[0].merge.apply(args[0], args.slice(1));
  }

  if (spec.between) {
    args = spec.between.map(ctx.get.bind(ctx));
    stream = stream.between(args[0], args[1]);
  }

  if (spec.filter) {
    stream = stream.filter(filter);
  }

  if (spec.throttle != null) {
    stream = stream.throttle(+spec.throttle);
  }

  if (spec.debounce != null) {
    stream = stream.debounce(+spec.debounce);
  }

  if (stream == null) {
    error$1('Invalid stream definition: ' + JSON.stringify(spec));
  }

  if (spec.consume) stream.consume(true);

  ctx.stream(spec, stream);
};

/**
 * Parse an event-driven operator update.
 */
var parseUpdate$1 = function(spec, ctx) {
  var source = ctx.get(spec.source),
      target = null,
      update = spec.update,
      params = undefined;

  if (!source) error$1('Source not defined: ' + spec.source);

  if (spec.target && spec.target.$expr) {
    target = eventExpression(spec.target.$expr, ctx);
  } else {
    target = ctx.get(spec.target);
  }

  if (update && update.$expr) {
    if (update.$params) {
      params = parseParameters$1(update.$params, ctx);
    }
    update = handlerExpression(update.$expr, ctx);
  }

  ctx.update(spec, source, target, update, params);
};

/**
 * Parse a serialized dataflow specification.
 */
var parseDataflow = function(spec, ctx) {
  var operators = spec.operators || [];

  // parse background
  if (spec.background) {
    ctx.background = spec.background;
  }

  // parse event configuration
  if (spec.eventConfig) {
    ctx.eventConfig = spec.eventConfig;
  }

  // parse operators
  operators.forEach(function(entry) {
    parseOperator(entry, ctx);
  });

  // parse operator parameters
  operators.forEach(function(entry) {
    parseOperatorParameters(entry, ctx);
  });

  // parse streams
  (spec.streams || []).forEach(function(entry) {
    parseStream$3(entry, ctx);
  });

  // parse updates
  (spec.updates || []).forEach(function(entry) {
    parseUpdate$1(entry, ctx);
  });

  return ctx.resolve();
};

var SKIP$3 = {skip: true};

function getState(options) {
  var ctx = this,
      state = {};

  if (options.signals) {
    var signals = (state.signals = {});
    Object.keys(ctx.signals).forEach(function(key$$1) {
      var op = ctx.signals[key$$1];
      if (options.signals(key$$1, op)) {
        signals[key$$1] = op.value;
      }
    });
  }

  if (options.data) {
    var data = (state.data = {});
    Object.keys(ctx.data).forEach(function(key$$1) {
      var dataset = ctx.data[key$$1];
      if (options.data(key$$1, dataset)) {
        data[key$$1] = dataset.input.value;
      }
    });
  }

  if (ctx.subcontext && options.recurse !== false) {
    state.subcontext = ctx.subcontext.map(function(ctx) {
      return ctx.getState(options);
    });
  }

  return state;
}

function setState(state) {
  var ctx = this,
      df = ctx.dataflow,
      data = state.data,
      signals = state.signals;

  Object.keys(signals || {}).forEach(function(key$$1) {
    df.update(ctx.signals[key$$1], signals[key$$1], SKIP$3);
  });

  Object.keys(data || {}).forEach(function(key$$1) {
    df.pulse(
      ctx.data[key$$1].input,
      df.changeset().remove(truthy).insert(data[key$$1])
    );
  });

  (state.subcontext  || []).forEach(function(substate, i) {
    var subctx = ctx.subcontext[i];
    if (subctx) subctx.setState(substate);
  });
}

/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, accessors, etc.
 * Provides a 'fork' method for creating child contexts for subflows.
 */
var context$2 = function(df, transforms, functions) {
  return new Context(df, transforms, functions);
};

function Context(df, transforms, functions) {
  this.dataflow = df;
  this.transforms = transforms;
  this.events = df.events.bind(df);
  this.signals = {};
  this.scales = {};
  this.nodes = {};
  this.data = {};
  this.fn = {};
  if (functions) {
    this.functions = Object.create(functions);
    this.functions.context = this;
  }
}

function ContextFork(ctx) {
  this.dataflow = ctx.dataflow;
  this.transforms = ctx.transforms;
  this.functions = ctx.functions;
  this.events = ctx.events;
  this.signals = Object.create(ctx.signals);
  this.scales = Object.create(ctx.scales);
  this.nodes = Object.create(ctx.nodes);
  this.data = Object.create(ctx.data);
  this.fn = Object.create(ctx.fn);
  if (ctx.functions) {
    this.functions = Object.create(ctx.functions);
    this.functions.context = this;
  }
}

Context.prototype = ContextFork.prototype = {
  fork: function() {
    var ctx = new ContextFork(this);
    (this.subcontext || (this.subcontext = [])).push(ctx);
    return ctx;
  },
  get: function(id) {
    return this.nodes[id];
  },
  set: function(id, node) {
    return this.nodes[id] = node;
  },
  add: function(spec, op) {
    var ctx = this,
        df = ctx.dataflow,
        data;

    ctx.set(spec.id, op);

    if (isCollect(spec.type) && (data = spec.value)) {
      if (data.$ingest) {
        df.ingest(op, data.$ingest, data.$format);
      } else if (data.$request) {
        df.request(op, data.$request, data.$format);
      } else {
        df.pulse(op, df.changeset().insert(data));
      }
    }

    if (spec.root) {
      ctx.root = op;
    }

    if (spec.parent) {
      var p = ctx.get(spec.parent.$ref);
      if (p) {
        df.connect(p, [op]);
        op.targets().add(p);
      } else {
        (ctx.unresolved = ctx.unresolved || []).push(function() {
          p = ctx.get(spec.parent.$ref);
          df.connect(p, [op]);
          op.targets().add(p);
        });
      }
    }

    if (spec.signal) {
      ctx.signals[spec.signal] = op;
    }

    if (spec.scale) {
      ctx.scales[spec.scale] = op;
    }

    if (spec.data) {
      for (var name in spec.data) {
        data = ctx.data[name] || (ctx.data[name] = {});
        spec.data[name].forEach(function(role) { data[role] = op; });
      }
    }
  },
  resolve: function() {
    (this.unresolved || []).forEach(function(fn) { fn(); });
    delete this.unresolved;
    return this;
  },
  operator: function(spec, update, params) {
    this.add(spec, this.dataflow.add(spec.value, update, params, spec.react));
  },
  transform: function(spec, type, params) {
    this.add(spec, this.dataflow.add(this.transforms[canonicalType(type)], params));
  },
  stream: function(spec, stream) {
    this.set(spec.id, stream);
  },
  update: function(spec, stream, target, update, params) {
    this.dataflow.on(stream, target, update, params, spec.options);
  },
  getState: getState,
  setState: setState
};

var runtime = function(view, spec, functions) {
  var fn = functions || functionContext;
  return parseDataflow(spec, context$2(view, transforms, fn));
};

var Padding$1 = 'padding';

function viewWidth(view, width) {
  var a = view.autosize(),
      p = view.padding();
  return width - (a && a.contains === Padding$1 ? p.left + p.right : 0);
}

function viewHeight(view, height) {
  var a = view.autosize(),
      p = view.padding();
  return height - (a && a.contains === Padding$1 ? p.top + p.bottom : 0);
}

function initializeResize(view) {
  var s = view._signals,
      w = s.width,
      h = s.height,
      p = s.padding;

  function resetSize() {
    view._autosize = view._resize = 1;
  }

  // respond to width signal
  view._resizeWidth = view.add(null,
    function(_$$1) {
      view._width = _$$1.size;
      view._viewWidth = viewWidth(view, _$$1.size);
      resetSize();
    },
    {size: w}
  );

  // respond to height signal
  view._resizeHeight = view.add(null,
    function(_$$1) {
      view._height = _$$1.size;
      view._viewHeight = viewHeight(view, _$$1.size);
      resetSize();
    },
    {size: h}
  );

  // respond to padding signal
  var resizePadding = view.add(null, resetSize, {pad: p});

  // set rank to run immediately after source signal
  view._resizeWidth.rank = w.rank + 1;
  view._resizeHeight.rank = h.rank + 1;
  resizePadding.rank = p.rank + 1;
}

function resizeView(viewWidth, viewHeight, width, height, origin, auto) {
  this.runAfter(function(view) {
    var rerun = 0;

    // reset autosize flag
    view._autosize = 0;

    // width value changed: update signal, skip resize op
    if (view.width() !== width) {
      rerun = 1;
      view.width(width);
      view._resizeWidth.skip(true);
    }

    // height value changed: update signal, skip resize op
    if (view.height() !== height) {
      rerun = 1;
      view.height(height);
      view._resizeHeight.skip(true);
    }

    // view width changed: update view property, set resize flag
    if (view._viewWidth !== viewWidth) {
      view._resize = 1;
      view._viewWidth = viewWidth;
    }

    // view height changed: update view property, set resize flag
    if (view._viewHeight !== viewHeight) {
      view._resize = 1;
      view._viewHeight = viewHeight;
    }

    // origin changed: update view property, set resize flag
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }

    // run dataflow on width/height signal change
    if (rerun) view.run('enter');
    if (auto) view.runAfter(function() { view.resize(); });
  });
}

/**
 * Get the current view state, consisting of signal values and/or data sets.
 * @param {object} [options] - Options flags indicating which state to export.
 *   If unspecified, all signals and data sets will be exported.
 * @param {function(string, Operator):boolean} [options.signals] - Optional
 *   predicate function for testing if a signal should be included in the
 *   exported state. If unspecified, all signals will be included, except for
 *   those named 'parent' or those which refer to a Transform value.
 * @param {function(string, object):boolean} [options.data] - Optional
 *   predicate function for testing if a data set's input should be included
 *   in the exported state. If unspecified, all data sets that have been
 *   explicitly modified will be included.
 * @param {boolean} [options.recurse=true] - Flag indicating if the exported
 *   state should recursively include state from group mark sub-contexts.
 * @return {object} - An object containing the exported state values.
 */
function getState$1(options) {
  return this._runtime.getState(options || {
    data:    dataTest,
    signals: signalTest,
    recurse: true
  });
}

function dataTest(name, data) {
  return data.modified
      && isArray(data.input.value)
      && name.indexOf('_:vega:_');
}

function signalTest(name, op) {
  return !(name === 'parent' || op instanceof transforms.Proxy);
}

/**
 * Sets the current view state and updates the view by invoking run.
 * @param {object} state - A state object containing signal and/or
 *   data set values, following the format used by the getState method.
 * @return {View} - This view instance.
 */
function setState$1(state) {
  var view = this;
  view._trigger = false;
  view._runtime.setState(state);
  view.run().runAfter(function() { view._trigger = true; });
  return this;
}

/**
 * Create a new View instance from a Vega dataflow runtime specification.
 * The generated View will not immediately be ready for display. Callers
 * should also invoke the initialize method (e.g., to set the parent
 * DOM element in browser-based deployment) and then invoke the run
 * method to evaluate the dataflow graph. Rendering will automatically
 * be peformed upon dataflow runs.
 * @constructor
 * @param {object} spec - The Vega dataflow runtime specification.
 */
function View(spec, options) {
  var view = this;
  options = options || {};

  Dataflow.call(view);
  view.loader(options.loader || view._loader);
  view.logLevel(options.logLevel || 0);

  view._el = null;
  view._renderType = options.renderer || RenderType.Canvas;
  view._scenegraph = new Scenegraph();
  var root = view._scenegraph.root;

  // initialize renderer, handler and event management
  view._renderer = null;
  view._redraw = true;
  view._handler = new CanvasHandler().scene(root);
  view._eventListeners = [];
  view._preventDefault = false;

  // initialize dataflow graph
  var ctx = runtime(view, spec, options.functions);
  view._runtime = ctx;
  view._signals = ctx.signals;
  view._bind = (spec.bindings || []).map(function(_$$1) {
    return {
      state: null,
      param: extend({}, _$$1)
    };
  });

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  view.pulse(
    ctx.data.root.input,
    view.changeset().insert(root.items)
  );

  // initialize background color
  view._background = ctx.background || null;

  // initialize event configuration
  view._eventConfig = initializeEventConfig(ctx.eventConfig);

  // initialize view size
  view._width = view.width();
  view._height = view.height();
  view._viewWidth = viewWidth(view, view._width);
  view._viewHeight = viewHeight(view, view._height);
  view._origin = [0, 0];
  view._resize = 0;
  view._autosize = 1;
  initializeResize(view);

  // initialize cursor
  cursor(view);
}

var prototype$81 = inherits(View, Dataflow);

// -- DATAFLOW / RENDERING ----

prototype$81.run = function(encode) {
  Dataflow.prototype.run.call(this, encode);
  if (this._redraw || this._resize) {
    try {
      this.render();
    } catch (e) {
      this.error(e);
    }
  }
  return this;
};

prototype$81.render = function() {
  if (this._renderer) {
    if (this._resize) {
      this._resize = 0;
      resizeRenderer(this);
    }
    this._renderer.render(this._scenegraph.root);
  }
  this._redraw = false;
  return this;
};

prototype$81.dirty = function(item) {
  this._redraw = true;
  this._renderer && this._renderer.dirty(item);
};

// -- GET / SET ----

prototype$81.container = function() {
  return this._el;
};

prototype$81.scenegraph = function() {
  return this._scenegraph;
};

function lookupSignal(view, name) {
  return view._signals.hasOwnProperty(name)
    ? view._signals[name]
    : error$1('Unrecognized signal name: ' + $$2(name));
}

prototype$81.signal = function(name, value, options) {
  var op = lookupSignal(this, name);
  return arguments.length === 1
    ? op.value
    : this.update(op, value, options);
};

prototype$81.background = function(_$$1) {
  if (arguments.length) {
    this._background = _$$1;
    this._resize = 1;
    return this;
  } else {
    return this._background;
  }
};

prototype$81.width = function(_$$1) {
  return arguments.length ? this.signal('width', _$$1) : this.signal('width');
};

prototype$81.height = function(_$$1) {
  return arguments.length ? this.signal('height', _$$1) : this.signal('height');
};

prototype$81.padding = function(_$$1) {
  return arguments.length ? this.signal('padding', _$$1) : this.signal('padding');
};

prototype$81.autosize = function(_$$1) {
  return arguments.length ? this.signal('autosize', _$$1) : this.signal('autosize');
};

prototype$81.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (!renderModule(type)) error$1('Unrecognized renderer type: ' + type);
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype$81.loader = function(loader) {
  if (!arguments.length) return this._loader;
  if (loader !== this._loader) {
    Dataflow.prototype.loader.call(this, loader);
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el);
    }
  }
  return this;
};

prototype$81.resize = function() {
  this._autosize = 1;
  return this;
};

// -- SIZING ----
prototype$81._resizeView = resizeView;

// -- EVENT HANDLING ----

prototype$81.addEventListener = function(type, handler) {
  this._handler.on(type, handler);
  return this;
};

prototype$81.removeEventListener = function(type, handler) {
  this._handler.off(type, handler);
  return this;
};

prototype$81.addSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      h = function() { handler(name, s.value); };
  h.handler = handler;
  this.on(s, null, h);
  return this;
};

prototype$81.removeSignalListener = function(name, handler) {
  var s = lookupSignal(this, name),
      t = s._targets || [],
      h = t.filter(function(op) {
            var u = op._update;
            return u && u.handler === handler;
          });
  if (h.length) t.remove(h[0]);
  return this;
};

prototype$81.preventDefault = function(_$$1) {
  if (arguments.length) {
    this._preventDefault = _$$1;
    return this;
  } else {
    return this._preventDefault;
  }
};

prototype$81.tooltipHandler = function(_$$1) {
  var h = this._handler;
  if (!arguments.length) {
    return h.handleTooltip;
  } else {
    h.handleTooltip = _$$1 || Handler.prototype.handleTooltip;
    return this;
  }
};

prototype$81.events = events$1;
prototype$81.finalize = finalize;
prototype$81.hover = hover;

// -- DATA ----
prototype$81.data = data;
prototype$81.change = change;
prototype$81.insert = insert;
prototype$81.remove = remove;

// -- INITIALIZATION ----
prototype$81.initialize = initialize$1;

// -- HEADLESS RENDERING ----
prototype$81.toImageURL = renderToImageURL;
prototype$81.toCanvas = renderToCanvas;
prototype$81.toSVG = renderToSVG;

// -- SAVE / RESTORE STATE ----
prototype$81.getState = getState$1;
prototype$81.setState = setState$1;

// -- Transforms -----

extend(transforms, tx, vtx, encode, geo, force, tree$1, voronoi$1, wordcloud, xf);

exports.version = version;
exports.Dataflow = Dataflow;
exports.EventStream = EventStream;
exports.Parameters = Parameters;
exports.Pulse = Pulse;
exports.MultiPulse = MultiPulse;
exports.Operator = Operator;
exports.Transform = Transform;
exports.changeset = changeset;
exports.ingest = ingest;
exports.isTuple = isTuple;
exports.definition = definition;
exports.transform = transform;
exports.transforms = transforms;
exports.tupleid = tupleid;
exports.scale = scale$1;
exports.scheme = getScheme;
exports.interpolate = interpolate$1;
exports.interpolateRange = interpolateRange;
exports.timeInterval = timeInterval;
exports.utcInterval = utcInterval;
exports.projection = projection;
exports.View = View;
exports.parse = parse$2;
exports.expressionFunction = expressionFunction;
exports.formatLocale = d3Format.formatDefaultLocale;
exports.timeFormatLocale = d3TimeFormat.timeFormatDefaultLocale;
exports.runtime = parseDataflow;
exports.runtimeContext = context$2;
exports.bin = bin;
exports.bootstrapCI = bootstrapCI;
exports.quartiles = quartiles;
exports.setRandom = setRandom;
exports.randomInteger = integer;
exports.randomKDE = randomKDE;
exports.randomMixture = randomMixture;
exports.randomNormal = randomNormal;
exports.randomUniform = randomUniform;
exports.accessor = accessor;
exports.accessorName = accessorName;
exports.accessorFields = accessorFields;
exports.id = id;
exports.identity = identity;
exports.zero = zero;
exports.one = one;
exports.truthy = truthy;
exports.falsy = falsy;
exports.logger = logger;
exports.None = None;
exports.Error = Error$1;
exports.Warn = Warn;
exports.Info = Info;
exports.Debug = Debug;
exports.panLinear = panLinear;
exports.panLog = panLog;
exports.panPow = panPow;
exports.zoomLinear = zoomLinear;
exports.zoomLog = zoomLog;
exports.zoomPow = zoomPow;
exports.array = array;
exports.compare = compare;
exports.constant = constant;
exports.debounce = debounce;
exports.error = error$1;
exports.extend = extend;
exports.extentIndex = extentIndex;
exports.fastmap = fastmap;
exports.field = field;
exports.inherits = inherits;
exports.isArray = isArray;
exports.isBoolean = isBoolean;
exports.isDate = isDate;
exports.isFunction = isFunction;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isRegExp = isRegExp;
exports.isString = isString;
exports.key = key;
exports.merge = merge;
exports.pad = pad;
exports.peek = peek;
exports.repeat = repeat;
exports.splitAccessPath = splitAccessPath;
exports.stringValue = $$2;
exports.toBoolean = toBoolean;
exports.toDate = toDate;
exports.toNumber = toNumber;
exports.toString = toString;
exports.toSet = toSet;
exports.truncate = truncate;
exports.visitArray = visitArray;
exports.loader = loader;
exports.read = read;
exports.inferType = inferType;
exports.inferTypes = inferTypes;
exports.typeParsers = typeParsers;
exports.formats = formats$1;
exports.Bounds = Bounds;
exports.Gradient = Gradient;
exports.GroupItem = GroupItem;
exports.ResourceLoader = ResourceLoader;
exports.Item = Item;
exports.Scenegraph = Scenegraph;
exports.Handler = Handler;
exports.Renderer = Renderer;
exports.CanvasHandler = CanvasHandler;
exports.CanvasRenderer = CanvasRenderer;
exports.SVGHandler = SVGHandler;
exports.SVGRenderer = SVGRenderer;
exports.SVGStringRenderer = SVGStringRenderer;
exports.RenderType = RenderType;
exports.renderModule = renderModule;
exports.Marks = marks;
exports.boundContext = context;
exports.boundStroke = boundStroke;
exports.boundItem = boundItem$1;
exports.boundMark = boundMark;
exports.pathCurves = curves;
exports.pathSymbols = symbols;
exports.pathRectangle = vg_rect;
exports.pathTrail = vg_trail;
exports.pathParse = pathParse;
exports.pathRender = pathRender;
exports.point = point;
exports.canvas = Canvas$1;
exports.domCreate = domCreate;
exports.domFind = domFind;
exports.domChild = domChild;
exports.domClear = domClear;
exports.openTag = openTag;
exports.closeTag = closeTag;
exports.font = font;
exports.textMetrics = textMetrics;
exports.resetSVGClipId = resetSVGClipId;
exports.sceneEqual = sceneEqual;
exports.pathEqual = pathEqual;
exports.sceneToJSON = sceneToJSON;
exports.sceneFromJSON = sceneFromJSON;
exports.sceneZOrder = zorder;
exports.sceneVisit = visit;
exports.scenePickVisit = pickVisit;

Object.defineProperty(exports, '__esModule', { value: true });

})));
