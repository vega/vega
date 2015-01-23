(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['d3', 'topojson'], factory);
  } else if(typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(require('d3'), require('topojson'));
  } else {
    // Browser globals (root is window)
    var tj = (typeof topojson === 'undefined') ? null : topojson;
    root.vg = factory(d3, tj);
  }
}(this, function (d3, topojson) {
    //almond, and your modules will be inlined here
/**
 * @license almond 0.3.0 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("../node_modules/almond/almond", function(){});

define('util/constants',['require','exports','module'],function(require, module, exports) {
  return {
    DATA: "data",
    FIELDS:  "fields",
    SCALES:  "scales",
    SIGNALS: "signals",

    DEPS: [this.DATA, this.FIELDS, this.SCALES, this.SIGNALS],
    
    GROUP: "group",
    
    ENTER: "enter",
    UPDATE: "update",
    EXIT: "exit",

    SENTINEL: {"sentinel": 1},

    ADD: "add",
    REMOVE: "remove",
    TOGGLE: "toggle",
    CLEAR: "clear",

    LINEAR: "linear",
    ORDINAL: "ordinal",
    LOG: "log",
    POWER: "pow",
    TIME: "time",
    QUANTILE: "quantile",

    MARK: "mark",
    AXIS: "axis"
  }
});
define('dataflow/changeset',['require','exports','module','../util/constants'],function(require, exports, module) {
  var C = require('../util/constants');

  function create(cs, touch) {
    var out = {};
    copy(cs, out);

    out.add = [];
    out.mod = [];
    out.rem = [];

    out.touch = touch;

    return out;
  }

  function done(cs) {
    // nothing for now
  }

  function copy(a, b) {
    b.stamp = a ? a.stamp : 0;
    b.sort  = a ? a.sort  : null;
    b.facet = a ? a.facet : null;
    b.trans = a ? a.trans : null;
    C.DEPS.forEach(function(d) { b[d] = a ? a[d] : {} });
  }

  return {
    create:  create,
    done:    done,
    copy:    copy
  };
});
define('util/config',['require','exports','module','d3'],function(require, module, exports) {
  var d3 = require('d3'),
      config = {};

  config.debug = false;

  // are we running in node.js?
  // via timetler.com/2012/10/13/environment-detection-in-javascript/
  // TODO: how does this work with requirejs?
  config.isNode = typeof exports !== 'undefined' && this.exports !== exports;

  // Allows domain restriction when using data loading via XHR.
  // To enable, set it to a list of allowed domains
  // e.g., ['wikipedia.org', 'eff.org']
  config.domainWhiteList = false;

  // If true, disable potentially unsafe transforms (filter, formula)
  // involving possible JavaScript injection attacks.
  config.safeMode = false;

  // base url for loading external data files
  // used only for server-side operation
  config.baseURL = "";

  // version and namepsaces for exported svg
  config.svgNamespace =
    'version="1.1" xmlns="http://www.w3.org/2000/svg" ' +
    'xmlns:xlink="http://www.w3.org/1999/xlink"';

  // inset padding for automatic padding calculation
  config.autopadInset = 5;

  // extensible scale lookup table
  // all d3.scale.* instances also supported
  config.scale = {
    time: d3.time.scale,
    utc:  d3.time.scale.utc
  };

  // default rendering settings
  config.render = {
    lineWidth: 1,
    lineCap:   "butt",
    font:      "sans-serif",
    fontSize:  11
  };

  // default axis properties
  config.axis = {
    orient: "bottom",
    ticks: 10,
    padding: 3,
    axisColor: "#000",
    gridColor: "#d8d8d8",
    tickColor: "#000",
    tickLabelColor: "#000",
    axisWidth: 1,
    tickWidth: 1,
    tickSize: 6,
    tickLabelFontSize: 11,
    tickLabelFont: "sans-serif",
    titleColor: "#000",
    titleFont: "sans-serif",
    titleFontSize: 11,
    titleFontWeight: "bold",
    titleOffset: 35
  };

  // default legend properties
  config.legend = {
    orient: "right",
    offset: 10,
    padding: 3,
    gradientStrokeColor: "#888",
    gradientStrokeWidth: 1,
    gradientHeight: 16,
    gradientWidth: 100,
    labelColor: "#000",
    labelFontSize: 10,
    labelFont: "sans-serif",
    labelAlign: "left",
    labelBaseline: "middle",
    labelOffset: 8,
    symbolShape: "circle",
    symbolSize: 50,
    symbolColor: "#888",
    symbolStrokeWidth: 1,
    titleColor: "#000",
    titleFont: "sans-serif",
    titleFontSize: 11,
    titleFontWeight: "bold"
  };

  // default color values
  config.color = {
    rgb: [128, 128, 128],
    lab: [50, 0, 0],
    hcl: [0, 0, 50],
    hsl: [0, 0, 0.5]
  };

  // default scale ranges
  config.range = {
    category10: [
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
    ],
    category20: [
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
    ],
    shapes: [
      "circle",
      "cross",
      "diamond",
      "square",
      "triangle-down",
      "triangle-up"
    ]
  };

  return config;
});
define('util/index',['require','exports','module','./config'],function(require, module, exports) {
  var config = require('./config'),
      util = {};

  // type checking functions
  var toString = Object.prototype.toString;

  util.isObject = function(obj) {
    return obj === Object(obj);
  };

  util.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  util.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };
    
  util.isArray = Array.isArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  util.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  util.isBoolean = function(obj) {
    return toString.call(obj) == '[object Boolean]';
  };

  util.isTree = function(obj) {
    return obj && obj.__vgtree__;
  };

  util.tree = function(obj, children) {
    var d = [obj];
    d.__vgtree__ = true;
    d.children = children || "children";
    return d;
  };

  util.number = function(s) { return +s; };

  util.boolean = function(s) { return !!s; };

  // utility functions

  util.identity = function(x) { return x; };

  util.true = function() { return true; };

  util.extend = function(obj) {
    for (var x, name, i=1, len=arguments.length; i<len; ++i) {
      x = arguments[i];
      for (name in x) { obj[name] = x[name]; }
    }
    return obj;
  };

  util.duplicate = function(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  util.field = function(f) {
    return f.split("\\.")
      .map(function(d) { return d.split("."); })
      .reduce(function(a, b) {
        if (a.length) { a[a.length-1] += "." + b.shift(); }
        a.push.apply(a, b);
        return a;
      }, []);
  };

  util.accessor = function(f) {
    var s;
    return (util.isFunction(f) || f==null)
      ? f : util.isString(f) && (s=util.field(f)).length > 1
      ? function(x) { return s.reduce(function(x,f) { return x[f]; }, x); }
      : function(x) { return x[f]; };
  };

  util.comparator = function(sort) {
    var sign = [];
    if (sort === undefined) sort = [];
    sort = util.array(sort).map(function(f) {
      var s = 1;
      if      (f[0] === "-") { s = -1; f = f.slice(1); }
      else if (f[0] === "+") { s = +1; f = f.slice(1); }
      sign.push(s);
      return util.accessor(f);
    });
    return function(a,b) {
      var i, n, f, x, y;
      for (i=0, n=sort.length; i<n; ++i) {
        f = sort[i]; x = f(a); y = f(b);
        if (x < y) return -1 * sign[i];
        if (x > y) return sign[i];
      }
      return 0;
    };
  };

  util.cmp = function(a, b) { return a<b ? -1 : a>b ? 1 : 0; };

  util.numcmp = function(a, b) { return a - b; };

  util.array = function(x) {
    return x != null ? (util.isArray(x) ? x : [x]) : [];
  };

  util.values = function(x) {
    return (util.isObject(x) && !util.isArray(x) && x.values) ? 
      (util.isFunction(x.values) ? x.values() : x.values) : x;
  };

  util.tuple_ids = function(a) {
    return a.reduce(function(m,x) {
      return (m[x._id] = 1, m);
    }, {});
  };

  util.str = function(x) {
    return util.isArray(x) ? "[" + x.map(util.str) + "]"
      : util.isObject(x) ? JSON.stringify(x)
      : util.isString(x) ? ("'"+vg_escape_str(x)+"'") : x;
  };

  var escape_str_re = /(^|[^\\])'/g;

  function vg_escape_str(x) {
    return x.replace(escape_str_re, "$1\\'");
  }

  util.keys = function(x) {
    var keys = [];
    for (var key in x) keys.push(key);
    return keys;
  };

  util.unique = function(data, f, results) {
    if (!util.isArray(data) || data.length==0) return [];
    f = f || util.identity;
    results = results || [];
    for (var v, i=0, n=data.length; i<n; ++i) {
      v = f(data[i]);
      if (results.indexOf(v) < 0) results.push(v);
    }
    return results;
  };

  util.minIndex = function(data, f) {
    if (!util.isArray(data) || data.length==0) return -1;
    f = f || util.identity;
    var idx = 0, min = f(data[0]), v = min;
    for (var i=1, n=data.length; i<n; ++i) {
      v = f(data[i]);
      if (v < min) { min = v; idx = i; }
    }
    return idx;
  };

  util.maxIndex = function(data, f) {
    if (!util.isArray(data) || data.length==0) return -1;
    f = f || util.identity;
    var idx = 0, max = f(data[0]), v = max;
    for (var i=1, n=data.length; i<n; ++i) {
      v = f(data[i]);
      if (v > max) { max = v; idx = i; }
    }
    return idx;
  };

  util.truncate = function(s, length, pos, word, ellipsis) {
    var len = s.length;
    if (len <= length) return s;
    ellipsis = ellipsis || "...";
    var l = Math.max(0, length - ellipsis.length);

    switch (pos) {
      case "left":
        return ellipsis + (word ? vg_truncateOnWord(s,l,1) : s.slice(len-l));
      case "middle":
      case "center":
        var l1 = Math.ceil(l/2), l2 = Math.floor(l/2);
        return (word ? vg_truncateOnWord(s,l1) : s.slice(0,l1)) + ellipsis
          + (word ? vg_truncateOnWord(s,l2,1) : s.slice(len-l2));
      default:
        return (word ? vg_truncateOnWord(s,l) : s.slice(0,l)) + ellipsis;
    }
  }

  function vg_truncateOnWord(s, len, rev) {
    var cnt = 0, tok = s.split(vg_truncate_word_re);
    if (rev) {
      s = (tok = tok.reverse())
        .filter(function(w) { cnt += w.length; return cnt <= len; })
        .reverse();
    } else {
      s = tok.filter(function(w) { cnt += w.length; return cnt <= len; });
    }
    return s.length ? s.join("").trim() : tok[0].slice(0, len);
  }

  var vg_truncate_word_re = /([\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u2028\u2029\u3000\uFEFF])/;

  util.fontString = function(o) {
    return (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
      + (o.font || config.render.font);
  };

  // Logging

  function vg_write(msg) {
    // config.isNode
      // ? process.stderr.write(msg + "\n")
      // : console.log(msg);
    console.log(msg);
  }

  util.log = function(msg) {
    vg_write("[Vega Log] " + msg);
  };

  util.error = function(msg) {
    msg = "[Vega Err] " + msg;
    vg_write(msg);
    if (typeof alert !== "undefined") alert(msg);
  };

  util.debug = function(input, args) {
    if(!config.debug) return;
    var log = Function.prototype.bind.call(console.log, console);
    args.unshift(input.stamp||-1);
    if(input.add) args.push(input.add.length, input.mod.length, input.rem.length, !!input.touch);
    log.apply(console, args);
  };

  return util;
});
define('dataflow/tuple',['require','exports','module','../util/index','../util/constants'],function(require, module, exports) {
  var util = require('../util/index'),
      C = require('../util/constants'),
      tuple_id = 1;

  function create(d, p) {
    var o = Object.create(util.isObject(d) ? d : {data: d});
    o._id = ++tuple_id;
    // o._prev = p ? Object.create(p) : C.SENTINEL;
    o._prev = p || C.SENTINEL;
    return o;
  }

  // WARNING: operators should only call this once per timestamp!
  function set(t, k, v, stamp) {
    var prev = t[k];
    if(prev === v) return;

    if(prev && t._prev) set_prev(t, k);
    t[k] = v;
  }

  function set_prev(t, k, stamp) {
    t._prev = (t._prev === C.SENTINEL) ? {} : t._prev;
    t._prev[k] = {
      value: t[k],
      stamp: stamp
    };
  }

  function reset() { tuple_id = 1; }

  return {
    create: create,
    set:    set,
    prev:   set_prev,
    reset:  reset
  };
});
define('dataflow/Node',['require','exports','module','../util/constants'],function(require, exports, module) {
  var C = require('../util/constants');

  function Node(graph) {
    this._graph = graph;
    this._rank = ++graph._rank; // For topologial sort
    this._stamp = 0;  // Last stamp seen

    this._listeners = [];

    this._deps = {
      data:    [],
      fields:  [],
      scales:  [],
      signals: [],
    };

    this._router = false; // Responsible for propagating tuples, cannot ever be skipped
    this._collector = false;  // Holds a materialized dataset, pulse to reflow
    return this;
  };

  var proto = Node.prototype;

  proto.last = function() { return this._stamp }

  proto.dependency = function(type, deps) {
    var d = this._deps[type];
    if(arguments.length === 1) return d;
    if(deps === null) { // Clear dependencies of a certain type
      while(d.length > 0) d.pop();
    } else {
      d.push.apply(d, util.array(deps));
    }
    return this;
  };

  proto.router = function(bool) {
    if(!arguments.length) return this._router;
    this._router = bool
    return this;
  };

  proto.collector = function(bool) {
    if(!arguments.length) return this._collector;
    this._collector = bool;
    return this;
  };

  proto.addListener = function(l) {
    if(!(l instanceof Node)) throw "Listener is not a Node";
    if(this._listeners.indexOf(l) !== -1) return;

    this._listeners.push(l);
    if(this._rank > l._rank) {
      var q = [l];
      while(q.length) {
        var cur = q.splice(0,1)[0];
        cur._rank = ++this._graph._rank;
        q = q.concat(cur._listeners);
      }
    }

    return this;
  };

  proto.removeListener = function (l) {
    for (var i = 0, len = this._listeners.length; i < len && !foundSending; i++) {
      if (this._listeners[i] === l) {
        this._listeners.splice(i, 1);
      }
    }
    
    return this;
  };

  // http://jsperf.com/empty-javascript-array
  proto.disconnect = function() {
    while(this._listeners.length > 0) {
      this._listeners.pop();
    }
  };

  proto.evaluate = function(pulse) { return pulse; }

  proto.reevaluate = function(pulse) {
    var node = this, reeval = false;
    return C.DEPS.some(function(prop) {
      reeval = reeval || node._deps[prop].some(function(k) { return !!pulse[prop][k] });
      return reeval;
    });

    return this;
  };

  return Node;
});


define('dataflow/Collector',['require','exports','module','./Node','./changeset','../util/index','../util/constants'],function(require, exports, module) {
  var Node = require('./Node'),
      changeset = require('./changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Collector(graph) {
    Node.prototype.call(this, graph);

    this._data = [];
    this.router(true)
      .collector(true);
  }

  var proto = (Bin.prototype = new Node());

  proto.data = function() { return this._data; }

  proto.evaluate = function(input) {
    util.debug(input, ["collecting"]);

    if(input.touch) {
      input = changeset.create(input);
      input.mod = this._data.slice();
      return input;
    }

    if(input.rem.length) {
      var ids = input.rem.reduce(function(m,x) { return (m[x._id]=1, m); }, {});
      this._data = this._data.filter(function(x) { return ids[x._id] !== 1; });
    }

    if(input.add.length) {
      this._data = this._data.length ? this._data.concat(input.add) : input.add;
    }

    if(input.sort) {
      this._data.sort(input.sort);
    }

    return input;
  };
});
define('dataflow/Datasource',['require','exports','module','./changeset','./tuple','./Collector','../util/index','../util/constants'],function(require, exports, module) {
  var changeset = require('./changeset'), 
      tuple = require('./tuple'), 
      Collector = require('./Collector'),
      util = require('../util/index'),
      C = require('../util/constants');
  
  function Datasource(graph, name, facet) {
    this._graph = graph;
    this._name = name;
    this._data = [];
    this._source = null;
    this._facet = facet;
    this._input = changeset.create();
    this._output = null;    // Output changeset

    this._pipeline  = null; // Pipeline of transformations.
    this._collector = null; // Collector to materialize output of pipeline
  };

  var proto = Datasource.prototype;

  proto.source = function(src) {
    if(!arguments.length) return this._source;
    this._source = this._graph.data(src);
    return this;
  };

  proto.add = function(d) {
    var add = this._input.add;
    add.push.apply(add, util.array(d).map(function(d) { return tuple.create(d); }));
    return this;
  };

  proto.remove = function(where) {
    var d = this._data.filter(where);
    this._input.rem.push.apply(this._input.rem, d);
    return this;
  };

  proto.update = function(where, field, func) {
    var mod = this._input.mod;
    this._input.fields[field] = 1;
    this._data.filter(where).forEach(function(x) {
      var prev = x[field],
          next = func(x);
      if (prev !== next) {
        tuple.prev(x, field);
        x.__proto__[field] = next;
        if(mod.indexOf(x) < 0) mod.push(x);
      }
    });
    return this;
  };

  proto.values = function(data) {
    if(!arguments.length)
      return this._collector ? this._collector.data() : this._data;

    // Replace backing data
    this._input.rem = this._data.slice();
    if (data) { this.add(data); }
    return this;
  };

  proto.last = function() { return this._output; }

  proto.fire = function(input) {
    if(input) this._input = input;
    this._graph.propagate(this._input, this._pipeline[0]); 
  };

  proto.pipeline = function(pipeline) {
    var ds = this, n, c;

    if(pipeline.length) {
      // If we have a pipeline, add a collector to the end to materialize
      // the output.
      ds._collector = new Collector(this._graph);
      pipeline.push(ds._collector);
    }

    // Input node applies the datasource's delta, and propagates it to 
    // the rest of the pipeline. It receives touches to reflow data.
    var input = new Node(this._graph)
      .router(true)
      .collector(true);

    input.evaluate = function(input) {
      util.debug(input, ["input", ds._name]);

      var delta = ds._input, 
          out = changeset.create(input);
      out.facet = ds._facet;

      if(input.touch) {
        out.mod = ds._source ? ds._source.values().slice() : ds._data.slice();
      } else {
        // update data
        var delta = ds._input;
        var ids = util.tuple_ids(delta.rem);

        ds._data = ds._data
          .filter(function(x) { return ids[x._id] !== 1; })
          .concat(delta.add);

        // reset change list
        ds._input = changeset.create();

        out.add = delta.add; 
        out.rem = delta.rem;

        // Assign a timestamp to any updated tuples
        out.mod = delta.mod.map(function(x) { 
          var k;
          if(x._prev === C.SENTINEL) return x;
          for(k in x._prev) {
            if(x._prev[k].stamp === undefined) x._prev[k].stamp = input.stamp;
          }
          return x;
        }); 
      }

      return out;
    };

    pipeline.unshift(input);

    // Output node captures the last changeset seen by this datasource
    // (needed for joins and builds) and materializes any nested data.
    // If this datasource is faceted, materializes the values in the facet.
    var output = new Node(this._graph)
      .router(true)
      .collector(true);

    output.evaluate = function(input) {
      util.debug(input, ["output", ds._name]);
      var output = changeset.create(input, true);

      if(ds._facet) {
        ds._facet.values = ds.values();
        input.facet = null;
      }

      ds._output = input;
      output.data[ds._name] = 1;
      return output;
    };

    pipeline.push(output);

    this._pipeline = pipeline;
    this._graph.connect(ds._pipeline);
    return this;
  };

  proto.addListener = function(l) {
    if(l instanceof Datasource) {
      var source = this, dest = l;
      l = new Node(this._graph);
      l.evaluate = function(input) {
        dest._input = source._output;
        return input;
      };
      l.addListener(dest._pipeline[0]);
    }

    this._pipeline[this._pipeline.length-1].addListener(l);
  };

  proto.removeListener = function(l) {
    this._pipeline[this._pipeline.length-1].removeListener(l);
  };

  return Datasource;
});
define('dataflow/Signal',['require','exports','module','./Node','./changeset','../util/index'],function(require, exports, module) {
  var Node = require('./Node'),
      changeset = require('./changeset'),
      util = require('../util/index');

  function Signal(graph, name, init) {
    Node.prototype.call(this, graph);

    this._name  = name;
    this._value = init;

    return this;
  };

  var proto = (Bin.prototype = new Node());

  proto.name = function() { return this._name; };

  proto.value = function(val) {
    if(!arguments.length) return this._value;
    this._value = val;
    return this;
  };

  proto.fire = function(cs) {
    if(!cs) cs = changeset.create(null, true);
    cs.signals[this._name] = 1;
    this._graph.propagate(cs, this);
  };

  return Signal;
});
define('dataflow/Graph',['require','exports','module','d3','./Datasource','./Signal','./changeset','../util/index','../util/constants'],function(require, exports, module) {
  var d3 = require('d3'),
      Datasource = require('./Datasource'),
      Signal = require('./Signal'),
      changeset = require('./changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Graph() {
    this._stamp = 0;
    this._rank = 0;

    this._data  = {};
    this._signals = {};

    this.doNotPropagate = {};
  }

  var proto = Graph.prototype;

  proto.data = function(name, pipeline, facet) {
    if(arguments.length === 1) return this._data[name];
    return this._data[name] = new Datasource(this, name, facet)
      .pipeline(pipeline);
  };

  function signal(name) {
    var m = this, i, len;
    if(!util.isArray(name)) return this._signals[name];
    return name.map(function(n) { m._signals[n]; });
  }

  proto.signal = function(name, init) {
    var m = this;
    if(arguments.length === 1) return signal.call(this, name);
    return this._signals[name] = new Signal(this, name, init);
  };

  proto.signalValues = function(name) {
    var signals = {},
        i, len, n;

    if(!util.isArray(name)) return this._signals[name].value();
    for(i=0, len=name.length; i<len; ++i) {
      n = name[i];
      signals[n] = this._signals[n].value();
    }

    return signals;
  };

  proto.signalRef = function(ref) {
    if(!util.isArray(ref)) ref = util.field(ref);
    var value = this.signal(ref.shift()).value();
    if(ref.length > 0) {
      var fn = Function("s", "return s["+ref.map(util.str).join("][")+"]");
      value = fn.call(null, value);
    }

    return value;
  };

  var schedule = d3.bisector(function(a, b) {
    // If the nodes are equal, propagate the non-touch pulse first,
    // so that we can ignore subsequent touch pulses. To efficiently
    // use the JS array, we want lower ranked nodes on the right so
    // we can pop them. 
    if(a.node == b.node) return a.pulse.touch ? -1 : 1;
    else return b.rank - a.rank; 
  }); 

  proto.propagate = function(pulse, node) {
    var v, l, n, p, r, i, len;

    var pq = [];
    pq.enq = function(x) {
      var idx = schedule.left(this, x);
      this.splice(idx, 0, x);
    };

    if(pulse.stamp) throw "Pulse already has a non-zero stamp"

    pulse.stamp = ++this._stamp;
    pq.enq({ node: node, pulse: pulse, rank: node._rank });

    while (pq.length > 0) {
      v = pq.pop(), n = v.node, p = v.pulse, r = v.rank, l = n._listeners;

      // A node's rank might change during a propagation (e.g. instantiating
      // a group's dataflow branch). Re-queue if it has.
      if(r != n._rank) {
        util.debug(p, ['Rank mismatch', r, n._rank]);
        pq.enq({ node: n, pulse: p, rank: n._rank });
        continue;
      }

      var touched = p.touch && n.last() >= p.stamp;
      if(touched) continue; // Don't needlessly touch ops.

      var run = !!p.add.length || !!p.rem.length || n.router();
      run = run || !touched;
      run = run || n.reevaluate(p);

      if(run) {
        pulse = n.evaluate(p);
        n._stamp = pulse.stamp;
      }

      // Even if we didn't run the node, we still want to propagate 
      // the pulse. 
      if (pulse != doNotPropagate || !run) {
        for (i = 0, len = l.length; i < len; i++) {
          pq.enq({ node: l[i], pulse: pulse, rank: l[i]._rank });
        }
      }
    }
  };

  // Connect a branch of dataflow nodes. 
  // Dependencies get wired to the nearest collector. 
  function forEachNode(branch, fn) {
    var node, collector, i, len;
    for(i=0, len=branch.length; i<len; ++i) {
      node = branch[i];
      if(n.collector()) collector = node;

      fn(node, collector, i);
    }
  }

  proto.connect = function(branch) {
    util.debug({}, ['connecting']);
    var graph = this;

    forEachNode(branch, function(n, c, i) {
      var data = n.dependency(C.DATA),
          signals = n.dependency(C.SIGNALS);

      if(data.length > 0) {
        data.forEach(function(d) { graph.data(d).addListener(c); });
      }

      if(signals.length > 0) {
        signals.forEach(function(s) { graph.signal(s).addListener(c) });
      }

      if(i > 0) {
        branch[i-1].addListener(branch[i]);
      }
    });

    return branch;
  };

  proto.disconnect = function(branch) {
    util.debug({}, ['disconnecting']);
    var graph = this;

    forEachNode(branch, function(n, c, i) {
      var data = n.dependency(C.DATA),
          signals = n.dependency(C.SIGNALS);

      if(data.length > 0) {
        data.forEach(function(d) { graph.data(d).removeListener(c); });
      }

      if(signals.length > 0) {
        signals.forEach(function(s) { graph.signal(s).removeListener(c) });
      }

      n.disconnect();  
    });

    return branch;
  };

  return Graph;
});
define('core/Model',['require','exports','module','../dataflow/Graph','../dataflow/changeset','../util/index'],function(require, exports, module) {
  var Graph = require('../dataflow/Graph'), 
      changeset = require('../dataflow/changeset'), 
      // scene = require('../scene/index'),
      util = require('../util/index');

  function Model() {
    this._stamp = 0;
    this._rank  = 0;

    this._defs = {};
    this._predicates = {};

    this.graph = new Graph();
    // this.scene = scene(this);

    this._node = new Node(this.graph);
  };

  var proto = Model.prototype;

  proto.data = function() {
    var data = this.graph.data.apply(this.graph, arguments);
    if(arguments.length > 1) {  // new Datasource
      this._node.addListener(data._pipeline[0]);
    }

    return data;
  };

  function predicates(name) {
    var m = this, predicates = {};
    if(!util.isArray(name)) return this._predicates[name];
    name.forEach(function(n) { predicates[n] = m._predicates[n] });
    return predicates;
  }

  proto.predicate = function(name, predicate) {
    if(arguments.length === 1) return predicates.call(this, name);
    return this._predicates[name] = predicate;
  };

  proto.addListener = function(l) { this._node.addListener(l); }
  proto.removeListener = function(l) { this._node.removeListener(l); }

  proto.fire = function(cs) {
    if(!cs) cs = changeset.create();
    this.graph.propagate(cs, this._node);
  };

  return Model;
});
define('parse/expr',['require','exports','module','../util/index'],function(require, exports, module) {
  var util = require('../util/index');
  
  var CONSTANT = {
  	"E":       "Math.E",
  	"LN2":     "Math.LN2",
  	"LN10":    "Math.LN10",
  	"LOG2E":   "Math.LOG2E",
  	"LOG10E":  "Math.LOG10E",
  	"PI":      "Math.PI",
  	"SQRT1_2": "Math.SQRT1_2",
  	"SQRT2":   "Math.SQRT2"
  };

  var FUNCTION = {
  	"abs":    "Math.abs",
  	"acos":   "Math.acos",
  	"asin":   "Math.asin",
  	"atan":   "Math.atan",
  	"atan2":  "Math.atan2",
  	"ceil":   "Math.ceil",
  	"cos":    "Math.cos",
  	"exp":    "Math.exp",
  	"floor":  "Math.floor",
  	"log":    "Math.log",
  	"max":    "Math.max",
  	"min":    "Math.min",
  	"pow":    "Math.pow",
  	"random": "Math.random",
  	"round":  "Math.round",
  	"sin":    "Math.sin",
  	"sqrt":   "Math.sqrt",
  	"tan":    "Math.tan",
    "date":   "Date.parse"
  };
  
  var lexer = /([\"\']|[\=\<\>\~\&\|\?\:\+\-\/\*\%\!\^\,\;\[\]\{\}\(\) ]+)/;
      
  function expr(model, x) {
    var tokens = x.split(lexer),
        t, v, i, n, sq, dq, ns, sg = {}, fd = {},
        args = ["vg", "d", "e", "i"];

    for (sq=0, dq=0, i=0, n=tokens.length; i<n; ++i) {
      var t = tokens[i];
      if (t==="'") { if (!dq) sq = !sq; continue; }
      if (t==='"') { if (!sq) dq = !dq; continue; }
      if (dq || sq) continue;
      if (CONSTANT[t]) {
        tokens[i] = CONSTANT[t];
      }
      if (FUNCTION[t] && (v=tokens[i+1]) && v[0]==="(") {
        tokens[i] = FUNCTION[t];
      }
      if(tokens[i+1] == ":") {  // Namespace signal
        ns = t+":"+tokens[i+2];
        if(model.signal((ns = util.field(ns))[0])) {
          sg[ns[0]] = 1;
          v = util.field(tokens[i+2]);
          tokens[i] = "sg['"+tokens[i];
          tokens[i+2] = tokens[i+2].replace(v[0], v[0]+"']");
          i+=2;
        }
      }
      if(model.signal((v = util.field(t))[0])) {
        sg[v[0]] = 1;
        tokens[i] = tokens[i].replace(v[0], "sg["+util.str(v[0])+"]");
      }
      if(v[0] == "d") fd[v.splice(1).join("")] = 1;
    }

    return {
      fn: Function("d", "e", "i", "p", "sg", "return ("+tokens.join("")+");"),
      signals: util.keys(sg),
      fields: util.keys(fd)
    };
  };

  expr.eval = function(model, fn, d, e, i, p, sg) {
    sg = model.signalValues(util.array(sg));
    return fn.call(null, d, e, i, p, sg);
  };

  return expr;
});
define('transforms/Parameter',['require','exports','module','../parse/expr','../util/index','../util/constants'],function(require, exports, module) {
  var expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  var arrayType = /array/i,
      fieldType = /field/i,
      exprType  = /expr/i;

  function Parameter(name, type) {
    this._name = name;
    this._type = type;
    this._stamp = 0; // Last stamp seen on resolved signals

    // If parameter is defined w/signals, it must be resolved
    // on every pulse.
    this._value = [];
    this._accessors = [];
    this._resolution = false;
    this._signals = {};
  }

  var proto = Parameter.prototype;

  proto._get = function() {
    var isArray = arrayType(this._type),
        isField = fieldType(this._field);

    if(isField) {
      return isArray ? { fields: this._value, accessors: this._accessors } :
        { field: this._value[0], accessor: this._accessors[0] };
    } else {
      return isArray ? this._value : this._value[0];
    }
  };

  proto.get = function(graph) {
    var s, sg, idx, val, last;

    // If we don't require resolution, return the value immediately.
    if(!this._resolution) return this._get();

    for(s in this._signals) {
      idx  = this._signals[s];
      sg   = graph.signal(s); 
      val  = sg.value();
      last = sg.last();

      if(isField) {
        this._accessors[idx] = this._stamp <= last ? 
          util.accessor(val) : this._accessors[idx];
      }

      this._value[idx] = val;
      this._stamp = Math.max(this._stamp, last);
    }

    return this._get();
  };

  proto.set = function(transform, value) {
    var param = this;
    this._value = util.array(value).map(function(v, i) {
      if(!util.isObject(v)) {
        if(exprType.test(this._type)) {
          var e = expr(transform._graph, v);
          transform.dependency(C.FIELDS,  e.fields);
          transform.dependency(C.SIGNALS, e.signals);
          return e;
        } else {
          return v;
        }
      } else if(v.value !== undefined) {
        return v.value;
      } else if(v.field !== undefined) {
        param._accessors[i] = util.accessor(v.field);
        transform.dependency(C.FIELDS, v.field);
        return v.field;
      } else if(v.signal !== undefined) {
        param._resolution = true;
        param._signals[v.signal] = i;
        transform.dependency(C.SIGNALS, v.signal);
        return v.signal;
      }
    });

    return transform;
  };

  return Parameter;
});
define('transforms/Transform',['require','exports','module','../dataflow/Node','./Parameter','../util/index','../util/constants'],function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      Parameter = require('./Parameter'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Transform(graph) {
    return Node.prototype.call(this, graph);
  }

  Transform.addParameters = function(proto, params) {
    var p;
    for (var name in params) {
      p = params[name];
      proto[name] = new Parameter(name, p.type);
      if(p.default) proto[name].set(p.default);
    }
  };

  var proto = (Transform.prototype = new Node());

  proto.transform = function(input, reset) { return input; };
  proto.evaluate = function(input) {
    // Many transforms store caches that must be invalidated if
    // a signal value has changed. 
    var reset = this.dependency(C.SIGNALS).some(function(s) { 
      return !!input.signals[s] 
    });

    return this.transform(input, reset);
  };
  
  proto.output = function(map) {
    for (var key in this._output) {
      if (map[key] !== undefined) {
        this._output[key] = map[key];
      }
    }
    return this;
  };

  return Transform;
});
define('transforms/Filter',['require','exports','module','./Transform','../dataflow/changeset','../parse/expr','../util/index','../util/constants'],function(require, exports, module) {
  var Transform = require('./Transform'),
      changeset = require('../dataflow/changeset'), 
      expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Facet(graph) {
    Transform.prototype.call(this, graph);
    Transform.addParameters(this, {test: {type: "expr"} });

    this._skip = {};
    return this;
  }

  var proto = (Facet.prototype = new Transform());

  proto._test = function(x) {
    return expr.eval(this._graph, this.test.get(), x, null, null, null, this.dependency(C.SIGNALS));
  };

  proto.transform = function(input) {
    util.debug(input, ["filtering"]);
    var output = changeset.create(input),
        skip = this._skip,
        f = this._test;

    input.rem.forEach(function(x) {
      if (skip[x._id] !== 1) output.rem.push(x);
      else skip[x._id] = 0;
    });

    input.add.forEach(function(x) {
      if (f(x)) output.add.push(x);
      else skip[x._id] = 1;
    });

    input.mod.forEach(function(x) {
      var b = f(x),
          s = (skip[x._id] === 1);
      if (b && s) {
        skip[x._id] = 0;
        output.add.push(x);
      } else if (b && !s) {
        output.mod.push(x);
      } else if (!b && s) {
        // do nothing, keep skip true
      } else { // !b && !s
        output.rem.push(x);
        skip[x._id] = 1;
      }
    });

    return output;
  };
});
define('transforms/Fold',['require','exports','module','./Transform','../util/index','../dataflow/tuple','../dataflow/changeset'],function(require, exports, module) {
  var Transform = require('./Transform'),
      util = require('../util/index'), 
      tuple = require('../dataflow/tuple'), 
      changeset = require('../dataflow/changeset');

  function Fold(graph) {
    Transform.prototype.call(this, graph);
    Transform.addParameters(this, {
      on: {type: "array<field>"} 
    });

    this._output = {key: "key", value: "value"};
    this._cache = {};

    return this.router(true);
  }

  var proto = (Fold.prototype = new Transform());

  proto._reset = function(input, output) { 
    for(var id in this._cache) output.rem.push.apply(output.rem, this._cache[id]);
    this._cache = {};
  };

  proto._get_tuple = function(x, i) {
    var list = this._cache[x._id] || (this._cache[x._id] = Array(fields.length));
    return list[i] || (list[i] = tuple.create(x, x._prev));
  };

  proto._fold = function(data, fields, accessors, out, stamp) {
    var i = 0, dlen = data.length,
        j = 0, flen = fields.length,
        d, t;

    for(; i<dlen; ++i) {
      d = data[i];
      for(; j<flen; ++j) {
        t = this._get_tuple(d, i);  
        tuple.set(t, this._output.key, fields[j], stamp);
        tuple.set(t, this._output.value, accessors[j](x), stamp);
        out.push(t);
      }      
    }
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["folding"]);

    var fold = this,
        on = this.on.get(),
        fields = on.fields, accessors = on.accessors,
        output = changeset.create(input);

    if(reset) this._reset(input, output);

    this._fold(input.add, fields, accessors, output.add, input.stamp);
    this._fold(input.mod, fields, accessors, output.mod, input.stamp);
    input.rem.forEach(function(x) {
      output.rem.push.apply(output.rem, fold._cache[x._id]);
      fold._cache[x._id] = null;
    });

    // If we're only propagating values, don't mark key/value as updated.
    if(input.add.length || input.rem.length || 
      fields.some(function(f) { return !!input.fields[f]; }))
        output.fields[this._output.key] = 1, output.fields[this._output.value] = 1;
    return output;
  };
});
define('transforms/Formula',['require','exports','module','./Transform','../dataflow/tuple','../parse/expr','../util/index','../util/constants'],function(require, exports, module) {
  var Transform = require('./Transform'),
      tuple = require('../dataflow/tuple'), 
      expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Formula(graph) {
    Transform.prototype.call(this, graph);
    Transform.addParameters(this, {
      field: {type: "string"},
      expr:  {type: "expr"}
    });
    return this;
  }

  var proto = (Formula.prototype = new Transform());

  proto._expr = function(x, stamp) {
    var val = expr.eval(this._graph, this._expr.get(), x, null, null, null, 
      this.dependency(C.SIGNALS));

    tuple.set(x, this._field.get(), val, stamp); 
  };

  proto.transform = function(input) {
    util.debug(input, ["formulating"]);
    var t = this;
    input.add.forEach(function(x) { t._expr(x, input.stamp) });;
    input.mod.forEach(function(x) { t._expr(x, input.stamp) });
    input.fields[this._field.get()] = 1;
    return input;
  };
});
define('transforms/Sort',['require','exports','module','./Transform','../parse/expr','../util/index'],function(require, exports, module) {
  var Transform = require('./Transform'),
      expr = require('../parse/expr'),
      util = require('../util/index');

  function Sort(graph) {
    Transform.prototype.call(this, graph);
    Transform.addParameters(this, {by: {type: "array<field>"} });

    return this.router(true);
  }

  var proto = (Sort.prototype = new Transform());

  proto.transform = function(input) {
    util.debug(input, ["sorting"]);

    if(input.add.length || input.mod.length || input.rem.length) {
      input.sort = util.comparator(this.by.get().fields);
    }

    return input;
  };
});
define('transforms/Zip',['require','exports','module','../util/index','../dataflow/Collector'],function(require, exports, module) {
  var util = require('../util/index'), 
      Collector = require('../dataflow/Collector');

  function Zip(graph) {
    Transform.prototype.call(this, graph);
    Transform.addParameters(this, {
      with: {type: "string"},
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
    util.debug(input, ["zipping", z]);

    var w = this.with.get(),
        wds = this._graph.data(w),
        woutput = wds.last(),
        wdata = wds.values(),
        key = this.key.get(),
        withKey = this.withKey.get(),
        as = this.as.get(),
        dflt = this.default.get(),
        map = this.__map;

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
});
define('transforms/index',['require','exports','module','./Filter','./Fold','./Formula','./Sort','./Zip'],function(require, exports, module) {
  return {
    // aggregate:  require('./aggregate'),
    // bin:        require('./bin'),
    // facet:      require('./Facet'),
    filter:     require('./Filter'),
    fold:       require('./Fold'),
    formula:    require('./Formula'),
    sort:       require('./Sort'),
    zip:        require('./Zip')
  };
});
define('parse/transforms',['require','exports','module','../util/index','../transforms/index'],function(require, exports, module) {
  var util = require('../util/index'),
      transforms = require('../transforms/index');

  return function parseTransforms(model, def) {
    var tx = transforms[def.type](model);
    if(def.type == 'facet') {
      var pipeline = (def.transform||[])
        .map(function(t) { return parseTransforms(model, t); });
      tx.pipeline(pipeline);
    }

    util.keys(def).forEach(function(k) {
      if(k === 'type') return;
      if(k === 'transform' && def.type === 'facet') return;
      (tx[k])(def[k]);
    });

    return tx;
  }
});
define('transforms/modify',['require','exports','module','../dataflow/tuple','../util/index','../util/constants'],function(require, exports, module) {
  var tuple = require('../dataflow/tuple'),
      util = require('../util/index'),
      C = require('../util/constants');

  var filter = function(field, value, src, dest) {
    for(var i = src.length-1; i >= 0; --i) {
      if(src[i][field] == value)
        dest.push.apply(dest, src.splice(i, 1));
    }
  };

  return function parseModify(model, def, ds) {
    var signal = def.signal ? util.field(def.signal) : null, 
        signalName = signal ? signal[0] : null,
        predicate = def.predicate ? model.predicate(def.predicate) : null,
        reeval = (predicate === null);

    var node = new model.Node(function(input) {
      if(predicate !== null) {
        var db = {};
        (predicate.data||[]).forEach(function(d) { db[d] = model.data(d).values(); });

        // TODO: input
        reeval = predicate({}, db, model.signalValues(predicate.signals||[]), model._predicates);
      }

      util.debug(input, [def.type+"ing", reeval]);
      if(!reeval) return input;

      var datum = {}, 
          value = signal ? model.signalRef(def.signal) : null,
          d = model.data(ds.name),
          t = null;

      datum[def.field] = value;

      // We have to modify ds._data so that subsequent pulses contain
      // our dynamic data. W/o modifying ds._data, only the output
      // collector will contain dynamic tuples. 
      if(def.type == C.ADD) {
        t = tuple.create(datum);
        input.add.push(t);
        d._data.push(t);
      } else if(def.type == C.REMOVE) {
        filter(def.field, value, input.add, input.rem);
        filter(def.field, value, input.mod, input.rem);
        d._data = d._data.filter(function(x) { return x[def.field] !== value });
      } else if(def.type == C.TOGGLE) {
        var add = [], rem = [];
        filter(def.field, value, input.rem, add);
        filter(def.field, value, input.add, rem);
        filter(def.field, value, input.mod, rem);
        if(add.length == 0 && rem.length == 0) add.push(tuple.create(datum));

        input.add.push.apply(input.add, add);
        d._data.push.apply(d._data, add);
        input.rem.push.apply(input.rem, rem);
        d._data = d._data.filter(function(x) { return rem.indexOf(x) === -1 });
      } else if(def.type == C.CLEAR) {
        input.rem.push.apply(input.rem, input.add);
        input.rem.push.apply(input.rem, input.mod);
        input.add = [];
        input.mod = [];
        d._data  = [];
      } 

      input.fields[def.field] = 1;
      return input;
    });
    
    var deps = node._deps.signals;
    if(signalName) deps.push(signalName);
    if(predicate)  deps.push.apply(deps, predicate.signals);
    
    return node;
  }
});
define('util/load',['require','exports','module','./index','./config'],function(require, module, exports) {
  var util = require('./index'),
      config = require('./config');

  var vg_load_protocolRE = /^[A-Za-z]+\:\/\//;
  var vg_load_fileProtocol = "file://";

  function vg_load_hasProtocol(url) {
    return vg_load_protocolRE.test(url);
  }

  function vg_load_isFile(url) {
    return url.indexOf(vg_load_fileProtocol) === 0;
  }

  function vg_load_xhr(url, callback) {
    util.log("LOAD: " + url);
    if (!vg_url_check(url)) {
      util.error("URL is not whitelisted: " + url);
      return;
    }
    d3.xhr(url, function(err, resp) {
      if (resp) resp = resp.responseText;
      callback(err, resp);
    });
  }

  function vg_url_check(url) {
    if (!config.domainWhiteList) return true;
    var a = document.createElement("a");
    a.href = url;
    var domain = a.hostname.toLowerCase();
    return config.domainWhiteList.some(function(d) {
      return d === domain ||
        domain.lastIndexOf("."+d) === (domain.length - d.length - 1);
    });
  }

  // TODO: how to check if nodeJS in requireJS?
  // function vg_load_file(file, callback) {
  //   util.log("LOAD FILE: " + file);
  //   var idx = file.indexOf(vg_load_fileProtocol);
  //   if (idx >= 0) file = file.slice(vg_load_fileProtocol.length);
  //   require("fs").readFile(file, callback);
  // }

  // function vg_load_http(url, callback) {
  //   util.log("LOAD HTTP: " + url);
  //   var req = require("http").request(url, function(res) {
  //     var pos=0, data = new Buffer(parseInt(res.headers['content-length'],10));
  //     res.on("error", function(err) { callback(err, null); });
  //     res.on("data", function(x) { x.copy(data, pos); pos += x.length; });
  //     res.on("end", function() { callback(null, data); });
  //   });
  //   req.on("error", function(err) { callback(err); });
  //   req.end();
  // }

  return function load(uri, callback) {
    var url = vg_load_hasProtocol(uri) ? uri : config.baseURL + uri;
    // if (config.isNode) {
    //   // in node.js, consult url and select file or http
    //   var get = vg_load_isFile(url) ? vg_load_file : vg_load_http;
    //   get(url, callback);
    // } else {
      // in browser, use xhr
      vg_load_xhr(url, callback);
    // }  
  };
});
define('util/read',['require','exports','module','./index'],function(require, module, exports) {
  var util = require('./index'),
      formats = {},
      parsers = {
        "number": util.number,
        "boolean": util.boolean,
        "date": Date.parse
      };

  function read(data, format) {
    var type = (format && format.type) || "json";
    data = formats[type](data, format);
    if (format && format.parse) parseValues(data, format.parse);
    return data;
  }

  formats.json = function(data, format) {
    var d = util.isObject(data) ? data : JSON.parse(data);
    if (format && format.property) {
      d = util.accessor(format.property)(d);
    }
    return d;
  };

  formats.csv = function(data, format) {
    var d = d3.csv.parse(data);
    return d;
  };

  formats.tsv = function(data, format) {
    var d = d3.tsv.parse(data);
    return d;
  };
  
  formats.topojson = function(data, format) {
    if (topojson == null) {
      util.error("TopoJSON library not loaded.");
      return [];
    }    
    var t = util.isObject(data) ? data : JSON.parse(data),
        obj = [];

    if (format && format.feature) {
      obj = (obj = t.objects[format.feature])
        ? topojson.feature(t, obj).features
        : (util.error("Invalid TopoJSON object: "+format.feature), []);
    } else if (format && format.mesh) {
      obj = (obj = t.objects[format.mesh])
        ? [topojson.mesh(t, t.objects[format.mesh])]
        : (util.error("Invalid TopoJSON object: " + format.mesh), []);
    }
    else { util.error("Missing TopoJSON feature or mesh parameter."); }

    return obj;
  };
  
  formats.treejson = function(data, format) {
    data = util.isObject(data) ? data : JSON.parse(data);
    return util.tree(data, format.children);
  };
  
  function parseValues(data, types) {
    var cols = util.keys(types),
        p = cols.map(function(col) { return parsers[types[col]]; }),
        tree = util.isTree(data);
    vg_parseArray(tree ? [data] : data, cols, p, tree);
  }
  
  function vg_parseArray(data, cols, p, tree) {
    var d, i, j, len, clen;
    for (i=0, len=data.length; i<len; ++i) {
      d = data[i];
      for (j=0, clen=cols.length; j<clen; ++j) {
        d[cols[j]] = p[j](d[cols[j]]);
      }
      if (tree && d.values) parseValues(d, cols, p, true);
    }
  }

  read.formats = formats;
  read.parse = parseValues;
  return read;
});
define('parse/data',['require','exports','module','./transforms','../transforms/modify','../util/index','../util/load','../util/read'],function(require, exports, module) {
  var parseTransforms = require('./transforms'),
      parseModify = require('../transforms/modify'),
      util = require('../util/index'),
      load = require('../util/load'),
      read = require('../util/read');

  var parseData = function(model, spec, callback) {
    var count = 0;

    function loaded(d) {
      return function(error, data) {
        if (error) {
          util.error("LOADING FAILED: " + d.url);
        } else {
          model.data(d.name).values(read(data.toString(), d.format));
        }
        if (--count === 0) callback();
      }
    }

    // process each data set definition
    (spec || []).forEach(function(d) {
      if (d.url) {
        count += 1;
        load(d.url, loaded(d)); 
      }
      parseData.datasource(model, d);
    });

    if (count === 0) setTimeout(callback, 1);
    return spec;
  };

  parseData.datasource = function(model, d) {
    var transform = (d.transform||[]).map(function(t) { return parseTransforms(model, t) }),
        mod = (d.modify||[]).map(function(m) { return parseModify(model, m, d) }),
        ds = model.data(d.name, mod.concat(transform));

    if(d.values) ds.values(read(d.values, d.format));
    else if(d.source) {
      ds.source(d.source);
      model.data(d.source).addListener(ds);
    }

    return ds;    
  };

  return parseData;
});
define('parse/spec',['require','exports','module','../core/Model','../parse/data','../util/index'],function(require, exports, module) {
  var Model = require('../core/Model'), 
      // View = require('../core/View'), 
      // parsePadding = require('../parse/padding'),
      // parseMarks = require('../parse/marks'),
      // parseSignals = require('../parse/signals'),
      // parsePredicates = require('../parse/predicates'),
      parseData = require('../parse/data'),
      // parseInteractors = require('../parse/interactors'),
      util = require('../util/index');

  return function parseSpec(spec, callback, viewFactory) {
    // protect against subsequent spec modification
    spec = util.duplicate(spec);

    viewFactory = viewFactory || View.factory;

    var width = spec.width || 500,
        height = spec.height || 500,
        viewport = spec.viewport || null,
        model = new Model();

    parseInteractors(model, spec, function() {
      model._defs = {
        // width: width,
        // height: height,
        // viewport: viewport,
        // padding: parsePadding(spec.padding),
        // signals: parseSignals(model, spec.signals),
        // predicates: parsePredicates(model, spec.predicates),
        // marks: parseMarks(model, spec, width, height),
        data: parseData(model, spec.data, function() { callback(viewFactory(model)); })
      };
    });
  }
});
    // d3 doesn't expose itself when running under AMD, so
    // we do it manually. 
    // See: https://github.com/mbostock/d3/issues/1693
    define('d3', [], function() { return d3 });
    define('topojson', [], function() { return topojson });

    //The modules for your project will be inlined above
    //this snippet. Ask almond to synchronously require the
    //module value for 'main' here and return it as the
    //value to use for the public API for the built file.
    return {
      parse: {
        spec: require('parse/spec')
      },
      util: require('util/index'),
      config: require('util/config')
    }
}));