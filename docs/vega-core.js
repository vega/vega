(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-dsv'), require('d3-path'), require('d3-shape'), require('d3-scale-chromatic'), require('d3-time'), require('d3-scale'), require('d3-interpolate'), require('d3-force'), require('d3-collection'), require('d3-hierarchy'), require('d3-voronoi'), require('d3-color'), require('d3-array'), require('d3-geo'), require('d3-format'), require('d3-time-format'), require('d3-timer')) :
  typeof define === 'function' && define.amd ? define(['exports', 'd3-dsv', 'd3-path', 'd3-shape', 'd3-scale-chromatic', 'd3-time', 'd3-scale', 'd3-interpolate', 'd3-force', 'd3-collection', 'd3-hierarchy', 'd3-voronoi', 'd3-color', 'd3-array', 'd3-geo', 'd3-format', 'd3-time-format', 'd3-timer'], factory) :
  (factory((global.vega = {}),global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3,global.d3));
}(this, (function (exports,d3Dsv,d3Path,d3Shape,_,d3Time,$,$$1,d3Force,d3Collection,d3Hierarchy,d3Voronoi,d3Color,d3Array,d3Geo,d3Format,d3TimeFormat,d3Timer) { 'use strict';

  function accessor(fn, fields, name) {
    fn.fields = fields || [];
    fn.fname = name;
    return fn;
  }

  function accessorName(fn) {
    return fn == null ? null : fn.fname;
  }

  function accessorFields(fn) {
    return fn == null ? null : fn.fields;
  }

  function error(message) {
    throw Error(message);
  }

  function splitAccessPath(p) {
    var path = [],
        q = null,
        b = 0,
        n = p.length,
        s = '',
        i, j, c;

    p = p + '';

    function push() {
      path.push(s + p.substring(i, j));
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
        if (!b) error('Access path missing open bracket: ' + p);
        if (b > 0) push();
        b = 0;
        i = j + 1;
      }
    }

    if (b) error('Access path missing closing bracket: ' + p);
    if (q) error('Access path missing closing quote: ' + p);

    if (j > i) {
      j++;
      push();
    }

    return path;
  }

  var isArray = Array.isArray;

  function isObject(_$$1) {
    return _$$1 === Object(_$$1);
  }

  function isString(_$$1) {
    return typeof _$$1 === 'string';
  }

  function $$2(x) {
    return isArray(x) ? '[' + x.map($$2) + ']'
      : isObject(x) || isString(x) ?
        // Output valid JSON and JS source strings.
        // See http://timelessrepo.com/json-isnt-a-javascript-subset
        JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
      : x;
  }

  function field(field, name) {
    var path = splitAccessPath(field),
        code = 'return _[' + path.map($$2).join('][') + '];';

    return accessor(
      Function('_', code),
      [(field = path.length===1 ? path[0] : field)],
      name || field
    );
  }

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

  function logger(_$$1) {
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
  }

  function peek(array) {
    return array[array.length - 1];
  }

  function toNumber(_$$1) {
    return _$$1 == null || _$$1 === '' ? null : +_$$1;
  }

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

  function array(_$$1) {
    return _$$1 != null ? (isArray(_$$1) ? _$$1 : [_$$1]) : [];
  }

  function isFunction(_$$1) {
    return typeof _$$1 === 'function';
  }

  function compare(fields, orders) {
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
  }

  function constant(_$$1) {
    return isFunction(_$$1) ? _$$1 : function() { return _$$1; };
  }

  function debounce(delay, handler) {
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
  }

  function extend(_$$1) {
    for (var x, k, i=1, len=arguments.length; i<len; ++i) {
      x = arguments[i];
      for (k in x) { _$$1[k] = x[k]; }
    }
    return _$$1;
  }

  function extentIndex(array, f) {
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
  }

  var NULL = {};

  function fastmap(input) {
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
  }

  function inherits(child, parent) {
    var proto = (child.prototype = Object.create(parent.prototype));
    proto.constructor = child;
    return proto;
  }

  function isBoolean(_$$1) {
    return typeof _$$1 === 'boolean';
  }

  function isDate(_$$1) {
    return Object.prototype.toString.call(_$$1) === '[object Date]';
  }

  function isNumber(_$$1) {
    return typeof _$$1 === 'number';
  }

  function isRegExp(_$$1) {
    return Object.prototype.toString.call(_$$1) === '[object RegExp]';
  }

  function key(fields, flat) {
    if (fields) {
      fields = flat
        ? array(fields).map(function(f) { return f.replace(/\\(.)/g, '$1'); })
        : array(fields);
    }

    var fn = !(fields && fields.length)
      ? function() { return ''; }
      : Function('_', 'return \'\'+' +
          fields.map(function(f) {
            return '_[' + (flat
                ? $$2(f)
                : splitAccessPath(f).map($$2).join('][')
              ) + ']';
          }).join('+\'|\'+') + ';');

    return accessor(fn, fields, 'key');
  }

  function merge(compare, array0, array1, output) {
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
  }

  function repeat(str, reps) {
    var s = '';
    while (--reps >= 0) s += str;
    return s;
  }

  function pad(str, length, padchar, align) {
    var c = padchar || ' ',
        s = str + '',
        n = length - s.length;

    return n <= 0 ? s
      : align === 'left' ? repeat(c, n) + s
      : align === 'center' ? repeat(c, ~~(n/2)) + s + repeat(c, Math.ceil(n/2))
      : s + repeat(c, n);
  }

  function toBoolean(_$$1) {
    return _$$1 == null || _$$1 === '' ? null : !_$$1 || _$$1 === 'false' || _$$1 === '0' ? false : !!_$$1;
  }

  function defaultParser(_$$1) {
    return isNumber(_$$1) ? _$$1 : isDate(_$$1) ? _$$1 : Date.parse(_$$1);
  }

  function toDate(_$$1, parser) {
    parser = parser || defaultParser;
    return _$$1 == null || _$$1 === '' ? null : parser(_$$1);
  }

  function toString(_$$1) {
    return _$$1 == null || _$$1 === '' ? null : _$$1 + '';
  }

  function toSet(_$$1) {
    for (var s={}, i=0, n=_$$1.length; i<n; ++i) s[_$$1[i]] = true;
    return s;
  }

  function truncate(str, length, align, ellipsis) {
    var e = ellipsis != null ? ellipsis : '\u2026',
        s = str + '',
        n = s.length,
        l = Math.max(0, length - e.length);

    return n <= length ? s
      : align === 'left' ? e + s.slice(n - l)
      : align === 'center' ? s.slice(0, Math.ceil(l/2)) + e + s.slice(n - ~~(l/2))
      : s.slice(0, l) + e;
  }

  function visitArray(array, filter, visitor) {
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
  }

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

  var TUPLE_ID_KEY = Symbol('vega_id'),
      TUPLE_ID = 1;

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
        var cur = {}, out = {}, i, n, m, f, t, id$$1;

        // build lookup table of current tuples
        for (i=0, n=tuples.length; i<n; ++i) {
          cur[tupleid(tuples[i])] = 1;
        }

        // process individual tuples to remove
        for (i=0, n=rem.length; i<n; ++i) {
          t = rem[i];
          cur[tupleid(t)] = -1;
        }

        // process predicate-based removals
        for (i=0, n=remp.length; i<n; ++i) {
          f = remp[i];
          tuples.forEach(function(t) {
            if (f(t)) cur[tupleid(t)] = -1;
          });
        }

        // process all add tuples
        for (i=0, n=add.length; i<n; ++i) {
          t = add[i];
          id$$1 = tupleid(t);
          if (cur[id$$1]) {
            // tuple already resides in dataset
            // if flagged for both add and remove, cancel
            cur[id$$1] = 1;
          } else {
            // tuple does not reside in dataset, add
            pulse.add.push(ingest(add[i]));
          }
        }

        // populate pulse rem list
        for (i=0, n=tuples.length; i<n; ++i) {
          t = tuples[i];
          if (cur[tupleid(t)] < 0) pulse.rem.push(t);
        }

        // modify helper method
        function modify(t, f, v) {
          if (v) {
            t[f] = v(t);
          } else {
            pulse.encode = f;
          }
          if (!reflow) out[tupleid(t)] = t;
        }

        // process individual tuples to modify
        for (i=0, n=mod.length; i<n; ++i) {
          m = mod[i];
          t = m.tuple;
          f = m.field;
          id$$1 = cur[tupleid(t)];
          if (id$$1 > 0) {
            modify(t, f, m.value);
            pulse.modifies(f);
          }
        }

        // process predicate-based modifications
        for (i=0, n=modp.length; i<n; ++i) {
          m = modp[i];
          f = m.filter;
          tuples.forEach(function(t) {
            if (f(t) && cur[tupleid(t)] > 0) {
              modify(t, m.field, m.value);
            }
          });
          pulse.modifies(m.field);
        }

        // upon reflow request, populate mod with all non-removed tuples
        // otherwise, populate mod with modified tuples only
        if (reflow) {
          pulse.mod = rem.length || remp.length
            ? tuples.filter(function(t) { return cur[tupleid(t)] > 0; })
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
    Object.defineProperty(this, CACHE, {writable: true, value: {}});
  }

  var prototype = Parameters.prototype;

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
  prototype.set = function(name, index, value, force) {
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
  prototype.modified = function(name, index) {
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
  prototype.clear = function() {
    this[CACHE] = {};
    return this;
  };

  var OP_ID = 0;
  var PULSE = 'pulse';
  var NO_PARAMS = new Parameters();

  // Boolean Flags
  var SKIP     = 1,
      MODIFIED = 2;

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
   * @param {boolean} [initonly=false] - A flag indicating if this operator
   *   should calculate an update only upon its initiatal evaluation, then
   *   deregister dependencies and suppress all future update invocations.
   * @return {Operator[]} - An array of upstream dependencies.
   */
  prototype$1.parameters = function(params, react, initonly) {
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
            error('Pulse parameters must be operator instances.');
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
    if (initonly) argops.initonly = true;

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

    if (argops) {
      for (i=0, n=argops.length; i<n; ++i) {
        item = argops[i];
        op = item.op;
        mod = op.modified() && op.stamp === stamp;
        argval.set(item.name, item.index, op.value, mod);
      }

      if (argops.initonly) {
        for (i=0; i<n; ++i) {
          item = argops[i];
          item.op.targets().remove(this);
        }
        this._argops = null;
        this._update = null;
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
    var update = this._update;
    if (update) {
      var params = this.marshall(pulse.stamp),
          v = update.call(this, params, pulse);

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
    return (this.pulse = rv || pulse);
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
  function add(init, update, params, react) {
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
  }

  /**
   * Connect a target operator as a dependent of source operators.
   * If necessary, this method will rerank the target operator and its
   * dependents to ensure propagation proceeds in a topologically sorted order.
   * @param {Operator} target - The target operator.
   * @param {Array<Operator>} - The source operators that should propagate
   *   to the target operator.
   */
  function connect(target, sources) {
    var targetRank = target.rank, i, n;

    for (i=0, n=sources.length; i<n; ++i) {
      if (targetRank < sources[i].rank) {
        this.rerank(target);
        return;
      }
    }
  }

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

  var prototype$2 = EventStream.prototype;

  prototype$2._filter = truthy;

  prototype$2._apply = identity;

  prototype$2.targets = function() {
    return this._targets || (this._targets = UniqueList(id));
  };

  prototype$2.consume = function(_$$1) {
    if (!arguments.length) return !!this._consume;
    this._consume = !!_$$1;
    return this;
  };

  prototype$2.receive = function(evt) {
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

  prototype$2.filter = function(filter) {
    var s = stream(filter);
    this.targets().add(s);
    return s;
  };

  prototype$2.apply = function(apply) {
    var s = stream(null, apply);
    this.targets().add(s);
    return s;
  };

  prototype$2.merge = function() {
    var s = stream();

    this.targets().add(s);
    for (var i=0, n=arguments.length; i<n; ++i) {
      arguments[i].targets().add(s);
    }

    return s;
  };

  prototype$2.throttle = function(pause) {
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

  prototype$2.debounce = function(delay) {
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

  prototype$2.between = function(a, b) {
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
  function events(source, type, filter, apply) {
    var df = this,
        s = stream(filter, apply),
        send = function(e) {
          e.dataflow = df;
          try {
            s.receive(e);
          } catch (error$$1) {
            df.error(error$$1);
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
  }

  // Matches absolute URLs with optional protocol
  //   https://...    file://...    //...
  var protocol_re = /^([A-Za-z]+:)?\/\//;

  // Special treatment in node.js for the file: protocol
  var fileProtocol = 'file://';

  /**
   * Creates a new loader instance that provides methods for requesting files
   * from either the network or disk, and for sanitizing request URIs.
   * @param {object} [options] - Optional default loading options to use.
   * @return {object} - A new loader instance.
   */
  function loader(options) {
    return {
      options: options || {},
      sanitize: sanitize,
      load: load,
      file: file,
      http: http
    };
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
    options = extend({}, this.options, options);

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

      // set uri
      result.href = uri;

      // set default result target, if specified
      if (options.target) {
        result.target = options.target + '';
      }

      // return
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
    return request(url, extend({}, this.options.http, options))
      .then(function(response) {
        if (!response.ok) throw response.status + '' + response.statusText;
        return response.text();
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
      f ? f.readFile(filename, function(error$$1, data) {
            if (error$$1) reject(error$$1);
            else accept(data);
          })
        : reject('No file system access for ' + filename);
    });
  }

  function request(url, init) {
    var f = typeof fetch === 'function' ? fetch : require('node-fetch');
    return f ? f(url, init) : Promise.reject('No fetch method available.');
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
    string:  toString,
    unknown: identity
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
    if (!values || !values.length) return 'unknown';

    var value, i, j, t = 0,
        n = values.length,
        m = typeTests.length,
        a = typeTests.map(function(_$$1, i) { return i + 1; });

    for (i=0, n=values.length; i<n; ++i) {
      value = field$$1 ? values[i][field$$1] : values[i];
      for (j=0; j<m; ++j) {
        if (a[j] && isValid(value) && !typeTests[j](value)) {
          a[j] = 0;
          ++t;
          if (t === typeTests.length) return 'string';
        }
      }
    }

    t = a.reduce(function(u, v) { return u === 0 ? v : u; }, 0) - 1;
    return typeList[t];
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
    return function(data, format) {
      var delim = {delimiter: delimiter};
      return dsv(data, format ? extend(format, delim) : delim);
    };
  }

  function dsv(data, format) {
    if (format.header) {
      data = format.header
        .map($$2)
        .join(format.delimiter) + '\n' + data;
    }
    return d3Dsv.dsvFormat(format.delimiter).parse(data+'');
  }

  function isBuffer(_$$1) {
    return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
      ? Buffer.isBuffer(_$$1) : false;
  }

  function json(data, format) {
    var prop = (format && format.property) ? field(format.property) : identity;
    return isObject(data) && !isBuffer(data)
      ? parseJSON(prop(data))
      : prop(JSON.parse(data));
  }

  function parseJSON(data, format) {
    return (format && format.copy)
      ? JSON.parse(JSON.stringify(data))
      : data;
  }

  function identity$1(x) {
    return x;
  }

  function transform(transform) {
    if (transform == null) return identity$1;
    var x0,
        y0,
        kx = transform.scale[0],
        ky = transform.scale[1],
        dx = transform.translate[0],
        dy = transform.translate[1];
    return function(input, i) {
      if (!i) x0 = y0 = 0;
      var j = 2, n = input.length, output = new Array(n);
      output[0] = (x0 += input[0]) * kx + dx;
      output[1] = (y0 += input[1]) * ky + dy;
      while (j < n) output[j] = input[j], ++j;
      return output;
    };
  }

  function reverse(array, n) {
    var t, j = array.length, i = j - n;
    while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
  }

  function feature(topology, o) {
    return o.type === "GeometryCollection"
        ? {type: "FeatureCollection", features: o.geometries.map(function(o) { return feature$1(topology, o); })}
        : feature$1(topology, o);
  }

  function feature$1(topology, o) {
    var id = o.id,
        bbox = o.bbox,
        properties = o.properties == null ? {} : o.properties,
        geometry = object(topology, o);
    return id == null && bbox == null ? {type: "Feature", properties: properties, geometry: geometry}
        : bbox == null ? {type: "Feature", id: id, properties: properties, geometry: geometry}
        : {type: "Feature", id: id, bbox: bbox, properties: properties, geometry: geometry};
  }

  function object(topology, o) {
    var transformPoint = transform(topology.transform),
        arcs = topology.arcs;

    function arc(i, points) {
      if (points.length) points.pop();
      for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length; k < n; ++k) {
        points.push(transformPoint(a[k], k));
      }
      if (i < 0) reverse(points, n);
    }

    function point(p) {
      return transformPoint(p);
    }

    function line(arcs) {
      var points = [];
      for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
      if (points.length < 2) points.push(points[0]); // This should never happen per the specification.
      return points;
    }

    function ring(arcs) {
      var points = line(arcs);
      while (points.length < 4) points.push(points[0]); // This may happen if an arc has only two points.
      return points;
    }

    function polygon(arcs) {
      return arcs.map(ring);
    }

    function geometry(o) {
      var type = o.type, coordinates;
      switch (type) {
        case "GeometryCollection": return {type: type, geometries: o.geometries.map(geometry)};
        case "Point": coordinates = point(o.coordinates); break;
        case "MultiPoint": coordinates = o.coordinates.map(point); break;
        case "LineString": coordinates = line(o.arcs); break;
        case "MultiLineString": coordinates = o.arcs.map(line); break;
        case "Polygon": coordinates = polygon(o.arcs); break;
        case "MultiPolygon": coordinates = o.arcs.map(polygon); break;
        default: return null;
      }
      return {type: type, coordinates: coordinates};
    }

    return geometry(o);
  }

  function stitch(topology, arcs) {
    var stitchedArcs = {},
        fragmentByStart = {},
        fragmentByEnd = {},
        fragments = [],
        emptyIndex = -1;

    // Stitch empty arcs first, since they may be subsumed by other arcs.
    arcs.forEach(function(i, j) {
      var arc = topology.arcs[i < 0 ? ~i : i], t;
      if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
        t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
      }
    });

    arcs.forEach(function(i) {
      var e = ends(i),
          start = e[0],
          end = e[1],
          f, g;

      if (f = fragmentByEnd[start]) {
        delete fragmentByEnd[f.end];
        f.push(i);
        f.end = end;
        if (g = fragmentByStart[end]) {
          delete fragmentByStart[g.start];
          var fg = g === f ? f : f.concat(g);
          fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else if (f = fragmentByStart[end]) {
        delete fragmentByStart[f.start];
        f.unshift(i);
        f.start = start;
        if (g = fragmentByEnd[start]) {
          delete fragmentByEnd[g.end];
          var gf = g === f ? f : g.concat(f);
          fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
        } else {
          fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
        }
      } else {
        f = [i];
        fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
      }
    });

    function ends(i) {
      var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
      if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
      else p1 = arc[arc.length - 1];
      return i < 0 ? [p1, p0] : [p0, p1];
    }

    function flush(fragmentByEnd, fragmentByStart) {
      for (var k in fragmentByEnd) {
        var f = fragmentByEnd[k];
        delete fragmentByStart[f.start];
        delete f.start;
        delete f.end;
        f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
        fragments.push(f);
      }
    }

    flush(fragmentByEnd, fragmentByStart);
    flush(fragmentByStart, fragmentByEnd);
    arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

    return fragments;
  }

  function mesh(topology) {
    return object(topology, meshArcs.apply(this, arguments));
  }

  function meshArcs(topology, object$$1, filter) {
    var arcs, i, n;
    if (arguments.length > 1) arcs = extractArcs(topology, object$$1, filter);
    else for (i = 0, arcs = new Array(n = topology.arcs.length); i < n; ++i) arcs[i] = i;
    return {type: "MultiLineString", arcs: stitch(topology, arcs)};
  }

  function extractArcs(topology, object$$1, filter) {
    var arcs = [],
        geomsByArc = [],
        geom;

    function extract0(i) {
      var j = i < 0 ? ~i : i;
      (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
    }

    function extract1(arcs) {
      arcs.forEach(extract0);
    }

    function extract2(arcs) {
      arcs.forEach(extract1);
    }

    function extract3(arcs) {
      arcs.forEach(extract2);
    }

    function geometry(o) {
      switch (geom = o, o.type) {
        case "GeometryCollection": o.geometries.forEach(geometry); break;
        case "LineString": extract1(o.arcs); break;
        case "MultiLineString": case "Polygon": extract2(o.arcs); break;
        case "MultiPolygon": extract3(o.arcs); break;
      }
    }

    geometry(object$$1);

    geomsByArc.forEach(filter == null
        ? function(geoms) { arcs.push(geoms[0].i); }
        : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });

    return arcs;
  }

  function topojson(data, format) {
    var method, object, property;
    data = json(data, format);

    method = (format && (property = format.feature)) ? feature
      : (format && (property = format.mesh)) ? mesh
      : error('Missing TopoJSON feature or mesh parameter.');

    object = (object = data.objects[property])
      ? method(data, object)
      : error('Invalid TopoJSON object: ' + property);

    return object && object.features || [object];
  }

  var format = {
    dsv: dsv,
    csv: delimitedFormat(','),
    tsv: delimitedFormat('\t'),
    json: json,
    topojson: topojson
  };

  function formats(name, reader) {
    if (arguments.length > 1) {
      format[name] = reader;
      return this;
    } else {
      return format.hasOwnProperty(name) ? format[name] : null;
    }
  }

  function read(data, schema, dateParse) {
    schema = schema || {};

    var reader = formats(schema.type || 'json');
    if (!reader) error('Unknown data format type: ' + schema.type);

    data = reader(data, schema);
    if (schema.parse) parse(data, schema.parse, dateParse);

    if (data.hasOwnProperty('columns')) delete data.columns;
    return data;
  }

  function parse(data, types, dateParse) {
    if (!data.length) return; // early exit for empty data

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

  /**
   * Ingests new data into the dataflow. First parses the data using the
   * vega-loader read method, then pulses a changeset to the target operator.
   * @param {Operator} target - The Operator to target with ingested data,
   *   typically a Collect transform instance.
   * @param {*} data - The input data, prior to parsing. For JSON this may
   *   be a string or an object. For CSV, TSV, etc should be a string.
   * @param {object} format - The data format description for parsing
   *   loaded data. This object is passed to the vega-loader read method.
   * @returns {Dataflow}
   */
  function ingest$1(target, data, format$$1) {
    return this.pulse(target, this.changeset().insert(read(data, format$$1)));
  }

  function loadPending(df) {
    var accept, reject,
        pending = new Promise(function(a, r) {
          accept = function() { a(df); };
          reject = r;
        });

    pending.requests = 0;

    pending.done = function() {
      if (--pending.requests === 0) {
        df.runAfter(function() {
          df._pending = null;
          try {
            df.run();
            if (df._pending) {
              df._pending.then(accept);
            } else {
              accept();
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    };

    return (df._pending = pending);
  }

  /**
   * Request data from an external source, parse it, and pulse a changeset
   * to the specified target operator.
   * @param {Operator} target - The Operator to target with the loaded data,
   *   typically a Collect transform instance.
   * @param {string} url - The URL from which to load the data. This string
   *   is passed to the vega-loader load method.
   * @param {object} [format] - The data format description for parsing
   *   loaded data. This object is passed to the vega-loader read method.
   * @return {Promise} A Promise that resolves upon completion of the request.
   *   Resolves to a status code: 0 success, -1 load fail, -2 parse fail.
   */
  function request$1(target, url, format$$1) {
    var df = this,
        status = 0,
        pending = df._pending || loadPending(df);

    pending.requests += 1;

    return df.loader()
      .load(url, {context:'dataflow'})
      .then(
        function(data) {
          return read(data, format$$1);
        },
        function(error$$1) {
          status = -1;
          df.error('Loading failed', url, error$$1);
        })
      .catch(
        function(error$$1) {
          status = -2;
          df.error('Data ingestion failed', url, error$$1);
        })
      .then(function(data) {
        df.pulse(target, df.changeset().remove(truthy).insert(data || []));
        pending.done();
        return status;
      });
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
  function on(source, target, update, params, options) {
    var fn = source instanceof Operator ? onOperator : onStream;
    fn(this, source, target, update, params, options);
    return this;
  }

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
        if (!target.skip()) {
          target.skip(value !== this.value).value = value;
        }
        return value;
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
          if (cur === op) error('Cycle detected in dataflow graph.');
        }
      }
    }
  }

  /**
   * Sentinel value indicating pulse propagation should stop.
   */
  var StopPropagation = {};

  // Pulse visit type flags
  var ADD       = (1 << 0),
      REM       = (1 << 1),
      MOD       = (1 << 2),
      ADD_REM   = ADD | REM,
      ADD_MOD   = ADD | MOD,
      ALL       = ADD | REM | MOD,
      REFLOW    = (1 << 3),
      SOURCE    = (1 << 4),
      NO_SOURCE = (1 << 5),
      NO_FIELDS = (1 << 6);

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

  var prototype$3 = Pulse.prototype;

  /**
   * Sentinel value indicating pulse propagation should stop.
   */
  prototype$3.StopPropagation = StopPropagation;

  /**
   * Boolean flag indicating ADD (added) tuples.
   */
  prototype$3.ADD = ADD;

  /**
   * Boolean flag indicating REM (removed) tuples.
   */
  prototype$3.REM = REM;

  /**
   * Boolean flag indicating MOD (modified) tuples.
   */
  prototype$3.MOD = MOD;

  /**
   * Boolean flag indicating ADD (added) and REM (removed) tuples.
   */
  prototype$3.ADD_REM = ADD_REM;

  /**
   * Boolean flag indicating ADD (added) and MOD (modified) tuples.
   */
  prototype$3.ADD_MOD = ADD_MOD;

  /**
   * Boolean flag indicating ADD, REM and MOD tuples.
   */
  prototype$3.ALL = ALL;

  /**
   * Boolean flag indicating all tuples in a data source
   * except for the ADD, REM and MOD tuples.
   */
  prototype$3.REFLOW = REFLOW;

  /**
   * Boolean flag indicating a 'pass-through' to a
   * backing data source, ignoring ADD, REM and MOD tuples.
   */
  prototype$3.SOURCE = SOURCE;

  /**
   * Boolean flag indicating that source data should be
   * suppressed when creating a forked pulse.
   */
  prototype$3.NO_SOURCE = NO_SOURCE;

  /**
   * Boolean flag indicating that field modifications should be
   * suppressed when creating a forked pulse.
   */
  prototype$3.NO_FIELDS = NO_FIELDS;

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
  prototype$3.fork = function(flags) {
    return new Pulse(this.dataflow).init(this, flags);
  };

  /**
   * Creates a copy of this pulse with new materialized array
   * instances for the ADD, REM, MOD, and SOURCE arrays.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse} - The cloned pulse instance.
   * @see init
   */
  prototype$3.clone = function() {
    var p = this.fork(ALL);
    p.add = p.add.slice();
    p.rem = p.rem.slice();
    p.mod = p.mod.slice();
    if (p.source) p.source = p.source.slice();
    return p.materialize(ALL | SOURCE);
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
  prototype$3.addAll = function() {
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
  prototype$3.init = function(src, flags) {
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
  prototype$3.runAfter = function(func) {
    this.dataflow.runAfter(func);
  };

  /**
   * Indicates if tuples have been added, removed or modified.
   * @param {number} [flags] - The tuple types (ADD, REM or MOD) to query.
   *   Defaults to ALL, returning true if any tuple type has changed.
   * @return {boolean} - Returns true if one or more queried tuple types have
   *   changed, false otherwise.
   */
  prototype$3.changed = function(flags) {
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
  prototype$3.reflow = function(fork) {
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
  prototype$3.modifies = function(_$$1) {
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
  prototype$3.modified = function(_$$1) {
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
  prototype$3.filter = function(flags, filter) {
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
  prototype$3.materialize = function(flags) {
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
  prototype$3.visit = function(flags, visitor) {
    var p = this, v = visitor, src, sum;

    if (flags & SOURCE) {
      visitArray(p.source, p.srcF, v);
      return p;
    }

    if (flags & ADD) visitArray(p.add, p.addF, v);
    if (flags & REM) visitArray(p.rem, p.remF, v);
    if (flags & MOD) visitArray(p.mod, p.modF, v);

    if ((flags & REFLOW) && (src = p.source)) {
      sum = p.add.length + p.mod.length;
      if (sum === src.length) ; else if (sum) {
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

  var prototype$4 = inherits(MultiPulse, Pulse);

  /**
   * Creates a new pulse based on the values of this pulse.
   * The dataflow, time stamp and field modification values are copied over.
   * @return {Pulse}
   */
  prototype$4.fork = function(flags) {
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

  prototype$4.changed = function(flags) {
    return this.changes & flags;
  };

  prototype$4.modified = function(_$$1) {
    var p = this, fields = p.fields;
    return !(fields && (p.changes & p.MOD)) ? 0
      : isArray(_$$1) ? _$$1.some(function(f) { return fields[f]; })
      : fields[_$$1];
  };

  prototype$4.filter = function() {
    error('MultiPulse does not support filtering.');
  };

  prototype$4.materialize = function() {
    error('MultiPulse does not support materialization.');
  };

  prototype$4.visit = function(flags, visitor) {
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
        op, next, dt, error$$1;

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
      error$$1 = err;
    }

    // reset pulse map
    df._pulses = {};
    df._pulse = null;

    if (level >= Info) {
      dt = Date.now() - dt;
      df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
    }

    if (error$$1) {
      df._postrun = [];
      df.error(error$$1);
    }

    if (df._onrun) {
      try { df._onrun(df, count, error$$1); } catch (err) { df.error(err); }
    }

    // invoke callbacks queued via runAfter
    if (df._postrun.length) {
      var postrun = df._postrun;
      df._postrun = [];
      postrun
        .sort(function(a, b) { return b.priority - a.priority; })
        .forEach(function(_$$1) { invokeCallback(df, _$$1.callback); });
    }

    return this;
  }

  function invokeCallback(df, callback) {
    try { callback(df); } catch (err) { df.error(err); }
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
    // return this._pending || Promise.resolve(this.run());
    return this._pending
      || (this.run() && this._pending)
      || Promise.resolve(this);
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
   *   cycle, suppressing immediate invocation when propagation is not
   *   currently occurring.
   */
  function runAfter(callback, enqueue, priority) {
    if (this._pulse || enqueue) {
      // pulse propagation is currently running, queue to run after
      this._postrun.push({
        priority: priority || 0,
        callback: callback
      });
    } else {
      // pulse propagation already complete, invoke immediately
      invokeCallback(this, callback);
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
    }

    p = this._pulses[op.id];
    if (s) {
      s = s.pulse;
      if (!s || s === StopPropagation) {
        p.source = [];
      } else if (s.stamp === stamp && p.target !== op) {
        p = s;
      } else {
        p.source = s.source;
      }
    }

    return p;
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

  var prototype$5 = Heap.prototype;

  prototype$5.size = function() {
    return this.nodes.length;
  };

  prototype$5.clear = function() {
    this.nodes = [];
    return this;
  };

  prototype$5.peek = function() {
    return this.nodes[0];
  };

  prototype$5.push = function(x) {
    var array = this.nodes;
    array.push(x);
    return siftdown(array, 0, array.length-1, this.cmp);
  };

  prototype$5.pop = function() {
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

  prototype$5.replace = function(item) {
    var array = this.nodes,
        retval = array[0];
    array[0] = item;
    siftup(array, 0, this.cmp);
    return retval;
  };

  prototype$5.pushpop = function(item) {
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
    try {
      this._loader = loader();
    } catch (e) {
      // do nothing if loader module is unavailable
    }

    this._touched = UniqueList(id);
    this._pulses = {};
    this._pulse = null;

    this._heap = new Heap(function(a, b) { return a.qrank - b.qrank; });
    this._postrun = [];
  }

  var prototype$6 = Dataflow.prototype;

  /**
   * The current timestamp of this dataflow. This value reflects the
   * timestamp of the previous dataflow run. The dataflow is initialized
   * with a stamp value of 0. The initial run of the dataflow will have
   * a timestap of 1, and so on. This value will match the
   * {@link Pulse.stamp} property.
   * @return {number} - The current timestamp value.
   */
  prototype$6.stamp = function() {
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
  prototype$6.loader = function(_$$1) {
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
  prototype$6.cleanThreshold = 1e4;

  // OPERATOR REGISTRATION
  prototype$6.add = add;
  prototype$6.connect = connect;
  prototype$6.rank = rank;
  prototype$6.rerank = rerank;

  // OPERATOR UPDATES
  prototype$6.pulse = pulse;
  prototype$6.touch = touch;
  prototype$6.update = update;
  prototype$6.changeset = changeset;

  // DATA LOADING
  prototype$6.ingest = ingest$1;
  prototype$6.request = request$1;

  // EVENT HANDLING
  prototype$6.events = events;
  prototype$6.on = on;

  // PULSE PROPAGATION
  prototype$6.run = run;
  prototype$6.runAsync = runAsync;
  prototype$6.runAfter = runAfter;
  prototype$6._enqueue = enqueue;
  prototype$6._getPulse = getPulse;

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
  prototype$6.error = logMethod('error');

  /**
   * Logs a warning message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit warning messages.
   */
  prototype$6.warn = logMethod('warn');

  /**
   * Logs a information message. By default, logged messages are written to
   * console output. The message will only be logged if the current log level is
   * high enough to permit information messages.
   */
  prototype$6.info = logMethod('info');

  /**
   * Logs a debug message. By default, logged messages are written to console
   * output. The message will only be logged if the current log level is high
   * enough to permit debug messages.
   */
  prototype$6.debug = logMethod('debug');

  /**
   * Get or set the current log level. If an argument is provided, it
   * will be used as the new log level.
   * @param {number} [level] - Should be one of None, Warn, Info
   * @return {number} - The current log level.
   */
  prototype$6.logLevel = logMethod('level');

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
    var t = transform$1(type);
    return t && t.Definition || null;
  }

  function transform$1(type) {
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
    '__count__': measure({
      name: 'count',
      set:  'this.missing + this.valid'
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
      add:  'this.sum += +v;',
      rem:  'this.sum -= v;',
      set:  'this.sum'
    }),
    'mean': measure({
      name: 'mean',
      init: 'this.mean = 0;',
      add:  'var d = v - this.mean; this.mean += d / this.valid;',
      rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
      set:  'this.valid ? this.mean : undefined'
    }),
    'average': measure({
      name: 'average',
      set:  'this.valid ? this.mean : undefined',
      req:  ['mean'], idx: 1
    }),
    'variance': measure({
      name: 'variance',
      init: 'this.dev = 0;',
      add:  'this.dev += d * (v - this.mean);',
      rem:  'this.dev -= d * (v - this.mean);',
      set:  'this.valid > 1 ? this.dev / (this.valid-1) : undefined',
      req:  ['mean'], idx: 1
    }),
    'variancep': measure({
      name: 'variancep',
      set:  'this.valid > 1 ? this.dev / this.valid : undefined',
      req:  ['variance'], idx: 2
    }),
    'stdev': measure({
      name: 'stdev',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : undefined',
      req:  ['variance'], idx: 2
    }),
    'stdevp': measure({
      name: 'stdevp',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : undefined',
      req:  ['variance'], idx: 2
    }),
    'stderr': measure({
      name: 'stderr',
      set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : undefined',
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
      init: 'this.argmin = undefined;',
      add:  'if (v < this.min) this.argmin = t;',
      rem:  'if (v <= this.min) this.argmin = undefined;',
      set:  'this.argmin || cell.data.argmin(this.get)',
      req:  ['min'], str: ['values'], idx: 3
    }),
    'argmax': measure({
      name: 'argmax',
      init: 'this.argmax = undefined;',
      add:  'if (v > this.max) this.argmax = t;',
      rem:  'if (v >= this.max) this.argmax = undefined;',
      set:  'this.argmax || cell.data.argmax(this.get)',
      req:  ['max'], str: ['values'], idx: 3
    }),
    'min': measure({
      name: 'min',
      init: 'this.min = undefined;',
      add:  'if (v < this.min || this.min === undefined) this.min = v;',
      rem:  'if (v <= this.min) this.min = NaN;',
      set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
      str:  ['values'], idx: 4
    }),
    'max': measure({
      name: 'max',
      init: 'this.max = undefined;',
      add:  'if (v > this.max || this.max === undefined) this.max = v;',
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

  function bin(_$$1) {
    // determine range
    var maxb = _$$1.maxbins || 20,
        base = _$$1.base || 10,
        logb = Math.log(base),
        div  = _$$1.divide || [5, 2],
        min  = _$$1.extent[0],
        max  = _$$1.extent[1],
        span = max - min,
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
      v = Math.floor(min / step + eps) * step;
      min = min < v ? v - step : v;
      max = Math.ceil(max / step) * step;
    }

    return {
      start: min,
      stop:  max,
      step:  step
    };
  }

  function numbers(array, f) {
    var numbers = [],
        n = array.length,
        i = -1, a;

    if (f == null) {
      while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
    } else {
      while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
    }
    return numbers;
  }

  function number(x) {
    return x === null ? NaN : +x;
  }

  exports.random = Math.random;

  function setRandom(r) {
    exports.random = r;
  }

  function bootstrapCI(array, samples, alpha, f) {
    if (!array.length) return [undefined, undefined];

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
  }

  function quartiles(array, f) {
    var values = numbers(array, f);

    return [
      d3Array.quantile(values.sort(d3Array.ascending), 0.25),
      d3Array.quantile(values, 0.50),
      d3Array.quantile(values, 0.75)
    ];
  }

  function integer(min, max) {
    if (max == null) {
      max = min;
      min = 0;
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

    return dist.min(min).max(max);
  }

  function randomNormal(mean, stdev) {
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
        var sum, exp = Math.exp(-Z*Z/2);
        if (Z < 7.07106781186547) {
          sum = 3.52624965998911e-02 * Z + 0.700383064443688;
          sum = sum * Z + 6.37396220353165;
          sum = sum * Z + 33.912866078383;
          sum = sum * Z + 112.079291497871;
          sum = sum * Z + 221.213596169931;
          sum = sum * Z + 220.206867912376;
          cd = exp * sum;
          sum = 8.83883476483184e-02 * Z + 1.75566716318264;
          sum = sum * Z + 16.064177579207;
          sum = sum * Z + 86.7807322029461;
          sum = sum * Z + 296.564248779674;
          sum = sum * Z + 637.333633378831;
          sum = sum * Z + 793.826512519948;
          sum = sum * Z + 440.413735824752;
          cd = cd / sum;
        } else {
          sum = Z + 0.65;
          sum = Z + 4 / sum;
          sum = Z + 3 / sum;
          sum = Z + 2 / sum;
          sum = Z + 1 / sum;
          cd = exp / sum / 2.506628274631;
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

    return dist.mean(mean).stdev(stdev);
  }

  // TODO: support for additional kernels?
  function randomKDE(support, bandwidth) {
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
  }

  // Scott, D. W. (1992) Multivariate Density Estimation:
  // Theory, Practice, and Visualization. Wiley.
  function estimateBandwidth(array) {
    var n = array.length,
        q = quartiles(array),
        h = (q[2] - q[0]) / 1.34;
    return 1.06 * Math.min(Math.sqrt(d3Array.variance(array)), h) * Math.pow(n, -0.2);
  }

  function randomMixture(dists, weights) {
    var dist = {}, m = 0, w;

    function normalize(x) {
      var w = [], sum = 0, i;
      for (i=0; i<m; ++i) { sum += (w[i] = (x[i]==null ? 1 : +x[i])); }
      for (i=0; i<m; ++i) { w[i] /= sum; }
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
  }

  function randomUniform(min, max) {
    if (max == null) {
      max = (min == null ? 1 : min);
      min = 0;
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

    return dist.min(min).max(max);
  }

  function TupleStore(key$$1) {
    this._key = key$$1 ? field(key$$1) : tupleid;
    this.reset();
  }

  var prototype$8 = TupleStore.prototype;

  prototype$8.reset = function() {
    this._add = [];
    this._rem = [];
    this._ext = null;
    this._get = null;
    this._q = null;
  };

  prototype$8.add = function(v) {
    this._add.push(v);
  };

  prototype$8.rem = function(v) {
    this._rem.push(v);
  };

  prototype$8.values = function() {
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

  prototype$8.distinct = function(get) {
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

  prototype$8.extent = function(get) {
    if (this._get !== get || !this._ext) {
      var v = this.values(),
          i = extentIndex(v, get);
      this._ext = [v[i[0]], v[i[1]]];
      this._get = get;
    }
    return this._ext;
  };

  prototype$8.argmin = function(get) {
    return this.extent(get)[0] || {};
  };

  prototype$8.argmax = function(get) {
    return this.extent(get)[1] || {};
  };

  prototype$8.min = function(get) {
    var m = this.extent(get)[0];
    return m != null ? get(m) : undefined;
  };

  prototype$8.max = function(get) {
    var m = this.extent(get)[1];
    return m != null ? get(m) : undefined;
  };

  prototype$8.quartile = function(get) {
    if (this._get !== get || !this._q) {
      this._q = quartiles(this.values(), get);
      this._get = get;
    }
    return this._q;
  };

  prototype$8.q1 = function(get) {
    return this.quartile(get)[0];
  };

  prototype$8.q2 = function(get) {
    return this.quartile(get)[1];
  };

  prototype$8.q3 = function(get) {
    return this.quartile(get)[2];
  };

  prototype$8.ci = function(get) {
    if (this._get !== get || !this._ci) {
      this._ci = bootstrapCI(this.values(), 1000, 0.05, get);
      this._get = get;
    }
    return this._ci;
  };

  prototype$8.ci0 = function(get) {
    return this.ci(get)[0];
  };

  prototype$8.ci1 = function(get) {
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

  var prototype$9 = inherits(Aggregate, Transform);

  prototype$9.transform = function(_$$1, pulse) {
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

  prototype$9.cross = function() {
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

  prototype$9.init = function(_$$1) {
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
      error('Unmatched number of fields and aggregate ops.');
    }

    for (i=0; i<n; ++i) {
      field$$1 = fields[i];
      op = ops[i];

      if (field$$1 == null && op !== 'count') {
        error('Null aggregate field specified.');
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

  prototype$9.cellkey = groupkey();

  prototype$9.cell = function(key$$1, t) {
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

  prototype$9.newcell = function(key$$1, t) {
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

  prototype$9.newtuple = function(t, p) {
    var names = this._dnames,
        dims = this._dims,
        x = {}, i, n;

    for (i=0, n=dims.length; i<n; ++i) {
      x[names[i]] = dims[i](t);
    }

    return p ? replace(p.tuple, x) : ingest(x);
  };

  // -- Process Tuples -----

  prototype$9.add = function(t) {
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

  prototype$9.rem = function(t) {
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

  prototype$9.celltuple = function(cell) {
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

  prototype$9.changes = function(out) {
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

  var prototype$a = inherits(Bin, Transform);

  prototype$a.transform = function(_$$1, pulse) {
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

  prototype$a._bins = function(_$$1) {
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

  function SortedList(idFunc, source, input) {
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
  }

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

  var prototype$b = inherits(Collect, Transform);

  prototype$b.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.ALL),
        list = SortedList(tupleid, this.value, out.materialize(out.ADD).add),
        sort = _$$1.sort,
        mod = pulse.changed() || (sort &&
              (_$$1.modified('sort') || pulse.modified(sort.fields)));

    out.visit(out.REM, list.remove);

    this.modified(mod);
    this.value = out.source = list.data(sort, mod);

    // propagate tree root if defined
    if (pulse.source && pulse.source.root) {
      this.value.root = pulse.source.root;
    }

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

  var prototype$c = inherits(CountPattern, Transform);

  prototype$c.transform = function(_$$1, pulse) {
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

  prototype$c._parameterCheck = function(_$$1, pulse) {
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

  prototype$c._finish = function(pulse, as) {
    var counts = this._counts,
        tuples = this._tuples || (this._tuples = {}),
        text = as[0],
        count = as[1],
        out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
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
    "metadata": {"generates": true},
    "params": [
      { "name": "filter", "type": "expr" },
      { "name": "as", "type": "string", "array": true, "length": 2, "default": ["a", "b"] }
    ]
  };

  var prototype$d = inherits(Cross, Transform);

  prototype$d.transform = function(_$$1, pulse) {
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
      data = pulse.materialize(pulse.SOURCE).source;
      out.add = this.value = cross(data, a, b, _$$1.filter || truthy);
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

  var DISTRIBUTIONS = 'distributions',
      FUNCTION = 'function',
      FIELD = 'field';

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
      error('Unknown distribution function: ' + func);
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
    "metadata": {"generates": true},
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

  var prototype$e = inherits(Density, Transform);

  prototype$e.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

    if (!this.value || pulse.changed() || _$$1.modified()) {
      var dist = parse$1(_$$1.distribution, source(pulse)),
          method = _$$1.method || 'pdf';

      if (method !== 'pdf' && method !== 'cdf') {
        error('Invalid density method: ' + method);
      }
      if (!_$$1.extent && !dist.data) {
        error('Missing density extent parameter.');
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
   * Wraps an expression function with access to external parameters.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function} params.expr - The expression function. The
   *  function should accept both a datum and a parameter object.
   *  This operator's value will be a new function that wraps the
   *  expression function with access to this operator's parameters.
   */
  function Expression(params) {
    Operator.call(this, null, update$2, params);
    this.modified(true);
  }

  inherits(Expression, Operator);

  function update$2(_$$1) {
    var expr = _$$1.expr;
    return this.value && !_$$1.modified('expr')
      ? this.value
      : accessor(
          function(datum) { return expr(datum, _$$1); },
          accessorFields(expr),
          accessorName(expr)
        );
  }

  /**
   * Computes extents (min/max) for a data field.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.field - The field over which to compute extends.
   */
  function Extent(params) {
    Transform.call(this, [undefined, undefined], params);
  }

  Extent.Definition = {
    "type": "Extent",
    "metadata": {},
    "params": [
      { "name": "field", "type": "field", "required": true }
    ]
  };

  var prototype$f = inherits(Extent, Transform);

  prototype$f.transform = function(_$$1, pulse) {
    var extent = this.value,
        field$$1 = _$$1.field,
        min = extent[0],
        max = extent[1],
        mod;

    mod = pulse.changed()
       || pulse.modified(field$$1.fields)
       || _$$1.modified('field');

    if (mod || min == null) {
      min = +Infinity;
      max = -Infinity;
    }

    pulse.visit(mod ? pulse.SOURCE : pulse.ADD, function(t) {
      var v = field$$1(t);
      if (v != null) {
        // coerce to number
        v = +v;
        // NaNs will fail all comparisons!
        if (v < min) min = v;
        if (v > max) max = v;
      }
    });

    if (!isFinite(min) || !isFinite(max)) {
      min = max = undefined;
    }
    this.value = [min, max];
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

  var prototype$g = inherits(Subflow, Operator);

  prototype$g.connect = function(target) {
    this.targets().add(target);
    return (target.source = this);
  };

  /**
   * Add an 'add' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being added.
   */
  prototype$g.add = function(t) {
    this.value.add.push(t);
  };

  /**
   * Add a 'rem' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being removed.
   */
  prototype$g.rem = function(t) {
    this.value.rem.push(t);
  };

  /**
   * Add a 'mod' tuple to the subflow pulse.
   * @param {Tuple} t - The tuple being modified.
   */
  prototype$g.mod = function(t) {
    this.value.mod.push(t);
  };

  /**
   * Re-initialize this operator's pulse value.
   * @param {Pulse} pulse - The pulse to copy from.
   * @see Pulse.init
   */
  prototype$g.init = function(pulse) {
    this.value.init(pulse, pulse.NO_SOURCE);
  };

  /**
   * Evaluate this operator. This method overrides the
   * default behavior to simply return the contained pulse value.
   * @return {Pulse}
   */
  prototype$g.evaluate = function() {
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

  var prototype$h = inherits(Facet, Transform);

  prototype$h.activate = function(flow) {
    this._targets[this._targets.active++] = flow;
  };

  prototype$h.subflow = function(key$$1, flow, pulse, parent) {
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

  prototype$h.transform = function(_$$1, pulse) {
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
    Operator.call(this, null, update$3, params);
  }

  inherits(Field, Operator);

  function update$3(_$$1) {
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

  var prototype$i = inherits(Filter, Transform);

  prototype$i.transform = function(_$$1, pulse) {
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

  // use either provided alias or accessor field name
  function fieldNames(fields, as) {
    if (!fields) return null;
    return fields.map(function(f, i) {
      return as[i] || accessorName(f);
    });
  }

  /**
   * Flattens array-typed field values into new data objects.
   * If multiple fields are specified, they are treated as parallel arrays,
   * with output values included for each matching index (or null if missing).
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *>} params.fields - An array of field
   *   accessors for the tuple fields that should be flattened.
   * @param {Array<string>} [params.as] - Output field names for flattened
   *   array fields. Any unspecified fields will use the field name provided
   *   by the fields accessors.
   */
  function Flatten(params) {
    Transform.call(this, [], params);
  }

  Flatten.Definition = {
    "type": "Flatten",
    "metadata": {"generates": true},
    "params": [
      { "name": "fields", "type": "field", "array": true, "required": true },
      { "name": "as", "type": "string", "array": true }
    ]
  };

  var prototype$j = inherits(Flatten, Transform);

  prototype$j.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
        fields = _$$1.fields,
        as = fieldNames(fields, _$$1.as || []),
        m = as.length;

    // remove any previous results
    out.rem = this.value;

    // generate flattened tuples
    pulse.visit(pulse.SOURCE, function(t) {
      var arrays = fields.map(function(f) { return f(t); }),
          maxlen = arrays.reduce(function(l, a) { return Math.max(l, a.length); }, 0),
          i = 0, j, d, v;

      for (; i<maxlen; ++i) {
        d = derive(t);
        for (j=0; j<m; ++j) {
          d[as[j]] = (v = arrays[j][i]) == null ? null : v;
        }
        out.add.push(d);
      }
    });

    this.value = out.source = out.add;
    return out.modifies(as);
  };

  /**
   * Folds one more tuple fields into multiple tuples in which the field
   * name and values are available under new 'key' and 'value' fields.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {function(object): *} params.fields - An array of field accessors
   *   for the tuple fields that should be folded.
   * @param {Array<string>} [params.as] - Output field names for folded key
   *   and value fields, defaults to ['key', 'value'].
   */
  function Fold(params) {
    Transform.call(this, [], params);
  }

  Fold.Definition = {
    "type": "Fold",
    "metadata": {"generates": true},
    "params": [
      { "name": "fields", "type": "field", "array": true, "required": true },
      { "name": "as", "type": "string", "array": true, "length": 2, "default": ["key", "value"] }
    ]
  };

  var prototype$k = inherits(Fold, Transform);

  prototype$k.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
        fields = _$$1.fields,
        fnames = fields.map(accessorName),
        as = _$$1.as || ['key', 'value'],
        k = as[0],
        v = as[1],
        n = fields.length;

    out.rem = this.value;

    pulse.visit(pulse.SOURCE, function(t) {
      for (var i=0, d; i<n; ++i) {
        d = derive(t);
        d[k] = fnames[i];
        d[v] = fields[i](t);
        out.add.push(d);
      }
    });

    this.value = out.source = out.add;
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

  var prototype$l = inherits(Formula, Transform);

  prototype$l.transform = function(_$$1, pulse) {
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

  var prototype$m = inherits(Generate, Transform);

  prototype$m.transform = function(_$$1, pulse) {
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

  var prototype$n = inherits(Impute, Transform);

  function getValue(_$$1) {
    var m = _$$1.method || Methods.value, v;

    if (Methods[m] == null) {
      error('Unrecognized imputation method: ' + m);
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

  prototype$n.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.ALL),
        impute = getValue(_$$1),
        field$$1 = getField(_$$1),
        fName = accessorName(_$$1.field),
        kName = accessorName(_$$1.key),
        gNames = (_$$1.groupby || []).map(accessorName),
        groups = partition(pulse.source, _$$1.groupby, _$$1.key, _$$1.keyvals),
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

  function partition(data, groupby, key$$1, keyvals) {
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

  var prototype$o = inherits(JoinAggregate, Aggregate);

  prototype$o.transform = function(_$$1, pulse) {
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

  prototype$o.changes = function() {
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
   * @param {boolean} params.flat - A boolean flag indicating if the field names
   *  should be treated as flat property names, side-stepping nested field
   *  lookups normally indicated by dot or bracket notation.
   */
  function Key(params) {
    Operator.call(this, null, update$4, params);
  }

  inherits(Key, Operator);

  function update$4(_$$1) {
    return (this.value && !_$$1.modified()) ? this.value : key(_$$1.fields, _$$1.flat);
  }

  /**
   * Load and parse data from an external source. Marshalls parameter
   * values and then invokes the Dataflow request method.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {string} params.url - The URL to load from.
   * @param {object} params.format - The data format options.
   */
  function Load(params) {
    Transform.call(this, null, params);
  }

  var prototype$p = inherits(Load, Transform);

  prototype$p.transform = function(_$$1, pulse) {
    pulse.dataflow.request(this.target, _$$1.url, _$$1.format);
  };

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

  var prototype$q = inherits(Lookup, Transform);

  prototype$q.transform = function(_$$1, pulse) {
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
        error('Multi-field lookup requires explicit "as" parameter.');
      }
      if (as && as.length !== n * m) {
        error('The "as" parameter has too few output field names.');
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
        error('Missing output field names.');
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
    Operator.call(this, null, update$5, params);
  }

  inherits(MultiExtent, Operator);

  function update$5(_$$1) {
    if (this.value && !_$$1.modified()) {
      return this.value;
    }

    var min = +Infinity,
        max = -Infinity,
        ext = _$$1.extents,
        i, n, e;

    for (i=0, n=ext.length; i<n; ++i) {
      e = ext[i];
      if (e[0] < min) min = e[0];
      if (e[1] > max) max = e[1];
    }
    return [min, max];
  }

  /**
   * Merge a collection of value arrays.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<Array<*>>} params.values - The input value arrrays.
   */
  function MultiValues(params) {
    Operator.call(this, null, update$6, params);
  }

  inherits(MultiValues, Operator);

  function update$6(_$$1) {
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
   * Aggregate and pivot selected field values to become new fields.
   * This operator is useful to construction cross-tabulations.
   * @constructor
   * @param {Array<function(object): *>} [params.groupby] - An array of accessors
   *  to groupby. These fields act just like groupby fields of an Aggregate transform.
   * @param {function(object): *} params.field - The field to pivot on. The unique
   *  values of this field become new field names in the output stream.
   * @param {function(object): *} params.value - The field to populate pivoted fields.
   *  The aggregate values of this field become the values of the new pivoted fields.
   * @param {string} [params.op] - The aggregation operation for the value field,
   *  applied per cell in the output stream. The default is "sum".
   * @param {number} [params.limit] - An optional parameter indicating the maximum
   *  number of pivoted fields to generate. The pivoted field names are sorted in
   *  ascending order prior to enforcing the limit.
   */
  function Pivot(params) {
    Aggregate.call(this, params);
  }

  Pivot.Definition = {
    "type": "Pivot",
    "metadata": {"generates": true, "changes": true},
    "params": [
      { "name": "groupby", "type": "field", "array": true },
      { "name": "field", "type": "field", "required": true },
      { "name": "value", "type": "field", "required": true },
      { "name": "op", "type": "enum", "values": ValidAggregateOps, "default": "sum" },
      { "name": "limit", "type": "number", "default": 0 },
      { "name": "key", "type": "field" }
    ]
  };

  var prototype$r = inherits(Pivot, Aggregate);

  prototype$r._transform = prototype$r.transform;

  prototype$r.transform = function(_$$1, pulse) {
    return this._transform(aggregateParams(_$$1, pulse), pulse);
  };

  // Shoehorn a pivot transform into an aggregate transform!
  // First collect all unique pivot field values.
  // Then generate aggregate fields for each output pivot field.
  function aggregateParams(_$$1, pulse) {
    var key$$1    = _$$1.field,
    value  = _$$1.value,
        op     = (_$$1.op === 'count' ? '__count__' : _$$1.op) || 'sum',
        fields = accessorFields(key$$1).concat(accessorFields(value)),
        keys   = pivotKeys(key$$1, _$$1.limit || 0, pulse);

    return {
      key:      _$$1.key,
      groupby:  _$$1.groupby,
      ops:      keys.map(function() { return op; }),
      fields:   keys.map(function(k) { return get(k, key$$1, value, fields); }),
      as:       keys.map(function(k) { return k + ''; }),
      modified: _$$1.modified.bind(_$$1)
    };
  }

  // Generate aggregate field accessor.
  // Output NaN for non-existent values; aggregator will ignore!
  function get(k, key$$1, value, fields) {
    return accessor(
      function(d) { return key$$1(d) === k ? value(d) : NaN; },
      fields,
      k + ''
    );
  }

  // Collect (and optionally limit) all unique pivot values.
  function pivotKeys(key$$1, limit, pulse) {
    var map = {},
        list = [];

    pulse.visit(pulse.SOURCE, function(t) {
      var k = key$$1(t);
      if (!map[k]) {
        map[k] = 1;
        list.push(k);
      }
    });

    // TODO? Move this comparator to vega-util?
    list.sort(function(u, v) {
      return (u<v||u==null) && v!=null ? -1
        : (u>v||v==null) && u!=null ? 1
        : ((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))!==u && v===v ? -1
        : v!==v && u===u ? 1 : 0;
    });

    return limit ? list.slice(0, limit) : list;
  }

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

  var prototype$s = inherits(PreFacet, Facet);

  prototype$s.transform = function(_$$1, pulse) {
    var self = this,
        flow = _$$1.subflow,
        field$$1 = _$$1.field;

    if (_$$1.modified('field') || field$$1 && pulse.modified(accessorFields(field$$1))) {
      error('PreFacet does not support field modification.');
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
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<function(object): *} params.fields - The fields to project,
   *   as an array of field accessors. If unspecified, all fields will be
   *   copied with names unchanged.
   * @param {Array<string>} [params.as] - Output field names for each projected
   *   field. Any unspecified fields will use the field name provided by
   *   the field accessor.
   */
  function Project(params) {
    Transform.call(this, null, params);
  }

  Project.Definition = {
    "type": "Project",
    "metadata": {"generates": true, "changes": true},
    "params": [
      { "name": "fields", "type": "field", "array": true },
      { "name": "as", "type": "string", "null": true, "array": true },
    ]
  };

  var prototype$t = inherits(Project, Transform);

  prototype$t.transform = function(_$$1, pulse) {
    var fields = _$$1.fields,
        as = fieldNames(_$$1.fields, _$$1.as || []),
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

    out = pulse.fork(pulse.NO_SOURCE);

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

  var prototype$u = inherits(Proxy, Transform);

  prototype$u.transform = function(_$$1, pulse) {
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

  var prototype$v = inherits(Relay, Transform);

  prototype$v.transform = function(_$$1, pulse) {
    var out, lut;

    if (this.value) {
      lut = this.value;
    } else {
      out = pulse = pulse.addAll();
      lut = this.value = {};
    }

    if (_$$1.derive) {
      out = pulse.fork(pulse.NO_SOURCE);

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
    "metadata": {},
    "params": [
      { "name": "size", "type": "number", "default": 1000 }
    ]
  };

  var prototype$w = inherits(Sample, Transform);

  prototype$w.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.NO_SOURCE),
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
    "metadata": {"changes": true},
    "params": [
      { "name": "start", "type": "number", "required": true },
      { "name": "stop", "type": "number", "required": true },
      { "name": "step", "type": "number", "default": 1 },
      { "name": "as", "type": "string", "default": "data" }
    ]
  };

  var prototype$x = inherits(Sequence, Transform);

  prototype$x.transform = function(_$$1, pulse) {
    if (this.value && !_$$1.modified()) return;

    var out = pulse.materialize().fork(pulse.MOD),
        as = _$$1.as || 'data';

    out.rem = this.value ? pulse.rem.concat(this.value) : pulse.rem;

    this.value = d3Array.range(_$$1.start, _$$1.stop, _$$1.step || 1).map(function(v) {
      var t = {};
      t[as] = v;
      return ingest(t);
    });

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

  var prototype$y = inherits(Sieve, Transform);

  prototype$y.transform = function(_$$1, pulse) {
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

  var prototype$z = inherits(TupleIndex, Transform);

  prototype$z.transform = function(_$$1, pulse) {
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

  var prototype$A = inherits(Values, Transform);

  prototype$A.transform = function(_$$1, pulse) {
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
      if (!(num > 0)) error('ntile num must be greater than zero.');
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
      if (!(nth > 0)) error('nth_value nth must be greater than zero.');
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
          error('Null aggregate field specified.');
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

  var prototype$B = WindowState.prototype;

  prototype$B.init = function() {
    this.windows.forEach(function(_$$1) { _$$1.init(); });
    if (this.cell) this.cell.init();
  };

  prototype$B.update = function(w, t) {
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

  var prototype$C = inherits(Window, Transform);

  prototype$C.transform = function(_$$1, pulse) {
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

  prototype$C.group = function(key$$1) {
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
        range = sort && !_$$1.ignorePeers,
        frame = _$$1.frame || [null, 0],
        data = list.data(sort),
        n = data.length,
        i = 0,
        b = range ? d3Array.bisector(sort) : null,
        w = {
          i0: 0, i1: 0, p0: 0, p1: 0, index: 0,
          data: data, compare: sort || constant(-1)
        };

    for (state.init(); i<n; ++i) {
      setWindow(w, frame, i, n);
      if (range) adjustRange(w, b);
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
  function adjustRange(w, bisect) {
    var r0 = w.i0,
        r1 = w.i1 - 1,
        c = w.compare,
        d = w.data,
        n = d.length - 1;

    if (r0 > 0 && !c(d[r0], d[r0-1])) w.i0 = bisect.left(d, d[r0]);
    if (r1 < n && !c(d[r1], d[r1+1])) w.i1 = bisect.right(d, d[r1]);
  }



  var tx = /*#__PURE__*/Object.freeze({
    aggregate: Aggregate,
    bin: Bin,
    collect: Collect,
    compare: Compare,
    countpattern: CountPattern,
    cross: Cross,
    density: Density,
    expression: Expression,
    extent: Extent,
    facet: Facet,
    field: Field,
    filter: Filter,
    flatten: Flatten,
    fold: Fold,
    formula: Formula,
    generate: Generate,
    impute: Impute,
    joinaggregate: JoinAggregate,
    key: Key,
    load: Load,
    lookup: Lookup,
    multiextent: MultiExtent,
    multivalues: MultiValues,
    params: Params,
    pivot: Pivot,
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

  var Top = 'top';
  var Left = 'left';
  var Right = 'right';
  var Bottom = 'bottom';

  var TopLeft = 'top-left';
  var TopRight = 'top-right';
  var BottomLeft = 'bottom-left';
  var BottomRight = 'bottom-right';

  var Start = 'start';
  var End = 'end';

  var Group = 'group';

  var AxisRole = 'axis';
  var TitleRole = 'title';
  var FrameRole = 'frame';
  var ScopeRole = 'scope';
  var LegendRole = 'legend';

  var RowHeader = 'row-header';
  var RowFooter = 'row-footer';
  var RowTitle  = 'row-title';
  var ColHeader = 'column-header';
  var ColFooter = 'column-footer';
  var ColTitle  = 'column-title';

  var Padding = 'padding';

  var Symbols = 'symbol';

  var Fit  = 'fit';
  var FitX = 'fit-x';
  var FitY = 'fit-y';
  var Pad  = 'pad';
  var None$1 = 'none';

  var All = 'all';
  var Each = 'each';
  var Flush = 'flush';

  var Column = 'column';
  var Row = 'row';

  function Bounds(b) {
    this.clear();
    if (b) this.union(b);
  }

  var prototype$D = Bounds.prototype;

  prototype$D.clone = function() {
    return new Bounds(this);
  };

  prototype$D.clear = function() {
    this.x1 = +Number.MAX_VALUE;
    this.y1 = +Number.MAX_VALUE;
    this.x2 = -Number.MAX_VALUE;
    this.y2 = -Number.MAX_VALUE;
    return this;
  };

  prototype$D.empty = function() {
    return (
      this.x1 === +Number.MAX_VALUE &&
      this.y1 === +Number.MAX_VALUE &&
      this.x2 === -Number.MAX_VALUE &&
      this.y2 === -Number.MAX_VALUE
    );
  };

  prototype$D.set = function(x1, y1, x2, y2) {
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

  prototype$D.add = function(x, y) {
    if (x < this.x1) this.x1 = x;
    if (y < this.y1) this.y1 = y;
    if (x > this.x2) this.x2 = x;
    if (y > this.y2) this.y2 = y;
    return this;
  };

  prototype$D.expand = function(d) {
    this.x1 -= d;
    this.y1 -= d;
    this.x2 += d;
    this.y2 += d;
    return this;
  };

  prototype$D.round = function() {
    this.x1 = Math.floor(this.x1);
    this.y1 = Math.floor(this.y1);
    this.x2 = Math.ceil(this.x2);
    this.y2 = Math.ceil(this.y2);
    return this;
  };

  prototype$D.translate = function(dx, dy) {
    this.x1 += dx;
    this.x2 += dx;
    this.y1 += dy;
    this.y2 += dy;
    return this;
  };

  prototype$D.rotate = function(angle, x, y) {
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

  prototype$D.union = function(b) {
    if (b.x1 < this.x1) this.x1 = b.x1;
    if (b.y1 < this.y1) this.y1 = b.y1;
    if (b.x2 > this.x2) this.x2 = b.x2;
    if (b.y2 > this.y2) this.y2 = b.y2;
    return this;
  };

  prototype$D.intersect = function(b) {
    if (b.x1 > this.x1) this.x1 = b.x1;
    if (b.y1 > this.y1) this.y1 = b.y1;
    if (b.x2 < this.x2) this.x2 = b.x2;
    if (b.y2 < this.y2) this.y2 = b.y2;
    return this;
  };

  prototype$D.encloses = function(b) {
    return b && (
      this.x1 <= b.x1 &&
      this.x2 >= b.x2 &&
      this.y1 <= b.y1 &&
      this.y2 >= b.y2
    );
  };

  prototype$D.alignsWith = function(b) {
    return b && (
      this.x1 == b.x1 ||
      this.x2 == b.x2 ||
      this.y1 == b.y1 ||
      this.y2 == b.y2
    );
  };

  prototype$D.intersects = function(b) {
    return b && !(
      this.x2 < b.x1 ||
      this.x1 > b.x2 ||
      this.y2 < b.y1 ||
      this.y1 > b.y2
    );
  };

  prototype$D.contains = function(x, y) {
    return !(
      x < this.x1 ||
      x > this.x2 ||
      y < this.y1 ||
      y > this.y2
    );
  };

  prototype$D.width = function() {
    return this.x2 - this.x1;
  };

  prototype$D.height = function() {
    return this.y2 - this.y1;
  };

  var gradient_id = 0;

  function Gradient(p0, p1) {
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
  }

  function Item(mark) {
    this.mark = mark;
    this.bounds = (this.bounds || new Bounds());
  }

  function GroupItem(mark) {
    Item.call(this, mark);
    this.items = (this.items || []);
  }

  inherits(GroupItem, Item);

  function domCanvas(w, h) {
    if (typeof document !== 'undefined' && document.createElement) {
      var c = document.createElement('canvas');
      if (c && c.getContext) {
        c.width = w;
        c.height = h;
        return c;
      }
    }
    return null;
  }

  function domImage() {
    return typeof Image !== 'undefined' ? Image : null;
  }

  var NodeCanvas;

  ['canvas', 'canvas-prebuilt'].some(function(libName) {
    try {
      NodeCanvas = require(libName);
      if (typeof NodeCanvas !== 'function') {
        NodeCanvas = null;
      }
    } catch (error) {
      NodeCanvas = null;
    }
    return NodeCanvas;
  });

  function nodeCanvas(w, h) {
    if (NodeCanvas) {
      try {
        return new NodeCanvas(w, h);
      } catch (e) {
        // do nothing, return null on error
      }
    }
    return null;
  }

  function nodeImage() {
    return (NodeCanvas && NodeCanvas.Image) || null;
  }

  function canvas(w, h) {
    return domCanvas(w, h) || nodeCanvas(w, h) || null;
  }

  function image() {
    return domImage() || nodeImage() || null;
  }

  function ResourceLoader(customLoader) {
    this._pending = 0;
    this._loader = customLoader || loader();
  }

  var prototype$E = ResourceLoader.prototype;

  prototype$E.pending = function() {
    return this._pending;
  };

  function increment(loader$$1) {
    loader$$1._pending += 1;
  }

  function decrement(loader$$1) {
    loader$$1._pending -= 1;
  }

  prototype$E.sanitizeURL = function(uri) {
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

  prototype$E.loadImage = function(uri) {
    var loader$$1 = this,
        Image = image();
    increment(loader$$1);

    return loader$$1._loader
      .sanitize(uri, {context: 'image'})
      .then(function(opt) {
        var url = opt.href;
        if (!url || !Image) throw {url: url};

        var img = new Image();

        img.onload = function() {
          decrement(loader$$1);
          img.loaded = true;
        };

        img.onerror = function() {
          decrement(loader$$1);
          img.loaded = false;
        };

        img.src = url;
        return img;
      })
      .catch(function(e) {
        decrement(loader$$1);
        return {loaded: false, width: 0, height: 0, src: e && e.url || ''};
      });
  };

  prototype$E.ready = function() {
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
  var cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 },
      regexp = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)([-+])/g, /\s|,|###/];

  function pathParse(pathstr) {
    var result = [],
        path,
        curr,
        chunks,
        parsed, param,
        cmd, len, i, j, n, m;

    // First, break path into command sequence
    path = pathstr
      .slice()
      .replace(regexp[0], '###$1')
      .split(regexp[1])
      .slice(1);

    // Next, parse each command in turn
    for (i=0, n=path.length; i<n; ++i) {
      curr = path[i];
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
  }

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
    if (th_arc < 0 && sweep === 1) {
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

  var temp = ['l', 0, 0, 0, 0, 0, 0, 0];

  function scale(current, s) {
    var c = (temp[0] = current[0]);
    if (c === 'a' || c === 'A') {
      temp[1] = s * current[1];
      temp[2] = s * current[2];
      temp[3] = current[3];
      temp[4] = current[4];
      temp[5] = current[5];
      temp[6] = s * current[6];
      temp[7] = s * current[7];
    } else {
      for (var i=1, n=current.length; i<n; ++i) {
        temp[i] = s * current[i];
      }
    }
    return temp;
  }

  function pathRender(context, path, l, t, s) {
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

    for (var i=0, len=path.length; i<len; ++i) {
      current = path[i];
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
  }

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

  var tau = 2 * Math.PI,
      halfSqrt3 = Math.sqrt(3) / 2;

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

  function customSymbol(path) {
    if (!custom.hasOwnProperty(path)) {
      var parsed = pathParse(path);
      custom[path] = {
        draw: function(context, size) {
          pathRender(context, parsed, 0, 0, Math.sqrt(size) / 2);
        }
      };
    }
    return custom[path];
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

  function vg_rect() {
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
  }

  var pi = Math.PI;

  function vg_trail() {
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
  }

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
                            .innerRadius(ir).outerRadius(or).cornerRadius(cr),
      areavShape  = d3Shape.area().x(x).y1(y).y0(yh).defined(def),
      areahShape  = d3Shape.area().y(y).x1(x).x0(xw).defined(def),
      lineShape   = d3Shape.line().x(x).y(y).defined(def),
      rectShape   = vg_rect().x(x).y(y).width(w).height(h).cornerRadius(cr),
      symbolShape = d3Shape.symbol().type(type).size(size),
      trailShape  = vg_trail().x(x).y(y).defined(def).size(ts);

  function arc(context, item) {
    return arcShape.context(context)(item);
  }

  function area(context, items) {
    var item = items[0],
        interp = item.interpolate || 'linear';
    return (item.orient === 'horizontal' ? areahShape : areavShape)
      .curve(curves(interp, item.orient, item.tension))
      .context(context)(items);
  }

  function line(context, items) {
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

  function symbol(context, item) {
    return symbolShape.context(context)(item);
  }

  function trail(context, items) {
    return trailShape.context(context)(items);
  }

  function boundStroke(bounds, item) {
    if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
      bounds.expand(item.strokeWidth != null ? +item.strokeWidth : 1);
    }
    return bounds;
  }

  var bounds,
      tau$1 = Math.PI * 2,
      halfPi = tau$1 / 4,
      circleThreshold = tau$1 - 1e-8;

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
        for (i=0; i<4 && s>ea; ++i, s-=halfPi) update(s);
      } else {
        s = sa - (sa % halfPi) + halfPi;
        for (i=0; i<4 && s<ea; ++i, s=s+halfPi) update(s);
      }
    }

    add$1(cx + xmin, cy + ymin);
    add$1(cx + xmax, cy + ymax);
  };

  function gradient(context, gradient, bounds) {
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
  }

  function color(context, item, value) {
    return (value.id) ?
      gradient(context, value, item.bounds) :
      value;
  }

  function fill(context, item, opacity) {
    opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
    if (opacity > 0) {
      context.globalAlpha = opacity;
      context.fillStyle = color(context, item, item.fill);
      return true;
    } else {
      return false;
    }
  }

  var Empty$1 = [];

  function stroke(context, item, opacity) {
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
  }

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

  function drawAll(path) {
    return function(context, scene, bounds) {
      visit(scene, function(item) {
        if (!bounds || bounds.intersects(item.bounds)) {
          drawPath(path, context, item, item);
        }
      });
    };
  }

  function drawOne(path) {
    return function(context, scene, bounds) {
      if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
        drawPath(path, context, scene.items[0], scene.items);
      }
    };
  }

  function drawPath(path, context, item, items) {
    var opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity === 0) return;

    if (path(context, items)) return;

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
      x *= context.pixelRatio;
      y *= context.pixelRatio;

      return pickVisit(scene, function(item) {
        var b = item.bounds;
        // first hit test against bounding box
        if ((b && !b.contains(gx, gy)) || !b) return;
        // if in bounding box, perform more careful test
        if (test(context, item, x, y, gx, gy)) return item;
      });
    };
  }

  function hitPath(path, filled) {
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

      return path(context, o) ? false :
        (fill && context.isPointInPath(x, y)) ||
        (stroke && context.isPointInStroke(x, y));
    };
  }

  function pickPath(path) {
    return pick(hitPath(path));
  }

  function translate(x, y) {
    return 'translate(' + x + ',' + y + ')';
  }

  function translateItem(item) {
    return translate(item.x || 0, item.y || 0);
  }

  function markItemPath(type, shape) {

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

  }

  var arc$1 = markItemPath('arc', arc);

  function pickArea(a, p) {
    var v = a[0].orient === 'horizontal' ? p[1] : p[0],
        z = a[0].orient === 'horizontal' ? 'y' : 'x',
        i = a.length,
        min = +Infinity, hit, d;

    while (--i >= 0) {
      if (a[i].defined === false) continue;
      d = Math.abs(a[i][z] - v);
      if (d < min) {
        min = d;
        hit = a[i];
      }
    }

    return hit;
  }

  function pickLine(a, p) {
    var t = Math.pow(a[0].strokeWidth || 1, 2),
        i = a.length, dx, dy, dd;

    while (--i >= 0) {
      if (a[i].defined === false) continue;
      dx = a[i].x - p[0];
      dy = a[i].y - p[1];
      dd = dx * dx + dy * dy;
      if (dd < t) return a[i];
    }

    return null;
  }

  function pickTrail(a, p) {
    var i = a.length, dx, dy, dd;

    while (--i >= 0) {
      if (a[i].defined === false) continue;
      dx = a[i].x - p[0];
      dy = a[i].y - p[1];
      dd = dx * dx + dy * dy;
      dx = a[i].size || 1;
      if (dd < dx*dx) return a[i];
    }

    return null;
  }

  function markMultiItemPath(type, shape, tip) {

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

      x *= context$$1.pixelRatio;
      y *= context$$1.pixelRatio;
      return hit(context$$1, items, x, y) ? items[0] : null;
    }

    return {
      type:   type,
      tag:    'path',
      nested: true,
      attr:   attr,
      bound:  bound,
      draw:   drawOne(draw),
      pick:   pick$$1,
      tip:    tip
    };

  }

  var area$1 = markMultiItemPath('area', area, pickArea);

  var clip_id = 1;

  function resetSVGClipId() {
    clip_id = 1;
  }

  function clip(renderer, item, size) {
    var clip = item.clip,
        defs = renderer._defs,
        id$$1 = item.clip_id || (item.clip_id = 'clip' + clip_id++),
        c = defs.clipping[id$$1] || (defs.clipping[id$$1] = {id: id$$1});

    if (isFunction(clip)) {
      c.path = clip(null);
    } else {
      c.width = size.width || 0;
      c.height = size.height || 0;
    }

    return 'url(#' + id$$1 + ')';
  }

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

    if ((group.clip || group.width || group.height) && !group.noBound) {
      bounds.add(0, 0).add(group.width || 0, group.height || 0);
    }

    boundStroke(bounds, group);

    return bounds.translate(group.x || 0, group.y || 0);
  }

  function backgroundPath(context, group) {
    var offset = group.stroke ? StrokeOffset : 0;
    context.beginPath();
    rectangle(context, group, offset, offset);
  }

  var hitBackground = hitPath(backgroundPath);

  function draw(context, scene, bounds) {
    var renderer = this;

    visit(scene, function(group) {
      var gx = group.x || 0,
          gy = group.y || 0,
          w = group.width || 0,
          h = group.height || 0,
          opacity;

      // setup graphics context
      context.save();
      context.translate(gx, gy);

      // draw group background
      if (group.stroke || group.fill) {
        opacity = group.opacity == null ? 1 : group.opacity;
        if (opacity > 0) {
          backgroundPath(context, group);
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

    var handler = this,
        cx = x * context.pixelRatio,
        cy = y * context.pixelRatio;

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

      // hit test against contained marks
      hit = pickVisit(group, function(mark) {
        return pickMark(mark, dx, dy)
          ? handler.pick(mark, x, y, dx, dy)
          : null;
      });

      // hit test against group background
      if (!hit && scene.interactive !== false
          && (group.fill || group.stroke)
          && hitBackground(context, group, cx, cy)) {
        hit = group;
      }

      context.restore();
      return hit || null;
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

  var image$1 = {
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

  var line$1 = markMultiItemPath('line', line, pickLine);

  function attr$2(emit, item) {
    emit('transform', translateItem(item));
    emit('d', item.path);
  }

  function path(context$$1, item) {
    var path = item.path;
    if (path == null) return true;

    var cache = item.pathCache;
    if (!cache || cache.path !== path) {
      (item.pathCache = cache = pathParse(path)).path = path;
    }
    pathRender(context$$1, cache, item.x, item.y);
  }

  function bound$2(bounds, item) {
    return path(context(bounds), item)
      ? bounds.set(0, 0, 0, 0)
      : boundStroke(bounds, item);
  }

  var path$1 = {
    type:   'path',
    tag:    'path',
    nested: false,
    attr:   attr$2,
    bound:  bound$2,
    draw:   drawAll(path),
    pick:   pickPath(path)
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

  function path$2(context, item, opacity) {
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
      if (opacity && path$2(context, item, opacity)) {
        context.stroke();
      }
    });
  }

  function hit(context, item, x, y) {
    if (!context.isPointInStroke) return false;
    return path$2(context, item, 1) && context.isPointInStroke(x, y);
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

  var symbol$1 = markItemPath('symbol', symbol);

  var context$1,
      currFontHeight;

  var textMetrics = {
    height: fontSize,
    measureWidth: measureWidth,
    estimateWidth: estimateWidth,
    width: estimateWidth,
    canvas: useCanvas
  };

  useCanvas(true);

  // make dumb, simple estimate if no canvas is available
  function estimateWidth(item) {
    currFontHeight = fontSize(item);
    return estimate(textValue(item));
  }

  function estimate(text) {
    return ~~(0.8 * text.length * currFontHeight);
  }

  // measure text width if canvas is available
  function measureWidth(item) {
    context$1.font = font(item);
    return measure$1(textValue(item));
  }

  function measure$1(text) {
    return context$1.measureText(text).width;
  }

  function fontSize(item) {
    return item.fontSize != null ? item.fontSize : 11;
  }

  function useCanvas(use) {
    context$1 = use && (context$1 = canvas(1,1)) ? context$1.getContext('2d') : null;
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
      currFontHeight = fontSize(item);
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

  function fontFamily(item, quote) {
    var font = item.font;
    return (quote && font
      ? String(font).replace(/"/g, '\'')
      : font) || 'sans-serif';
  }

  function font(item, quote) {
    return '' +
      (item.fontStyle ? item.fontStyle + ' ' : '') +
      (item.fontVariant ? item.fontVariant + ' ' : '') +
      (item.fontWeight ? item.fontWeight + ' ' : '') +
      fontSize(item) + 'px ' +
      fontFamily(item, quote);
  }

  function offset(item) {
    // perform our own font baseline calculation
    // why? not all browsers support SVG 1.1 'alignment-baseline' :(
    var baseline = item.baseline,
        h = fontSize(item);
    return Math.round(
      baseline === 'top'    ?  0.79*h :
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

  var trail$1 = markMultiItemPath('trail', trail, pickTrail);

  var marks = {
    arc:     arc$1,
    area:    area$1,
    group:   group,
    image:   image$1,
    line:    line$1,
    path:    path$1,
    rect:    rect,
    rule:    rule,
    shape:   shape$1,
    symbol:  symbol$1,
    text:    text,
    trail:   trail$1
  };

  function boundItem(item, func, opt) {
    var type = marks[item.mark.marktype],
        bound = func || type.bound;
    if (type.nested) item = item.mark;

    return bound(item.bounds || (item.bounds = new Bounds()), item, opt);
  }

  var DUMMY = {mark: null};

  function boundMark(mark, bounds, opt) {
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
      b = boundItem(item, bound, opt);
      bounds = bounds && bounds.union(b) || b;
      return bounds;
    }

    bounds = bounds
      || mark.bounds && mark.bounds.clear()
      || new Bounds();

    if (hasItems) {
      for (i=0, n=items.length; i<n; ++i) {
        bounds.union(boundItem(items[i], bound, opt));
      }
    }

    return mark.bounds = bounds;
  }

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

  var prototype$F = Scenegraph.prototype;

  prototype$F.toJSON = function(indent) {
    return sceneToJSON(this.root, indent || 0);
  };

  prototype$F.mark = function(markdef, group, index) {
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

  function point(event, el) {
    var rect = el.getBoundingClientRect();
    return [
      event.clientX - rect.left - (el.clientLeft || 0),
      event.clientY - rect.top - (el.clientTop || 0)
    ];
  }

  function resolveItem(item, event, el, origin) {
    var mark = item && item.mark,
        mdef, p;

    if (mark && (mdef = marks[mark.marktype]).tip) {
      p = point(event, el);
      p[0] -= origin[0];
      p[1] -= origin[1];
      while (item = item.mark.group) {
        p[0] -= item.x || 0;
        p[1] -= item.y || 0;
      }
      item = mdef.tip(mark.items, p);
    }

    return item;
  }

  /**
   * Create a new Handler instance.
   * @param {object} [customLoader] - Optional loader instance for
   *   href URL sanitization. If not specified, a standard loader
   *   instance will be generated.
   * @param {function} [customTooltip] - Optional tooltip handler
   *   function for custom tooltip display.
   * @constructor
   */
  function Handler(customLoader, customTooltip) {
    this._active = null;
    this._handlers = {};
    this._loader = customLoader || loader();
    this._tooltip = customTooltip || defaultTooltip;
  }

  // The default tooltip display handler.
  // Sets the HTML title attribute on the visualization container.
  function defaultTooltip(handler, event, item, value) {
    handler.element().setAttribute('title', value || '');
  }

  var prototype$G = Handler.prototype;

  /**
   * Initialize a new Handler instance.
   * @param {DOMElement} el - The containing DOM element for the display.
   * @param {Array<number>} origin - The origin of the display, in pixels.
   *   The coordinate system will be translated to this point.
   * @param {object} [obj] - Optional context object that should serve as
   *   the "this" context for event callbacks.
   * @return {Handler} - This handler instance.
   */
  prototype$G.initialize = function(el, origin, obj) {
    this._el = el;
    this._obj = obj || null;
    return this.origin(origin);
  };

  /**
   * Returns the parent container element for a visualization.
   * @return {DOMElement} - The containing DOM element.
   */
  prototype$G.element = function() {
    return this._el;
  };

  /**
   * Returns the scene element (e.g., canvas or SVG) of the visualization
   * Subclasses must override if the first child is not the scene element.
   * @return {DOMElement} - The scene (e.g., canvas or SVG) element.
   */
  prototype$G.canvas = function() {
    return this._el && this._el.firstChild;
  };

  /**
   * Get / set the origin coordinates of the visualization.
   */
  prototype$G.origin = function(origin) {
    if (arguments.length) {
      this._origin = origin || [0, 0];
      return this;
    } else {
      return this._origin.slice();
    }
  };

  /**
   * Get / set the scenegraph root.
   */
  prototype$G.scene = function(scene) {
    if (!arguments.length) return this._scene;
    this._scene = scene;
    return this;
  };

  /**
   * Add an event handler. Subclasses should override this method.
   */
  prototype$G.on = function(/*type, handler*/) {};

  /**
   * Remove an event handler. Subclasses should override this method.
   */
  prototype$G.off = function(/*type, handler*/) {};

  /**
   * Utility method for finding the array index of an event handler.
   * @param {Array} h - An array of registered event handlers.
   * @param {string} type - The event type.
   * @param {function} handler - The event handler instance to find.
   * @return {number} - The handler's array index or -1 if not registered.
   */
  prototype$G._handlerIndex = function(h, type, handler) {
    for (var i = h ? h.length : 0; --i>=0;) {
      if (h[i].type === type && (!handler || h[i].handler === handler)) {
        return i;
      }
    }
    return -1;
  };

  /**
   * Returns an array with registered event handlers.
   * @param {string} [type] - The event type to query. Any annotations
   *   are ignored; for example, for the argument "click.foo", ".foo" will
   *   be ignored and the method returns all "click" handlers. If type is
   *   null or unspecified, this method returns handlers for all types.
   * @return {Array} - A new array containing all registered event handlers.
   */
  prototype$G.handlers = function(type) {
    var h = this._handlers, a = [], k;
    if (type) {
      a.push.apply(a, h[this.eventName(type)]);
    } else {
      for (k in h) { a.push.apply(a, h[k]); }
    }
    return a;
  };

  /**
   * Parses an event name string to return the specific event type.
   * For example, given "click.foo" returns "click"
   * @param {string} name - The input event type string.
   * @return {string} - A string with the event type only.
   */
  prototype$G.eventName = function(name) {
    var i = name.indexOf('.');
    return i < 0 ? name : name.slice(0,i);
  };

  /**
   * Handle hyperlink navigation in response to an item.href value.
   * @param {Event} event - The event triggering hyperlink navigation.
   * @param {Item} item - The scenegraph item.
   * @param {string} href - The URL to navigate to.
   */
  prototype$G.handleHref = function(event, item, href) {
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

  /**
   * Handle tooltip display in response to an item.tooltip value.
   * @param {Event} event - The event triggering tooltip display.
   * @param {Item} item - The scenegraph item.
   * @param {boolean} show - A boolean flag indicating whether
   *   to show or hide a tooltip for the given item.
   */
  prototype$G.handleTooltip = function(event, item, show) {
    if (item && item.tooltip != null) {
      item = resolveItem(item, event, this.canvas(), this._origin);
      var value = (show && item && item.tooltip) || null;
      this._tooltip.call(this._obj, this, event, item, value);
    }
  };

  /**
   * Returns the size of a scenegraph item and its position relative
   * to the viewport.
   * @param {Item} item - The scenegraph item.
   * @return {object} - A bounding box object (compatible with the
   *   DOMRect type) consisting of x, y, width, heigh, top, left,
   *   right, and bottom properties.
   */
  prototype$G.getItemBoundingClientRect = function(item) {
    if (!(el = this.canvas())) return;

    var el, rect = el.getBoundingClientRect(),
        origin = this._origin,
        itemBounds = item.bounds,
        x = itemBounds.x1 + origin[0] + rect.left,
        y = itemBounds.y1 + origin[1] + rect.top,
        w = itemBounds.width(),
        h = itemBounds.height();

    // translate coordinate for each parent group
    while (item.mark && (item = item.mark.group)) {
      x += item.x || 0;
      y += item.y || 0;
    }

    // return DOMRect-compatible bounding box
    return {
      x:      x,
      y:      y,
      width:  w,
      height: h,
      left:   x,
      top:    y,
      right:  x + w,
      bottom: y + h
    };
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

  var prototype$H = Renderer.prototype;

  /**
   * Initialize a new Renderer instance.
   * @param {DOMElement} el - The containing DOM element for the display.
   * @param {number} width - The coordinate width of the display, in pixels.
   * @param {number} height - The coordinate height of the display, in pixels.
   * @param {Array<number>} origin - The origin of the display, in pixels.
   *   The coordinate system will be translated to this point.
   * @param {number} [scaleFactor=1] - Optional scaleFactor by which to multiply
   *   the width and height to determine the final pixel size.
   * @return {Renderer} - This renderer instance.
   */
  prototype$H.initialize = function(el, width, height, origin, scaleFactor) {
    this._el = el;
    return this.resize(width, height, origin, scaleFactor);
  };

  /**
   * Returns the parent container element for a visualization.
   * @return {DOMElement} - The containing DOM element.
   */
  prototype$H.element = function() {
    return this._el;
  };

  /**
   * Returns the scene element (e.g., canvas or SVG) of the visualization
   * Subclasses must override if the first child is not the scene element.
   * @return {DOMElement} - The scene (e.g., canvas or SVG) element.
   */
  prototype$H.canvas = function() {
    return this._el && this._el.firstChild;
  };

  /**
   * Get / set the background color.
   */
  prototype$H.background = function(bgcolor) {
    if (arguments.length === 0) return this._bgcolor;
    this._bgcolor = bgcolor;
    return this;
  };

  /**
   * Resize the display.
   * @param {number} width - The new coordinate width of the display, in pixels.
   * @param {number} height - The new coordinate height of the display, in pixels.
   * @param {Array<number>} origin - The new origin of the display, in pixels.
   *   The coordinate system will be translated to this point.
   * @param {number} [scaleFactor=1] - Optional scaleFactor by which to multiply
   *   the width and height to determine the final pixel size.
   * @return {Renderer} - This renderer instance;
   */
  prototype$H.resize = function(width, height, origin, scaleFactor) {
    this._width = width;
    this._height = height;
    this._origin = origin || [0, 0];
    this._scale = scaleFactor || 1;
    return this;
  };

  /**
   * Report a dirty item whose bounds should be redrawn.
   * This base class method does nothing. Subclasses that perform
   * incremental should implement this method.
   * @param {Item} item - The dirty item whose bounds should be redrawn.
   */
  prototype$H.dirty = function(/*item*/) {
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
  prototype$H.render = function(scene) {
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
  prototype$H._render = function(/*scene*/) {
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
  prototype$H.renderAsync = function(scene) {
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
  prototype$H._load = function(method, uri) {
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
  prototype$H.sanitizeURL = function(uri) {
    return this._load('sanitizeURL', uri);
  };

  /**
   * Requests an image to include in the rendered scene.
   * This method proxies a call to ImageLoader.loadImage, but also tracks
   * image loading progress and invokes a re-render once complete.
   * @param {string} uri - The URI string of the image.
   * @return {Promise} - A Promise that resolves to the loaded Image.
   */
  prototype$H.loadImage = function(uri) {
    return this._load('loadImage', uri);
  };

  var Events = [
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

  var TooltipShowEvent = 'mousemove';

  var TooltipHideEvent = 'mouseout';

  var HrefEvent = 'click';

  function CanvasHandler(loader, tooltip) {
    Handler.call(this, loader, tooltip);
    this._down = null;
    this._touch = null;
    this._first = true;
  }

  var prototype$I = inherits(CanvasHandler, Handler);

  prototype$I.initialize = function(el, origin, obj) {
    // add event listeners
    var canvas = this._canvas = el && domFind(el, 'canvas');
    if (canvas) {
      var that = this;
      this.events.forEach(function(type) {
        canvas.addEventListener(type, function(evt) {
          if (prototype$I[type]) {
            prototype$I[type].call(that, evt);
          } else {
            that.fire(type, evt);
          }
        });
      });
    }

    return Handler.prototype.initialize.call(this, el, origin, obj);
  };

  // return the backing canvas instance
  prototype$I.canvas = function() {
    return this._canvas;
  };

  // retrieve the current canvas context
  prototype$I.context = function() {
    return this._canvas.getContext('2d');
  };

  // supported events
  prototype$I.events = Events;

  // to keep old versions of firefox happy
  prototype$I.DOMMouseScroll = function(evt) {
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

  prototype$I.mousemove = move('mousemove', 'mouseover', 'mouseout');
  prototype$I.dragover  = move('dragover', 'dragenter', 'dragleave');

  prototype$I.mouseout  = inactive('mouseout');
  prototype$I.dragleave = inactive('dragleave');

  prototype$I.mousedown = function(evt) {
    this._down = this._active;
    this.fire('mousedown', evt);
  };

  prototype$I.click = function(evt) {
    if (this._down === this._active) {
      this.fire('click', evt);
      this._down = null;
    }
  };

  prototype$I.touchstart = function(evt) {
    this._touch = this.pickEvent(evt.changedTouches[0]);

    if (this._first) {
      this._active = this._touch;
      this._first = false;
    }

    this.fire('touchstart', evt, true);
  };

  prototype$I.touchmove = function(evt) {
    this.fire('touchmove', evt, true);
  };

  prototype$I.touchend = function(evt) {
    this.fire('touchend', evt, true);
    this._touch = null;
  };

  // fire an event
  prototype$I.fire = function(type, evt, touch) {
    var a = touch ? this._touch : this._active,
        h = this._handlers[type], i, len;

    // set event type relative to scenegraph items
    evt.vegaType = type;

    // handle hyperlinks and tooltips first
    if (type === HrefEvent && a && a.href) {
      this.handleHref(evt, a, a.href);
    } else if (type === TooltipShowEvent || type === TooltipHideEvent) {
      this.handleTooltip(evt, a, type !== TooltipHideEvent);
    }

    // invoke all registered handlers
    if (h) {
      for (i=0, len=h.length; i<len; ++i) {
        h[i].handler.call(this._obj, evt, a);
      }
    }
  };

  // add an event handler
  prototype$I.on = function(type, handler) {
    var name = this.eventName(type),
        h = this._handlers,
        i = this._handlerIndex(h[name], type, handler);

    if (i < 0) {
      (h[name] || (h[name] = [])).push({
        type:    type,
        handler: handler
      });
    }

    return this;
  };

  // remove an event handler
  prototype$I.off = function(type, handler) {
    var name = this.eventName(type),
        h = this._handlers[name],
        i = this._handlerIndex(h, type, handler);

    if (i >= 0) {
      h.splice(i, 1);
    }

    return this;
  };

  prototype$I.pickEvent = function(evt) {
    var p = point(evt, this._canvas),
        o = this._origin;
    return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
  };

  // find the scenegraph item at the current mouse position
  // x, y -- the absolute x, y mouse coordinates on the canvas element
  // gx, gy -- the relative coordinates within the current group
  prototype$I.pick = function(scene, x, y, gx, gy) {
    var g = this.context(),
        mark = marks[scene.marktype];
    return mark.pick.call(this, g, scene, x, y, gx, gy);
  };

  function clip$1(context, scene) {
    var clip = scene.clip;

    context.save();
    context.beginPath();

    if (isFunction(clip)) {
      clip(context);
    } else {
      var group = scene.group;
      context.rect(0, 0, group.width || 0, group.height || 0);
    }

    context.clip();
  }

  function devicePixelRatio() {
    return typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  }

  var pixelRatio = devicePixelRatio();

  function resize(canvas, width, height, origin, scaleFactor) {
    var inDOM = typeof HTMLElement !== 'undefined'
      && canvas instanceof HTMLElement
      && canvas.parentNode != null;

    var context = canvas.getContext('2d'),
        ratio = inDOM ? pixelRatio : scaleFactor;

    canvas.width = width * ratio;
    canvas.height = height * ratio;

    if (inDOM && ratio !== 1) {
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
  }

  function CanvasRenderer(loader) {
    Renderer.call(this, loader);
    this._redraw = false;
    this._dirty = new Bounds();
  }

  var prototype$J = inherits(CanvasRenderer, Renderer),
      base = Renderer.prototype,
      tempBounds$1 = new Bounds();

  prototype$J.initialize = function(el, width, height, origin, scaleFactor) {
    this._canvas = canvas(1, 1); // instantiate a small canvas
    if (el) {
      domClear(el, 0).appendChild(this._canvas);
      this._canvas.setAttribute('class', 'marks');
    }
    // this method will invoke resize to size the canvas appropriately
    return base.initialize.call(this, el, width, height, origin, scaleFactor);
  };

  prototype$J.resize = function(width, height, origin, scaleFactor) {
    base.resize.call(this, width, height, origin, scaleFactor);
    resize(this._canvas, this._width, this._height, this._origin, this._scale);
    this._redraw = true;
    return this;
  };

  prototype$J.canvas = function() {
    return this._canvas;
  };

  prototype$J.context = function() {
    return this._canvas ? this._canvas.getContext('2d') : null;
  };

  prototype$J.dirty = function(item) {
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

  prototype$J._render = function(scene) {
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

  prototype$J.draw = function(ctx, scene, bounds) {
    var mark = marks[scene.marktype];
    if (scene.clip) clip$1(ctx, scene);
    mark.draw.call(this, ctx, scene, bounds);
    if (scene.clip) ctx.restore();
  };

  prototype$J.clear = function(x, y, w, h) {
    var g = this.context();
    g.clearRect(x, y, w, h);
    if (this._bgcolor != null) {
      g.fillStyle = this._bgcolor;
      g.fillRect(x, y, w, h);
    }
  };

  function SVGHandler(loader, tooltip) {
    Handler.call(this, loader, tooltip);
    var h = this;
    h._hrefHandler = listener(h, function(evt, item) {
      if (item && item.href) h.handleHref(evt, item, item.href);
    });
    h._tooltipHandler = listener(h, function(evt, item) {
      h.handleTooltip(evt, item, evt.type !== TooltipHideEvent);
    });
  }

  var prototype$K = inherits(SVGHandler, Handler);

  prototype$K.initialize = function(el, origin, obj) {
    var svg = this._svg;
    if (svg) {
      svg.removeEventListener(HrefEvent, this._hrefHandler);
      svg.removeEventListener(TooltipShowEvent, this._tooltipHandler);
      svg.removeEventListener(TooltipHideEvent, this._tooltipHandler);
    }
    this._svg = svg = el && domFind(el, 'svg');
    if (svg) {
      svg.addEventListener(HrefEvent, this._hrefHandler);
      svg.addEventListener(TooltipShowEvent, this._tooltipHandler);
      svg.addEventListener(TooltipHideEvent, this._tooltipHandler);
    }
    return Handler.prototype.initialize.call(this, el, origin, obj);
  };

  prototype$K.canvas = function() {
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
  prototype$K.on = function(type, handler) {
    var name = this.eventName(type),
        h = this._handlers,
        i = this._handlerIndex(h[name], type, handler);

    if (i < 0) {
      var x = {
        type:     type,
        handler:  handler,
        listener: listener(this, handler)
      };

      (h[name] || (h[name] = [])).push(x);
      if (this._svg) {
        this._svg.addEventListener(name, x.listener);
      }
    }

    return this;
  };

  // remove an event handler
  prototype$K.off = function(type, handler) {
    var name = this.eventName(type),
        h = this._handlers[name],
        i = this._handlerIndex(h, type, handler);

    if (i >= 0) {
      if (this._svg) {
        this._svg.removeEventListener(name, h[i].listener);
      }
      h.splice(i, 1);
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
    'strokeOpacity':    'stroke-opacity',
    'strokeWidth':      'stroke-width',
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

  var prototype$L = inherits(SVGRenderer, Renderer);
  var base$1 = Renderer.prototype;

  prototype$L.initialize = function(el, width, height, padding) {
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

  prototype$L.background = function(bgcolor) {
    if (arguments.length && this._svg) {
      this._svg.style.setProperty('background-color', bgcolor);
    }
    return base$1.background.apply(this, arguments);
  };

  prototype$L.resize = function(width, height, origin, scaleFactor) {
    base$1.resize.call(this, width, height, origin, scaleFactor);

    if (this._svg) {
      this._svg.setAttribute('width', this._width * this._scale);
      this._svg.setAttribute('height', this._height * this._scale);
      this._svg.setAttribute('viewBox', '0 0 ' + this._width + ' ' + this._height);
      this._root.setAttribute('transform', 'translate(' + this._origin + ')');
    }

    this._dirty = [];

    return this;
  };

  prototype$L.canvas = function() {
    return this._svg;
  };

  prototype$L.svg = function() {
    if (!this._svg) return null;

    var attr = {
      class:   'marks',
      width:   this._width * this._scale,
      height:  this._height * this._scale,
      viewBox: '0 0 ' + this._width + ' ' + this._height
    };
    for (var key$$1 in metadata) {
      attr[key$$1] = metadata[key$$1];
    }

    var bg = !this._bgcolor ? ''
      : (openTag('rect', {
          width:  this._width,
          height: this._height,
          style:  'fill: ' + this._bgcolor + ';'
        }) + closeTag('rect'));

    return openTag('svg', attr) + bg + this._svg.innerHTML + closeTag('svg');
  };


  // -- Render entry point --

  prototype$L._render = function(scene) {
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

  prototype$L.updateDefs = function() {
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
    var mask;

    el = domChild(el, index, 'clipPath', ns);
    el.setAttribute('id', clip$$1.id);

    if (clip$$1.path) {
      mask = domChild(el, 0, 'path', ns);
      mask.setAttribute('d', clip$$1.path);
    } else {
      mask = domChild(el, 0, 'rect', ns);
      mask.setAttribute('x', 0);
      mask.setAttribute('y', 0);
      mask.setAttribute('width', clip$$1.width);
      mask.setAttribute('height', clip$$1.height);
    }
  }

  prototype$L._resetDefs = function() {
    var def = this._defs;
    def.gradient = {};
    def.clipping = {};
  };


  // -- Manage rendering of items marked as dirty --

  prototype$L.dirty = function(item) {
    if (item.dirty !== this._dirtyID) {
      item.dirty = this._dirtyID;
      this._dirty.push(item);
    }
  };

  prototype$L.isDirty = function(item) {
    return this._dirtyAll
      || !item._svg
      || item.dirty === this._dirtyID;
  };

  prototype$L._dirtyCheck = function() {
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
        dirtyParents(item, id$$1);
        mark.items.forEach(function(i) { i.dirty = id$$1; });
      }
      if (mark.zdirty) continue; // handle in standard drawing pass

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
  prototype$L.draw = function(el, scene, prev) {
    if (!this.isDirty(scene)) return scene._svg;

    var renderer = this,
        svg = this._svg,
        mdef = marks[scene.marktype],
        events = scene.interactive === false ? 'none' : null,
        isGroup = mdef.tag === 'g',
        sibling = null,
        i = 0,
        parent;

    parent = bind(scene, el, prev, 'g', svg);
    parent.setAttribute('class', cssClass(scene));
    if (!isGroup) {
      parent.style.setProperty('pointer-events', events);
    }
    if (scene.clip) {
      parent.setAttribute('clip-path', clip(renderer, scene, scene.group));
    } else {
      parent.removeAttribute('clip-path');
    }

    function process(item) {
      var dirty = renderer.isDirty(item),
          node = bind(item, parent, sibling, mdef.tag, svg);

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
  function bind(item, el, sibling, tag, svg) {
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

    // (re-)insert if (a) not contained in SVG or (b) sibling order has changed
    if (node.ownerSVGElement !== svg || hasSiblings(item) && node.previousSibling !== sibling) {
      el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
    }

    return node;
  }

  function hasSiblings(item) {
    var parent = item.mark || item.group;
    return parent && parent.items.length > 1;
  }


  // -- Set attributes & styles on SVG elements ---

  var element = null, // temp var for current SVG element
      values = null;  // temp var for current values hash

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
      var value;

      value = textValue(item);
      if (value !== values.text) {
        el.textContent = value;
        values.text = value;
      }

      setStyle(el, 'font-family', fontFamily(item));
      setStyle(el, 'font-size', fontSize(item) + 'px');
      setStyle(el, 'font-style', item.fontStyle);
      setStyle(el, 'font-variant', item.fontVariant);
      setStyle(el, 'font-weight', item.fontWeight);
    }
  };

  function setStyle(el, name, value) {
    if (value !== values[name]) {
      if (value == null) {
        el.style.removeProperty(name);
      } else {
        el.style.setProperty(name, value + '');
      }
      values[name] = value;
    }
  }

  prototype$L._update = function(mdef, el, item) {
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

  prototype$L.style = function(el, o) {
    if (o == null) return;
    var i, n, prop, name, value;

    for (i=0, n=styleProperties.length; i<n; ++i) {
      prop = styleProperties[i];
      value = o[prop];

      if (prop === 'font') {
        value = fontFamily(o);
      }

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
        el.style.setProperty(name, value + '');
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
      bg:   '',
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

  var prototype$M = inherits(SVGStringRenderer, Renderer);
  var base$2 = Renderer.prototype;

  prototype$M.resize = function(width, height, origin, scaleFactor) {
    base$2.resize.call(this, width, height, origin, scaleFactor);
    var o = this._origin,
        t = this._text;

    var attr = {
      class:   'marks',
      width:   this._width * this._scale,
      height:  this._height * this._scale,
      viewBox: '0 0 ' + this._width + ' ' + this._height
    };
    for (var key$$1 in metadata) {
      attr[key$$1] = metadata[key$$1];
    }

    t.head = openTag('svg', attr);

    var bg = this._bgcolor;
    if (bg === 'transparent' || bg === 'none') bg = null;

    if (bg) {
      t.bg = openTag('rect', {
        width:  this._width,
        height: this._height,
        style:  'fill: ' + bg + ';'
      }) + closeTag('rect');
    } else {
      t.bg = '';
    }

    t.root = openTag('g', {
      transform: 'translate(' + o + ')'
    });

    t.foot = closeTag('g') + closeTag('svg');

    return this;
  };

  prototype$M.background = function() {
    var rv = base$2.background.apply(this, arguments);
    if (arguments.length && this._text.head) {
      this.resize(this._width, this._height, this._origin, this._scale);
    }
    return rv;
  };

  prototype$M.svg = function() {
    var t = this._text;
    return t.head + t.bg + t.defs + t.root + t.body + t.foot;
  };

  prototype$M._render = function(scene) {
    this._text.body = this.mark(scene);
    this._text.defs = this.buildDefs();
    return this;
  };

  prototype$M.buildDefs = function() {
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

      if (def.path) {
        defs += openTag('path', {
          d: def.path
        }) + closeTag('path');
      } else {
        defs += openTag('rect', {
          x: 0,
          y: 0,
          width: def.width,
          height: def.height
        }) + closeTag('rect');
      }

      defs += closeTag('clipPath');
    }

    return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
  };

  var object$1;

  function emit$1(name, value, ns, prefixed) {
    object$1[prefixed || name] = value;
  }

  prototype$M.attributes = function(attr, item) {
    object$1 = {};
    attr(emit$1, item, this);
    return object$1;
  };

  prototype$M.href = function(item) {
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

  prototype$M.mark = function(scene) {
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

  prototype$M.markGroup = function(scene) {
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
      s += 'pointer-events: none; ';
    }

    if (tag === 'text') {
      s += 'font-family: ' + fontFamily(o) + '; ';
      s += 'font-size: ' + fontSize(o) + 'px; ';
      if (o.fontStyle) s += 'font-style: ' + o.fontStyle + '; ';
      if (o.fontVariant) s += 'font-variant: ' + o.fontVariant + '; ';
      if (o.fontWeight) s += 'font-weight: ' + o.fontWeight + '; ';
    }

    for (i=0, n=styleProperties.length; i<n; ++i) {
      prop = styleProperties[i];
      name = styles[prop];
      value = o[prop];

      if (value == null) {
        if (name === 'fill') {
          s += 'fill: none; ';
        }
      } else if (value === 'transparent' && (name === 'fill' || name === 'stroke')) {
        // transparent is not a legal SVG value, so map to none instead
        s += name + ': none; ';
      } else {
        if (value.id) {
          // ensure definition is included
          defs.gradient[value.id] = value;
          value = 'url(#' + value.id + ')';
        }
        s += name + ': ' + value + '; ';
      }
    }

    return s ? 'style="' + s.trim() + '"' : null;
  }

  function escape_text(s) {
    return s.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
  }

  var Canvas = 'canvas';
  var PNG = 'png';
  var SVG = 'svg';
  var None$2 = 'none';

  var RenderType = {
    Canvas: Canvas,
    PNG:    PNG,
    SVG:    SVG,
    None:   None$2
  };

  var modules = {};

  modules[Canvas] = modules[PNG] = {
    renderer: CanvasRenderer,
    headless: CanvasRenderer,
    handler:  CanvasHandler
  };

  modules[SVG] = {
    renderer: SVGRenderer,
    headless: SVGStringRenderer,
    handler:  SVGHandler
  };

  modules[None$2] = {};

  function renderModule(name, _$$1) {
    name = String(name || '').toLowerCase();
    if (arguments.length > 1) {
      modules[name] = _$$1;
      return this;
    } else {
      return modules[name];
    }
  }

  var clipBounds = new Bounds();

  function boundClip(mark) {
    var clip = mark.clip;

    if (isFunction(clip)) {
      clip(context(clipBounds.clear()));
    } else if (clip) {
      clipBounds.set(0, 0, mark.group.width, mark.group.height);
    } else return;

    mark.bounds.intersect(clipBounds);
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

  var prototype$N = inherits(Bound, Transform);

  prototype$N.transform = function(_$$1, pulse) {
    var view = pulse.dataflow,
        mark = _$$1.mark,
        type = mark.marktype,
        entry = marks[type],
        bound = entry.bound,
        markBounds = mark.bounds, rebound;

    if (entry.nested) {
      // multi-item marks have a single bounds instance
      if (mark.items.length) view.dirty(mark.items[0]);
      markBounds = boundItem$1(mark, bound);
      mark.items.forEach(function(item) {
        item.bounds.clear().union(markBounds);
      });
    }

    else if (type === Group || _$$1.modified()) {
      // operator parameters modified -> re-bound all items
      // updates group bounds in response to modified group content
      pulse.visit(pulse.MOD, function(item) { view.dirty(item); });
      markBounds.clear();
      mark.items.forEach(function(item) {
        markBounds.union(boundItem$1(item, bound));
      });

      // force reflow for legends to propagate any layout changes
      // suppress other types to prevent overall layout jumpiness
      if (mark.role === LegendRole) pulse.reflow();
    }

    else {
      // incrementally update bounds, re-bound mark as needed
      rebound = pulse.changed(pulse.REM);

      pulse.visit(pulse.ADD, function(item) {
        markBounds.union(boundItem$1(item, bound));
      });

      pulse.visit(pulse.MOD, function(item) {
        rebound = rebound || markBounds.alignsWith(item.bounds);
        view.dirty(item);
        markBounds.union(boundItem$1(item, bound));
      });

      if (rebound) {
        markBounds.clear();
        mark.items.forEach(function(item) { markBounds.union(item.bounds); });
      }
    }

    // ensure mark bounds do not exceed any clipping region
    boundClip(mark);

    return pulse.modifies('bounds');
  };

  function boundItem$1(item, bound, opt) {
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

  var prototype$O = inherits(Identifier, Transform);

  prototype$O.transform = function(_$$1, pulse) {
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
   */
  function Mark(params) {
    Transform.call(this, null, params);
  }

  var prototype$P = inherits(Mark, Transform);

  prototype$P.transform = function(_$$1, pulse) {
    var mark = this.value;

    // acquire mark on first invocation, bind context and group
    if (!mark) {
      mark = pulse.dataflow.scenegraph().mark(_$$1.markdef, lookup$1(_$$1), _$$1.index);
      mark.group.context = _$$1.context;
      if (!_$$1.context.group) _$$1.context.group = mark.group;
      mark.source = this;
      mark.clip = _$$1.clip;
      mark.interactive = _$$1.interactive;
      this.value = mark;
    }

    // initialize entering items
    var Init = mark.marktype === Group ? GroupItem : Item;
    pulse.visit(pulse.ADD, function(item) { Init.call(item, mark); });

    // update clipping and/or interactive status
    if (_$$1.modified('clip') || _$$1.modified('interactive')) {
      mark.clip = _$$1.clip;
      mark.interactive = !!_$$1.interactive;
      mark.zdirty = true; // force scenegraph re-eval
      pulse.reflow();
    }

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

  var prototype$Q = inherits(Overlap, Transform);

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
    var range = scale.range(),
        b = new Bounds();

    if (orient === Top || orient === Bottom) {
      b.set(range[0], -Infinity, range[1], +Infinity);
    } else {
      b.set(-Infinity, range[0], +Infinity, range[1]);
    }
    b.expand(tolerance || 1);

    return function(item) {
      return b.encloses(item.bounds);
    };
  }

  // reset all items to be fully opaque
  function reset$1(source) {
    source.forEach(function(item) { item.opacity = 1; });
    return source;
  }

  // add all tuples to mod, fork pulse if parameters were modified
  // fork prevents cross-stream tuple pollution (e.g., pulse from scale)
  function reflow(pulse, _$$1) {
    return pulse.reflow(_$$1.modified()).modifies('opacity');
  }

  prototype$Q.transform = function(_$$1, pulse) {
    var reduce = methods[_$$1.method] || methods.parity,
        source = pulse.materialize(pulse.SOURCE).source,
        items, test;

    if (!source) return;

    if (!_$$1.method) {
      // early exit if method is falsy
      if (_$$1.modified('method')) {
        reset$1(source);
        pulse = reflow(pulse, _$$1);
      }
      return pulse;
    }

    if (_$$1.sort) {
      source = source.slice().sort(_$$1.sort);
    }

    if (_$$1.method === 'greedy') {
      source = source.filter(hasBounds);
    }

    items = reset$1(source);
    pulse = reflow(pulse, _$$1);

    if (items.length >= 3 && hasOverlap(items)) {
      do {
        items = reduce(items);
      } while (items.length >= 3 && hasOverlap(items));

      if (items.length < 3 && !peek(source).opacity) {
        if (items.length > 1) peek(items).opacity = 0;
        peek(source).opacity = 1;
      }
    }

    if (_$$1.boundScale && _$$1.boundTolerance >= 0) {
      test = boundTest(_$$1.boundScale, _$$1.boundOrient, +_$$1.boundTolerance);
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

  var prototype$R = inherits(Render, Transform);

  prototype$R.transform = function(_$$1, pulse) {
    var view = pulse.dataflow;

    pulse.visit(pulse.ALL, function(item) { view.dirty(item); });

    // set z-index dirty flag as needed
    if (pulse.fields && pulse.fields['zindex']) {
      var item = pulse.source && pulse.source[0];
      if (item) item.mark.zdirty = true;
    }
  };

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
      if (mark.marktype === Group) {
        switch (mark.role) {
          case AxisRole:
          case LegendRole:
            break;
          case RowHeader: addAll(items, views.rowheaders); break;
          case RowFooter: addAll(items, views.rowfooters); break;
          case ColHeader: addAll(items, views.colheaders); break;
          case ColFooter: addAll(items, views.colfooters); break;
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

  function get$1(opt, key$$1, d) {
    var v = isObject(opt) ? opt[key$$1] : opt;
    return v != null ? v : (d !== undefined ? d : 0);
  }

  function offsetValue(v) {
    return v < 0 ? Math.ceil(-v) : 0;
  }

  function gridLayout(view, group, opt) {
    var views = extractGroups(group, opt),
        groups = views.marks,
        flush = opt.bounds === Flush,
        bbox = flush ? bboxFlush : bboxFull,
        bounds = new Bounds(0, 0, 0, 0),
        alignCol = get$1(opt.align, Column),
        alignRow = get$1(opt.align, Row),
        padCol = get$1(opt.padding, Column),
        padRow = get$1(opt.padding, Row),
        off = opt.offset,
        ncols = group.columns || opt.columns || groups.length,
        nrows = ncols < 0 ? 1 : Math.ceil(groups.length / ncols),
        cells = nrows * ncols,
        xOffset = [], xExtent = [], xMax = 0, xInit = 0,
        yOffset = [], yExtent = [], yMax = 0, yInit = 0,
        n = groups.length,
        m, i, c, r, b, g, px, py, x, y, band, offset;

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
      px = Math.ceil(bbox(groups[i]).x2);
      py = Math.ceil(bbox(groups[i]).y2);
      xMax = Math.max(xMax, px);
      yMax = Math.max(yMax, py);
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
    if (alignCol === Each) {
      for (c=1; c<ncols; ++c) {
        for (offset=0, i=c; i<n; i += ncols) {
          if (offset < xOffset[i]) offset = xOffset[i];
        }
        for (i=c; i<n; i += ncols) {
          xOffset[i] = offset + xExtent[c-1];
        }
      }
    } else if (alignCol === All) {
      for (offset=0, i=0; i<n; ++i) {
        if (i % ncols && offset < xOffset[i]) offset = xOffset[i];
      }
      for (i=0; i<n; ++i) {
        if (i % ncols) xOffset[i] = offset + xMax;
      }
    } else {
      for (alignCol=false, c=1; c<ncols; ++c) {
        for (i=c; i<n; i += ncols) {
          xOffset[i] += xExtent[c-1];
        }
      }
    }

    // enforce row alignment constraints
    if (alignRow === Each) {
      for (r=1; r<nrows; ++r) {
        for (offset=0, i=r*ncols, m=i+ncols; i<m; ++i) {
          if (offset < yOffset[i]) offset = yOffset[i];
        }
        for (i=r*ncols; i<m; ++i) {
          yOffset[i] = offset + yExtent[r-1];
        }
      }
    } else if (alignRow === All) {
      for (offset=0, i=ncols; i<n; ++i) {
        if (offset < yOffset[i]) offset = yOffset[i];
      }
      for (i=ncols; i<n; ++i) {
        yOffset[i] = offset + yMax;
      }
    } else {
      for (alignRow=false, r=1; r<nrows; ++r) {
        for (i=r*ncols, m=i+ncols; i<m; ++i) {
          yOffset[i] += yExtent[r-1];
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

    // perform horizontal centering
    if (get$1(opt.center, Column) && nrows > 1 && alignCol) {
      for (i=0; i<n; ++i) {
        g = groups[i];
        b = alignCol === All ? xMax : xExtent[i % ncols];
        x = b - bbox(g).x2;
        if (x > 0) {
          g.x += (px = x / 2);
          g.bounds.translate(px, 0);
        }
      }
    }

    // perform vertical centering
    if (get$1(opt.center, Row) && ncols !== 1 && alignRow) {
      for (i=0; i<n; ++i) {
        g = groups[i];
        b = alignRow === All ? yMax : yExtent[~~(i / ncols)];
        y = b - bbox(g).y2;
        if (y > 0) {
          g.y += (py = y / 2);
          g.bounds.translate(0, py);
        }
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
    function min(a, b) { return Math.floor(Math.min(a, b)); }
    function max(a, b) { return Math.ceil(Math.max(a, b)); }

    // bounding box calculation methods
    bbox = flush ? boundFlush : boundFull;

    // perform row header layout
    band = get$1(opt.headerBand, Row, null);
    x = layoutHeaders(view, views.rowheaders, groups, ncols, nrows, -get$1(off, 'rowHeader'),    min, 0, bbox, 'x1', 0, ncols, 1, band);

    // perform column header layout
    band = get$1(opt.headerBand, Column, null);
    y = layoutHeaders(view, views.colheaders, groups, ncols, ncols, -get$1(off, 'columnHeader'), min, 1, bbox, 'y1', 0, 1, ncols, band);

    // perform row footer layout
    band = get$1(opt.footerBand, Row, null);
    layoutHeaders(    view, views.rowfooters, groups, ncols, nrows,  get$1(off, 'rowFooter'),    max, 0, bbox, 'x2', ncols-1, ncols, 1, band);

    // perform column footer layout
    band = get$1(opt.footerBand, Column, null);
    layoutHeaders(    view, views.colfooters, groups, ncols, ncols,  get$1(off, 'columnFooter'), max, 1, bbox, 'y2', cells-ncols, 1, ncols, band);

    // perform row title layout
    if (views.rowtitle) {
      offset = x - get$1(off, 'rowTitle');
      band = get$1(opt.titleBand, Row, 0.5);
      layoutTitle(view, views.rowtitle, offset, 0, bounds, band);
    }

    // perform column title layout
    if (views.coltitle) {
      offset = y - get$1(off, 'columnTitle');
      band = get$1(opt.titleBand, Column, 0.5);
      layoutTitle(view, views.coltitle, offset, 1, bounds, band);
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

  function layoutTitle(view, g, offset, isX, bounds, band) {
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

  var AxisOffset = 0.5,
      tempBounds$2 = new Bounds();

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

  var prototype$S = inherits(ViewLayout, Transform);

  prototype$S.transform = function(_$$1, pulse) {
    // TODO incremental update, output?
    var view = pulse.dataflow;
    _$$1.mark.items.forEach(function(group) {
      if (_$$1.layout) gridLayout(view, group, _$$1.layout);
      layoutGroup(view, group, _$$1);
    });
    if (_$$1.modified()) pulse.reflow();
    return pulse;
  };

  function layoutGroup(view, group, _$$1) {
    var items = group.items,
        width = Math.max(0, group.width || 0),
        height = Math.max(0, group.height || 0),
        viewBounds = new Bounds().set(0, 0, width, height),
        xBounds = viewBounds.clone(),
        yBounds = viewBounds.clone(),
        legends = [], title,
        mark, flow, b, i, n;

    // layout axes, gather legends, collect bounds
    for (i=0, n=items.length; i<n; ++i) {
      mark = items[i];
      switch (mark.role) {
        case AxisRole:
          b = isYAxis(mark) ? xBounds : yBounds;
          b.union(axisLayout(view, mark, width, height));
          break;
        case TitleRole:
          title = mark; break;
        case LegendRole:
          legends.push(mark); break;
        case FrameRole:
        case ScopeRole:
        case RowHeader:
        case RowFooter:
        case RowTitle:
        case ColHeader:
        case ColFooter:
        case ColTitle:
          xBounds.union(mark.bounds);
          yBounds.union(mark.bounds);
          break;
        default:
          viewBounds.union(mark.bounds);
      }
    }

    // layout legends, adjust viewBounds
    if (legends.length) {
      flow = {
        leftWidth: legendPreprocess(view, legends),
        margin: _$$1.legendMargin || 8,
        left: 0, right: 0, top: 0, bottom: 0
      };

      for (i=0, n=legends.length; i<n; ++i) {
        b = legendLayout(view, legends[i], flow, xBounds, yBounds, width, height);
        if (_$$1.autosize && _$$1.autosize.type === Fit) {
          // For autosize fit, incorporate the orthogonal dimension only.
          // Legends that overrun the chart area will then be clipped;
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

    // combine bounding boxes
    viewBounds.union(xBounds).union(yBounds);

    // layout title, adjust bounds
    if (title) {
      viewBounds.union(titleLayout(view, title, width, height, viewBounds));
    }

    // perform size adjustment
    viewSizeLayout(view, group, viewBounds, _$$1);
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

  function axisLayout(view, axis, width, height) {
    var item = axis.items[0],
        datum = item.datum,
        orient = datum.orient,
        indices = axisIndices(datum),
        range = item.range,
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
        if (title) s = axisTitleLayout(title, s, titlePadding, 0, -1, bounds);
        bounds.add(0, -s).add(range, 0);
        break;
      case Left:
        x = -offset;
        y = position || 0;
        s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
        if (title) s = axisTitleLayout(title, s, titlePadding, 1, -1, bounds);
        bounds.add(-s, 0).add(0, range);
        break;
      case Right:
        x = width + offset;
        y = position || 0;
        s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
        if (title) s = axisTitleLayout(title, s, titlePadding, 1, 1, bounds);
        bounds.add(0, 0).add(s, range);
        break;
      case Bottom:
        x = position || 0;
        y = height + offset;
        s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
        if (title) s = axisTitleLayout(title, s, titlePadding, 0, 1, bounds);
        bounds.add(0, 0).add(range, s);
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

  function axisTitleLayout(title, offset, pad$$1, isYAxis, sign, bounds) {
    var b = title.bounds, dx = 0, dy = 0;

    if (title.auto) {
      offset += pad$$1;

      isYAxis
        ? dx = (title.x || 0) - (title.x = sign * offset)
        : dy = (title.y || 0) - (title.y = sign * offset);

      b.translate(-dx, -dy);
      title.mark.bounds.set(b.x1, b.y1, b.x2, b.y2);

      if (isYAxis) {
        bounds.add(0, b.y1).add(0, b.y2);
        offset += b.width();
      } else {
        bounds.add(b.x1, 0).add(b.x2, 0);
        offset += b.height();
      }
    } else {
      bounds.union(b);
    }

    return offset;
  }

  function titleLayout(view, title, width, height, viewBounds) {
    var item = title.items[0],
        orient = item.orient,
        frame = item.frame,
        anchor = item.anchor,
        offset = item.offset,
        bounds = item.bounds,
        vertical = (orient === Left || orient === Right),
        start = 0,
        end = vertical ? height : width,
        x = 0, y = 0, pos;

    if (frame !== Group) {
      orient === Left ? (start = viewBounds.y2, end = viewBounds.y1)
        : orient === Right ? (start = viewBounds.y1, end = viewBounds.y2)
        : (start = viewBounds.x1, end = viewBounds.x2);
    } else if (orient === Left) {
      start = height, end = 0;
    }

    pos = (anchor === Start) ? start
      : (anchor === End) ? end
      : (start + end) / 2;

    tempBounds$2.clear().union(bounds);

    // position title text
    switch (orient) {
      case Top:
        x = pos;
        y = viewBounds.y1 - offset;
        break;
      case Left:
        x = viewBounds.x1 - offset;
        y = pos;
        break;
      case Right:
        x = viewBounds.x2 + offset;
        y = pos;
        break;
      case Bottom:
        x = pos;
        y = viewBounds.y2 + offset;
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

  function legendPreprocess(view, legends) {
    return legends.reduce(function(w, legend) {
      var item = legend.items[0];

      // adjust entry to accommodate padding and title
      legendGroupLayout(view, item, item.items[0].items[0]);

      if (item.datum.orient === Left) {
        var b = tempBounds$2.clear();
        item.items.forEach(function(_$$1) { b.union(_$$1.bounds); });
        w = Math.max(w, Math.ceil(b.width() + 2 * item.padding - 1));
      }

      return w;
    }, 0);
  }

  function legendGroupLayout(view, item, entry) {
    var x = item.padding - entry.x,
        y = item.padding - entry.y;

    if (item.datum.title) {
      var title = item.items[1].items[0];
      y += item.titlePadding + title.fontSize;
    }

    if (x || y) {
      entry.x += x;
      entry.y += y;
      entry.bounds.translate(x, y);
      entry.mark.bounds.translate(x, y);
      view.dirty(entry);
    }
  }

  function legendLayout(view, legend, flow, xBounds, yBounds, width, height) {
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
    w = 2 * item.padding - 1;
    h = 2 * item.padding - 1;
    if (!bounds.empty()) {
      w = Math.ceil(bounds.width() + w);
      h = Math.ceil(bounds.height() + h);
    }

    if (datum.type === Symbols) {
      legendEntryLayout(item.items[0].items[0].items[0].items);
    }

    switch (orient) {
      case Left:
        x -= flow.leftWidth + offset - Math.floor(axisBounds.x1);
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
      case TopLeft:
        x += offset;
        y += offset;
        break;
      case TopRight:
        x += width - w - offset;
        y += offset;
        break;
      case BottomLeft:
        x += offset;
        y += height - h - offset;
        break;
      case BottomRight:
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

  function legendEntryLayout(entries) {
    // get max widths for each column
    var widths = entries.reduce(function(w, g) {
      w[g.column] = Math.max(g.bounds.x2 - g.x, w[g.column] || 0);
      return w;
    }, {});

    // set dimensions of legend entry groups
    entries.forEach(function(g) {
      g.width  = widths[g.column];
      g.height = g.bounds.y2 - g.y;
    });
  }

  function viewSizeLayout(view, group, viewBounds, _$$1) {
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

    if (type === None$1) {
      left = 0;
      top = 0;
      width = viewWidth;
      height = viewHeight;
    }

    else if (type === Fit) {
      width = Math.max(0, viewWidth - left - right);
      height = Math.max(0, viewHeight - top - bottom);
    }

    else if (type === FitX) {
      width = Math.max(0, viewWidth - left - right);
      viewHeight = height + top + bottom;
    }

    else if (type === FitY) {
      viewWidth = width + left + right;
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



  var vtx = /*#__PURE__*/Object.freeze({
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

  function bandSpace(count, paddingInner, paddingOuter) {
    var space = count - paddingInner + paddingOuter * 2;
    return count ? (space > 0 ? space : 1) : 0;
  }

  function invertRange(scale) {
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
  }

  function invertRangeExtent(scale) {
    return function(_$$1) {
      var range = scale.range(),
          lo = _$$1[0],
          hi = _$$1[1],
          min = -1, max, t, i, n;

      if (hi < lo) {
        t = lo;
        lo = hi;
        hi = t;
      }

      for (i=0, n=range.length; i<n; ++i) {
        if (range[i] >= lo && range[i] <= hi) {
          if (min < 0) min = i;
          max = i;
        }
      }

      if (min < 0) return undefined;

      lo = scale.invertExtent(range[min]);
      hi = scale.invertExtent(range[max]);

      return [
        lo[0] === undefined ? lo[1] : lo[0],
        hi[1] === undefined ? hi[0] : hi[1]
      ];
    }
  }

  function band() {
    var scale = $.scaleOrdinal().unknown(undefined),
        domain = scale.domain,
        ordinalRange = scale.range,
        range = [0, 1],
        step,
        bandwidth,
        round = false,
        paddingInner = 0,
        paddingOuter = 0,
        align = 0.5;

    delete scale.unknown;

    function rescale() {
      var n = domain().length,
          reverse = range[1] < range[0],
          start = range[reverse - 0],
          stop = range[1 - reverse],
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
        range = [+_$$1[0], +_$$1[1]];
        return rescale();
      } else {
        return range.slice();
      }
    };

    scale.rangeRound = function(_$$1) {
      range = [+_$$1[0], +_$$1[1]];
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
          reverse = range[1] < range[0],
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
      if (hi < values[0] || lo > range[1-reverse]) return;

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
          .range(range)
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

  var map = Array.prototype.map,
      slice = Array.prototype.slice;

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
        range = [];

    function scale(x) {
      return x == null || x !== x
        ? undefined
        : range[(d3Array.bisect(domain, x) - 1) % range.length];
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
        range = slice.call(_$$1);
        return scale;
      } else {
        return range.slice();
      }
    };

    // Addresses #1395, refine if/when d3-scale tickFormat is exposed
    scale.tickFormat = function() {
      var linear = $.scaleLinear().domain([domain[0], peek(domain)]);
      return linear.tickFormat.apply(linear, arguments);
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

  function interpolateRange(interpolator, range) {
    var start = range[0],
        span = peek(range) - start;
    return function(i) { return interpolator(start + i * span); };
  }

  function scaleFraction(scale, min, max) {
    var delta = max - min;
    return !delta || !isFinite(delta) ? constant(0)
      : scale.type === 'linear' || scale.type === 'sequential'
        ? function(_$$1) { return (_$$1 - min) / delta; }
        : scale.copy().domain([min, max]).range([0, 1]).interpolate(lerp);
  }

  function lerp(a, b) {
    var span = b - a;
    return function(i) { return a + i * span; }
  }

  function interpolate(type, gamma) {
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

  function colors(specifier) {
    var n = specifier.length / 6 | 0, colors = new Array(n), i = 0;
    while (i < n) colors[i] = "#" + specifier.slice(i * 6, ++i * 6);
    return colors;
  }

  var category20 = colors(
    '1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5'
  );

  var category20b = colors(
    '393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6'
  );

  var category20c = colors(
    '3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9'
  );

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

  var discretized = {
    blueorange:  blueOrange
  };

  var schemes = {
    // d3 categorical palettes
    category10:  _.schemeCategory10,
    accent:      _.schemeAccent,
    dark2:       _.schemeDark2,
    paired:      _.schemePaired,
    pastel1:     _.schemePastel1,
    pastel2:     _.schemePastel2,
    set1:        _.schemeSet1,
    set2:        _.schemeSet2,
    set3:        _.schemeSet3,

    // additional categorical palettes
    category20:  category20,
    category20b: category20b,
    category20c: category20c,
    tableau10:   tableau10,
    tableau20:   tableau20,

    // sequential multi-hue interpolators
    viridis:     _.interpolateViridis,
    magma:       _.interpolateMagma,
    inferno:     _.interpolateInferno,
    plasma:      _.interpolatePlasma,

    // cyclic interpolators
    rainbow:     _.interpolateRainbow,
    sinebow:     _.interpolateSinebow,

    // extended interpolators
    blueorange:  $$1.interpolateRgbBasis(peek(blueOrange))
  };

  function add$2(name, suffix) {
    schemes[name] = _['interpolate' + suffix];
    discretized[name] = _['scheme' + suffix];
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

  function scheme(name, scheme) {
    if (arguments.length > 1) {
      schemes[name] = scheme;
      return this;
    }

    var part = name.split('-');
    name = part[0];
    part = +part[1] + 1;

    return part && discretized.hasOwnProperty(name) ? discretized[name][part-1]
      : !part && schemes.hasOwnProperty(name) ? schemes[name]
      : undefined;
  }

  function schemeDiscretized(name, schemeArray, interpolator) {
    if (arguments.length > 1) {
      discretized[name] = schemeArray;
      schemes[name] = interpolator || $$1.interpolateRgbBasis(peek(schemeArray));
      return this;
    }

    return discretized.hasOwnProperty(name)
      ? discretized[name]
      : undefined;
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
  function tickCount(scale, count) {
    var step;

    if (isObject(count)) {
      step = count.step;
      count = count.interval;
    }

    if (isString(count)) {
      count = scale.type === 'time' ? timeInterval(count)
        : scale.type === 'utc' ? utcInterval(count)
        : error('Only time and utc scales accept interval strings.');
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
  function validTicks(scale, ticks, count) {
    var range = scale.range(),
        lo = range[0],
        hi = peek(range);
    if (lo > hi) {
      range = hi;
      hi = lo;
      lo = range;
    }

    ticks = ticks.filter(function(v) {
      v = scale(v);
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
  function tickValues(scale, count) {
    return scale.ticks ? scale.ticks(count) : scale.domain();
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
  function tickFormat(scale, count, specifier) {
    var format = scale.tickFormat ? scale.tickFormat(count, specifier)
      : specifier ? d3Format.format(specifier)
      : String;

    return (scale.type === Log)
      ? filter$1(format, variablePrecision(specifier))
      : format;
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

  function trimZeroes(format, decimalChar) {
    return function(x) {
      var str = format(x),
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

  var prototype$T = inherits(AxisTicks, Transform);

  prototype$T.transform = function(_$$1, pulse) {
    if (this.value && !_$$1.modified()) {
      return pulse.StopPropagation;
    }

    var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        ticks = this.value,
        scale = _$$1.scale,
        count = _$$1.count == null ? (_$$1.values ? _$$1.values.length : 10) : tickCount(scale, _$$1.count),
        format = _$$1.format || tickFormat(scale, count, _$$1.formatSpecifier),
        values = _$$1.values ? validTicks(scale, _$$1.values, count) : tickValues(scale, count);

    if (ticks) out.rem = ticks;

    ticks = values.map(function(value, i) {
      return ingest({
        index: i / (values.length - 1),
        value: value,
        label: format(value)
      });
    });

    if (_$$1.extra && ticks.length) {
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

  var prototype$U = inherits(DataJoin, Transform);

  function defaultItemCreate() {
    return ingest({});
  }

  function isExit(t) {
    return t.exit;
  }

  prototype$U.transform = function(_$$1, pulse) {
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

    if (map && (_$$1.modified('key') || pulse.modified(key$$1))) {
      error('DataJoin does not support modified key function or fields.');
    }

    if (!map) {
      pulse = pulse.addAll();
      this.value = map = fastmap().test(isExit);
      map.lookup = function(t) { return map.get(key$$1(t)); };
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

  var prototype$V = inherits(Encode, Transform);

  prototype$V.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.ADD_REM),
        encoders = _$$1.encoders,
        encode = pulse.encode;

    // if an array, the encode directive includes additional sets
    // that must be defined in order for the primary set to be invoked
    // e.g., only run the update set if the hover set is defined
    if (isArray(encode)) {
      if (out.changed() || encode.every(function(e) { return encoders[e]; })) {
        encode = encode[0];
        out.encode = null; // consume targeted encode directive
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

  var Symbols$1  = 'symbol';
  var Discrete = 'discrete';
  var Gradient$1 = 'gradient';

  var symbols$1 = {};
  symbols$1[Quantile] = quantileSymbols;
  symbols$1[Quantize] = quantizeSymbols;
  symbols$1[Threshold] = thresholdSymbols;
  symbols$1[BinLinear] = symbols$1[BinOrdinal] = binSymbols;

  function labelValues(scale, count) {
    var values = symbols$1[scale.type];
    return values ? values(scale) : tickValues(scale, count);
  }

  function quantizeSymbols(scale) {
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

  function quantileSymbols(scale) {
    var values = [-Infinity].concat(scale.quantiles());
    values.max = +Infinity;

    return values;
  }

  function thresholdSymbols(scale) {
    var values = [-Infinity].concat(scale.domain());
    values.max = +Infinity;

    return values;
  }

  function binSymbols(scale) {
    var values = scale.domain();
    values.max = values.pop();

    return values;
  }

  function labelFormat(scale, format, type) {
    return type === Symbols$1 && symbols$1[scale.type] ? formatRange(format)
      : type === Discrete ? formatDiscrete(format)
      : formatPoint(format);
  }

  function formatRange(format) {
    return function(value, index, array$$1) {
      var limit = array$$1[index + 1] || array$$1.max || +Infinity,
          lo = formatValue(value, format),
          hi = formatValue(limit, format);
      return lo && hi ? lo + '\u2013' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
    };
  }

  function formatDiscrete(format) {
    return function(value, index) {
      return index ? format(value) : null;
    }
  }

  function formatPoint(format) {
    return function(value) {
      return format(value);
    };
  }

  function formatValue(value, format) {
    return isFinite(value) ? format(value) : null;
  }

  function labelFraction(scale) {
    var domain = scale.domain(),
        count = domain.length - 1,
        lo = +domain[0],
        hi = +peek(domain),
        span = hi - lo;

    if (scale.type === Threshold) {
      var adjust = count ? span / count : 0.1;
      lo -= adjust;
      hi += adjust;
      span = hi - lo;
    }

    return function(value) {
      return (value - lo) / span;
    };
  }

  /**
   * Generates legend entries for visualizing a scale.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Scale} params.scale - The scale to generate items for.
   * @param {*} [params.count=5] - The approximate number of items, or
   *   desired tick interval, to use.
   * @param {Array<*>} [params.values] - The exact tick values to use.
   *   These must be legal domain values for the provided scale.
   *   If provided, the count argument is ignored.
   * @param {string} [params.formatSpecifier] - A format specifier
   *   to use in conjunction with scale.tickFormat. Legal values are
   *   any valid D3 format specifier string.
   * @param {function(*):string} [params.format] - The format function to use.
   *   If provided, the formatSpecifier argument is ignored.
   */
  function LegendEntries(params) {
    Transform.call(this, [], params);
  }

  var prototype$W = inherits(LegendEntries, Transform);

  prototype$W.transform = function(_$$1, pulse) {
    if (this.value != null && !_$$1.modified()) {
      return pulse.StopPropagation;
    }

    var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
        items = this.value,
        type  = _$$1.type || Symbols$1,
        scale = _$$1.scale,
        count = _$$1.count == null ? 5 : tickCount(scale, _$$1.count),
        format = _$$1.format || tickFormat(scale, count, _$$1.formatSpecifier),
        values = _$$1.values || labelValues(scale, count, type),
        domain, fraction, size, offset;

    format = labelFormat(scale, format, type);
    if (items) out.rem = items;

    if (type === Symbols$1) {
      if (isFunction(size = _$$1.size)) {
        // if first value maps to size zero, remove from list (vega#717)
        if (!_$$1.values && scale(values[0]) === 0) {
          values = values.slice(1);
        }
        // compute size offset for legend entries
        offset = values.reduce(function(max, value) {
          return Math.max(max, size(value, _$$1));
        }, 0);
      } else {
        size = constant(offset = size || 8);
      }

      items = values.map(function(value, index) {
        return ingest({
          index:  index,
          label:  format(value, index, values),
          value:  value,
          offset: offset,
          size:   size(value, _$$1)
        });
      });
    }

    else if (type === Gradient$1) {
      domain = scale.domain(),
      fraction = scaleFraction(scale, domain[0], peek(domain));

      // if automatic label generation produces 2 or fewer values,
      // use the domain end points instead (fixes vega/vega#1364)
      if (values.length < 3 && !_$$1.values && domain[0] !== peek(domain)) {
        values = [domain[0], peek(domain)];
      }

      items = values.map(function(value, index) {
        return ingest({
          index: index,
          label: format(value, index, values),
          value: value,
          perc:  fraction(value)
        });
      });
    }

    else {
      size = values.length - 1;
      fraction = labelFraction(scale);

      items = values.map(function(value, index) {
        return ingest({
          index: index,
          label: format(value, index, values),
          value: value,
          perc:  index ? fraction(value) : 0,
          perc2: index === size ? 1 : fraction(values[index+1])
        });
      });
    }

    out.source = items;
    out.add = items;
    this.value = items;

    return out;
  };

  var Paths = fastmap({
    'line': line$2,
    'line-radial': lineR,
    'arc': arc$2,
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
      { "name": "require", "type": "signal" },
      { "name": "as", "type": "string", "default": "path" }
    ]
  };

  var prototype$X = inherits(LinkPath, Transform);

  prototype$X.transform = function(_$$1, pulse) {
    var sx = _$$1.sourceX || sourceX,
        sy = _$$1.sourceY || sourceY,
        tx = _$$1.targetX || targetX,
        ty = _$$1.targetY || targetY,
        as = _$$1.as || 'path',
        orient = _$$1.orient || 'vertical',
        shape = _$$1.shape || 'line',
        path = Paths.get(shape + '-' + orient) || Paths.get(shape);

    if (!path) {
      error('LinkPath unsupported type: ' + _$$1.shape
        + (_$$1.orient ? '-' + _$$1.orient : ''));
    }

    pulse.visit(pulse.SOURCE, function(t) {
      t[as] = path(sx(t), sy(t), tx(t), ty(t));
    });

    return pulse.reflow(_$$1.modified()).modifies(as);
  };

  // -- Link Path Generation Methods -----

  function line$2(sx, sy, tx, ty) {
    return 'M' + sx + ',' + sy +
           'L' + tx + ',' + ty;
  }

  function lineR(sa, sr, ta, tr) {
    return line$2(
      sr * Math.cos(sa), sr * Math.sin(sa),
      tr * Math.cos(ta), tr * Math.sin(ta)
    );
  }

  function arc$2(sx, sy, tx, ty) {
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
    return arc$2(
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

  var prototype$Y = inherits(Pie, Transform);

  prototype$Y.transform = function(_$$1, pulse) {
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
    'domain', 'domainMin', 'domainMid', 'domainMax', 'domainRaw', 'domainImplicit', 'nice', 'zero',
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

  var prototype$Z = inherits(Scale, Transform);

  prototype$Z.transform = function(_$$1, pulse) {
    var df = pulse.dataflow,
        scale$$1 = this.value,
        prop;

    if (!scale$$1 || _$$1.modified('type')) {
      this.value = scale$$1 = scale$1((_$$1.type || Linear).toLowerCase())();
    }

    for (prop in _$$1) if (!SKIP$2[prop]) {
      // padding is a scale property for band/point but not others
      if (prop === 'padding' && INCLUDE_PAD[scale$$1.type]) continue;
      // invoke scale property setter, raise warning if not found
      isFunction(scale$$1[prop])
        ? scale$$1[prop](_$$1[prop])
        : df.warn('Unsupported scale property: ' + prop);
    }

    configureRange(scale$$1, _$$1, configureDomain(scale$$1, _$$1, df));

    return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
  };

  function configureDomain(scale$$1, _$$1, df) {
    // check raw domain, if provided use that and exit early
    var raw = rawDomain(scale$$1, _$$1.domainRaw, df);
    if (raw > -1) return raw;

    var domain = _$$1.domain,
        type = scale$$1.type,
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
    scale$$1.domain(domainCheck(type, domain, df));

    // if ordinal scale domain is defined, prevent implicit
    // domain construction as side-effect of scale lookup
    if (type === Ordinal) {
      scale$$1.unknown(_$$1.domainImplicit ? $.scaleImplicit : undefined);
    }

    // perform 'nice' adjustment as requested
    if (_$$1.nice && scale$$1.nice) {
      scale$$1.nice((_$$1.nice !== true && tickCount(scale$$1, _$$1.nice)) || null);
    }

    // return the cardinality of the domain
    return domain.length;
  }

  function rawDomain(scale$$1, raw, df) {
    if (raw) {
      scale$$1.domain(domainCheck(scale$$1.type, raw, df));
      return raw.length;
    } else {
      return -1;
    }
  }

  function padDomain(type, domain, range, pad$$1, exponent) {
    var span = Math.abs(peek(range) - range[0]),
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

  function domainCheck(type, domain, df) {
    if (type === Log) {
      // sum signs of domain values
      // if all pos or all neg, abs(sum) === domain.length
      var s = Math.abs(domain.reduce(function(s, v) {
        return s + (v < 0 ? -1 : v > 0 ? 1 : 0);
      }, 0));

      if (s !== domain.length) {
        df.warn('Log scale domain includes zero: ' + $$2(domain));
      }
    }
    return domain;
  }

  function configureRange(scale$$1, _$$1, count) {
    var round = _$$1.round || false,
        range = _$$1.range;

    // if range step specified, calculate full range extent
    if (_$$1.rangeStep != null) {
      range = configureRangeStep(scale$$1.type, _$$1, count);
    }

    // else if a range scheme is defined, use that
    else if (_$$1.scheme) {
      range = configureScheme(scale$$1.type, _$$1, count);
      if (isFunction(range)) return scale$$1.interpolator(range);
    }

    // given a range array for a sequential scale, convert to interpolator
    else if (range && scale$$1.type === Sequential) {
      return scale$$1.interpolator($$1.interpolateRgbBasis(flip(range, _$$1.reverse)));
    }

    // configure rounding / interpolation
    if (range && _$$1.interpolate && scale$$1.interpolate) {
      scale$$1.interpolate(interpolate(_$$1.interpolate, _$$1.interpolateGamma));
    } else if (isFunction(scale$$1.round)) {
      scale$$1.round(round);
    } else if (isFunction(scale$$1.rangeRound)) {
      scale$$1.interpolate(round ? $$1.interpolateRound : $$1.interpolate);
    }

    if (range) scale$$1.range(flip(range, _$$1.reverse));
  }

  function configureRangeStep(type, _$$1, count) {
    if (type !== Band && type !== Point) {
      error('Only band and point scales support rangeStep.');
    }

    // calculate full range based on requested step size and padding
    var outer = (_$$1.paddingOuter != null ? _$$1.paddingOuter : _$$1.padding) || 0,
        inner = type === Point ? 1
              : ((_$$1.paddingInner != null ? _$$1.paddingInner : _$$1.padding) || 0);
    return [0, _$$1.rangeStep * bandSpace(count, inner, outer)];
  }

  function configureScheme(type, _$$1, count) {
    var name = _$$1.scheme.toLowerCase(),
        scheme$$1 = scheme(name),
        extent = _$$1.schemeExtent,
        discrete;

    if (!scheme$$1) {
      error('Unrecognized scheme name: ' + _$$1.scheme);
    }

    // determine size for potential discrete range
    count = (type === Threshold) ? count + 1
      : (type === BinOrdinal) ? count - 1
      : (type === Quantile || type === Quantize) ? (+_$$1.schemeCount || DEFAULT_COUNT)
      : count;

    // adjust and/or quantize scheme as appropriate
    return type === Sequential ? adjustScheme(scheme$$1, extent, _$$1.reverse)
      : !extent && (discrete = scheme(name + '-' + count)) ? discrete
      : isFunction(scheme$$1) ? quantize$1(adjustScheme(scheme$$1, extent), count)
      : type === Ordinal ? scheme$$1 : scheme$$1.slice(0, count);
  }

  function adjustScheme(scheme$$1, extent, reverse) {
    return (isFunction(scheme$$1) && (extent || reverse))
      ? interpolateRange(scheme$$1, flip(extent || [0, 1], reverse))
      : scheme$$1;
  }

  function flip(array$$1, reverse) {
    return reverse ? array$$1.slice().reverse() : array$$1;
  }

  function quantize$1(interpolator, count) {
    var samples = new Array(count),
        n = count + 1;
    for (var i = 0; i < count;) samples[i] = interpolator(++i / n);
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

  var prototype$_ = inherits(SortItems, Transform);

  prototype$_.transform = function(_$$1, pulse) {
    var mod = _$$1.modified('sort')
           || pulse.changed(pulse.ADD)
           || pulse.modified(_$$1.sort.fields)
           || pulse.modified('datum');

    if (mod) pulse.source.sort(_$$1.sort);

    this.modified(mod);
    return pulse;
  };

  var Zero = 'zero',
      Center = 'center',
      Normalize = 'normalize',
      DefOutput = ['y0', 'y1'];

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
      { "name": "offset", "type": "enum", "default": Zero, "values": [Zero, Center, Normalize] },
      { "name": "as", "type": "string", "array": true, "length": 2, "default": DefOutput }
    ]
  };

  var prototype$10 = inherits(Stack, Transform);

  prototype$10.transform = function(_$$1, pulse) {
    var as = _$$1.as || DefOutput,
        y0 = as[0],
        y1 = as[1],
        field$$1 = _$$1.field || one,
        stack = _$$1.offset === Center ? stackCenter
              : _$$1.offset === Normalize ? stackNormalize
              : stackZero,
        groups, i, n, max;

    // partition, sum, and sort the stack groups
    groups = partition$1(pulse.source, _$$1.groupby, _$$1.sort, field$$1);

    // compute stack layouts per group
    for (i=0, n=groups.length, max=groups.max; i<n; ++i) {
      stack(groups[i], max, field$$1, y0, y1);
    }

    return pulse.reflow(_$$1.modified()).modifies(as);
  };

  function stackCenter(group, max, field$$1, y0, y1) {
    var last = (max - group.sum) / 2,
        m = group.length,
        j = 0, t;

    for (; j<m; ++j) {
      t = group[j];
      t[y0] = last;
      t[y1] = (last += Math.abs(field$$1(t)));
    }
  }

  function stackNormalize(group, max, field$$1, y0, y1) {
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

  function stackZero(group, max, field$$1, y0, y1) {
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

  function partition$1(data, groupby, sort, field$$1) {
    var groups = [],
        get = function(f) { return f(t); },
        map, i, n, m, t, k, g, s, max;

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
    for (k=0, max=0, m=groups.length; k<m; ++k) {
      g = groups[k];
      for (i=0, s=0, n=g.length; i<n; ++i) {
        s += Math.abs(field$$1(g[i]));
      }
      g.sum = s;
      if (s > max) max = s;
      if (sort) g.sort(sort);
    }
    groups.max = max;

    return groups;
  }



  var encode = /*#__PURE__*/Object.freeze({
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

  function ascending(a, b) {
    return a - b;
  }

  function area$2(ring) {
    var i = 0, n = ring.length, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
    while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
    return area;
  }

  function constant$2(x) {
    return function() {
      return x;
    };
  }

  function contains(ring, hole) {
    var i = -1, n = hole.length, c;
    while (++i < n) if (c = ringContains(ring, hole[i])) return c;
    return 0;
  }

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

  function noop$1() {}

  var cases = [
    [],
    [[[1.0, 1.5], [0.5, 1.0]]],
    [[[1.5, 1.0], [1.0, 1.5]]],
    [[[1.5, 1.0], [0.5, 1.0]]],
    [[[1.0, 0.5], [1.5, 1.0]]],
    [[[1.0, 1.5], [0.5, 1.0]], [[1.0, 0.5], [1.5, 1.0]]],
    [[[1.0, 0.5], [1.0, 1.5]]],
    [[[1.0, 0.5], [0.5, 1.0]]],
    [[[0.5, 1.0], [1.0, 0.5]]],
    [[[1.0, 1.5], [1.0, 0.5]]],
    [[[0.5, 1.0], [1.0, 0.5]], [[1.5, 1.0], [1.0, 1.5]]],
    [[[1.5, 1.0], [1.0, 0.5]]],
    [[[0.5, 1.0], [1.5, 1.0]]],
    [[[1.0, 1.5], [1.5, 1.0]]],
    [[[0.5, 1.0], [1.0, 1.5]]],
    []
  ];

  function contours() {
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
        tz = tz.slice().sort(ascending);
      }

      return tz.map(function(value) {
        return contour(values, value);
      });
    }

    // Accumulate, smooth contour rings, assign holes to exterior rings.
    // Based on https://github.com/mbostock/shapefile/blob/v0.6.2/shp/polygon.js
    function contour(values, value) {
      var polygons = [],
          holes = [];

      isorings(values, value, function(ring) {
        smooth(ring, values, value);
        if (area$2(ring) > 0) polygons.push([ring]);
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

      return {
        type: "MultiPolygon",
        value: value,
        coordinates: polygons
      };
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

      function stitch(line) {
        var start = [line[0][0] + x, line[0][1] + y],
            end = [line[1][0] + x, line[1][1] + y],
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

    contours.contour = contour;

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
  }

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

  function defaultWeight() {
    return 1;
  }

  function contourDensity() {
    var x = defaultX,
        y = defaultY,
        weight = defaultWeight,
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
        var xi = (+x(d, i, data) + o) >> k,
            yi = (+y(d, i, data) + o) >> k,
            wi = +weight(d, i, data);
        if (xi >= 0 && xi < n && yi >= 0 && yi < m) {
          values0[xi + yi * n] += wi;
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

    density.weight = function(_$$1) {
      return arguments.length ? (weight = typeof _$$1 === "function" ? _$$1 : constant$2(+_$$1), density) : weight;
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
  }

  var CONTOUR_PARAMS = ['size', 'smooth'];
  var DENSITY_PARAMS = ['x', 'y', 'weight', 'size', 'cellSize', 'bandwidth'];

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
   * @param {function(object): number} [params.weight] - The data point weight accessor for density estimation.
   * @param {number} [params.cellSize] - Contour density calculation cell size.
   * @param {number} [params.bandwidth] - Kernel density estimation bandwidth.
   * @param {Array<number>} [params.thresholds] - Contour threshold array. If
   *   this parameter is set, the count and nice parameters will be ignored.
   * @param {number} [params.count] - The desired number of contours.
   * @param {boolean} [params.nice] - Boolean flag indicating if the contour
   *   threshold values should be automatically aligned to "nice"
   *   human-friendly values. Setting this flag may cause the number of
   *   thresholds to deviate from the specified count.
   * @param {boolean} [params.smooth] - Boolean flag indicating if the contour
   *   polygons should be smoothed using linear interpolation. The default is
   *   true. The parameter is ignored when using density estimation.
   */
  function Contour(params) {
    Transform.call(this, null, params);
  }

  Contour.Definition = {
    "type": "Contour",
    "metadata": {"generates": true},
    "params": [
      { "name": "size", "type": "number", "array": true, "length": 2, "required": true },
      { "name": "values", "type": "number", "array": true },
      { "name": "x", "type": "field" },
      { "name": "y", "type": "field" },
      { "name": "weight", "type": "field" },
      { "name": "cellSize", "type": "number" },
      { "name": "bandwidth", "type": "number" },
      { "name": "count", "type": "number" },
      { "name": "smooth", "type": "boolean" },
      { "name": "nice", "type": "boolean", "default": false },
      { "name": "thresholds", "type": "number", "array": true }
    ]
  };

  var prototype$11 = inherits(Contour, Transform);

  prototype$11.transform = function(_$$1, pulse) {
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
    values = values && values.length ? contour(values).map(ingest) : [];
    this.value = out.source = out.add = values;

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

  var prototype$12 = inherits(GeoJSON, Transform);

  prototype$12.transform = function(_$$1, pulse) {
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
    'reflectX',
    'reflectY',

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
    if (!type || typeof type !== 'string') {
      throw new Error('Projection type must be a name string.');
    }
    type = type.toLowerCase();
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
    identity:             d3Geo.geoIdentity,
    mercator:             d3Geo.geoMercator,
    naturalEarth1:        d3Geo.geoNaturalEarth1,
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
      { "name": "pointRadius", "type": "number", "expr": true },
      { "name": "as", "type": "string", "default": "path" }
    ]
  };

  var prototype$13 = inherits(GeoPath, Transform);

  prototype$13.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.ALL),
        path = this.value,
        field$$1 = _$$1.field || identity,
        as = _$$1.as || 'path',
        flag = out.SOURCE;

    function set(t) { t[as] = path(field$$1(t)); }

    if (!path || _$$1.modified()) {
      // parameters updated, reset and reflow
      this.value = path = getProjectionPath(_$$1.projection);
      out.materialize().reflow();
    } else {
      flag = field$$1 === identity || pulse.modified(field$$1.fields)
        ? out.ADD_MOD
        : out.ADD;
    }

    var prev = initPath(path, _$$1.pointRadius);
    out.visit(flag, set);
    path.pointRadius(prev);

    return out.modifies(as);
  };

  function initPath(path, pointRadius) {
    var prev = path.pointRadius();
    path.context(null);
    if (pointRadius != null) {
      path.pointRadius(pointRadius);
    }
    return prev;
  }

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

  var prototype$14 = inherits(GeoPoint, Transform);

  prototype$14.transform = function(_$$1, pulse) {
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
      { "name": "pointRadius", "type": "number", "expr": true },
      { "name": "as", "type": "string", "default": "shape" }
    ]
  };

  var prototype$15 = inherits(GeoShape, Transform);

  prototype$15.transform = function(_$$1, pulse) {
    var out = pulse.fork(pulse.ALL),
        shape = this.value,
        datum = _$$1.field || field('datum'),
        as = _$$1.as || 'shape',
        flag = out.ADD_MOD;

    if (!shape || _$$1.modified()) {
      // parameters updated, reset and reflow
      this.value = shape = shapeGenerator(
        getProjectionPath(_$$1.projection),
        datum,
        _$$1.pointRadius
      );
      out.materialize().reflow();
      flag = out.SOURCE;
    }

    out.visit(flag, function(t) { t[as] = shape; });

    return out.modifies(as);
  };

  function shapeGenerator(path, field$$1, pointRadius) {
    var shape = pointRadius == null
      ? function(_$$1) { return path(field$$1(_$$1)); }
      : function(_$$1) {
        var prev = path.pointRadius(),
            value = path.pointRadius(pointRadius)(field$$1(_$$1));
        path.pointRadius(prev);
        return value;
      };
    shape.context = function(_$$1) {
      path.context(_$$1);
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
    "metadata": {"changes": true},
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

  var prototype$16 = inherits(Graticule, Transform);

  prototype$16.transform = function(_$$1, pulse) {
    var src = this.value,
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
      pulse.mod.push(replace(src[0], t));
    } else {
      pulse.add.push(ingest(t));
    }
    src[0] = t;

    return pulse;
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

  var prototype$17 = inherits(Projection, Transform);

  prototype$17.transform = function(_$$1, pulse) {
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
    if (!constructor) error('Unrecognized projection type: ' + type);
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



  var geo = /*#__PURE__*/Object.freeze({
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

  var Forces = 'forces',
      ForceParams = [
        'alpha', 'alphaMin', 'alphaTarget',
        'velocityDecay', 'forces'
      ],
      ForceConfig = ['static', 'iterations'],
      ForceOutput = ['x', 'y', 'vx', 'vy'];

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

  var prototype$18 = inherits(Force, Transform);

  prototype$18.transform = function(_$$1, pulse) {
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

  prototype$18.finish = function(_$$1, pulse) {
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
      error('Unrecognized force: ' + _$$1.force);
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



  var force = /*#__PURE__*/Object.freeze({
    force: Force
  });

  // Build lookup table mapping tuple keys to tree node instances
  function lookup$2(tree, key, filter) {
    var map = {};
    tree.each(function(node) {
      var t = node.data;
      if (filter(t)) map[key(t)] = node;
    });
    tree.lookup = map;
    return tree;
  }

  /**
    * Nest tuples into a tree structure, grouped by key values.
    * @constructor
    * @param {object} params - The parameters for this operator.
    * @param {Array<function(object): *>} params.keys - The key fields to nest by, in order.
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
    "metadata": {"treesource": true, "changes": true},
    "params": [
      { "name": "keys", "type": "field", "array": true },
      { "name": "generate", "type": "boolean" }
    ]
  };

  var prototype$19 = inherits(Nest, Transform);

  function children(n) {
    return n.values;
  }

  prototype$19.transform = function(_$$1, pulse) {
    if (!pulse.source) {
      error('Nest transform requires an upstream data source.');
    }

    var gen = _$$1.generate,
        mod = _$$1.modified(),
        out = pulse.clone(),
        tree = this.value;

    if (!tree || mod || pulse.changed()) {
      // collect nodes to remove
      if (tree) {
        tree.each(function(node) {
          if (node.children && isTuple(node.data)) {
            out.rem.push(node.data);
          }
        });
      }

      // generate new tree structure
      this.value = tree = d3Hierarchy.hierarchy({
        values: array(_$$1.keys)
                  .reduce(function(n, k) { n.key(k); return n; }, d3Collection.nest())
                  .entries(out.source)
      }, children);

      // collect nodes to add
      if (gen) {
        tree.each(function(node) {
          if (node.children) {
            node = ingest(node.data);
            out.add.push(node);
            out.source.push(node);
          }
        });
      }

      // build lookup table
      lookup$2(tree, tupleid, tupleid);
    }

    out.source.root = tree;
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

  var prototype$1a = inherits(HierarchyLayout, Transform);

  prototype$1a.transform = function(_$$1, pulse) {
    if (!pulse.source || !pulse.source.root) {
      error(this.constructor.name
        + ' transform requires a backing tree data source.');
    }

    var layout = this.layout(_$$1.method),
        fields = this.fields,
        root = pulse.source.root,
        as = _$$1.as || fields;

    if (_$$1.field) root.sum(_$$1.field);
    if (_$$1.sort) root.sort(_$$1.sort);

    setParams(layout, this.params, _$$1);
    if (layout.separation) {
      layout.separation(_$$1.separation !== false ? defaultSeparation : one);
    }

    try {
      this.value = layout(root);
    } catch (err) {
      error(err);
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

  function defaultSeparation(a, b) {
    return a.parent === b.parent ? 1 : 2;
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
      { "name": "as", "type": "string", "array": true, "length": Output.length, "default": Output }
    ]
  };

  var prototype$1b = inherits(Pack, HierarchyLayout);

  prototype$1b.layout = d3Hierarchy.pack;

  prototype$1b.params = ['size', 'padding'];

  prototype$1b.fields = Output;

  var Output$1 = ['x0', 'y0', 'x1', 'y1', 'depth', 'children'];

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
      { "name": "as", "type": "string", "array": true, "length": Output$1.length, "default": Output$1 }
    ]
  };

  var prototype$1c = inherits(Partition, HierarchyLayout);

  prototype$1c.layout = d3Hierarchy.partition;

  prototype$1c.params = ['size', 'round', 'padding'];

  prototype$1c.fields = Output$1;

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

  var prototype$1d = inherits(Stratify, Transform);

  prototype$1d.transform = function(_$$1, pulse) {
    if (!pulse.source) {
      error('Stratify transform requires an upstream data source.');
    }

    var tree = this.value,
        mod = _$$1.modified(),
        out = pulse.fork(pulse.ALL).materialize(pulse.SOURCE),
        run = !this.value
           || mod
           || pulse.changed(pulse.ADD_REM)
           || pulse.modified(_$$1.key.fields)
           || pulse.modified(_$$1.parentKey.fields);

    // prevent upstream source pollution
    out.source = out.source.slice();

    if (run) {
      if (out.source.length) {
        tree = lookup$2(
          d3Hierarchy.stratify().id(_$$1.key).parentId(_$$1.parentKey)(out.source)
          , _$$1.key, truthy);
      } else {
        tree = lookup$2(d3Hierarchy.stratify()([{}]), _$$1.key, _$$1.key);
      }
    }

    out.source.root = this.value = tree;
    return out;
  };

  var Layouts = {
    tidy: d3Hierarchy.tree,
    cluster: d3Hierarchy.cluster
  };

  var Output$2 = ['x', 'y', 'depth', 'children'];

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
      { "name": "separation", "type": "boolean", "default": true },
      { "name": "as", "type": "string", "array": true, "length": Output$2.length, "default": Output$2 }
    ]
  };

  var prototype$1e = inherits(Tree, HierarchyLayout);

  /**
   * Tree layout generator. Supports both 'tidy' and 'cluster' layouts.
   */
  prototype$1e.layout = function(method) {
    var m = method || 'tidy';
    if (Layouts.hasOwnProperty(m)) return Layouts[m]();
    else error('Unrecognized Tree layout method: ' + m);
  };

  prototype$1e.params = ['size', 'nodeSize'];

  prototype$1e.fields = Output$2;

  /**
    * Generate tuples representing links between tree nodes.
    * The resulting tuples will contain 'source' and 'target' fields,
    * which point to parent and child node tuples, respectively.
    * @constructor
    * @param {object} params - The parameters for this operator.
    */
  function TreeLinks(params) {
    Transform.call(this, [], params);
  }

  TreeLinks.Definition = {
    "type": "TreeLinks",
    "metadata": {"tree": true, "generates": true, "changes": true},
    "params": []
  };

  var prototype$1f = inherits(TreeLinks, Transform);

  prototype$1f.transform = function(_$$1, pulse) {
    var links = this.value,
        tree = pulse.source && pulse.source.root,
        out = pulse.fork(pulse.NO_SOURCE),
        lut = {};

    if (!tree) error('TreeLinks transform requires a tree data source.');

    if (pulse.changed(pulse.ADD_REM)) {
      // remove previous links
      out.rem = links;

      // build lookup table of valid tuples
      pulse.visit(pulse.SOURCE, function(t) { lut[tupleid(t)] = 1; });

      // generate links for all edges incident on valid tuples
      tree.each(function(node) {
        var t = node.data,
            p = node.parent && node.parent.data;
        if (p && lut[tupleid(t)] && lut[tupleid(p)]) {
          out.add.push(ingest({source: p, target: t}));
        }
      });
      this.value = out.add;
    }

    else if (pulse.changed(pulse.MOD)) {
      // build lookup table of modified tuples
      pulse.visit(pulse.MOD, function(t) { lut[tupleid(t)] = 1; });

      // gather links incident on modified tuples
      links.forEach(function(link) {
        if (lut[tupleid(link.source)] || lut[tupleid(link.target)]) {
          out.mod.push(link);
        }
      });
    }

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

  var Output$3 = ['x0', 'y0', 'x1', 'y1', 'depth', 'children'];

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
      { "name": "as", "type": "string", "array": true, "length": Output$3.length, "default": Output$3 }
    ]
  };

  var prototype$1g = inherits(Treemap, HierarchyLayout);

  /**
   * Treemap layout generator. Adds 'method' and 'ratio' parameters
   * to configure the underlying tile method.
   */
  prototype$1g.layout = function() {
    var x = d3Hierarchy.treemap();
    x.ratio = function(_$$1) {
      var t = x.tile();
      if (t.ratio) x.tile(t.ratio(_$$1));
    };
    x.method = function(_$$1) {
      if (Tiles.hasOwnProperty(_$$1)) x.tile(Tiles[_$$1]);
      else error('Unrecognized Treemap layout method: ' + _$$1);
    };
    return x;
  };

  prototype$1g.params = [
    'method', 'ratio', 'size', 'round',
    'padding', 'paddingInner', 'paddingOuter',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
  ];

  prototype$1g.fields = Output$3;



  var tree = /*#__PURE__*/Object.freeze({
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

  var prototype$1h = inherits(Voronoi, Transform);

  var defaultExtent = [[-1e5, -1e5], [1e5, 1e5]];

  prototype$1h.transform = function(_$$1, pulse) {
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



  var voronoi = /*#__PURE__*/Object.freeze({
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

  var cloudRadians = Math.PI / 180,
      cw = 1 << 11 >> 5,
      ch = 1 << 11;

  function cloud() {
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
        cloud = {};

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

    function getContext(canvas$$1) {
      canvas$$1.width = canvas$$1.height = 1;
      var ratio = Math.sqrt(canvas$$1.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
      canvas$$1.width = (cw << 5) / ratio;
      canvas$$1.height = ch / ratio;

      var context = canvas$$1.getContext("2d");
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
  }

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

  var prototype$1i = inherits(Wordcloud, Transform);

  prototype$1i.transform = function(_$$1, pulse) {
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
        range;

    isFunction(fontSize)
      ? (range = _$$1.fontSizeRange)
      : (fontSize = constant(fontSize));

    // create font size scaling function as needed
    if (range) {
      var fsize = fontSize,
          sizeScale = scale$1('sqrt')()
            .domain(extent(fsize, data))
            .range(range);
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

  function extent(field$$1, data) {
    var min = +Infinity,
        max = -Infinity,
        i = 0,
        n = data.length,
        v;

    for (; i<n; ++i) {
      v = field$$1(data[i]);
      if (v < min) min = v;
      if (v > max) max = v;
    }

    return [min, max];
  }



  var wordcloud = /*#__PURE__*/Object.freeze({
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

  function Dimension(index, i, query) {
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
            range = dim.bisect(dim.range, added.value),
            idx = added.index,
            lo = range[0],
            hi = range[1],
            n1 = idx.length, i;

        for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
        for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
        return dim;
      }
    };
  }

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
        merge$2(base, oldv, oldi, n0, addv, addi, n1, value, index);
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

    function bisect(range, array) {
      var n;
      if (array) {
        n = array.length;
      } else {
        array = value;
        n = size;
      }
      return [
        d3Array.bisectLeft(array, range[0], 0, n),
        d3Array.bisectRight(array, range[1], 0, n)
      ];
    }

    return {
      insert:  insert,
      remove:  remove,
      bisect:  bisect,
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

  function merge$2(base, value0, index0, n0, value1, index1, n1, value, index) {
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

  var prototype$1j = inherits(CrossFilter, Transform);

  prototype$1j.transform = function(_$$1, pulse) {
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

  prototype$1j.init = function(_$$1, pulse) {
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

  prototype$1j.reinit = function(_$$1, pulse) {
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

  prototype$1j.eval = function(_$$1, pulse) {
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

  prototype$1j.insert = function(_$$1, pulse, output) {
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

  prototype$1j.modify = function(pulse, output) {
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

  prototype$1j.remove = function(_$$1, pulse, output) {
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
  prototype$1j.reindex = function(pulse, num, map) {
    var indices = this._indices,
        bits = this.value;

    pulse.runAfter(function() {
      var indexMap = bits.remove(num, map);
      for (var key$$1 in indices) indices[key$$1].reindex(indexMap);
    });
  };

  prototype$1j.update = function(_$$1, pulse, output) {
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

  prototype$1j.incrementAll = function(dim, query, stamp, out) {
    var bits = this.value,
        seen = bits.seen(),
        curr = bits.curr(),
        prev = bits.prev(),
        index = dim.index(),
        old = dim.bisect(dim.range),
        range = dim.bisect(query),
        lo1 = range[0],
        hi1 = range[1],
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

  prototype$1j.incrementOne = function(dim, query, add, rem) {
    var bits = this.value,
        curr = bits.curr(),
        index = dim.index(),
        old = dim.bisect(dim.range),
        range = dim.bisect(query),
        lo1 = range[0],
        hi1 = range[1],
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

  var prototype$1k = inherits(ResolveFilter, Transform);

  prototype$1k.transform = function(_$$1, pulse) {
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



  var xf = /*#__PURE__*/Object.freeze({
    crossfilter: CrossFilter,
    resolvefilter: ResolveFilter
  });

  var version = "4.4.0";

  var Default = 'default';

  function cursor(view) {
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
  }

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
      error('Unrecognized data set: ' + name);
    }
    return data[name];
  }

  function data(name) {
    return dataref(this, name).values.value;
  }

  function change(name, changes) {
    if (!isChangeSet(changes)) {
      error('Second argument to changes must be a changeset.');
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

  function height(view) {
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
    var origin = offset$1(view),
        w = width(view),
        h = height(view);

    view._renderer.background(view._background);
    view._renderer.resize(w, h, origin);
    view._handler.origin(origin);

    view._resizeListeners.forEach(function(handler) {
      try {
        handler(w, h);
      } catch (error) {
        view.error(error);
      }
    });
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
  function eventExtend(view, event, item) {
    var el = view._renderer.canvas(),
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
  }

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

  var VIEW = 'view',
      TIMER = 'timer',
      WINDOW = 'window',
      NO_TRAP = {trap: false};

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
          } catch (error$$1) {
            view.error(error$$1);
          } finally {
            view.run();
          }
        },
        sources;

    if (source === TIMER) {
      view.timer(send, type);
    }

    else if (source === VIEW) {
      // send traps errors, so use {trap: false} option
      view.addEventListener(type, send, NO_TRAP);
    }

    else {
      if (source === WINDOW) {
        if (typeof window !== 'undefined') sources = [window];
      } else if (typeof document !== 'undefined') {
        sources = document.querySelectorAll(source);
      }

      if (!sources) {
        view.warn('Can not resolve event source: ' + source);
      } else {
        for (var i=0, n=sources.length; i<n; ++i) {
          sources[i].addEventListener(type, send);
        }

        view._eventListeners.push({
          type:    type,
          sources: sources,
          handler: send
        });
      }
    }

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

  function hover(hoverSet, leaveSet) {
    hoverSet = [hoverSet || 'hover'];
    leaveSet = [leaveSet || 'update', hoverSet[0]];

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
  }

  /**
   * Finalize a View instance that is being removed.
   * Cancel any running timers.
   * Remove all external event listeners.
   * Remove any currently displayed tooltip.
   */
  function finalize() {
    var tooltip = this._tooltip,
        timers = this._timers,
        listeners = this._eventListeners,
        n, m, e;

    n = timers.length;
    while (--n >= 0) {
      timers[n].stop();
    }

    n = listeners.length;
    while (--n >= 0) {
      e = listeners[n];
      m = e.sources.length;
      while (--m >= 0) {
        e.sources[m].removeEventListener(e.type, e.handler);
      }
    }

    if (tooltip) {
      tooltip.call(this, this._handler, null, null, null);
    }

    return this;
  }

  function element$1(tag, attr, text) {
    var el = document.createElement(tag);
    for (var key in attr) el.setAttribute(key, attr[key]);
    if (text != null) el.textContent = text;
    return el;
  }

  var BindClass = 'vega-bind',
      NameClass = 'vega-bind-name',
      RadioClass = 'vega-bind-radio',
      OptionClass = 'vega-option-';

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
  function bind$1(view, el, binding) {
    if (!el) return;

    var param = binding.param,
        bind = binding.state;

    if (!bind) {
      bind = binding.state = {
        elements: null,
        active: false,
        set: null,
        update: function(value) {
          if (value !== view.signal(param.signal)) {
            bind.source = true;
            view.signal(param.signal, value).run();
          }
        }
      };
      if (param.debounce) {
        bind.update = debounce(param.debounce, bind.update);
      }
    }

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
  }

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
      case 'range':    input = range; break;
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
  function range(bind, el, param, value) {
    value = value !== undefined ? value : ((+param.max) + (+param.min)) / 2;

    var min = param.min || Math.min(0, +value) || 0,
        max = param.max || Math.max(100, +value) || 100,
        step = param.step || d3Array.tickStep(min, max, 100);

    var node = element$1('input', {
      type:  'range',
      name:  param.signal,
      min:   min,
      max:   max,
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

  function initializeRenderer(view, r, el, constructor, scaleFactor) {
    r = r || new constructor(view.loader());
    return r
      .initialize(el, width(view), height(view), offset$1(view), scaleFactor)
      .background(view._background);
  }

  function trap(view, fn) {
    return !fn ? null : function() {
      try {
        fn.apply(this, arguments);
      } catch (error) {
        view.error(error);
      }
    };
  }

  function initializeHandler(view, prevHandler, el, constructor) {
    // instantiate scenegraph handler
    var handler = new constructor(view.loader(), trap(view, view.tooltip()))
      .scene(view.scenegraph().root)
      .initialize(el, offset$1(view), view);

    // transfer event handlers
    if (prevHandler) {
      prevHandler.handlers().forEach(function(h) {
        handler.on(h.type, h.handler);
      });
    }

    return handler;
  }

  function initialize$1(el, elBind) {
    var view = this,
        type = view._renderType,
        module = renderModule(type),
        Handler$$1, Renderer$$1;

    // containing dom element
    el = view._el = el ? lookup$3(view, el) : null;

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
      elBind = elBind ? lookup$3(view, elBind)
        : el.appendChild(element$1('div', {'class': 'vega-bindings'}));

      view._bind.forEach(function(_$$1) {
        if (_$$1.param.element) {
          _$$1.element = lookup$3(view, _$$1.param.element);
        }
      });

      view._bind.forEach(function(_$$1) {
        bind$1(view, _$$1.element || elBind, _$$1);
      });
    }

    return view;
  }

  function lookup$3(view, el) {
    if (typeof el === 'string') {
      if (typeof document !== 'undefined') {
        el = document.querySelector(el);
        if (!el) {
          view.error('Signal bind element not found: ' + el);
          return null;
        }
      } else {
        view.error('DOM document instance not found.');
        return null;
      }
    }
    if (el) {
      try {
        el.innerHTML = '';
      } catch (e) {
        el = null;
        view.error(e);
      }
    }
    return el;
  }

  /**
   * Render the current scene in a headless fashion.
   * This method is asynchronous, returning a Promise instance.
   * @return {Promise} - A Promise that resolves to a renderer.
   */
  function renderHeadless(view, type, scaleFactor) {
    var module = renderModule(type),
        ctr = module && module.headless;
    return !ctr
      ? Promise.reject('Unrecognized renderer type: ' + type)
      : view.runAsync().then(function() {
          return initializeRenderer(view, null, null, ctr, scaleFactor)
            .renderAsync(view._scenegraph.root);
        });
  }

  /**
   * Produce an image URL for the visualization. Depending on the type
   * parameter, the generated URL contains data for either a PNG or SVG image.
   * The URL can be used (for example) to download images of the visualization.
   * This method is asynchronous, returning a Promise instance.
   * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
   *   The 'canvas' and 'png' types are synonyms for a PNG image.
   * @return {Promise} - A promise that resolves to an image URL.
   */
  function renderToImageURL(type, scaleFactor) {
    return (type !== RenderType.Canvas && type !== RenderType.SVG && type !== RenderType.PNG)
      ? Promise.reject('Unrecognized image type: ' + type)
      : renderHeadless(this, type, scaleFactor).then(function(renderer) {
          return type === RenderType.SVG
            ? toBlobURL(renderer.svg(), 'image/svg+xml')
            : renderer.canvas().toDataURL('image/png');
        });
  }

  function toBlobURL(data, mime) {
    var blob = new Blob([data], {type: mime});
    return window.URL.createObjectURL(blob);
  }

  /**
   * Produce a Canvas instance containing a rendered visualization.
   * This method is asynchronous, returning a Promise instance.
   * @return {Promise} - A promise that resolves to a Canvas instance.
   */
  function renderToCanvas(scaleFactor) {
    return renderHeadless(this, RenderType.Canvas, scaleFactor)
      .then(function(renderer) { return renderer.canvas(); });
  }

  /**
   * Produce a rendered SVG string of the visualization.
   * This method is asynchronous, returning a Promise instance.
   * @return {Promise} - A promise that resolves to an SVG string.
   */
  function renderToSVG(scaleFactor) {
    return renderHeadless(this, RenderType.SVG, scaleFactor)
      .then(function(renderer) { return renderer.svg(); });
  }

  function parseAutosize(spec, config) {
    spec = spec || config.autosize;
    if (isObject(spec)) {
      return spec;
    } else {
      spec = spec || 'pad';
      return {type: spec};
    }
  }

  function parsePadding(spec, config) {
    spec = spec || config.padding;
    return isObject(spec)
      ? {
          top:    number$1(spec.top),
          bottom: number$1(spec.bottom),
          left:   number$1(spec.left),
          right:  number$1(spec.right)
        }
      : paddingObject(number$1(spec));
  }

  function number$1(_$$1) {
    return +_$$1 || 0;
  }

  function paddingObject(_$$1) {
    return {top: _$$1, bottom: _$$1, left: _$$1, right: _$$1};
  }

  var OUTER = 'outer',
      OUTER_INVALID = ['value', 'update', 'init', 'react', 'bind'];

  function outerError(prefix, name) {
    error(prefix + ' for "outer" push: ' + $$2(name));
  }

  function parseSignal(signal, scope) {
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
  }

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

  var TokenName,
      source$1,
      index,
      length,
      lookahead;

  var TokenBooleanLiteral = 1,
      TokenEOF = 2,
      TokenIdentifier = 3,
      TokenKeyword = 4,
      TokenNullLiteral = 5,
      TokenNumericLiteral = 6,
      TokenPunctuator = 7,
      TokenStringLiteral = 8,
      TokenRegularExpression = 9;

  TokenName = {};
  TokenName[TokenBooleanLiteral] = 'Boolean';
  TokenName[TokenEOF] = '<end>';
  TokenName[TokenIdentifier] = 'Identifier';
  TokenName[TokenKeyword] = 'Keyword';
  TokenName[TokenNullLiteral] = 'Null';
  TokenName[TokenNumericLiteral] = 'Numeric';
  TokenName[TokenPunctuator] = 'Punctuator';
  TokenName[TokenStringLiteral] = 'String';
  TokenName[TokenRegularExpression] = 'RegularExpression';

  var SyntaxArrayExpression = 'ArrayExpression',
      SyntaxBinaryExpression = 'BinaryExpression',
      SyntaxCallExpression = 'CallExpression',
      SyntaxConditionalExpression = 'ConditionalExpression',
      SyntaxIdentifier = 'Identifier',
      SyntaxLiteral = 'Literal',
      SyntaxLogicalExpression = 'LogicalExpression',
      SyntaxMemberExpression = 'MemberExpression',
      SyntaxObjectExpression = 'ObjectExpression',
      SyntaxProperty = 'Property',
      SyntaxUnaryExpression = 'UnaryExpression';

  // Error messages should be identical to V8.
  var MessageUnexpectedToken = 'Unexpected token %0',
      MessageUnexpectedNumber = 'Unexpected number',
      MessageUnexpectedString = 'Unexpected string',
      MessageUnexpectedIdentifier = 'Unexpected identifier',
      MessageUnexpectedReserved = 'Unexpected reserved word',
      MessageUnexpectedEOS = 'Unexpected end of input',
      MessageInvalidRegExp = 'Invalid regular expression',
      MessageUnterminatedRegExp = 'Invalid regular expression: missing /',
      MessageStrictOctalLiteral = 'Octal literals are not allowed in strict mode.',
      MessageStrictDuplicateProperty = 'Duplicate data property in object literal not allowed in strict mode';

  var ILLEGAL = 'ILLEGAL',
      DISABLED = 'Disabled.';

  // See also tools/generate-unicode-regex.py.
  var RegexNonAsciiIdentifierStart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]'),
      RegexNonAsciiIdentifierPart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]');

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

    expr = parseExpression();

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

    expr = parseExpression();

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

  function parseExpression() {
    var expr = parseConditionalExpression();

    if (match(',')) {
      throw new Error(DISABLED); // no sequence expressions
    }

    return expr;
  }

  function parse$2(code) {
    source$1 = code;
    index = 0;
    length = source$1.length;
    lookahead = null;

    peek$1();

    var expr = parseExpression();

    if (lookahead.type !== TokenEOF) {
      throw new Error("Unexpect token after expression.");
    }
    return expr;
  }

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

  function Functions(codegen) {

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
        if (args.length < 3) error('Missing arguments to clamp function.');
        if (args.length > 3) error('Too many arguments to clamp function.');
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
      split:       fn('split', STRING),
      replace:     fn('replace', STRING),

      // REGEXP functions
      regexp:  REGEXP,
      test:    fn('test', REGEXP),

      // Control Flow functions
      if: function(args) {
          if (args.length < 3) error('Missing arguments to if function.');
          if (args.length > 3) error('Too many arguments to if function.');
          var a = args.map(codegen);
          return '('+a[0]+'?'+a[1]+':'+a[2]+')';
        }
    };
  }

  function codegen(opt) {
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
      if (generator == null) error('Unsupported type: ' + ast.type);
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
          return error('Illegal identifier: ' + id$$1);
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
            error('Illegal callee type: ' + n.callee.type);
          }
          var callee = n.callee.name;
          var args = n.arguments;
          var fn = functions.hasOwnProperty(callee) && functions[callee];
          if (!fn) error('Unrecognized function: ' + callee);
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
  }

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

  function timeFormat(_$$1, specifier) {
    return formatter('timeFormat', d3TimeFormat.timeFormat, specifier)(_$$1);
  }

  function utcFormat(_$$1, specifier) {
    return formatter('utcFormat', d3TimeFormat.utcFormat, specifier)(_$$1);
  }

  function timeParse(_$$1, specifier) {
    return formatter('timeParse', d3TimeFormat.timeParse, specifier)(_$$1);
  }

  function utcParse(_$$1, specifier) {
    return formatter('utcParse', d3TimeFormat.utcParse, specifier)(_$$1);
  }

  var dateObj = new Date(2000, 0, 1);

  function time$1(month, day, specifier) {
    dateObj.setMonth(month);
    dateObj.setDate(day);
    return timeFormat(dateObj, specifier);
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

  /**
   * Return an array with minimum and maximum values, in the
   * form [min, max]. Ignores null, undefined, and NaN values.
   */
  function extent$1(array) {
    var i = 0, n, v, min, max;

    if (array && (n = array.length)) {
      // find first valid value
      for (v = array[i]; v == null || v !== v; v = array[++i]);
      min = max = v;

      // visit all other values
      for (; i<n; ++i) {
        v = array[i];
        // skip null/undefined; NaN will fail all comparisons
        if (v != null) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }

    return [min, max];
  }

  /**
   * Predicate that returns true if the value lies within the span
   * of the given range. The left and right flags control the use
   * of inclusive (true) or exclusive (false) comparisons.
   */
  function inrange(value, range, left, right) {
    var r0 = range[0], r1 = range[range.length-1], t;
    if (r0 > r1) {
      t = r0;
      r0 = r1;
      r1 = t;
    }
    left = left === undefined || left;
    right = right === undefined || right;

    return (left ? r0 <= value : r0 < value) &&
      (right ? value <= r1 : value < r1);
  }

  /**
   * Span-preserving range clamp. If the span of the input range is less
   * than (max - min) and an endpoint exceeds either the min or max value,
   * the range is translated such that the span is preserved and one
   * endpoint touches the boundary of the min/max range.
   * If the span exceeds (max - min), the range [min, max] is returned.
   */
  function clampRange(range, min, max) {
    var lo = range[0],
        hi = range[1],
        span;

    if (hi < lo) {
      span = hi;
      hi = lo;
      lo = span;
    }
    span = hi - lo;

    return span >= (max - min)
      ? [min, max]
      : [
          (lo = Math.min(Math.max(lo, min), max - span)),
          lo + span
        ];
  }

  /**
   * Return the numerical span of an array: the difference between
   * the last and first values.
   */
  function span(array) {
    return (array[array.length-1] - array[0]) || 0;
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

  function inScope(item) {
    var group = this.context.group,
        value = false;

    if (group) while (item) {
      if (item === group) { value = true; break; }
      item = item.mark.group;
    }
    return value;
  }

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

  function flush(range, value, threshold, left, right, center) {
    if (!threshold && threshold !== 0) return center;

    var a = range[0],
        b = peek(range),
        t = +threshold,
        l, r;

    // swap endpoints if range is reversed
    if (b < a) {
      l = a; a = b; b = l;
    }

    // compare value to endpoints
    l = Math.abs(value - a);
    r = Math.abs(b - value);

    // adjust if value within threshold distance of endpoint
    return l < r && l <= t ? left : r <= t ? right : center;
  }

  function merge$3() {
    var args = [].slice.call(arguments);
    args.unshift({});
    return extend.apply(null, args);
  }

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

  function range$1(name, group) {
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

  function invert(name, range, group) {
    var s = getScale(name, (group || this).context);
    return !s ? undefined
      : isArray(range) ? (s.invertRange || s.invert)(range)
      : (s.invert || s.invertExtent)(range);
  }

  function scaleGradient(scale, p0, p1, count, group) {
    scale = getScale(scale, (group || this).context);

    var gradient = Gradient(p0, p1),
        stops = scale.domain(),
        min = stops[0],
        max = peek(stops),
        fraction = scaleFraction(scale, min, max);

    if (scale.ticks) {
      stops = scale.ticks(+count || 15);
      if (min !== stops[0]) stops.unshift(min);
      if (max !== peek(stops)) stops.push(max);
    }

    for (var i=0, n=stops.length; i<n; ++i) {
      gradient.stop(fraction(stops[i]), scale(stops[i]));
    }

    return gradient;
  }

  function geoMethod(methodName, globalMethod) {
    return function(projection, geojson, group) {
      if (projection) {
        // projection defined, use it
        var p = getScale(projection, (group || this).context);
        return p && p.path[methodName](geojson);
      } else {
        // projection undefined, use global method
        return globalMethod(geojson);
      }
    };
  }

  var geoArea = geoMethod('area', d3Geo.geoArea);
  var geoBounds = geoMethod('bounds', d3Geo.geoBounds);
  var geoCentroid = geoMethod('centroid', d3Geo.geoCentroid);

  function geoShape(projection, geojson, group) {
    var p = getScale(projection, (group || this).context);
    return function(context$$1) {
      return p ? p.path.context(context$$1)(geojson) : '';
    }
  }

  function pathShape(path) {
    var p = null;
    return function(context$$1) {
      return context$$1
        ? pathRender(context$$1, (p = p || pathParse(path)))
        : path;
    };
  }

  function data$1(name) {
    var data = this.context.data[name];
    return data ? data.values.value : [];
  }

  function dataVisitor(name, args, scope, params) {
    if (args[0].type !== Literal) {
      error('First argument to data functions must be a string literal.');
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
    if (args[0].type !== Literal) error('First argument to indata must be a string literal.');
    if (args[1].type !== Literal) error('Second argument to indata must be a string literal.');

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
    var tree = data$1.call(context, name);
    return tree.root && tree.root.lookup || EMPTY;
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

  function encode$1(item, name, retval) {
    if (item) {
      var df = this.context.dataflow,
          target = item.mark.source;
      df.pulse(target, df.changeset().encode(item, name));
    }
    return retval !== undefined ? retval : item;
  }

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

  function modify(name, insert, remove, toggle, modify, values) {
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
      }, true, 1);
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
  }

  var TYPE_ENUM = 'E',
      TYPE_RANGE_INC = 'R',
      TYPE_RANGE_EXC = 'R-E',
      TYPE_RANGE_LE = 'R-LE',
      TYPE_RANGE_RE = 'R-RE',
      INTERSECT = 'intersect',
      UNION = 'union',
      UNIT_INDEX = 'index:unit';

  // TODO: revisit date coercion?
  function testPoint(datum, entry) {
    var fields = entry.fields,
        values = entry.values,
        n = fields.length,
        i = 0, dval, f;

    for (; i<n; ++i) {
      f = fields[i];
      f.getter = field.getter || field(f.field);
      dval = f.getter(datum);

      if (isDate(dval)) dval = toNumber(dval);
      if (isDate(values[i])) values[i] = toNumber(values[i]);
      if (isDate(values[i][0])) values[i] = values[i].map(toNumber);

      if (f.type === TYPE_ENUM) {
        // Enumerated fields can either specify individual values (single/multi selections)
        // or an array of values (interval selections).
        if(isArray(values[i]) ? values[i].indexOf(dval) < 0 : dval !== values[i]) {
          return false;
        }
      } else {
        if (f.type === TYPE_RANGE_INC) {
          if (!inrange(dval, values[i])) return false;
        } else if (f.type === TYPE_RANGE_RE) {
          // Discrete selection of bins test within the range [bin_start, bin_end).
          if (!inrange(dval, values[i], true, false)) return false;
        } else if (f.type === TYPE_RANGE_EXC) { // 'R-E'/'R-LE' included for completeness.
          if (!inrange(dval, values[i], false, false)) return false;
        } else if (f.type === TYPE_RANGE_LE) {
          if (!inrange(dval, values[i], false, true)) return false;
        }
      }
    }

    return true;
  }

  /**
   * Tests if a tuple is contained within an interactive selection.
   * @param {string} name - The name of the data set representing the selection.
   *                 Tuples in the dataset are of the form
   *                 {unit: string, fields: array<fielddef>, values: array<*>}.
   *                 Fielddef is of the form
   *                 {field: string, channel: string, type: 'E' | 'R'} where
   *                 'type' identifies whether tuples in the dataset enumerate
   *                 values for the field, or specify a continuous range.
   * @param {object} datum - The tuple to test for inclusion.
   * @param {string} op - The set operation for combining selections.
   *   One of 'intersect' or 'union' (default).
   * @return {boolean} - True if the datum is in the selection, false otherwise.
   */
  function vlSelectionTest(name, datum, op) {
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

        b = testPoint(datum, entry);
        miss[unit] = b ? -1 : ++count;

        // if we match and there are no other units return true
        // if we've missed against all tuples in this unit return false
        if (b && unitIdx.size === 1) return true;
        if (!b && count === unitIdx.get(unit).count) return false;
      } else {
        b = testPoint(datum, entry);

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

  function vlSelectionVisitor(name, args, scope, params) {
    if (args[0].type !== Literal) error('First argument to indata must be a string literal.');

    var data = args[0].value,
        op = args.length >= 2 && args[args.length-1].value,
        field$$1 = 'unit',
        indexName = indexPrefix + field$$1;

    if (op === INTERSECT && !params.hasOwnProperty(indexName)) {
      params[indexName] = scope.getData(data).indataRef(scope, field$$1);
    }

    dataVisitor(name, args, scope, params);
  }

  /**
   * Resolves selection for use as a scale domain or reads via the API.
   * @param {string} name - The name of the dataset representing the selection
   * @param {string} [op='union'] - The set operation for combining selections.
   *                 One of 'intersect' or 'union' (default).
   * @returns {object} An object of selected fields and values.
   */
  function vlSelectionResolve(name, op) {
    var data = this.context.data[name],
      entries = data ? data.values.value : [],
      resolved = {}, types = {},
      entry, fields, values, unit, field$$1, res, resUnit, type, union,
      n = entries.length, i = 0, j, m;

    // First union all entries within the same unit.
    for (; i < n; ++i) {
      entry = entries[i];
      unit = entry.unit;
      fields = entry.fields;
      values = entry.values;

      for (j = 0, m = fields.length; j < m; ++j) {
        field$$1 = fields[j];
        res = resolved[field$$1.field] || (resolved[field$$1.field] = {});
        resUnit = res[unit] || (res[unit] = []);
        types[field$$1.field] = type = field$$1.type.charAt(0);
        union = ops[type + '_union'];
        res[unit] = union(resUnit, array(values[j]));
      }
    }

    // Then resolve fields across units as per the op.
    op = op || UNION;
    Object.keys(resolved).forEach(function (field$$1) {
      resolved[field$$1] = Object.keys(resolved[field$$1])
        .map(function (unit) { return resolved[field$$1][unit]; })
        .reduce(function (acc, curr) {
          return acc === undefined ? curr :
            ops[types[field$$1] + '_' + op](acc, curr);
        });
    });

    return resolved;
  }

  var ops = {
    'E_union': function (base, value) {
      if (!base.length) return value;

      var i = 0, n = value.length;
      for (; i<n; ++i) if (base.indexOf(value[i]) < 0) base.push(value[i]);
      return base;
    },

    'E_intersect': function (base, value) {
      return !base.length ? value :
        base.filter(function (v) { return value.indexOf(v) >= 0; });
    },

    'R_union': function (base, value) {
      var lo = toNumber(value[0]), hi = toNumber(value[1]);
      if (lo > hi) {
        lo = value[1];
        hi = value[0];
      }

      if (!base.length) return [lo, hi];
      if (base[0] > lo) base[0] = lo;
      if (base[1] < hi) base[1] = hi;
      return base;
    },

    'R_intersect': function (base, value) {
      var lo = toNumber(value[0]), hi = toNumber(value[1]);
      if (lo > hi) {
        lo = value[1];
        hi = value[0];
      }

      if (!base.length) return [lo, hi];
      if (hi < base[0] || base[1] < lo) {
        return [];
      } else {
        if (base[0] < lo) base[0] = lo;
        if (base[1] > hi) base[1] = hi;
      }
      return base;
    }
  };

  var BIN = 'bin_',
      INTERSECT$1 = 'intersect',
      UNION$1 = 'union',
      UNIT_INDEX$1 = 'index:unit';

  function testPoint$1(datum, entry) {
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
        getter, extent, value;

    for (; i<n; ++i) {
      extent = ivals[i].extent;
      getter = ivals[i].getter || (ivals[i].getter = field(ivals[i].field));
      value = getter(datum);
      if (!extent || extent[0] === extent[1]) return false;
      if (isDate(value)) value = toNumber(value);
      if (isDate(extent[0])) extent = ivals[i].extent = extent.map(toNumber);
      if (isNumber(extent[0]) && !inrange(value, extent)) return false;
      else if (isString(extent[0]) && extent.indexOf(value) < 0) return false;
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
        unitIdx = data ? data[UNIT_INDEX$1] && data[UNIT_INDEX$1].value : undefined,
        intersect = op === INTERSECT$1,
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
    return vlSelection.call(this, name, datum, op, testPoint$1);
  }

  // Assumes interval selection typles are of the form:
  // {unit: string, intervals: array<{encoding: string, field:string, extent:array<number>}>}
  function vlInterval(name, datum, op) {
    return vlSelection.call(this, name, datum, op, testInterval);
  }

  function vlMultiVisitor(name, args, scope, params) {
    if (args[0].type !== Literal) error('First argument to indata must be a string literal.');

    var data = args[0].value,
        // vlMulti, vlMultiDomain have different # of params, but op is always last.
        op = args.length >= 2 && args[args.length-1].value,
        field$$1 = 'unit',
        indexName = indexPrefix + field$$1;

    if (op === INTERSECT$1 && !params.hasOwnProperty(indexName)) {
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
        unitIdx = data ? data[UNIT_INDEX$1] && data[UNIT_INDEX$1].value : undefined,
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
      op = UNION$1;
    }

    if (unitIdx && op === INTERSECT$1) {
      units = entries.reduce(function(acc, entry) {
        var u = acc[entry.unit] || (acc[entry.unit] = []);
        u.push({unit: entry.unit, value: entry.values[index]});
        return acc;
      }, {});

      values = Object.keys(units).map(function(unit) {
        return {
          unit: unit,
          value: continuous
            ? continuousDomain(units[unit], UNION$1)
            : discreteDomain(units[unit], UNION$1)
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
      var extent = entry.intervals[index].extent,
          value = discrete
             ? extent.map(function (d) { return {unit: entry.unit, value: d}; })
             : {unit: entry.unit, value: extent};

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
      if (op === INTERSECT$1 && v.count !== count) continue;
      domain.push(v.value);
    }

    return domain.length ? domain : undefined;
  }

  function continuousDomain(entries, op) {
    var merge$$1 = op === INTERSECT$1 ? intersectInterval : unionInterval,
        i = 0, n = entries.length,
        extent, domain, lo, hi;

    for (; i<n; ++i) {
      extent = entries[i].value;
      if (isDate(extent[0])) extent = extent.map(toNumber);
      lo = extent[0];
      hi = extent[1];
      if (lo > hi) {
        hi = extent[0];
        lo = extent[1];
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
    utcFormat: utcFormat,
    utcParse: utcParse,
    timeFormat: timeFormat,
    timeParse: timeParse,
    monthFormat: monthFormat,
    monthAbbrevFormat: monthAbbrevFormat,
    dayFormat: dayFormat,
    dayAbbrevFormat: dayAbbrevFormat,
    quarter: quarter,
    utcquarter: utcquarter,
    warn: warn,
    info: info,
    debug: debug,
    extent: extent$1,
    inScope: inScope,
    clampRange: clampRange,
    pinchDistance: pinchDistance,
    pinchAngle: pinchAngle,
    screen: screen,
    containerSize: containerSize,
    windowSize: windowSize,
    span: span,
    merge: merge$3,
    flush: flush,
    bandspace: bandspace,
    inrange: inrange,
    setdata: setdata,
    pathShape: pathShape,
    panLinear: panLinear,
    panLog: panLog,
    panPow: panPow,
    zoomLinear: zoomLinear,
    zoomLog: zoomLog,
    zoomPow: zoomPow,
    encode: encode$1,
    modify: modify
  };

  var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'], // event functions
      eventPrefix = 'event.vega.', // event function prefix
      thisPrefix = 'this.', // function context prefix
      astVisitors = {}; // AST visitors for dependency analysis

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
  expressionFunction('range', range$1, scaleVisitor);
  expressionFunction('invert', invert, scaleVisitor);
  expressionFunction('scale', scale$2, scaleVisitor);
  expressionFunction('gradient', scaleGradient, scaleVisitor);
  expressionFunction('geoArea', geoArea, scaleVisitor);
  expressionFunction('geoBounds', geoBounds, scaleVisitor);
  expressionFunction('geoCentroid', geoCentroid, scaleVisitor);
  expressionFunction('geoShape', geoShape, scaleVisitor);
  expressionFunction('indata', indata, indataVisitor);
  expressionFunction('data', data$1, dataVisitor);
  expressionFunction('treePath', treePath, dataVisitor);
  expressionFunction('treeAncestors', treeAncestors, dataVisitor);

  // Vega-Lite selection functions.
  expressionFunction('vlSelectionTest', vlSelectionTest, vlSelectionVisitor);
  expressionFunction('vlSelectionResolve', vlSelectionResolve, vlSelectionVisitor);

  // Deprecated selection functions kept around to avoid a major version bump.
  expressionFunction('vlSingle', vlPoint, dataVisitor);
  expressionFunction('vlSingleDomain', vlPointDomain, dataVisitor);
  expressionFunction('vlMulti', vlPoint, vlMultiVisitor);
  expressionFunction('vlMultiDomain', vlPointDomain, vlMultiVisitor);
  expressionFunction('vlInterval', vlInterval, dataVisitor);
  expressionFunction('vlIntervalDomain', vlIntervalDomain, dataVisitor);

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

  function expression(expr, scope, preamble) {
    var params = {}, ast, gen;

    // parse the expression to an abstract syntax tree (ast)
    try {
      expr = isString(expr) ? expr : ($$2(expr) + '');
      ast = parse$2(expr);
    } catch (err) {
      error('Expression parse error: ' + expr);
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
  }

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

  function fieldRef(field$$1, name) {
    return name ? {$field: field$$1, $name: name} : {$field: field$$1};
  }

  var keyFieldRef = fieldRef('key');

  function compareRef(fields, orders) {
    return {$compare: fields, $order: orders};
  }

  function keyRef(fields, flat) {
    var ref = {$key: fields};
    if (flat) ref.$flat = true;
    return ref;
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

  var Scope = 'scope';

  var View = 'view';

  function isSignal(_$$1) {
    return _$$1 && _$$1.signal;
  }

  function hasSignal(_$$1) {
    if (isSignal(_$$1)) return true;
    if (isObject(_$$1)) for (var key$$1 in _$$1) {
      if (hasSignal(_$$1[key$$1])) return true;
    }
    return false;
  }

  function value(specValue, defaultValue) {
    return specValue != null ? specValue : defaultValue;
  }

  function deref(v) {
    return v && v.signal || v;
  }

  var Timer = 'timer';

  function parseStream(stream, scope) {
    var method = stream.merge ? mergeStream
      : stream.stream ? nestedStream
      : stream.type ? eventStream
      : error('Invalid stream specification: ' + $$2(stream));

    return method(stream, scope);
  }

  function eventSource(source) {
     return source === Scope ? View : (source || View);
  }

  function mergeStream(stream, scope) {
    var list = stream.merge.map(function(s) {
      return parseStream(s, scope);
    });

    var entry$$1 = streamParameters({merge: list}, stream, scope);
    return scope.addStream(entry$$1).id;
  }

  function nestedStream(stream, scope) {
    var id$$1 = parseStream(stream.stream, scope),
        entry$$1 = streamParameters({stream: id$$1}, stream, scope);
    return scope.addStream(entry$$1).id;
  }

  function eventStream(stream, scope) {
    var id$$1, entry$$1;

    if (stream.type === Timer) {
      id$$1 = scope.event(Timer, stream.throttle);
      stream = {between: stream.between, filter: stream.filter};
    } else {
      id$$1 = scope.event(eventSource(stream.source), stream.type);
    }

    entry$$1 = streamParameters({stream: id$$1}, stream, scope);
    return Object.keys(entry$$1).length === 1
      ? id$$1
      : scope.addStream(entry$$1).id;
  }

  function streamParameters(entry$$1, stream, scope) {
    var param = stream.between;

    if (param) {
      if (param.length !== 2) {
        error('Stream "between" parameter must have 2 entries: ' + $$2(stream));
      }
      entry$$1.between = [
        parseStream(param[0], scope),
        parseStream(param[1], scope)
      ];
    }

    param = stream.filter ? array(stream.filter) : [];
    if (stream.marktype || stream.markname || stream.markrole) {
      // add filter for mark type, name and/or role
      param.push(filterMark(stream.marktype, stream.markname, stream.markrole));
    }
    if (stream.source === Scope) {
      // add filter to limit events from sub-scope only
      param.push('inScope(event.item)');
    }
    if (param.length) {
      entry$$1.filter = expression('(' + param.join(')&&(') + ')').$expr;
    }

    if ((param = stream.throttle) != null) {
      entry$$1.throttle = +param;
    }

    if ((param = stream.debounce) != null) {
      entry$$1.debounce = +param;
    }

    if (stream.consume) {
      entry$$1.consume = true;
    }

    return entry$$1;
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
  function selector(selector, source, marks) {
    DEFAULT_SOURCE = source || VIEW$1;
    MARKS = marks || DEFAULT_MARKS;
    return parseMerge(selector.trim()).map(parseSelector);
  }

  var VIEW$1    = 'view',
      LBRACK  = '[',
      RBRACK  = ']',
      LBRACE  = '{',
      RBRACE  = '}',
      COLON   = ':',
      COMMA   = ',',
      NAME    = '@',
      GT      = '>',
      ILLEGAL$1 = /[[\]{}]/,
      DEFAULT_SOURCE,
      MARKS,
      DEFAULT_MARKS = {
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
      : parseStream$1(s);
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

  function parseStream$1(s) {
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

  function parseUpdate(spec, scope, target) {
    var events = spec.events,
        update = spec.update,
        encode = spec.encode,
        sources = [],
        value$$1 = '', entry$$1;

    if (!events) {
      error('Signal update missing events specification.');
    }

    // interpret as an event selector string
    if (isString(events)) {
      events = selector(events, scope.isSubscope() ? Scope : View);
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
      if (update) error('Signal encode and update are mutually exclusive.');
      update = 'encode(item(),' + $$2(encode) + ')';
    }

    // resolve update value
    value$$1 = isString(update) ? expression(update, scope, preamble)
      : update.expr != null ? expression(update.expr, scope, preamble)
      : update.value != null ? update.value
      : update.signal != null ? {
          $expr:   '_.value',
          $params: {value: scope.signalRef(update.signal)}
        }
      : error('Invalid signal update specification.');

    entry$$1 = {
      target: target,
      update: value$$1
    };

    if (spec.force) {
      entry$$1.options = {force: true};
    }

    sources.forEach(function(source) {
      scope.addUpdate(extend(streamSource(source, scope), entry$$1));
    });
  }

  function streamSource(stream, scope) {
    return {
      source: stream.signal ? scope.signalRef(stream.signal)
            : stream.scale ? scope.scaleRef(stream.scale)
            : parseStream(stream, scope)
    };
  }

  function parseSignalUpdates(signal, scope) {
    var op = scope.getSignal(signal.name),
        expr = signal.update;

    if (signal.init) {
      if (expr) {
        error('Signals can not include both init and update expressions.');
      } else {
        expr = signal.init;
        op.initonly = true;
      }
    }

    if (expr) {
      expr = expression(expr, scope);
      op.update = expr.$expr;
      op.params = expr.$params;
    }

    if (signal.on) {
      signal.on.forEach(function(_$$1) {
        parseUpdate(_$$1, scope, op.id);
      });
    }
  }

  function transform$2(name) {
    return function(params, value$$1, parent) {
      return entry(name, value$$1, params || undefined, parent);
    };
  }

  var Aggregate$1 = transform$2('aggregate');
  var AxisTicks$1 = transform$2('axisticks');
  var Bound$1 = transform$2('bound');
  var Collect$1 = transform$2('collect');
  var Compare$1 = transform$2('compare');
  var DataJoin$1 = transform$2('datajoin');
  var Encode$1 = transform$2('encode');
  var Expression$1 = transform$2('expression');
  var Facet$1 = transform$2('facet');
  var Field$1 = transform$2('field');
  var Key$1 = transform$2('key');
  var LegendEntries$1 = transform$2('legendentries');
  var Load$1 = transform$2('load');
  var Mark$1 = transform$2('mark');
  var MultiExtent$1 = transform$2('multiextent');
  var MultiValues$1 = transform$2('multivalues');
  var Overlap$1 = transform$2('overlap');
  var Params$2 = transform$2('params');
  var PreFacet$1 = transform$2('prefacet');
  var Projection$1 = transform$2('projection');
  var Proxy$1 = transform$2('proxy');
  var Relay$1 = transform$2('relay');
  var Render$1 = transform$2('render');
  var Scale$1 = transform$2('scale');
  var Sieve$1 = transform$2('sieve');
  var SortItems$1 = transform$2('sortitems');
  var ViewLayout$1 = transform$2('viewlayout');
  var Values$1 = transform$2('values');

  var FIELD_REF_ID = 0;

  var types = [
    'identity',
    'ordinal', 'band', 'point',
    'bin-linear', 'bin-ordinal',
    'quantize', 'quantile', 'threshold',
    'linear', 'pow', 'sqrt', 'log', 'sequential',
    'time', 'utc'
  ];

  var allTypes = toSet(types),
      discreteTypes = toSet(types.slice(4, 9)),
      continuousTypes = toSet(types.slice(9)),
      ordinalTypes = toSet(types.slice(1, 6));

  function isOrdinal(type) {
    return ordinalTypes.hasOwnProperty(type);
  }

  function isDiscretizing(type) {
    return discreteTypes.hasOwnProperty(type);
  }

  function isContinuous(type) {
    return continuousTypes.hasOwnProperty(type);
  }

  function isQuantile(type) {
    return type === 'quantile';
  }

  function initScale(spec, scope) {
    var type = spec.type || 'linear';

    if (!allTypes.hasOwnProperty(type)) {
      error('Unrecognized scale type: ' + $$2(type));
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
      : error('Unsupported object: ' + $$2(v));
  }

  function parseArray(v, scope) {
    return v.signal
      ? scope.signalRef(v.signal)
      : v.map(function(v) { return parseLiteral(v, scope); });
  }

  function dataLookupError(name) {
    error('Can not find data set: ' + $$2(name));
  }

  // -- SCALE DOMAIN ----

  function parseScaleDomain(domain, spec, scope) {
    if (!domain) {
      if (spec.domainMin != null || spec.domainMax != null) {
        error('No scale domain defined for domainMin/domainMax to override.');
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
            : (isArray(d) || d.signal) ? fieldRef$1(d, scope)
            : d;
          dom.push(d);
          return dom;
        }, []);

    return (isOrdinal(spec.type) ? ordinalMultipleDomain
      : isQuantile(spec.type) ? quantileMultipleDomain
      : numericMultipleDomain)(domain, scope, fields);
  }

  function fieldRef$1(data, scope) {
    var name = '_:vega:_' + (FIELD_REF_ID++),
        coll = Collect$1({});

    if (isArray(data)) {
      coll.value = {$ingest: data};
    } else if (data.signal) {
      var code = 'setdata(' + $$2(name) + ',' + data.signal + ')';
      coll.params.input = scope.signalRef(code);
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
        error('No field provided for sort aggregate op: ' + sort.op);
      } else if (multidomain && sort.field) {
        error('Multiple domain scales can not sort by field.');
      } else if (multidomain && sort.op && sort.op !== 'count') {
        error('Multiple domain scales support op count only.');
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

  function parseScaleInterpolate(interpolate, params) {
    params.interpolate = parseLiteral(interpolate.type || interpolate);
    if (interpolate.gamma != null) {
      params.interpolateGamma = parseLiteral(interpolate.gamma);
    }
  }

  // -- SCALE RANGE -----

  function parseScaleRange(spec, scope, params) {
    var range = spec.range,
        config = scope.config.range;

    if (range.signal) {
      return scope.signalRef(range.signal);
    } else if (isString(range)) {
      if (config && config.hasOwnProperty(range)) {
        spec = extend({}, spec, {range: config[range]});
        return parseScaleRange(spec, scope, params);
      } else if (range === 'width') {
        range = [0, {signal: 'width'}];
      } else if (range === 'height') {
        range = isOrdinal(spec.type)
          ? [0, {signal: 'height'}]
          : [{signal: 'height'}, 0];
      } else {
        error('Unrecognized scale range value: ' + $$2(range));
      }
    } else if (range.scheme) {
      params.scheme = parseLiteral(range.scheme, scope);
      if (range.extent) params.schemeExtent = parseArray(range.extent, scope);
      if (range.count) params.schemeCount = parseLiteral(range.count, scope);
      return;
    } else if (range.step) {
      params.rangeStep = parseLiteral(range.step, scope);
      return;
    } else if (isOrdinal(spec.type) && !isArray(range)) {
      return parseScaleDomain(range, spec, scope);
    } else if (!isArray(range)) {
      error('Unsupported range type: ' + $$2(range));
    }

    return range.map(function(v) {
      return parseLiteral(v, scope);
    });
  }

  function parseProjection(proj, scope) {
    var params = {};

    for (var name in proj) {
      if (name === 'name') continue;
      params[name] = parseParameter(proj[name], name, scope);
    }

    scope.addProjection(proj.name, params);
  }

  function parseParameter(_$$1, name, scope) {
    return isArray(_$$1) ? _$$1.map(function(_$$1) { return parseParameter(_$$1, name, scope); })
      : !isObject(_$$1) ? _$$1
      : _$$1.signal ? scope.signalRef(_$$1.signal)
      : name === 'fit' ? _$$1
      : error('Unsupported parameter object: ' + $$2(_$$1));
  }

  var Top$1 = 'top';
  var Left$1 = 'left';
  var Right$1 = 'right';
  var Bottom$1 = 'bottom';
  var Center$1 = 'center';

  var Vertical = 'vertical';

  var Start$1 = 'start';
  var End$1 = 'end';

  var Index  = 'index';
  var Label  = 'label';
  var Offset = 'offset';
  var Perc   = 'perc';
  var Perc2  = 'perc2';
  var Size   = 'size';
  var Value  = 'value';

  var GuideLabelStyle = 'guide-label';
  var GuideTitleStyle = 'guide-title';
  var GroupTitleStyle = 'group-title';

  var Symbols$2 = 'symbol';
  var Gradient$2 = 'gradient';
  var Discrete$1 = 'discrete';

  // Encoding channels supported by legends
  // In priority order of 'canonical' scale
  var LegendScales = [
    'size',
    'shape',
    'fill',
    'stroke',
    'strokeDash',
    'opacity'
  ];

  var Skip = {
    name: 1,
    interactive: 1
  };

  var Skip$1 = toSet(['rule']),
      Swap = toSet(['group', 'image', 'rect']);

  function adjustSpatial(encode, marktype) {
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
  }

  function color$1(enc, scope, params, fields) {
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
  }

  function expression$1(code, scope, params, fields) {
    var expr = expression(code, scope);
    expr.$fields.forEach(function(name) { fields[name] = 1; });
    extend(params, expr.$params);
    return expr.$expr;
  }

  function field$1(ref, scope, params, fields) {
    return resolve$1(isObject(ref) ? ref : {datum: ref}, scope, params, fields);
  }

  function resolve$1(ref, scope, params, fields) {
    var object, level, field$$1;

    if (ref.signal) {
      object = 'datum';
      field$$1 = expression$1(ref.signal, scope, params, fields);
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
      error('Invalid field reference: ' + $$2(ref));
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

  function scale$3(enc, value, scope, params, fields) {
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
  }

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
          ? '(' + expression$1(name.signal, scope, params, fields) + ')'
          : field$1(name, scope, params, fields));
    }

    return '_[' + scaleName + ']';
  }

  function gradient$1(enc, scope, params, fields) {
    return 'this.gradient('
      + getScale$1(enc.gradient, scope, params, fields)
      + ',' + $$2(enc.start)
      + ',' + $$2(enc.stop)
      + ',' + $$2(enc.count)
      + ')';
  }

  function property(property, scope, params, fields) {
    return isObject(property)
        ? '(' + entry$1(null, property, scope, params, fields) + ')'
        : property;
  }

  function entry$1(channel, enc, scope, params, fields) {
    if (enc.gradient != null) {
      return gradient$1(enc, scope, params, fields);
    }

    var value = enc.signal ? expression$1(enc.signal, scope, params, fields)
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
  }

  function set$2(obj, key$$1, value) {
    return obj + '[' + $$2(key$$1) + ']=' + value + ';';
  }

  function rule$1(channel, rules, scope, params, fields) {
    var code = '';

    rules.forEach(function(rule) {
      var value = entry$1(channel, rule, scope, params, fields);
      code += rule.test
        ? expression$1(rule.test, scope, params, fields) + '?' + value + ':'
        : value;
    });

    // if no else clause, terminate with null (vega/vega#1366)
    if (peek(code) === ':') {
      code += 'null';
    }

    return set$2('o', channel, code);
  }

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

  var AxisRole$1 = 'axis';
  var AxisDomainRole = 'axis-domain';
  var AxisGridRole = 'axis-grid';
  var AxisLabelRole = 'axis-label';
  var AxisTickRole = 'axis-tick';
  var AxisTitleRole = 'axis-title';

  var LegendRole$1 = 'legend';
  var LegendBandRole = 'legend-band';
  var LegendEntryRole = 'legend-entry';
  var LegendGradientRole = 'legend-gradient';
  var LegendLabelRole = 'legend-label';
  var LegendSymbolRole = 'legend-symbol';
  var LegendTitleRole = 'legend-title';

  var TitleRole$1 = 'title';

  function encoder(_$$1) {
    return isObject(_$$1) ? extend({}, _$$1) : {value: _$$1};
  }

  function addEncode(object, name, value, set) {
    if (value != null) {
      if (isObject(value) && !isArray(value)) {
        object.update[name] = value;
      } else {
        object[set || 'enter'][name] = {value: value};
      }
      // object[name] = isObject(value) && !isArray(value) ? value : {value: value};
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

      if (!skip) enter[key$$1] = defaultEncode(props[key$$1]);
    }

    // resolve styles, apply with increasing precedence
    array(style).forEach(function(name) {
      var props = config.style && config.style[name];
      for (var key$$1 in props) {
        if (!has(key$$1, encode)) {
          enter[key$$1] = defaultEncode(props[key$$1]);
        }
      }
    });

    encode = extend({}, encode); // defensive copy
    encode.enter = extend(enter, encode.enter);

    return encode;
  }

  function defaultEncode(value) {
    return value && value.signal
      ? {signal: value.signal}
      : {value: value};
  }

  function has(key$$1, encode) {
    return encode && (
      (encode.enter && encode.enter[key$$1]) ||
      (encode.update && encode.update[key$$1])
    );
  }

  function guideMark(type, role, style, key, dataRef, encode, extras) {
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
  }

  function lookup$4(name, spec, config) {
    return value(spec[name], config[name]);
  }

  function isVertical(spec, configVal) {
    return value(spec.direction, configVal) === Vertical;
  }

  function gradientLength(spec, config) {
    return value(
      spec.gradientLength,
      config.gradientLength || config.gradientWidth
    );
  }

  function gradientThickness(spec, config) {
    return value(
      spec.gradientThickness,
      config.gradientThickness || config.gradientHeight
    );
  }

  function entryColumns(spec, config) {
    return value(
      spec.columns,
      value(config.columns, +isVertical(spec, config.symbolDirection))
    );
  }

  function getEncoding(name, encode) {
    var v = encode && (
      (encode.update && encode.update[name]) ||
      (encode.enter && encode.enter[name])
    );
    return v && v.signal ? v : v ? v.value : null;
  }

  function getStyle(name, scope, style) {
    var s = scope.config.style[style];
    return s && s[name];
  }

  var GroupMark = 'group';
  var RectMark = 'rect';
  var RuleMark = 'rule';
  var SymbolMark = 'symbol';
  var TextMark = 'text';

  function legendGradient(spec, scale, config, userEncode) {
    var zero$$1 = {value: 0},
        vertical = isVertical(spec, config.gradientDirection),
        thickness = gradientThickness(spec, config),
        length = gradientLength(spec, config),
        encode, enter, start, stop, width, height;

    if (vertical) {
      start = [0, 1];
      stop = [0, 0];
      width = thickness;
      height = length;
    } else {
      start = [0, 0];
      stop = [1, 0];
      width = length;
      height = thickness;
    }

    encode = {
      enter: enter = {
        opacity: zero$$1,
        x: zero$$1,
        y: zero$$1,
        width: encoder(width),
        height: encoder(height)
      },
      update: extend({}, enter, {
        opacity: {value: 1},
        fill: {gradient: scale, start: start, stop: stop}
      }),
      exit: {
        opacity: zero$$1
      }
    };
    addEncode(encode, 'stroke',      lookup$4('gradientStrokeColor', spec, config));
    addEncode(encode, 'strokeWidth', lookup$4('gradientStrokeWidth', spec, config));
    addEncode(encode, 'opacity',     lookup$4('gradientOpacity', spec, config), 'update');

    return guideMark(RectMark, LegendGradientRole, null, undefined, undefined, encode, userEncode);
  }

  function legendGradientDiscrete(spec, scale, config, userEncode, dataRef) {
    var zero$$1 = {value: 0},
        vertical = isVertical(spec, config.gradientDirection),
        thickness = gradientThickness(spec, config),
        length = gradientLength(spec, config),
        encode, enter, u, v, uu, vv, adjust = '';

    vertical
      ? (u = 'y', uu = 'y2', v = 'x', vv = 'width', adjust = '1-')
      : (u = 'x', uu = 'x2', v = 'y', vv = 'height');

    enter = {
      opacity: zero$$1,
      fill: {scale: scale, field: Value}
    };
    enter[u]  = {signal: adjust + 'datum.' + Perc, mult: length};
    enter[v]  = zero$$1;
    enter[uu] = {signal: adjust + 'datum.' + Perc2, mult: length};
    enter[vv] = encoder(thickness);

    encode = {
      enter: enter,
      update: extend({}, enter, {opacity: {value: 1}}),
      exit: {opacity: zero$$1}
    };
    addEncode(encode, 'stroke',      lookup$4('gradientStrokeColor', spec, config));
    addEncode(encode, 'strokeWidth', lookup$4('gradientStrokeWidth', spec, config));
    addEncode(encode, 'opacity',     lookup$4('gradientOpacity', spec, config), 'update');

    return guideMark(RectMark, LegendBandRole, null, Value, dataRef, encode, userEncode);
  }

  var alignExpr = 'datum.' + Perc + '<=0?"left"'
    + ':datum.' + Perc + '>=1?"right":"center"';

  var baselineExpr = 'datum.' + Perc + '<=0?"bottom"'
    + ':datum.' + Perc + '>=1?"top":"middle"';

  function legendGradientLabels(spec, config, userEncode, dataRef) {
    var zero = {value: 0},
        vertical = isVertical(spec, config.gradientDirection),
        thickness = encoder(gradientThickness(spec, config)),
        length = gradientLength(spec, config),
        overlap = lookup$4('labelOverlap', spec, config),
        encode, enter, update, u, v, adjust = '';

    encode = {
      enter: enter = {
        opacity: zero
      },
      update: update = {
        opacity: {value: 1},
        text: {field: Label}
      },
      exit: {
        opacity: zero
      }
    };
    addEncode(encode, 'fill',        lookup$4('labelColor', spec, config));
    addEncode(encode, 'font',        lookup$4('labelFont', spec, config));
    addEncode(encode, 'fontSize',    lookup$4('labelFontSize', spec, config));
    addEncode(encode, 'fontWeight',  lookup$4('labelFontWeight', spec, config));
    addEncode(encode, 'fillOpacity', lookup$4('labelOpacity', spec, config));
    addEncode(encode, 'limit',       value(spec.labelLimit, config.gradientLabelLimit));

    if (vertical) {
      enter.align = {value: 'left'};
      enter.baseline = update.baseline = {signal: baselineExpr};
      u = 'y'; v = 'x'; adjust = '1-';
    } else {
      enter.align = update.align = {signal: alignExpr};
      enter.baseline = {value: 'top'};
      u = 'x'; v = 'y';
    }

    enter[u] = update[u] = {signal: adjust + 'datum.' + Perc, mult: length};

    enter[v] = update[v] = thickness;
    thickness.offset = value(spec.labelOffset, config.gradientLabelOffset) || 0;

    spec = guideMark(TextMark, LegendLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);
    if (overlap) spec.overlap = {method: overlap, order:  'datum.' + Index};
    return spec;
  }

  function guideGroup(role, style, name, dataRef, interactive, encode, marks, layout) {
    return {
      type: GroupMark,
      name: name,
      role: role,
      style: style,
      from: dataRef,
      interactive: interactive || false,
      encode: encode,
      marks: marks,
      layout: layout
    };
  }

  var zero$1 = {value: 0};

  // userEncode is top-level, includes entries, symbols, labels
  function legendSymbolGroups(spec, config, userEncode, dataRef, columns) {
    var entries = userEncode.entries,
        interactive = !!(entries && entries.interactive),
        name = entries ? entries.name : undefined,
        height = lookup$4('clipHeight', spec, config),
        symbolOffset = lookup$4('symbolOffset', spec, config),
        valueRef = {data: 'value'},
        encode = {},
        xSignal = columns + '?' + 'datum.' + Offset + ':' + 'datum.' + Size,
        yEncode = height ? encoder(height) : {field: Size},
        index = 'datum.' + Index,
        ncols = 'max(1,' + columns + ')',
        enter, update, labelOffset, symbols, labels, nrows, sort;

    yEncode.mult = 0.5;

    // -- LEGEND SYMBOLS --
    encode = {
      enter:  enter = {
        opacity: zero$1,
        x: {signal: xSignal, mult: 0.5, offset: symbolOffset},
        y: yEncode
      },
      update: update = {
        opacity: {value: 1},
        x: enter.x,
        y: enter.y
      },
      exit: {
        opacity: zero$1
      }
    };

    if (!spec.fill) {
      addEncode(encode, 'fill',   config.symbolBaseFillColor);
      addEncode(encode, 'stroke', config.symbolBaseStrokeColor);
    }
    addEncode(encode, 'shape',       lookup$4('symbolType', spec, config));
    addEncode(encode, 'size',        lookup$4('symbolSize', spec, config));
    addEncode(encode, 'strokeWidth', lookup$4('symbolStrokeWidth', spec, config));
    addEncode(encode, 'fill',        lookup$4('symbolFillColor', spec, config));
    addEncode(encode, 'stroke',      lookup$4('symbolStrokeColor', spec, config));
    addEncode(encode, 'opacity',     lookup$4('symbolOpacity', spec, config), 'update');

    LegendScales.forEach(function(scale) {
      if (spec[scale]) {
        update[scale] = enter[scale] = {scale: spec[scale], field: Value};
      }
    });

    symbols = guideMark(
      SymbolMark, LegendSymbolRole, null,
      Value, valueRef, encode, userEncode.symbols
    );
    if (height) symbols.clip = true;

    // -- LEGEND LABELS --
    labelOffset = encoder(symbolOffset);
    labelOffset.offset = lookup$4('labelOffset', spec, config);

    encode = {
      enter:  enter = {
        opacity: zero$1,
        x: {signal: xSignal, offset: labelOffset},
        y: yEncode
      },
      update: update = {
        opacity: {value: 1},
        text: {field: Label},
        x: enter.x,
        y: enter.y
      },
      exit: {
        opacity: zero$1
      }
    };

    addEncode(encode, 'align',       lookup$4('labelAlign', spec, config));
    addEncode(encode, 'baseline',    lookup$4('labelBaseline', spec, config));
    addEncode(encode, 'fill',        lookup$4('labelColor', spec, config));
    addEncode(encode, 'font',        lookup$4('labelFont', spec, config));
    addEncode(encode, 'fontSize',    lookup$4('labelFontSize', spec, config));
    addEncode(encode, 'fontWeight',  lookup$4('labelFontWeight', spec, config));
    addEncode(encode, 'limit',       lookup$4('labelLimit', spec, config));
    addEncode(encode, 'fillOpacity', lookup$4('labelOpacity', spec, config));

    labels = guideMark(
      TextMark, LegendLabelRole, GuideLabelStyle,
      Value, valueRef, encode, userEncode.labels
    );

    // -- LEGEND ENTRY GROUPS --
    encode = {
      enter: {
        noBound: {value: true}, // ignore width/height in bounds calc
        width: zero$1,
        height: height ? encoder(height) : zero$1,
        opacity: zero$1
      },
      exit: {opacity: zero$1},
      update: update = {
        opacity: {value: 1},
        row: {signal: null},
        column: {signal: null}
      }
    };

    // annotate and sort groups to ensure correct ordering
    if (isVertical(spec, config.symbolDirection)) {
      nrows = 'ceil(item.mark.items.length/' + ncols + ')';
      update.row.signal = index + '%' + nrows;
      update.column.signal = 'floor(' + index + '/' + nrows + ')';
      sort = {field: ['row', index]};
    } else {
      update.row.signal = 'floor(' + index + '/' + ncols + ')';
      update.column.signal = index + '%' + ncols;
      sort = {field: index};
    }
    // handle zero column case (implies infinite columns)
    update.column.signal = columns + '?' + update.column.signal + ':' + index;

    // facet legend entries into sub-groups
    dataRef = {facet: {data: dataRef, name: 'value', groupby: Index}};

    spec = guideGroup(
      ScopeRole$1, null, name, dataRef, interactive,
      extendEncode(encode, entries, Skip), [symbols, labels]
    );
    spec.sort = sort;
    return spec;
  }

  function legendSymbolLayout(spec, config) {
    // layout parameters for legend entries
    return {
      align:   lookup$4('gridAlign', spec, config),
      center:  {row: true, column: false},
      columns: entryColumns(spec, config),
      padding: {
        row:    lookup$4('rowPadding', spec, config),
        column: lookup$4('columnPadding', spec, config)
      }
    };
  }

  function legendTitle(spec, config, userEncode, dataRef) {
    var zero = {value: 0},
        encode, enter;

    encode = {
      enter: enter = {
        opacity: zero,
        x: {field: {group: 'padding'}},
        y: {field: {group: 'padding'}}
      },
      update: {
        opacity: {value: 1},
        text: encoder(spec.title),
        x: enter.x,
        y: enter.y
      },
      exit: {
        opacity: zero
      }
    };
    addEncode(encode, 'align',       lookup$4('titleAlign', spec, config));
    addEncode(encode, 'baseline',    lookup$4('titleBaseline', spec, config));
    addEncode(encode, 'fill',        lookup$4('titleColor', spec, config));
    addEncode(encode, 'font',        lookup$4('titleFont', spec, config));
    addEncode(encode, 'fontSize',    lookup$4('titleFontSize', spec, config));
    addEncode(encode, 'fontWeight',  lookup$4('titleFontWeight', spec, config));
    addEncode(encode, 'limit',       lookup$4('titleLimit', spec, config));
    addEncode(encode, 'fillOpacity', lookup$4('titleOpacity', spec, config));

    return guideMark(TextMark, LegendTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
  }

  function clip$2(clip, scope) {
    var expr;

    if (isObject(clip)) {
      if (clip.signal) {
        expr = clip.signal;
      } else if (clip.path) {
        expr = 'pathShape(' + param(clip.path) + ')';
      } else if (clip.sphere) {
        expr = 'geoShape(' + param(clip.sphere) + ', {type: "Sphere"})';
      }
    }

    return expr
      ? scope.signalRef(expr)
      : !!clip;
  }

  function param(value) {
    return isObject(value) && value.signal
      ? value.signal
      : $$2(value);
  }

  function role(spec) {
    var role = spec.role || '';
    return (!role.indexOf('axis') || !role.indexOf('legend'))
      ? role
      : spec.type === GroupMark ? ScopeRole$1 : (role || MarkRole);
  }

  function definition$1(spec) {
    return {
      marktype:    spec.type,
      name:        spec.name || undefined,
      role:        spec.role || role(spec),
      zindex:      +spec.zindex || undefined
    };
  }

  function interactive(spec, scope) {
    return spec && spec.signal ? scope.signalRef(spec.signal)
      : spec === false ? false
      : true;
  }

  /**
   * Parse a data transform specification.
   */
  function parseTransform(spec, scope) {
    var def = definition(spec.type);
    if (!def) error('Unrecognized transform type: ' + $$2(spec.type));

    var t = entry(def.type.toLowerCase(), null, parseParameters(def, spec, scope));
    if (spec.signal) scope.addSignal(spec.signal, scope.proxy(t));
    t.metadata = def.metadata || {};

    return t;
  }

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
        error('Missing required ' + $$2(spec.type)
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
      return isExpr(type) ? error('Expression references can not be signals.')
           : isField(type) ? scope.fieldRef(value$$1)
           : isCompare(type) ? scope.compareRef(value$$1)
           : scope.signalRef(value$$1.signal);
    } else {
      var expr = def.expr || isField(type);
      return expr && outerExpr(value$$1) ? scope.exprRef(value$$1.expr, value$$1.as)
           : expr && outerField(value$$1) ? fieldRef(value$$1.field, value$$1.as)
           : isExpr(type) ? expression(value$$1, scope)
           : isData(type) ? ref(scope.getData(value$$1).values)
           : isField(type) ? fieldRef(value$$1)
           : isCompare(type) ? scope.compareRef(value$$1)
           : value$$1;
    }
  }

  /**
   * Parse parameter for accessing an index of another data set.
   */
  function parseIndexParameter(def, spec, scope) {
    if (!isString(spec.from)) {
      error('Lookup "from" parameter must be a string literal.');
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
        error('Expected an array of sub-parameters. Instead: ' + $$2(value$$1));
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
    if (!pdef) error('Unsupported parameter: ' + $$2(value$$1));

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

  function parseData(from, group, scope) {
    var facet, key$$1, op, dataRef, parent;

    // if no source data, generate singleton datum
    if (!from) {
      dataRef = ref(scope.add(Collect$1(null, [{}])));
    }

    // if faceted, process facet specification
    else if (facet = from.facet) {
      if (!group) error('Only group marks can be faceted.');

      // use pre-faceted source data, if available
      if (facet.field != null) {
        dataRef = parent = getDataRef(facet, scope);
      } else {
        // generate facet aggregates if no direct data specification
        if (!from.data) {
          op = parseTransform(extend({
            type:    'aggregate',
            groupby: array(facet.groupby)
          }, facet.aggregate), scope);
          op.params.key = scope.keyRef(facet.groupby);
          op.params.pulse = getDataRef(facet, scope);
          dataRef = parent = ref(scope.add(op));
        } else {
          parent = ref(scope.getData(from.data).aggregate);
        }

        key$$1 = scope.keyRef(facet.groupby, true);
      }
    }

    // if not yet defined, get source data reference
    if (!dataRef) {
      dataRef = getDataRef(from, scope);
    }

    return {
      key: key$$1,
      pulse: dataRef,
      parent: parent
    };
  }

  function getDataRef(from, scope) {
    return from.$ref ? from
      : from.data && from.data.$ref ? from.data
      : ref(scope.getData(from.data).output);
  }

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

  var prototype$1l = DataScope.prototype;

  prototype$1l.countsRef = function(scope, field$$1, sort) {
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

  prototype$1l.tuplesRef = function() {
    return ref(this.values);
  };

  prototype$1l.extentRef = function(scope, field$$1) {
    return cache(scope, this, 'extent', 'extent', field$$1, false);
  };

  prototype$1l.domainRef = function(scope, field$$1) {
    return cache(scope, this, 'domain', 'values', field$$1, false);
  };

  prototype$1l.valuesRef = function(scope, field$$1, sort) {
    return cache(scope, this, 'vals', 'values', field$$1, sort || true);
  };

  prototype$1l.lookupRef = function(scope, field$$1) {
    return cache(scope, this, 'lookup', 'tupleindex', field$$1, false);
  };

  prototype$1l.indataRef = function(scope, field$$1) {
    return cache(scope, this, 'indata', 'tupleindex', field$$1, true, true);
  };

  function parseFacet(spec, scope, group) {
    var facet = spec.from.facet,
        name = facet.name,
        data = getDataRef(facet, scope),
        subscope, source, values, op;

    if (!facet.name) {
      error('Facet must have a name: ' + $$2(facet));
    }
    if (!facet.data) {
      error('Facet must reference a data set: ' + $$2(facet));
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
      error('Facet must specify groupby or field: ' + $$2(facet));
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
  }

  function parseSubflow(spec, scope, input) {
    var op = scope.add(PreFacet$1({pulse: input.pulse})),
        subscope = scope.fork();

    subscope.add(Sieve$1());
    subscope.addSignal('parent', null);

    // parse group mark subflow
    op.params.subflow = {
      $subflow: parseSpec(spec, subscope).toRuntime()
    };
  }

  function parseTrigger(spec, scope, name) {
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

    expr = expression(update, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }

  function parseMark(spec, scope) {
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
      key:   input.key || (spec.key ? fieldRef(spec.key) : undefined),
      pulse: input.pulse,
      clean: !group
    }));
    joinRef = ref(op);

    // collect visual items
    op = store = scope.add(Collect$1({pulse: joinRef}));

    // connect visual items to scenegraph
    op = scope.add(Mark$1({
      markdef:     definition$1(spec),
      interactive: interactive(spec.interactive, scope),
      clip:        clip$2(spec.clip, scope),
      context:     {$context: true},
      groups:      scope.lookup(),
      parent:      scope.signals.parent ? scope.signalRef('parent') : null,
      index:       scope.markpath(),
      pulse:       ref(op)
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
          error('Mark transforms should not generate new data.');
        }
        tx.params.pulse = ref(op);
        scope.add(op = tx);
      });
    }

    // if item sort specified, perform post-encoding
    if (spec.sort) {
      op = scope.add(SortItems$1({
        sort:  scope.compareRef(spec.sort, true), // stable sort
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

    // if requested, add overlap removal transform
    if (overlap) {
      boundRef = parseOverlap(overlap, boundRef, scope);
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
          error('Marks only support modify triggers.');
        }
        parseTrigger(on, scope, name);
      });
    }
  }

  function parseOverlap(overlap, source, scope) {
    var method = overlap.method,
        bound = overlap.bound, tol;

    var params = {
      method: isSignal(method) ? scope.signalRef(method.signal) : method,
      pulse:  source
    };

    if (overlap.order) {
      params.sort = scope.compareRef({field: overlap.order});
    }

    if (bound) {
      tol = bound.tolerance;
      params.boundTolerance = isSignal(tol) ? scope.signalRef(tol.signal) : +tol;
      params.boundScale = scope.scaleRef(bound.scale);
      params.boundOrient = bound.orient;
    }

    return ref(scope.add(Overlap$1(params)));
  }

  function parseLegend(spec, scope) {
    var config = scope.config.legend,
        encode = spec.encode || {},
        legendEncode = encode.legend || {},
        name = legendEncode.name || undefined,
        interactive = legendEncode.interactive,
        style = legendEncode.style,
        entryEncode, entryLayout, params, children,
        type, datum, dataRef, entryRef, group;

    // resolve 'canonical' scale name
    var scale = LegendScales.reduce(function(a, b) { return a || spec[b]; }, 0);
    if (!scale) error('Missing valid scale for legend.');

    // resolve legend type (symbol, gradient, or discrete gradient)
    type = legendType(spec, scope.scaleType(scale));

    // single-element data source for legend group
    datum = {
      orient: lookup$4('orient', spec, config),
      title:  spec.title != null,
      type:   type
    };
    dataRef = ref(scope.add(Collect$1(null, [datum])));

    // encoding properties for legend group
    legendEncode = extendEncode(
      buildLegendEncode(spec, config),legendEncode, Skip
    );

    // encoding properties for legend entry sub-group
    entryEncode = {enter: {x: {value: 0}, y: {value: 0}}};

    // data source for legend values
    entryRef = ref(scope.add(LegendEntries$1(params = {
      type:   type,
      scale:  scope.scaleRef(scale),
      count:  scope.objectProperty(spec.tickCount),
      values: scope.objectProperty(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    // continuous gradient legend
    if (type === Gradient$2) {
      children = [
        legendGradient(spec, scale, config, encode.gradient),
        legendGradientLabels(spec, config, encode.labels, entryRef)
      ];
      // adjust default tick count based on the gradient length
      params.count = params.count || scope.signalRef(
        'max(2,2*floor((' + deref(gradientLength(spec, config)) + ')/100))'
      );
    }

    // discrete gradient legend
    else if (type === Discrete$1) {
      children = [
        legendGradientDiscrete(spec, scale, config, encode.gradient, entryRef),
        legendGradientLabels(spec, config, encode.labels, entryRef)
      ];
    }

    // symbol legend
    else {
      // determine legend symbol group layout
      entryLayout = legendSymbolLayout(spec, config);
      children = [
        legendSymbolGroups(spec, config, encode, entryRef, deref(entryLayout.columns))
      ];
      // pass symbol size information to legend entry generator
      params.size = sizeExpression(spec, scope, children[0].marks);
    }

    // generate legend marks
    children = [
      guideGroup(LegendEntryRole, null, null, dataRef, interactive,
                 entryEncode, children, entryLayout)
    ];

    // include legend title if defined
    if (datum.title) {
      children.push(legendTitle(spec, config, encode.title, dataRef));
    }

    // build legend specification
    group = guideGroup(LegendRole$1, style, name, dataRef, interactive, legendEncode, children);
    if (spec.zindex) group.zindex = spec.zindex;

    // parse legend specification
    return parseMark(group, scope);
  }

  function legendType(spec, scaleType) {
    var type = spec.type || Symbols$2;

    if (!spec.type && scaleCount(spec) === 1 && (spec.fill || spec.stroke)) {
      type = isContinuous(scaleType) ? Gradient$2
        : isDiscretizing(scaleType) ? Discrete$1
        : Symbols$2;
    }

    return type !== Gradient$2 ? type
      : isDiscretizing(scaleType) ? Discrete$1
      : Gradient$2;
  }

  function scaleCount(spec) {
    return LegendScales.reduce(function(count, type) {
      return count + (spec[type] ? 1 : 0);
    }, 0);
  }

  function buildLegendEncode(spec, config) {
    var encode = {enter: {}, update: {}};

    addEncode(encode, 'offset',       lookup$4('offset', spec, config));
    addEncode(encode, 'padding',      lookup$4('padding', spec, config));
    addEncode(encode, 'titlePadding', lookup$4('titlePadding', spec, config));
    addEncode(encode, 'fill',         lookup$4('fillColor', spec, config));
    addEncode(encode, 'stroke',       lookup$4('strokeColor', spec, config));
    addEncode(encode, 'strokeWidth',  lookup$4('strokeWidth', spec, config));
    addEncode(encode, 'cornerRadius', lookup$4('cornerRadius', spec, config));
    addEncode(encode, 'strokeDash',   config.strokeDash);

    return encode;
  }

  function sizeExpression(spec, scope, marks) {
    var fontSize, size, strokeWidth, expr;

    strokeWidth = getEncoding('strokeWidth', marks[0].encode);

    size = spec.size ? 'scale("' + spec.size + '",datum)'
      : getEncoding('size', marks[0].encode, scope);

    fontSize = getFontSize(marks[1].encode, scope, GuideLabelStyle);

    expr = 'max('
      + 'ceil(sqrt(' + deref(size) + ')+' + deref(strokeWidth) + '),'
      + deref(fontSize)
      + ')';

    return expression(expr, scope);
  }

  function getFontSize(encode, scope, style) {
    return getEncoding('fontSize', encode) || getStyle('fontSize', scope, style);
  }

  function anchorExpr(startValue, endValue, centerValue) {
    return 'item.anchor==="' + Start$1 + '"?' + startValue
      + ':item.anchor==="' + End$1 + '"?' + endValue
      + ':' + centerValue;
  }

  // title text alignment
  var alignExpr$1 = anchorExpr(
    $$2(Left$1), $$2(Right$1), $$2(Center$1)
  );

  // multiplication factor for anchor positioning
  var multExpr = anchorExpr(
    '+(item.orient==="' + Right$1 + '")',
    '+(item.orient!=="' + Left$1 + '")',
    '0.5'
  );

  function parseTitle(spec, scope) {
    spec = isString(spec) ? {text: spec} : spec;

    var config = scope.config.title,
        encode = extend({}, spec.encode),
        datum, dataRef, title;

    // single-element data source for group title
    datum = {
      orient: lookup$4('orient', spec, config)
    };
    dataRef = ref(scope.add(Collect$1(null, [datum])));

    // build title specification
    encode.name = spec.name;
    encode.interactive = spec.interactive;
    title = buildTitle(spec, config, encode, dataRef);
    if (spec.zindex) title.zindex = spec.zindex;

    // parse title specification
    return parseMark(title, scope);
  }

  function buildTitle(spec, config, userEncode, dataRef) {
    var zero$$1 = {value: 0},
        title = spec.text,
        orient = lookup$4('orient', spec, config),
        anchor = lookup$4('anchor', spec, config),
        sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
        horizontal = (orient === Top$1 || orient === Bottom$1),
        extent = {group: (horizontal ? 'width' : 'height')},
        encode, enter, update, pos, opp;

    // title positioning along orientation axis
    pos = {field: extent, mult: {signal: multExpr}};

    // title baseline position
    opp = sign < 0 ? zero$$1
      : horizontal ? {field: {group: 'height'}}
      : {field: {group: 'width'}};

    encode = {
      enter: enter = {
        opacity: zero$$1
      },
      update: update = {
        opacity: {value: 1},
        text:   encoder(title),
        anchor: encoder(anchor),
        orient: encoder(orient),
        extent: {field: extent},
        align:  {signal: alignExpr$1}
      },
      exit: {
        opacity: zero$$1
      }
    };

    if (horizontal) {
      update.x = pos;
      update.y = opp;
      enter.angle = zero$$1;
      enter.baseline = {value: orient === Top$1 ? Bottom$1 : Top$1};
    } else {
      update.x = opp;
      update.y = pos;
      enter.angle = {value: sign * 90};
      enter.baseline = {value: Bottom$1};
    }

    addEncode(encode, 'align',      lookup$4('align', spec, config), 'update');
    addEncode(encode, 'angle',      lookup$4('angle', spec, config));
    addEncode(encode, 'baseline',   lookup$4('baseline', spec, config));
    addEncode(encode, 'fill',       lookup$4('color', spec, config));
    addEncode(encode, 'font',       lookup$4('font', spec, config));
    addEncode(encode, 'fontSize',   lookup$4('fontSize', spec, config));
    addEncode(encode, 'fontWeight', lookup$4('fontWeight', spec, config));
    addEncode(encode, 'frame',      lookup$4('frame', spec, config));
    addEncode(encode, 'limit',      lookup$4('limit', spec, config));
    addEncode(encode, 'offset',     lookup$4('offset', spec, config) || 0);

    return guideMark(TextMark, TitleRole$1, spec.style || GroupTitleStyle,
                     null, dataRef, encode, userEncode);
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
      output.push(source = collect({
        $ingest: data.values,
        $format: data.format
      }));
    } else if (data.url) {
      // load data from external source
      // if either url or format has signal, use dynamic loader
      // otherwise, request load upon dataflow init
      source = (hasSignal(data.url) || hasSignal(data.format))
        ? {$load: ref(scope.add(load$1(scope, data, source)))}
        : {$request: data.url, $format: data.format};
      output.push(source = collect(source));
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

  function load$1(scope, data) {
    return Load$1({
      url:    scope.property(data.url),
      format: scope.objectProperty(data.format)
    });
  }

  function axisConfig(spec, scope) {
    var config = scope.config,
        orient = spec.orient,
        xy = (orient === Top$1 || orient === Bottom$1) ? config.axisX : config.axisY,
        or = config['axis' + orient[0].toUpperCase() + orient.slice(1)],
        band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

    return (xy || or || band)
      ? extend({}, config.axis, xy, or, band)
      : config.axis;
  }

  function axisDomain(spec, config, userEncode, dataRef) {
    var orient = spec.orient,
        zero = {value: 0},
        encode, enter, update, u, u2, v;

    encode = {
      enter: enter = {
        opacity: zero
      },
      update: update = {
        opacity: {value: 1}
      },
      exit: {
        opacity: zero
      }
    };
    addEncode(encode, 'stroke',        lookup$4('domainColor', spec, config));
    addEncode(encode, 'strokeWidth',   lookup$4('domainWidth', spec, config));
    addEncode(encode, 'strokeOpacity', lookup$4('domainOpacity', spec, config));

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
  }

  function position(spec, pos) {
    return {scale: spec.scale, range: pos};
  }

  function axisGrid(spec, config, userEncode, dataRef) {
    var orient = spec.orient,
        vscale = spec.gridScale,
        sign = (orient === Left$1 || orient === Top$1) ? 1 : -1,
        offset = sign * spec.offset || 0,
        zero = {value: 0},
        encode, enter, exit, update, tickPos, u, v, v2, s;

    encode = {
      enter: enter = {
        opacity: zero
      },
      update: update = {
        opacity: {value: 1}
      },
      exit: exit = {
        opacity: zero
      }
    };
    addEncode(encode, 'stroke',        lookup$4('gridColor', spec, config));
    addEncode(encode, 'strokeDash',    lookup$4('gridDash', spec, config));
    addEncode(encode, 'strokeOpacity', lookup$4('gridOpacity', spec, config));
    addEncode(encode, 'strokeWidth',   lookup$4('gridWidth', spec, config));

    tickPos = {
      scale:  spec.scale,
      field:  Value,
      band:   lookup$4('bandPosition', spec, config),
      round:  lookup$4('tickRound', spec, config),
      extra:  lookup$4('tickExtra', spec, config),
      offset: lookup$4('tickOffset', spec, config)
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
  }

  function axisTicks(spec, config, userEncode, dataRef, size) {
    var orient = spec.orient,
        sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
        zero = {value: 0},
        encode, enter, exit, update, tickSize, tickPos;

    encode = {
      enter: enter = {
        opacity: zero
      },
      update: update = {
        opacity: {value: 1}
      },
      exit: exit = {
        opacity: zero
      }
    };
    addEncode(encode, 'stroke',        lookup$4('tickColor', spec, config));
    addEncode(encode, 'strokeOpacity', lookup$4('tickOpacity', spec, config));
    addEncode(encode, 'strokeWidth',   lookup$4('tickWidth', spec, config));

    tickSize = encoder(size);
    tickSize.mult = sign;

    tickPos = {
      scale:  spec.scale,
      field:  Value,
      band:   lookup$4('bandPosition', spec, config),
      round:  lookup$4('tickRound', spec, config),
      extra:  lookup$4('tickExtra', spec, config),
      offset: lookup$4('tickOffset', spec, config)
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
  }

  function flushExpr(scale, threshold, a, b, c) {
    return {
      signal: 'flush(range("' + scale + '"), '
        + 'scale("' + scale + '", datum.value), '
        + threshold + ',' + a + ',' + b + ',' + c + ')'
    };
  }

  function axisLabels(spec, config, userEncode, dataRef, size) {
    var orient = spec.orient,
        sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
        isXAxis = (orient === Top$1 || orient === Bottom$1),
        scale = spec.scale,
        flush = deref(lookup$4('labelFlush', spec, config)),
        flushOffset = deref(lookup$4('labelFlushOffset', spec, config)),
        flushOn = flush === 0 || !!flush,
        labelAlign = lookup$4('labelAlign', spec, config),
        labelBaseline = lookup$4('labelBaseline', spec, config),
        zero = {value: 0},
        encode, enter, tickSize, tickPos, align, baseline, offset, bound, overlap;

    tickSize = encoder(size);
    tickSize.mult = sign;
    tickSize.offset = encoder(lookup$4('labelPadding', spec, config) || 0);
    tickSize.offset.mult = sign;

    tickPos = {
      scale:  scale,
      field:  Value,
      band:   0.5,
      offset: lookup$4('tickOffset', spec, config)
    };

    if (isXAxis) {
      align = labelAlign || (flushOn
        ? flushExpr(scale, flush, '"left"', '"right"', '"center"')
        : 'center');
      baseline = labelBaseline || (orient === Top$1 ? 'bottom' : 'top');
      offset = !labelAlign;
    } else {

      align = labelAlign || (orient === Right$1 ? 'left' : 'right');
      baseline = labelBaseline || (flushOn
        ? flushExpr(scale, flush, '"top"', '"bottom"', '"middle"')
        : 'middle');
      offset = !labelBaseline;
    }

    offset = offset && flushOn && flushOffset
      ? flushExpr(scale, flush, '-' + flushOffset, flushOffset, 0)
      : null;

    encode = {
      enter: enter = {
        opacity: zero,
        x: isXAxis ? tickPos : tickSize,
        y: isXAxis ? tickSize : tickPos
      },
      update: {
        opacity: {value: 1},
        text: {field: Label},
        x: enter.x,
        y: enter.y
      },
      exit: {
        opacity: zero,
        x: enter.x,
        y: enter.y
      }
    };

    addEncode(encode, isXAxis ? 'dx' : 'dy', offset);
    addEncode(encode, 'align',       align);
    addEncode(encode, 'baseline',    baseline);
    addEncode(encode, 'angle',       lookup$4('labelAngle', spec, config));
    addEncode(encode, 'fill',        lookup$4('labelColor', spec, config));
    addEncode(encode, 'font',        lookup$4('labelFont', spec, config));
    addEncode(encode, 'fontSize',    lookup$4('labelFontSize', spec, config));
    addEncode(encode, 'fontWeight',  lookup$4('labelFontWeight', spec, config));
    addEncode(encode, 'limit',       lookup$4('labelLimit', spec, config));
    addEncode(encode, 'fillOpacity', lookup$4('labelOpacity', spec, config));
    bound   = lookup$4('labelBound', spec, config);
    overlap = lookup$4('labelOverlap', spec, config);

    spec = guideMark(TextMark, AxisLabelRole, GuideLabelStyle, Value, dataRef, encode, userEncode);

    // if overlap method or bound defined, request label overlap removal
    if (overlap || bound) {
      spec.overlap = {
        method: overlap,
        order:  'datum.index',
        bound:  bound ? {scale: scale, orient: orient, tolerance: bound} : null
      };
    }

    return spec;
  }

  function axisTitle(spec, config, userEncode, dataRef) {
    var orient = spec.orient,
        sign = (orient === Left$1 || orient === Top$1) ? -1 : 1,
        horizontal = (orient === Top$1 || orient === Bottom$1),
        zero = {value: 0},
        encode, enter, update, titlePos;

    encode = {
      enter: enter = {
        opacity: zero
      },
      update: update = {
        opacity: {value: 1},
        text: encoder(spec.title)
      },
      exit: {
        opacity: zero
      }
    };

    titlePos = {
      scale: spec.scale,
      range: 0.5
    };

    if (horizontal) {
      update.x = titlePos;
      enter.angle = {value: 0};
      enter.baseline = {value: orient === Top$1 ? 'bottom' : 'top'};
    } else {
      update.y = titlePos;
      enter.angle = {value: sign * 90};
      enter.baseline = {value: 'bottom'};
    }

    addEncode(encode, 'align',       lookup$4('titleAlign', spec, config));
    addEncode(encode, 'angle',       lookup$4('titleAngle', spec, config));
    addEncode(encode, 'baseline',    lookup$4('titleBaseline', spec, config));
    addEncode(encode, 'fill',        lookup$4('titleColor', spec, config));
    addEncode(encode, 'font',        lookup$4('titleFont', spec, config));
    addEncode(encode, 'fontSize',    lookup$4('titleFontSize', spec, config));
    addEncode(encode, 'fontWeight',  lookup$4('titleFontWeight', spec, config));
    addEncode(encode, 'limit',       lookup$4('titleLimit', spec, config));
    addEncode(encode, 'fillOpacity', lookup$4('titleOpacity', spec, config));

    !addEncode(encode, 'x', lookup$4('titleX', spec, config), 'update')
      && horizontal && !has('x', userEncode)
      && (encode.enter.auto = {value: true});

    !addEncode(encode, 'y', lookup$4('titleY', spec, config), 'update')
      && !horizontal && !has('y', userEncode)
      && (encode.enter.auto = {value: true});

    return guideMark(TextMark, AxisTitleRole, GuideTitleStyle, null, dataRef, encode, userEncode);
  }

  function parseAxis(spec, scope) {
    var config = axisConfig(spec, scope),
        encode = spec.encode || {},
        axisEncode = encode.axis || {},
        name = axisEncode.name || undefined,
        interactive = axisEncode.interactive,
        style = axisEncode.style,
        datum, dataRef, ticksRef, size, group, children;

    // single-element data source for axis group
    datum = {
      orient: spec.orient,
      ticks:  !!lookup$4('ticks',  spec, config),
      labels: !!lookup$4('labels', spec, config),
      grid:   !!lookup$4('grid',   spec, config),
      domain: !!lookup$4('domain', spec, config),
      title:  !!value(spec.title, false)
    };
    dataRef = ref(scope.add(Collect$1({}, [datum])));

    // encoding properties for axis group item
    axisEncode = extendEncode({
      update: {
        range:        {signal: 'abs(span(range("' + spec.scale + '")))'},
        offset:       encoder(value(spec.offset, 0)),
        position:     encoder(value(spec.position, 0)),
        titlePadding: encoder(lookup$4('titlePadding', spec, config)),
        minExtent:    encoder(lookup$4('minExtent', spec, config)),
        maxExtent:    encoder(lookup$4('maxExtent', spec, config))
      }
    }, encode.axis, Skip);

    // data source for axis ticks
    ticksRef = ref(scope.add(AxisTicks$1({
      scale:  scope.scaleRef(spec.scale),
      extra:  scope.property(lookup$4('tickExtra', spec, config)),
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
      size = lookup$4('tickSize', spec, config);
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
    group = guideGroup(AxisRole$1, style, name, dataRef, interactive, axisEncode, children);
    if (spec.zindex) group.zindex = spec.zindex;

    // parse axis specification
    return parseMark(group, scope);
  }

  function parseSpec(spec, scope, preprocessed) {
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
  }

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

  function Scope$1(config) {
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

  var prototype$1m = Scope$1.prototype = Subscope.prototype;

  // ----

  prototype$1m.fork = function() {
    return new Subscope(this);
  };

  prototype$1m.isSubscope = function() {
    return this._subid > 0;
  };

  prototype$1m.toRuntime = function() {
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

  prototype$1m.id = function() {
    return (this._subid ? this._subid + ':' : 0) + this._id++;
  };

  prototype$1m.add = function(op) {
    this.operators.push(op);
    op.id = this.id();
    // if pre-registration references exist, resolve them now
    if (op.refs) {
      op.refs.forEach(function(ref$$1) { ref$$1.$ref = op.id; });
      op.refs = null;
    }
    return op;
  };

  prototype$1m.proxy = function(op) {
    var vref = op instanceof Entry ? ref(op) : op;
    return this.add(Proxy$1({value: vref}));
  };

  prototype$1m.addStream = function(stream) {
    this.streams.push(stream);
    stream.id = this.id();
    return stream;
  };

  prototype$1m.addUpdate = function(update) {
    this.updates.push(update);
    return update;
  };

  // Apply metadata
  prototype$1m.finish = function() {
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

  prototype$1m.pushState = function(encode, parent, lookup) {
    this._encode.push(ref(this.add(Sieve$1({pulse: encode}))));
    this._parent.push(parent);
    this._lookup.push(lookup ? ref(this.proxy(lookup)) : null);
    this._markpath.push(-1);
  };

  prototype$1m.popState = function() {
    this._encode.pop();
    this._parent.pop();
    this._lookup.pop();
    this._markpath.pop();
  };

  prototype$1m.parent = function() {
    return peek(this._parent);
  };

  prototype$1m.encode = function() {
    return peek(this._encode);
  };

  prototype$1m.lookup = function() {
    return peek(this._lookup);
  };

  prototype$1m.markpath = function() {
    var p = this._markpath;
    return ++p[p.length-1];
  };

  // ----

  prototype$1m.fieldRef = function(field$$1, name) {
    if (isString(field$$1)) return fieldRef(field$$1, name);
    if (!field$$1.signal) {
      error('Unsupported field reference: ' + $$2(field$$1));
    }

    var s = field$$1.signal,
        f = this.field[s],
        params;

    if (!f) {
      params = {name: this.signalRef(s)};
      if (name) params.as = name;
      this.field[s] = f = ref(this.add(Field$1(params)));
    }
    return f;
  };

  prototype$1m.compareRef = function(cmp, stable) {
    function check(_$$1) {
      if (isSignal(_$$1)) {
        signal = true;
        return scope.signalRef(_$$1.signal);
      } else {
        return _$$1;
      }
    }

    var scope = this,
        signal = false,
        fields = array(cmp.field).map(check),
        orders = array(cmp.order).map(check);

    if (stable) {
      fields.push(tupleidRef);
    }

    return signal
      ? ref(this.add(Compare$1({fields: fields, orders: orders})))
      : compareRef(fields, orders);
  };

  prototype$1m.keyRef = function(fields, flat) {
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
      ? ref(this.add(Key$1({fields: fields, flat: flat})))
      : keyRef(fields, flat);
  };

  prototype$1m.sortRef = function(sort) {
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

  prototype$1m.event = function(source, type) {
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

  prototype$1m.addSignal = function(name, value$$1) {
    if (this.signals.hasOwnProperty(name)) {
      error('Duplicate signal name: ' + $$2(name));
    }
    var op = value$$1 instanceof Entry ? value$$1 : this.add(operator(value$$1));
    return this.signals[name] = op;
  };

  prototype$1m.getSignal = function(name) {
    if (!this.signals[name]) {
      error('Unrecognized signal name: ' + $$2(name));
    }
    return this.signals[name];
  };

  prototype$1m.signalRef = function(s) {
    if (this.signals[s]) {
      return ref(this.signals[s]);
    } else if (!this.lambdas.hasOwnProperty(s)) {
      this.lambdas[s] = this.add(operator(null));
    }
    return ref(this.lambdas[s]);
  };

  prototype$1m.parseLambdas = function() {
    var code = Object.keys(this.lambdas);
    for (var i=0, n=code.length; i<n; ++i) {
      var s = code[i],
          e = expression(s, this),
          op = this.lambdas[s];
      op.params = e.$params;
      op.update = e.$expr;
    }
  };

  prototype$1m.property = function(spec) {
    return spec && spec.signal ? this.signalRef(spec.signal) : spec;
  };

  prototype$1m.objectProperty = function(spec) {
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

  prototype$1m.exprRef = function(code, name) {
    var params = {expr: expression(code, this)};
    if (name) params.expr.$name = name;
    return ref(this.add(Expression$1(params)));
  };

  prototype$1m.addBinding = function(name, bind) {
    if (!this.bindings) {
      error('Nested signals do not support binding: ' + $$2(name));
    }
    this.bindings.push(extend({signal: name}, bind));
  };

  // ----

  prototype$1m.addScaleProj = function(name, transform) {
    if (this.scales.hasOwnProperty(name)) {
      error('Duplicate scale or projection name: ' + $$2(name));
    }
    this.scales[name] = this.add(transform);
  };

  prototype$1m.addScale = function(name, params) {
    this.addScaleProj(name, Scale$1(params));
  };

  prototype$1m.addProjection = function(name, params) {
    this.addScaleProj(name, Projection$1(params));
  };

  prototype$1m.getScale = function(name) {
    if (!this.scales[name]) {
      error('Unrecognized scale name: ' + $$2(name));
    }
    return this.scales[name];
  };

  prototype$1m.projectionRef =
  prototype$1m.scaleRef = function(name) {
    return ref(this.getScale(name));
  };

  prototype$1m.projectionType =
  prototype$1m.scaleType = function(name) {
    return this.getScale(name).params.type;
  };

  // ----

  prototype$1m.addData = function(name, dataScope) {
    if (this.data.hasOwnProperty(name)) {
      error('Duplicate data set name: ' + $$2(name));
    }
    return (this.data[name] = dataScope);
  };

  prototype$1m.getData = function(name) {
    if (!this.data[name]) {
      error('Undefined data set name: ' + $$2(name));
    }
    return this.data[name];
  };

  prototype$1m.addDataPipeline = function(name, entries) {
    if (this.data.hasOwnProperty(name)) {
      error('Duplicate data set name: ' + $$2(name));
    }
    return this.addData(name, DataScope.fromEntries(this, entries));
  };

  function defaults(configs) {
    var output = defaults$1();
    (configs || []).forEach(function(config) {
      var key$$1, value, style;
      if (config) {
        for (key$$1 in config) {
          if (key$$1 === 'style') {
            style = output.style || (output.style = {});
            for (key$$1 in config.style) {
              style[key$$1] = extend(style[key$$1] || {}, config.style[key$$1]);
            }
          } else {
            value = config[key$$1];
            output[key$$1] = isObject(value) && !isArray(value)
              ? extend(isObject(output[key$$1]) ? output[key$$1] : {}, value)
              : value;
          }
        }
      }
    });
    return output;
  }

  var defaultFont = 'sans-serif',
      defaultSymbolSize = 30,
      defaultStrokeWidth = 2,
      defaultColor = '#4c78a8',
      black = "#000",
      gray = '#888',
      lightGray = '#ddd';

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
        titlePadding: 4
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
        gridAlign: 'each',
        columnPadding: 10,
        rowPadding: 2,
        symbolDirection: 'vertical',
        gradientDirection: 'vertical',
        gradientLength: 200,
        gradientThickness: 16,
        gradientStrokeColor: lightGray,
        gradientStrokeWidth: 0,
        gradientLabelOffset: 2,
        labelAlign: 'left',
        labelBaseline: 'middle',
        labelLimit: 160,
        labelOffset: 4,
        labelOverlap: true,
        symbolType: 'circle',
        symbolSize: 100,
        symbolOffset: 0,
        symbolStrokeWidth: 1.5,
        symbolBaseFillColor: 'transparent',
        symbolBaseStrokeColor: gray,
        titleAlign: 'left',
        titleBaseline: 'top',
        titleLimit: 180,
        titlePadding: 5
      },

      // defaults for group title
      title: {
        orient: 'top',
        anchor: 'middle',
        offset: 4
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

  function parse$3(spec, config) {
    if (!isObject(spec)) error('Input Vega specification must be an object.');
    return parseView(spec, new Scope$1(defaults([config, spec.config])))
      .toRuntime();
  }

  /**
   * Parse an expression given the argument signature and body code.
   */
  function expression$2(args, code, ctx) {
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
    return expression$2(['_'], code, ctx);
  }

  /**
   * Parse an expression provided as an operator parameter value.
   */
  function parameterExpression(code, ctx) {
    return expression$2(['datum', '_'], code, ctx);
  }

  /**
   * Parse an expression applied to an event stream.
   */
  function eventExpression(code, ctx) {
    return expression$2(['event'], code, ctx);
  }

  /**
   * Parse an expression used to handle an event-driven operator update.
   */
  function handlerExpression(code, ctx) {
    return expression$2(['_', 'event'], code, ctx);
  }

  /**
   * Parse an expression that performs visual encoding.
   */
  function encodeExpression(code, ctx) {
    return expression$2(['item', '_'], code, ctx);
  }

  /**
   * Parse a set of operator parameters.
   */
  function parseParameters$1(spec, ctx, params) {
    params = params || {};
    var key$$1, value;

    for (key$$1 in spec) {
      value = spec[key$$1];

      params[key$$1] = isArray(value)
        ? value.map(function(v) { return parseParameter$2(v, ctx, params); })
        : parseParameter$2(value, ctx, params);
    }
    return params;
  }

  /**
   * Parse a single parameter.
   */
  function parseParameter$2(spec, ctx, params) {
    if (!spec || !isObject(spec)) return spec;

    for (var i=0, n=PARSERS.length, p; i<n; ++i) {
      p = PARSERS[i];
      if (spec.hasOwnProperty(p.key)) {
        return p.parse(spec, ctx, params);
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
    return ctx.get(_$$1.$ref) || error('Operator not defined: ' + _$$1.$ref);
  }

  /**
   * Resolve an expression reference.
   */
  function getExpression(_$$1, ctx, params) {
    if (_$$1.$params) { // parse expression parameters
      parseParameters$1(_$$1.$params, ctx, params);
    }
    var k = 'e:' + _$$1.$expr + '_' + _$$1.$name;
    return ctx.fn[k]
      || (ctx.fn[k] = accessor(parameterExpression(_$$1.$expr, ctx), _$$1.$fields, _$$1.$name));
  }

  /**
   * Resolve a key accessor reference.
   */
  function getKey(_$$1, ctx) {
    var k = 'k:' + _$$1.$key + '_' + (!!_$$1.$flat);
    return ctx.fn[k] || (ctx.fn[k] = key(_$$1.$key, _$$1.$flat));
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
   * Resolve a context reference.
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
  function parseOperator(spec, ctx) {
    if (isOperator(spec.type) || !spec.type) {
      ctx.operator(spec,
        spec.update ? operatorExpression(spec.update, ctx) : null);
    } else {
      ctx.transform(spec, spec.type);
    }
  }

  /**
   * Parse and assign operator parameters.
   */
  function parseOperatorParameters(spec, ctx) {
    if (spec.params) {
      var op = ctx.get(spec.id);
      if (!op) error('Invalid operator id: ' + spec.id);
      ctx.dataflow.connect(op, op.parameters(
        parseParameters$1(spec.params, ctx),
        spec.react,
        spec.initonly
      ));
    }
  }

  /**
   * Parse an event stream specification.
   */
  function parseStream$2(spec, ctx) {
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
      error('Invalid stream definition: ' + JSON.stringify(spec));
    }

    if (spec.consume) stream.consume(true);

    ctx.stream(spec, stream);
  }

  /**
   * Parse an event-driven operator update.
   */
  function parseUpdate$1(spec, ctx) {
    var srcid = isObject(srcid = spec.source) ? srcid.$ref : srcid,
        source = ctx.get(srcid),
        target = null,
        update = spec.update,
        params = undefined;

    if (!source) error('Source not defined: ' + spec.source);

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
  }

  /**
   * Parse a serialized dataflow specification.
   */
  function parseDataflow(spec, ctx) {
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
      parseStream$2(entry, ctx);
    });

    // parse updates
    (spec.updates || []).forEach(function(entry) {
      parseUpdate$1(entry, ctx);
    });

    return ctx.resolve();
  }

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
  function context$2(df, transforms, functions) {
    return new Context(df, transforms, functions);
  }

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
        } else if (data.$load) {
          ctx.get(data.$load.$ref).target = op;
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
    operator: function(spec, update) {
      this.add(spec, this.dataflow.add(spec.value, update));
    },
    transform: function(spec, type) {
      this.add(spec, this.dataflow.add(this.transforms[canonicalType(type)]));
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

  function runtime(view, spec, functions) {
    var fn = functions || functionContext;
    return parseDataflow(spec, context$2(view, transforms, fn));
  }

  function scale$4(name) {
    var scales = this._runtime.scales;
    if (!scales.hasOwnProperty(name)) {
      error('Unrecognized scale or projection: ' + name);
    }
    return scales[name].value;
  }

  var Width = 'width',
      Height = 'height',
      Padding$1 = 'padding',
      Skip$2 = {skip: true};

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
        w = s[Width],
        h = s[Height],
        p = s[Padding$1];

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
        view.signal(Width, width, Skip$2); // set width, skip update calc
        view._resizeWidth.skip(true); // skip width resize handler
      }

      // height value changed: update signal, skip resize op
      if (view.height() !== height) {
        rerun = 1;
        view.signal(Height, height, Skip$2); // set height, skip update calc
        view._resizeHeight.skip(true); // skip height resize handler
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
    }, false, 1);
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
    return !(name === 'parent' || op instanceof transforms.proxy);
  }

  /**
   * Sets the current view state and updates the view by invoking run.
   * @param {object} state - A state object containing signal and/or
   *   data set values, following the format used by the getState method.
   * @return {View} - This view instance.
   */
  function setState$1(state) {
    var view = this;
    view.runAfter(function() {
      view._trigger = false;
      view._runtime.setState(state);
      view.run().runAfter(function() { view._trigger = true; });
    });
    return this;
  }

  function timer(callback, delay) {
    function tick(elapsed) {
      callback({timestamp: Date.now(), elapsed: elapsed});
    }
    this._timers.push(d3Timer.interval(tick, delay));
  }

  function defaultTooltip$1(handler, event, item, value) {
    var el = handler.element();
    if (el) el.setAttribute('title', formatTooltip(value));
  }

  function formatTooltip(value) {
    return value == null ? ''
      : isArray(value) ? formatArray(value)
      : isObject(value) && !isDate(value) ? formatObject(value)
      : value + '';
  }

  function formatObject(obj) {
    return Object.keys(obj).map(function(key$$1) {
      var v = obj[key$$1];
      return key$$1 + ': ' + (isArray(v) ? formatArray(v) : formatValue$1(v));
    }).join('\n');
  }

  function formatArray(value) {
    return '[' + value.map(formatValue$1).join(', ') + ']';
  }

  function formatValue$1(value) {
    return isArray(value) ? '[\u2026]'
      : isObject(value) && !isDate(value) ? '{\u2026}'
      : value;
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
  function View$1(spec, options) {
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
    view._tooltip = options.tooltip || defaultTooltip$1,
    view._redraw = true;
    view._handler = new CanvasHandler().scene(root);
    view._preventDefault = false;
    view._timers = [];
    view._eventListeners = [];
    view._resizeListeners = [];

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

  var prototype$1n = inherits(View$1, Dataflow);

  // -- DATAFLOW / RENDERING ----

  prototype$1n.run = function(encode) {
    // evaluate dataflow
    Dataflow.prototype.run.call(this, encode);

    if (this._pending) {
      // resize next cycle if loading data sets
      this.resize();
    } else if (this._redraw || this._resize) {
      // render as needed
      try {
        this.render();
      } catch (e) {
        this.error(e);
      }
    }

    return this;
  };

  prototype$1n.render = function() {
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

  prototype$1n.dirty = function(item) {
    this._redraw = true;
    this._renderer && this._renderer.dirty(item);
  };

  // -- GET / SET ----

  prototype$1n.container = function() {
    return this._el;
  };

  prototype$1n.scenegraph = function() {
    return this._scenegraph;
  };

  prototype$1n.origin = function() {
    return this._origin.slice();
  };

  function lookupSignal(view, name) {
    return view._signals.hasOwnProperty(name)
      ? view._signals[name]
      : error('Unrecognized signal name: ' + $$2(name));
  }

  prototype$1n.signal = function(name, value, options) {
    var op = lookupSignal(this, name);
    return arguments.length === 1
      ? op.value
      : this.update(op, value, options);
  };

  prototype$1n.background = function(_$$1) {
    if (arguments.length) {
      this._background = _$$1;
      this._resize = 1;
      return this;
    } else {
      return this._background;
    }
  };

  prototype$1n.width = function(_$$1) {
    return arguments.length ? this.signal('width', _$$1) : this.signal('width');
  };

  prototype$1n.height = function(_$$1) {
    return arguments.length ? this.signal('height', _$$1) : this.signal('height');
  };

  prototype$1n.padding = function(_$$1) {
    return arguments.length ? this.signal('padding', _$$1) : this.signal('padding');
  };

  prototype$1n.autosize = function(_$$1) {
    return arguments.length ? this.signal('autosize', _$$1) : this.signal('autosize');
  };

  prototype$1n.renderer = function(type) {
    if (!arguments.length) return this._renderType;
    if (!renderModule(type)) error('Unrecognized renderer type: ' + type);
    if (type !== this._renderType) {
      this._renderType = type;
      this._resetRenderer();
    }
    return this;
  };

  prototype$1n.tooltip = function(handler) {
    if (!arguments.length) return this._tooltip;
    if (handler !== this._tooltip) {
      this._tooltip = handler;
      this._resetRenderer();
    }
    return this;
  };

  prototype$1n.loader = function(loader) {
    if (!arguments.length) return this._loader;
    if (loader !== this._loader) {
      Dataflow.prototype.loader.call(this, loader);
      this._resetRenderer();
    }
    return this;
  };

  prototype$1n.resize = function() {
    // set flag to perform autosize
    this._autosize = 1;
    // touch autosize signal to ensure top-level ViewLayout runs
    return this.touch(lookupSignal(this, 'autosize'));
  };

  prototype$1n._resetRenderer = function() {
    if (this._renderer) {
      this._renderer = null;
      this.initialize(this._el);
    }
  };

  // -- SIZING ----
  prototype$1n._resizeView = resizeView;

  // -- EVENT HANDLING ----

  prototype$1n.addEventListener = function(type, handler, options) {
    var callback = handler;
    if (!(options && options.trap === false)) {
      // wrap callback in error handler
      callback = trap(this, handler);
      callback.raw = handler;
    }
    this._handler.on(type, callback);
    return this;
  };

  prototype$1n.removeEventListener = function(type, handler) {
    var handlers = this._handler.handlers(type),
        i = handlers.length, h, t;

    // search registered handlers, remove if match found
    while (--i >= 0) {
      t = handlers[i].type;
      h = handlers[i].handler;
      if (type === t && (handler === h || handler === h.raw)) {
        this._handler.off(t, h);
        break;
      }
    }
    return this;
  };

  prototype$1n.addResizeListener = function(handler) {
    var l = this._resizeListeners;
    if (l.indexOf(handler) < 0) {
      // add handler if it isn't already registered
      // note: error trapping handled elsewhere, so
      // no need to wrap handlers here
      l.push(handler);
    }
    return this;
  };

  prototype$1n.removeResizeListener = function(handler) {
    var l = this._resizeListeners,
        i = l.indexOf(handler);
    if (i >= 0) {
      l.splice(i, 1);
    }
    return this;
  };

  function findOperatorHandler(op, handler) {
    var t = op._targets || [],
        h = t.filter(function(op) {
              var u = op._update;
              return u && u.handler === handler;
            });
    return h.length ? h[0] : null;
  }

  function addOperatorListener(view, name, op, handler) {
    var h = findOperatorHandler(op, handler);
    if (!h) {
      h = trap(this, function() { handler(name, op.value); });
      h.handler = handler;
      view.on(op, null, h);
    }
    return view;
  }

  function removeOperatorListener(view, op, handler) {
    var h = findOperatorHandler(op, handler);
    if (h) op._targets.remove(h);
    return view;
  }

  prototype$1n.addSignalListener = function(name, handler) {
    return addOperatorListener(this, name, lookupSignal(this, name), handler);
  };

  prototype$1n.removeSignalListener = function(name, handler) {
    return removeOperatorListener(this, lookupSignal(this, name), handler);
  };

  prototype$1n.addDataListener = function(name, handler) {
    return addOperatorListener(this, name, dataref(this, name).values, handler);
  };

  prototype$1n.removeDataListener = function(name, handler) {
    return removeOperatorListener(this, dataref(this, name).values, handler);
  };

  prototype$1n.preventDefault = function(_$$1) {
    if (arguments.length) {
      this._preventDefault = _$$1;
      return this;
    } else {
      return this._preventDefault;
    }
  };

  prototype$1n.timer = timer;
  prototype$1n.events = events$1;
  prototype$1n.finalize = finalize;
  prototype$1n.hover = hover;

  // -- DATA ----
  prototype$1n.data = data;
  prototype$1n.change = change;
  prototype$1n.insert = insert;
  prototype$1n.remove = remove;

  // -- SCALES --
  prototype$1n.scale = scale$4;

  // -- INITIALIZATION ----
  prototype$1n.initialize = initialize$1;

  // -- HEADLESS RENDERING ----
  prototype$1n.toImageURL = renderToImageURL;
  prototype$1n.toCanvas = renderToCanvas;
  prototype$1n.toSVG = renderToSVG;

  // -- SAVE / RESTORE STATE ----
  prototype$1n.getState = getState$1;
  prototype$1n.setState = setState$1;

  // -- Transforms -----
  extend(transforms, tx, vtx, encode, geo, force, tree, voronoi, wordcloud, xf);

  exports.formatLocale = d3Format.formatDefaultLocale;
  exports.timeFormatLocale = d3TimeFormat.timeFormatDefaultLocale;
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
  exports.transform = transform$1;
  exports.transforms = transforms;
  exports.tupleid = tupleid;
  exports.scale = scale$1;
  exports.scheme = scheme;
  exports.schemeDiscretized = schemeDiscretized;
  exports.interpolate = interpolate;
  exports.interpolateRange = interpolateRange;
  exports.timeInterval = timeInterval;
  exports.utcInterval = utcInterval;
  exports.projection = projection;
  exports.View = View$1;
  exports.parse = parse$3;
  exports.expressionFunction = expressionFunction;
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
  exports.error = error;
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
  exports.format = format;
  exports.formats = formats;
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
  exports.boundClip = boundClip;
  exports.boundContext = context;
  exports.boundStroke = boundStroke;
  exports.boundItem = boundItem;
  exports.boundMark = boundMark;
  exports.pathCurves = curves;
  exports.pathSymbols = symbols;
  exports.pathRectangle = vg_rect;
  exports.pathTrail = vg_trail;
  exports.pathParse = pathParse;
  exports.pathRender = pathRender;
  exports.point = point;
  exports.domCreate = domCreate;
  exports.domFind = domFind;
  exports.domChild = domChild;
  exports.domClear = domClear;
  exports.openTag = openTag;
  exports.closeTag = closeTag;
  exports.font = font;
  exports.fontFamily = fontFamily;
  exports.fontSize = fontSize;
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
