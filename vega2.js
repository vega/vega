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

// Generated by CoffeeScript 1.8.0
(function() {
  var Heap, defaultCmp, floor, heapify, heappop, heappush, heappushpop, heapreplace, insort, min, nlargest, nsmallest, updateItem, _siftdown, _siftup;

  floor = Math.floor, min = Math.min;


  /*
  Default comparison function to be used
   */

  defaultCmp = function(x, y) {
    if (x < y) {
      return -1;
    }
    if (x > y) {
      return 1;
    }
    return 0;
  };


  /*
  Insert item x in list a, and keep it sorted assuming a is sorted.
  
  If x is already in a, insert it to the right of the rightmost x.
  
  Optional args lo (default 0) and hi (default a.length) bound the slice
  of a to be searched.
   */

  insort = function(a, x, lo, hi, cmp) {
    var mid;
    if (lo == null) {
      lo = 0;
    }
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (lo < 0) {
      throw new Error('lo must be non-negative');
    }
    if (hi == null) {
      hi = a.length;
    }
    while (lo < hi) {
      mid = floor((lo + hi) / 2);
      if (cmp(x, a[mid]) < 0) {
        hi = mid;
      } else {
        lo = mid + 1;
      }
    }
    return ([].splice.apply(a, [lo, lo - lo].concat(x)), x);
  };


  /*
  Push item onto heap, maintaining the heap invariant.
   */

  heappush = function(array, item, cmp) {
    if (cmp == null) {
      cmp = defaultCmp;
    }
    array.push(item);
    return _siftdown(array, 0, array.length - 1, cmp);
  };


  /*
  Pop the smallest item off the heap, maintaining the heap invariant.
   */

  heappop = function(array, cmp) {
    var lastelt, returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    lastelt = array.pop();
    if (array.length) {
      returnitem = array[0];
      array[0] = lastelt;
      _siftup(array, 0, cmp);
    } else {
      returnitem = lastelt;
    }
    return returnitem;
  };


  /*
  Pop and return the current smallest value, and add the new item.
  
  This is more efficient than heappop() followed by heappush(), and can be
  more appropriate when using a fixed size heap. Note that the value
  returned may be larger than item! That constrains reasonable use of
  this routine unless written as part of a conditional replacement:
      if item > array[0]
        item = heapreplace(array, item)
   */

  heapreplace = function(array, item, cmp) {
    var returnitem;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    returnitem = array[0];
    array[0] = item;
    _siftup(array, 0, cmp);
    return returnitem;
  };


  /*
  Fast version of a heappush followed by a heappop.
   */

  heappushpop = function(array, item, cmp) {
    var _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (array.length && cmp(array[0], item) < 0) {
      _ref = [array[0], item], item = _ref[0], array[0] = _ref[1];
      _siftup(array, 0, cmp);
    }
    return item;
  };


  /*
  Transform list into a heap, in-place, in O(array.length) time.
   */

  heapify = function(array, cmp) {
    var i, _i, _j, _len, _ref, _ref1, _results, _results1;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    _ref1 = (function() {
      _results1 = [];
      for (var _j = 0, _ref = floor(array.length / 2); 0 <= _ref ? _j < _ref : _j > _ref; 0 <= _ref ? _j++ : _j--){ _results1.push(_j); }
      return _results1;
    }).apply(this).reverse();
    _results = [];
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      i = _ref1[_i];
      _results.push(_siftup(array, i, cmp));
    }
    return _results;
  };


  /*
  Update the position of the given item in the heap.
  This function should be called every time the item is being modified.
   */

  updateItem = function(array, item, cmp) {
    var pos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    pos = array.indexOf(item);
    if (pos === -1) {
      return;
    }
    _siftdown(array, 0, pos, cmp);
    return _siftup(array, pos, cmp);
  };


  /*
  Find the n largest elements in a dataset.
   */

  nlargest = function(array, n, cmp) {
    var elem, result, _i, _len, _ref;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    result = array.slice(0, n);
    if (!result.length) {
      return result;
    }
    heapify(result, cmp);
    _ref = array.slice(n);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      elem = _ref[_i];
      heappushpop(result, elem, cmp);
    }
    return result.sort(cmp).reverse();
  };


  /*
  Find the n smallest elements in a dataset.
   */

  nsmallest = function(array, n, cmp) {
    var elem, i, los, result, _i, _j, _len, _ref, _ref1, _results;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    if (n * 10 <= array.length) {
      result = array.slice(0, n).sort(cmp);
      if (!result.length) {
        return result;
      }
      los = result[result.length - 1];
      _ref = array.slice(n);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        elem = _ref[_i];
        if (cmp(elem, los) < 0) {
          insort(result, elem, 0, null, cmp);
          result.pop();
          los = result[result.length - 1];
        }
      }
      return result;
    }
    heapify(array, cmp);
    _results = [];
    for (i = _j = 0, _ref1 = min(n, array.length); 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
      _results.push(heappop(array, cmp));
    }
    return _results;
  };

  _siftdown = function(array, startpos, pos, cmp) {
    var newitem, parent, parentpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    newitem = array[pos];
    while (pos > startpos) {
      parentpos = (pos - 1) >> 1;
      parent = array[parentpos];
      if (cmp(newitem, parent) < 0) {
        array[pos] = parent;
        pos = parentpos;
        continue;
      }
      break;
    }
    return array[pos] = newitem;
  };

  _siftup = function(array, pos, cmp) {
    var childpos, endpos, newitem, rightpos, startpos;
    if (cmp == null) {
      cmp = defaultCmp;
    }
    endpos = array.length;
    startpos = pos;
    newitem = array[pos];
    childpos = 2 * pos + 1;
    while (childpos < endpos) {
      rightpos = childpos + 1;
      if (rightpos < endpos && !(cmp(array[childpos], array[rightpos]) < 0)) {
        childpos = rightpos;
      }
      array[pos] = array[childpos];
      pos = childpos;
      childpos = 2 * pos + 1;
    }
    array[pos] = newitem;
    return _siftdown(array, startpos, pos, cmp);
  };

  Heap = (function() {
    Heap.push = heappush;

    Heap.pop = heappop;

    Heap.replace = heapreplace;

    Heap.pushpop = heappushpop;

    Heap.heapify = heapify;

    Heap.updateItem = updateItem;

    Heap.nlargest = nlargest;

    Heap.nsmallest = nsmallest;

    function Heap(cmp) {
      this.cmp = cmp != null ? cmp : defaultCmp;
      this.nodes = [];
    }

    Heap.prototype.push = function(x) {
      return heappush(this.nodes, x, this.cmp);
    };

    Heap.prototype.pop = function() {
      return heappop(this.nodes, this.cmp);
    };

    Heap.prototype.peek = function() {
      return this.nodes[0];
    };

    Heap.prototype.contains = function(x) {
      return this.nodes.indexOf(x) !== -1;
    };

    Heap.prototype.replace = function(x) {
      return heapreplace(this.nodes, x, this.cmp);
    };

    Heap.prototype.pushpop = function(x) {
      return heappushpop(this.nodes, x, this.cmp);
    };

    Heap.prototype.heapify = function() {
      return heapify(this.nodes, this.cmp);
    };

    Heap.prototype.updateItem = function(x) {
      return updateItem(this.nodes, x, this.cmp);
    };

    Heap.prototype.clear = function() {
      return this.nodes = [];
    };

    Heap.prototype.empty = function() {
      return this.nodes.length === 0;
    };

    Heap.prototype.size = function() {
      return this.nodes.length;
    };

    Heap.prototype.clone = function() {
      var heap;
      heap = new Heap();
      heap.nodes = this.nodes.slice(0);
      return heap;
    };

    Heap.prototype.toArray = function() {
      return this.nodes.slice(0);
    };

    Heap.prototype.insert = Heap.prototype.push;

    Heap.prototype.top = Heap.prototype.peek;

    Heap.prototype.front = Heap.prototype.peek;

    Heap.prototype.has = Heap.prototype.contains;

    Heap.prototype.copy = Heap.prototype.clone;

    return Heap;

  })();

  (function(root, factory) {
    if (typeof define === 'function' && define.amd) {
      return define('heap',[], factory);
    } else if (typeof exports === 'object') {
      return module.exports = factory();
    } else {
      return root.Heap = factory();
    }
  })(this, function() {
    return Heap;
  });

}).call(this);

define('util/constants',['require','exports','module'],function(require, module, exports) {
  return {
    ADD_CELL: 1,
    MOD_CELL: 2,

    DATA: "data",
    FIELDS:  "fields",
    SCALES:  "scales",
    SIGNAL:  "signal",
    SIGNALS: "signals",
    
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

    DOMAIN: "domain",
    RANGE: "range",

    MARK: "mark",
    AXIS: "axis",

    COUNT: "count",
    MIN: "min",
    MAX: "max",

    ASC: "asc",
    DESC: "desc"
  }
});
define('dataflow/changeset',['require','exports','module','../util/constants'],function(require, exports, module) {
  var C = require('../util/constants');
  var REEVAL = [C.DATA, C.FIELDS, C.SCALES, C.SIGNALS];

  function create(cs, reflow) {
    var out = {};
    copy(cs, out);

    out.add = [];
    out.mod = [];
    out.rem = [];

    out.reflow = reflow;

    return out;
  }

  function reset_prev(x) {
    x._prev = (x._prev === undefined) ? undefined : C.SENTINEL;
  }

  function finalize(cs) {
    for(i=0, len=cs.add.length; i<len; ++i) reset_prev(cs.add[i]);
    for(i=0, len=cs.mod.length; i<len; ++i) reset_prev(cs.mod[i]);
  }

  function copy(a, b) {
    b.stamp = a ? a.stamp : 0;
    b.sort  = a ? a.sort  : null;
    b.facet = a ? a.facet : null;
    b.trans = a ? a.trans : null;
    REEVAL.forEach(function(d) { b[d] = a ? a[d] : {}; });
  }

  return {
    create: create,
    copy: copy,
    finalize: finalize,
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
    if(input.add) args.push(input.add.length, input.mod.length, input.rem.length, !!input.reflow);
    log.apply(console, args);
  };

  return util;
});
define('dataflow/tuple',['require','exports','module','../util/index','../util/constants'],function(require, module, exports) {
  var util = require('../util/index'),
      C = require('../util/constants'),
      tuple_id = 1;

  // Object.create is expensive. So, when ingesting, trust that the
  // datum is an object that has been appropriately sandboxed from 
  // the outside environment. 
  function ingest(datum, prev) {
    datum = util.isObject(datum) ? datum : {data: datum};
    datum._id = tuple_id++;
    datum._prev = (prev !== undefined) ? (prev || C.SENTINEL) : undefined;
    return datum;
  }

  function derive(datum, prev) {
    return ingest(Object.create(datum), prev);
  }

  // WARNING: operators should only call this once per timestamp!
  function set(t, k, v) {
    var prev = t[k];
    if(prev === v) return;
    set_prev(t, k);
    t[k] = v;
  }

  function set_prev(t, k) {
    if(t._prev === undefined) return;
    t._prev = (t._prev === C.SENTINEL) ? {} : t._prev;
    t._prev[k] = t[k];
  }

  function reset() { tuple_id = 1; }

  return {
    ingest: ingest,
    derive: derive,
    set:    set,
    prev:   set_prev,
    reset:  reset
  };
});
define('dataflow/Node',['require','exports','module','../util/index','../util/constants'],function(require, exports, module) {
  var util = require('../util/index'),
      C = require('../util/constants'),
      REEVAL = [C.DATA, C.FIELDS, C.SCALES, C.SIGNALS];

  var node_id = 1;

  function Node(graph) {
    if(graph) this.init(graph);
  }

  var proto = Node.prototype;

  proto.init = function(graph) {
    this._id = node_id++;
    this._graph = graph;
    this._rank = ++graph._rank; // For topologial sort
    this._stamp = 0;  // Last stamp seen

    this._listeners = [];
    this._registered = {}; // To prevent duplicate listeners

    this._deps = {
      data:    [],
      fields:  [],
      scales:  [],
      signals: [],
    };

    this._isRouter = false; // Responsible for propagating tuples, cannot ever be skipped
    this._isCollector = false;  // Holds a materialized dataset, pulse to reflow
    this._revises = false; // Does the operator require tuples' previous values? 
    return this;
  };

  proto.clone = function() {
    var n = new Node(this._graph);
    n.evaluate = this.evaluate;
    n._deps = this._deps;
    n._isRouter = this._isRouter;
    n._isCollector = this._isCollector;
    return n;
  };

  proto.rank = function() { return this._rank; };

  proto.last = function(stamp) { 
    if(!arguments.length) return this._stamp;
    this._stamp = stamp;
    return this;
  };

  proto.dependency = function(type, deps) {
    var d = this._deps[type];
    if(arguments.length === 1) return d;
    if(deps === null) { // Clear dependencies of a certain type
      while(d.length > 0) d.pop();
    } else {
      if(!util.isArray(deps) && d.indexOf(deps) < 0) d.push(deps);
      else d.push.apply(d, util.array(deps));
    }
    return this;
  };

  proto.router = function(bool) {
    if(!arguments.length) return this._isRouter;
    this._isRouter = !!bool
    return this;
  };

  proto.collector = function(bool) {
    if(!arguments.length) return this._isCollector;
    this._isCollector = !!bool;
    return this;
  };

  proto.revises = function(bool) {
    if(!arguments.length) return this._revises;
    this._revises = !!bool;
    return this;
  };

  proto.listeners = function() {
    return this._listeners;
  };

  proto.addListener = function(l) {
    if(!(l instanceof Node)) throw "Listener is not a Node";
    if(this._registered[l._id]) return;

    this._listeners.push(l);
    this._registered[l._id] = 1;
    if(this._rank > l._rank) {
      var q = [l];
      while(q.length) {
        var cur = q.splice(0,1)[0];
        cur._rank = ++this._graph._rank;
        q.push.apply(q, cur._listeners);
      }
    }

    return this;
  };

  proto.removeListener = function (l) {
    var foundSending = false;
    for (var i = 0, len = this._listeners.length; i < len && !foundSending; i++) {
      if (this._listeners[i] === l) {
        this._listeners.splice(i, 1);
        this._registered[l._id] = null;
        foundSending = true;
      }
    }
    
    return foundSending;
  };

  // http://jsperf.com/empty-javascript-array
  proto.disconnect = function() {
    this._listeners = [];
    this._registered = {};
  };

  proto.evaluate = function(pulse) { return pulse; }

  proto.reevaluate = function(pulse) {
    var node = this, reeval = false;
    return REEVAL.some(function(prop) {
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
    Node.prototype.init.call(this, graph);
    this._data = [];
    return this.router(true)
      .collector(true);
  }

  var proto = (Collector.prototype = new Node());

  proto.data = function() { return this._data; }

  proto.evaluate = function(input) {
    util.debug(input, ["collecting"]);

    if(input.reflow) {
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

  return Collector;
});
define('dataflow/Datasource',['require','exports','module','./changeset','./tuple','./Node','./Collector','../util/index','../util/constants'],function(require, exports, module) {
  var changeset = require('./changeset'), 
      tuple = require('./tuple'), 
      Node = require('./Node'),
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
    this._revises = false; // Does any pipeline operator need to track prev?
  };

  var proto = Datasource.prototype;

  proto.source = function(src) {
    if(!arguments.length) return this._source;
    this._source = this._graph.data(src);
    return this;
  };

  proto.add = function(d) {
    var prev = this._revises ? null : undefined;

    this._input.add = this._input.add
      .concat(util.array(d).map(function(d) { return tuple.ingest(d, prev); }));
    return this;
  };

  proto.remove = function(where) {
    var d = this._data.filter(where);
    this._input.rem = this._input.rem.concat(d);
    return this;
  };

  proto.update = function(where, field, func) {
    var mod = this._input.mod,
        prev = this._revises ? null : undefined; 

    this._input.fields[field] = 1;
    this._data.filter(where).forEach(function(x) {
      var prev = x[field],
          next = func(x);
      if (prev !== next) {
        if(x._prev === undefined && prev !== undefined) x._prev = C.SENTINEL;
        tuple.set(x, field, next);
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

  proto.revises = function(p) {
    if(!arguments.length) return this._revises;

    // If we've not needed prev in the past, but a new dataflow node needs it now
    // ensure existing tuples have prev set.
    if(!this._revises && p) { 
      this._data.forEach(function(d) { 
        if(d._prev === undefined) d._prev = C.SENTINEL 
      });
    }

    this._revises = this._revises || p;
    return this;
  };

  proto.last = function() { return this._output; };

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
      ds._revises = pipeline.some(function(p) { return p.revises(); });
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

      if(input.reflow) {
        out.mod = ds._data.slice();
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
        out.mod = delta.mod;
        out.rem = delta.rem;
      }

      return (out.facet = ds._facet, out);
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

  proto.listener = function() { 
    var l = new Node(this._graph),
        dest = this,
        prev = this._revises ? null : undefined;

    l.evaluate = function(input) {
      this._cache = this._cache || {};  // to propagate tuples correctly
      var output  = changeset.create(input);

      output.add = input.add.map(function(t) {
        return (l._cache[t._id] = tuple.derive(t, t._prev !== undefined ? t._prev : prev));
      });
      output.mod = input.mod.map(function(t) { return l._cache[t._id]; });
      output.rem = input.rem.map(function(t) { 
        var o = l._cache[t._id];
        l._cache[t._id] = null;
        return o;
      });

      return (dest._input = output);
    };

    l.addListener(this._pipeline[0]);
    return l;
  };

  proto.addListener = function(l) {
    if(l instanceof Datasource) {
      if(this._collector) this._collector.addListener(l.listener());
      else this._pipeline[0].addListener(l.listener());
    } else {
      this._pipeline[this._pipeline.length-1].addListener(l);      
    }
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
    Node.prototype.init.call(this, graph);
    this._name  = name;
    this._value = init;
    return this;
  };

  var proto = (Signal.prototype = new Node());

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
define('dataflow/Graph',['require','exports','module','heap','./Datasource','./Signal','./changeset','../util/index','../util/constants'],function(require, exports, module) {
  var Heap = require('heap'),
      Datasource = require('./Datasource'),
      Signal = require('./Signal'),
      changeset = require('./changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Graph() {
    this._stamp = 0;
    this._rank  = 0;

    this._data = {};
    this._signals = {};

    this.doNotPropagate = {};
  }

  var proto = Graph.prototype;

  proto.data = function(name, pipeline, facet) {
    if(arguments.length === 1) return this._data[name];
    return (this._data[name] = new Datasource(this, name, facet)
      .pipeline(pipeline));
  };

  function signal(name) {
    var m = this, i, len;
    if(!util.isArray(name)) return this._signals[name];
    return name.map(function(n) { m._signals[n]; });
  }

  proto.signal = function(name, init) {
    var m = this;
    if(arguments.length === 1) return signal.call(this, name);
    return (this._signals[name] = new Signal(this, name, init));
  };

  proto.signalValues = function(name) {
    var graph = this;
    if(!util.isArray(name)) return this._signals[name].value();
    return name.reduce(function(sg, n) {
      return (sg[n] = graph._signals[n].value(), sg);
    }, {});
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

  var schedule = function(a, b) {
    // If the nodes are equal, propagate the non-reflow pulse first,
    // so that we can ignore subsequent reflow pulses. 
    if(a.rank == b.rank) return a.pulse.reflow ? 1 : -1;
    else return a.rank - b.rank; 
  };

  proto.propagate = function(pulse, node) {
    var v, l, n, p, r, i, len, reflowed;

    // new PQ with each propagation cycle so that we can pulse branches
    // of the dataflow graph during a propagation (e.g., when creating
    // a new inline datasource).
    var pq = new Heap(schedule); 

    if(pulse.stamp) throw "Pulse already has a non-zero stamp"

    pulse.stamp = ++this._stamp;
    pq.push({ node: node, pulse: pulse, rank: node.rank() });

    while (pq.size() > 0) {
      v = pq.pop(), n = v.node, p = v.pulse, r = v.rank, l = n._listeners;
      reflowed = p.reflow && n.last() >= p.stamp;

      if(reflowed) continue; // Don't needlessly reflow ops.

      // A node's rank might change during a propagation (e.g. instantiating
      // a group's dataflow branch). Re-queue if it has. T
      // TODO: use pq.replace or pq.poppush?
      if(r != n.rank()) {
        util.debug(p, ['Rank mismatch', r, n.rank()]);
        pq.push({ node: n, pulse: p, rank: n.rank() });
        continue;
      }

      p = this.evaluate(n, p);

      // Even if we didn't run the node, we still want to propagate 
      // the pulse. 
      if (p !== this.doNotPropagate) {
        for (i = 0, len = l.length; i < len; i++) {
          pq.push({ node: l[i], pulse: p, rank: l[i]._rank });
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
      if(node.collector()) collector = node;
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
        data.forEach(function(d) { 
          graph.data(d)
            .revises(n.revises())
            .addListener(c);
        });
      }

      if(signals.length > 0) {
        signals.forEach(function(s) { graph.signal(s).addListener(c); });
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

  proto.reevaluate = function(node, pulse) {
    var reflowed = pulse.reflow && node.last() >= pulse.stamp,
        run = !!pulse.add.length || !!pulse.rem.length || node.router();

    run = run || !reflowed;
    return run || node.reevaluate(pulse);
  };

  proto.evaluate = function(node, pulse) {
    if(!this.reevaluate(node, pulse)) return pulse;
    pulse = node.evaluate(pulse);
    node.last(pulse.stamp);
    return pulse
  };

  return Graph;
});
define('scene/Encoder',['require','exports','module','../dataflow/Node','../util/index','../util/constants'],function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      util = require('../util/index'),
      C = require('../util/constants'),
      EMPTY = {};

  function Encoder(model, mark) {
    var props = mark.def.properties || {},
        update = props.update;

    Node.prototype.init.call(this, model.graph)

    this._model = model;
    this._mark  = mark;

    if(update) {
      this.dependency(C.DATA, update.data);
      this.dependency(C.SCALES, update.scales);
      this.dependency(C.SIGNALS, update.signals);
    }

    return this;
  }

  var proto = (Encoder.prototype = new Node());

  proto.evaluate = function(input) {
    util.debug(input, ["encoding", this._mark.def.type]);
    var items = this._mark.items,
        props = this._mark.def.properties || {},
        enter  = props.enter,
        update = props.update,
        exit   = props.exit,
        i, item;

    // Only do one traversal of items and use item.status instead
    // of input.add/mod/rem.
    for(i=0; i<items.length; ++i) {
      item = items[i];

      // enter set
      if(item.status === C.ENTER) {
        if(enter) encode.call(this, enter, item, input.trans, input.stamp);
        item.status = C.UPDATE;
      }

      // update set      
      if (item.status !== C.EXIT && update) {
        encode.call(this, update, item, input.trans, input.stamp);
      }
      
      // exit set
      if (item.status === C.EXIT) {
        if (exit) encode.call(this, exit, item, input.trans, input.stamp); 
        if (input.trans && !exit) input.trans.interpolate(item, EMPTY);
        else if (!input.trans) items[i--].remove();
      }
    }

    return input;
  };

  function encode(prop, item, trans, stamp) {
    var model = this._model,
        enc = prop.encode,
        sg = this._graph.signalValues(prop.signals||[]),
        db = (prop.data||[]).reduce(function(db, ds) { 
          return db[ds] = model.data(ds).values(), db;
        }, {});

    enc.call(enc, item, item.mark.group||item, trans, db, sg, model.predicates());
  }

  return Encoder;
});

define('core/Bounds',['require','exports','module'],function(require, module, exports) {
  var bounds = function(b) {
    this.clear();
    if (b) this.union(b);
  };
  
  var prototype = bounds.prototype;
  
  prototype.clear = function() {
    this.x1 = +Number.MAX_VALUE;
    this.y1 = +Number.MAX_VALUE;
    this.x2 = -Number.MAX_VALUE;
    this.y2 = -Number.MAX_VALUE;
    return this;
  };
  
  prototype.set = function(x1, y1, x2, y2) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    return this;
  };

  prototype.add = function(x, y) {
    if (x < this.x1) this.x1 = x;
    if (y < this.y1) this.y1 = y;
    if (x > this.x2) this.x2 = x;
    if (y > this.y2) this.y2 = y;
    return this;
  };

  prototype.expand = function(d) {
    this.x1 -= d;
    this.y1 -= d;
    this.x2 += d;
    this.y2 += d;
    return this;
  };
  
  prototype.round = function() {
    this.x1 = Math.floor(this.x1);
    this.y1 = Math.floor(this.y1);
    this.x2 = Math.ceil(this.x2);
    this.y2 = Math.ceil(this.y2);
    return this;
  };

  prototype.translate = function(dx, dy) {
    this.x1 += dx;
    this.x2 += dx;
    this.y1 += dy;
    this.y2 += dy;
    return this;
  };
  
  prototype.rotate = function(angle, x, y) {
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
  }

  prototype.union = function(b) {
    if (b.x1 < this.x1) this.x1 = b.x1;
    if (b.y1 < this.y1) this.y1 = b.y1;
    if (b.x2 > this.x2) this.x2 = b.x2;
    if (b.y2 > this.y2) this.y2 = b.y2;
    return this;
  };

  prototype.encloses = function(b) {
    return b && (
      this.x1 <= b.x1 &&
      this.x2 >= b.x2 &&
      this.y1 <= b.y1 &&
      this.y2 >= b.y2
    );
  };

  prototype.intersects = function(b) {
    return b && !(
      this.x2 < b.x1 ||
      this.x1 > b.x2 ||
      this.y2 < b.y1 ||
      this.y1 > b.y2
    );
  };

  prototype.contains = function(x, y) {
    return !(
      x < this.x1 ||
      x > this.x2 ||
      y < this.y1 ||
      y > this.y2
    );
  };

  prototype.width = function() {
    return this.x2 - this.x1;
  };

  prototype.height = function() {
    return this.y2 - this.y1;
  };

  return bounds;
});
define('render/canvas/path',['require','exports','module','d3','../../core/Bounds'],function(require, module, exports) {
  var d3 = require('d3'),
      Bounds = require('../../core/Bounds');

  // Path parsing and rendering code taken from fabric.js -- Thanks!
  var cmdLength = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 },
      re = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)-/g, /\s|,|###/];

  function parse(path) {
    var result = [],
        currentPath,
        chunks,
        parsed;

    // First, break path into command sequence
    path = path.slice().replace(re[0], '###$1').split(re[1]).slice(1);

    // Next, parse each command in turn
    for (var i=0, j, chunksParsed, len=path.length; i<len; i++) {
      currentPath = path[i];
      chunks = currentPath.slice(1).trim().replace(re[2],'$1###-').split(re[3]);
      chunksParsed = [currentPath.charAt(0)];

      for (var j = 0, jlen = chunks.length; j < jlen; j++) {
        parsed = parseFloat(chunks[j]);
        if (!isNaN(parsed)) {
          chunksParsed.push(parsed);
        }
      }

      var command = chunksParsed[0].toLowerCase(),
          commandLength = cmdLength[command];

      if (chunksParsed.length - 1 > commandLength) {
        for (var k = 1, klen = chunksParsed.length; k < klen; k += commandLength) {
          result.push([ chunksParsed[0] ].concat(chunksParsed.slice(k, k + commandLength)));
        }
      }
      else {
        result.push(chunksParsed);
      }
    }

    return result;
  }

  function drawArc(g, x, y, coords, bounds, l, t) {
    var rx = coords[0];
    var ry = coords[1];
    var rot = coords[2];
    var large = coords[3];
    var sweep = coords[4];
    var ex = coords[5];
    var ey = coords[6];
    var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
    for (var i=0; i<segs.length; i++) {
      var bez = segmentToBezier.apply(null, segs[i]);
      g.bezierCurveTo.apply(g, bez);
      bounds.add(bez[0]-l, bez[1]-t);
      bounds.add(bez[2]-l, bez[3]-t);
      bounds.add(bez[4]-l, bez[5]-t);
    }
  }

  function boundArc(x, y, coords, bounds) {
    var rx = coords[0];
    var ry = coords[1];
    var rot = coords[2];
    var large = coords[3];
    var sweep = coords[4];
    var ex = coords[5];
    var ey = coords[6];
    var segs = arcToSegments(ex, ey, rx, ry, large, sweep, rot, x, y);
    for (var i=0; i<segs.length; i++) {
      var bez = segmentToBezier.apply(null, segs[i]);
      bounds.add(bez[0], bez[1]);
      bounds.add(bez[2], bez[3]);
      bounds.add(bez[4], bez[5]);
    }
  }

  var arcToSegmentsCache = { },
      segmentToBezierCache = { },
      join = Array.prototype.join,
      argsStr;

  // Copied from Inkscape svgtopdf, thanks!
  function arcToSegments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
    argsStr = join.call(arguments);
    if (arcToSegmentsCache[argsStr]) {
      return arcToSegmentsCache[argsStr];
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
    if (th_arc < 0 && sweep == 1){
      th_arc += 2*Math.PI;
    } else if (th_arc > 0 && sweep == 0) {
      th_arc -= 2 * Math.PI;
    }

    var segments = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
    var result = [];
    for (var i=0; i<segments; i++) {
      var th2 = th0 + i * th_arc / segments;
      var th3 = th0 + (i+1) * th_arc / segments;
      result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
    }

    return (arcToSegmentsCache[argsStr] = result);
  }

  function segmentToBezier(cx, cy, th0, th1, rx, ry, sin_th, cos_th) {
    argsStr = join.call(arguments);
    if (segmentToBezierCache[argsStr]) {
      return segmentToBezierCache[argsStr];
    }

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

    return (segmentToBezierCache[argsStr] = [
      a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
      a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
      a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
    ]);
  }

  function render(g, path, l, t) {
    var current, // current instruction
        previous = null,
        x = 0, // current x
        y = 0, // current y
        controlX = 0, // current control point x
        controlY = 0, // current control point y
        tempX,
        tempY,
        tempControlX,
        tempControlY,
        bounds = new Bounds();
    if (l == undefined) l = 0;
    if (t == undefined) t = 0;

    g.beginPath();
  
    for (var i=0, len=path.length; i<len; ++i) {
      current = path[i];

      switch (current[0]) { // first letter

        case 'l': // lineto, relative
          x += current[1];
          y += current[2];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'L': // lineto, absolute
          x = current[1];
          y = current[2];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'h': // horizontal lineto, relative
          x += current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'H': // horizontal lineto, absolute
          x = current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'v': // vertical lineto, relative
          y += current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'V': // verical lineto, absolute
          y = current[1];
          g.lineTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'm': // moveTo, relative
          x += current[1];
          y += current[2];
          g.moveTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'M': // moveTo, absolute
          x = current[1];
          y = current[2];
          g.moveTo(x + l, y + t);
          bounds.add(x, y);
          break;

        case 'c': // bezierCurveTo, relative
          tempX = x + current[5];
          tempY = y + current[6];
          controlX = x + current[3];
          controlY = y + current[4];
          g.bezierCurveTo(
            x + current[1] + l, // x1
            y + current[2] + t, // y1
            controlX + l, // x2
            controlY + t, // y2
            tempX + l,
            tempY + t
          );
          bounds.add(x + current[1], y + current[2]);
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          x = tempX;
          y = tempY;
          break;

        case 'C': // bezierCurveTo, absolute
          x = current[5];
          y = current[6];
          controlX = current[3];
          controlY = current[4];
          g.bezierCurveTo(
            current[1] + l,
            current[2] + t,
            controlX + l,
            controlY + t,
            x + l,
            y + t
          );
          bounds.add(current[1], current[2]);
          bounds.add(controlX, controlY);
          bounds.add(x, y);
          break;

        case 's': // shorthand cubic bezierCurveTo, relative
          // transform to absolute x,y
          tempX = x + current[3];
          tempY = y + current[4];
          // calculate reflection of previous control points
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
          g.bezierCurveTo(
            controlX + l,
            controlY + t,
            x + current[1] + l,
            y + current[2] + t,
            tempX + l,
            tempY + t
          );
          bounds.add(controlX, controlY);
          bounds.add(x + current[1], y + current[2]);
          bounds.add(tempX, tempY);

          // set control point to 2nd one of this command
          // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
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
          g.bezierCurveTo(
            controlX + l,
            controlY + t,
            current[1] + l,
            current[2] + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          bounds.add(current[1], current[2]);
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          // set control point to 2nd one of this command
          // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
          controlX = current[1];
          controlY = current[2];

          break;

        case 'q': // quadraticCurveTo, relative
          // transform to absolute x,y
          tempX = x + current[3];
          tempY = y + current[4];

          controlX = x + current[1];
          controlY = y + current[2];

          g.quadraticCurveTo(
            controlX + l,
            controlY + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'Q': // quadraticCurveTo, absolute
          tempX = current[3];
          tempY = current[4];

          g.quadraticCurveTo(
            current[1] + l,
            current[2] + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          controlX = current[1];
          controlY = current[2];
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
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

          g.quadraticCurveTo(
            controlX + l,
            controlY + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          controlX = x + current[1];
          controlY = y + current[2];
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'T':
          tempX = current[1];
          tempY = current[2];

          // calculate reflection of previous control points
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
          g.quadraticCurveTo(
            controlX + l,
            controlY + t,
            tempX + l,
            tempY + t
          );
          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'a':
          drawArc(g, x + l, y + t, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6] + x + l,
            current[7] + y + t
          ], bounds, l, t);
          x += current[6];
          y += current[7];
          break;

        case 'A':
          drawArc(g, x + l, y + t, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6] + l,
            current[7] + t
          ], bounds, l, t);
          x = current[6];
          y = current[7];
          break;

        case 'z':
        case 'Z':
          g.closePath();
          break;
      }
      previous = current;
    }
    return bounds.translate(l, t);
  }

  function bounds(path, bounds) {
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

    for (var i=0, len=path.length; i<len; ++i) {
      current = path[i];

      switch (current[0]) { // first letter

        case 'l': // lineto, relative
          x += current[1];
          y += current[2];
          bounds.add(x, y);
          break;

        case 'L': // lineto, absolute
          x = current[1];
          y = current[2];
          bounds.add(x, y);
          break;

        case 'h': // horizontal lineto, relative
          x += current[1];
          bounds.add(x, y);
          break;

        case 'H': // horizontal lineto, absolute
          x = current[1];
          bounds.add(x, y);
          break;

        case 'v': // vertical lineto, relative
          y += current[1];
          bounds.add(x, y);
          break;

        case 'V': // verical lineto, absolute
          y = current[1];
          bounds.add(x, y);
          break;

        case 'm': // moveTo, relative
          x += current[1];
          y += current[2];
          bounds.add(x, y);
          break;

        case 'M': // moveTo, absolute
          x = current[1];
          y = current[2];
          bounds.add(x, y);
          break;

        case 'c': // bezierCurveTo, relative
          tempX = x + current[5];
          tempY = y + current[6];
          controlX = x + current[3];
          controlY = y + current[4];
          bounds.add(x + current[1], y + current[2]);
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          x = tempX;
          y = tempY;
          break;

        case 'C': // bezierCurveTo, absolute
          x = current[5];
          y = current[6];
          controlX = current[3];
          controlY = current[4];
          bounds.add(current[1], current[2]);
          bounds.add(controlX, controlY);
          bounds.add(x, y);
          break;

        case 's': // shorthand cubic bezierCurveTo, relative
          // transform to absolute x,y
          tempX = x + current[3];
          tempY = y + current[4];
          // calculate reflection of previous control points
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
          bounds.add(controlX, controlY);
          bounds.add(x + current[1], y + current[2]);
          bounds.add(tempX, tempY);

          // set control point to 2nd one of this command
          // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
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
          x = tempX;
          y = tempY;
          bounds.add(current[1], current[2]);
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          // set control point to 2nd one of this command
          // "... the first control point is assumed to be the reflection of the second control point on the previous command relative to the current point."
          controlX = current[1];
          controlY = current[2];

          break;

        case 'q': // quadraticCurveTo, relative
          // transform to absolute x,y
          tempX = x + current[3];
          tempY = y + current[4];

          controlX = x + current[1];
          controlY = y + current[2];

          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'Q': // quadraticCurveTo, absolute
          tempX = current[3];
          tempY = current[4];

          x = tempX;
          y = tempY;
          controlX = current[1];
          controlY = current[2];
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
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

          x = tempX;
          y = tempY;
          controlX = x + current[1];
          controlY = y + current[2];
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'T':
          tempX = current[1];
          tempY = current[2];

          // calculate reflection of previous control points
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;

          x = tempX;
          y = tempY;
          bounds.add(controlX, controlY);
          bounds.add(tempX, tempY);
          break;

        case 'a':
          boundArc(x, y, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6] + x,
            current[7] + y
          ], bounds);
          x += current[6];
          y += current[7];
          break;

        case 'A':
          boundArc(x, y, [
            current[1],
            current[2],
            current[3],
            current[4],
            current[5],
            current[6],
            current[7]
          ], bounds);
          x = current[6];
          y = current[7];
          break;

        case 'z':
        case 'Z':
          break;
      }
      previous = current;
    }
    return bounds;
  }
  
  function area(items) {
    var o = items[0];
    var area = d3.svg.area()
      .x(function(d) { return d.x; })
      .y1(function(d) { return d.y; })
      .y0(function(d) { return d.y + d.height; });
    if (o.interpolate) area.interpolate(o.interpolate);
    if (o.tension != null) area.tension(o.tension);
    return area(items);
  }

  function line(items) {
    var o = items[0];
    var line = d3.svg.line()
     .x(function(d) { return d.x; })
     .y(function(d) { return d.y; });
    if (o.interpolate) line.interpolate(o.interpolate);
    if (o.tension != null) line.tension(o.tension);
    return line(items);
  }
  
  return {
    parse:  parse,
    render: render,
    bounds: bounds,
    area:   area,
    line:   line
  };
  
});
define('util/bounds',['require','exports','module','../core/Bounds','../render/canvas/path','./index','./config'],function(require, module, exports) {
  var Bounds = require('../core/Bounds'),
      canvas = require('../render/canvas/path'),
      util = require('./index'),
      config = require('./config');

  var parse = canvas.parse,
      boundPath = canvas.bounds,
      areaPath = canvas.area,
      linePath = canvas.line,
      halfpi = Math.PI / 2,
      sqrt3 = Math.sqrt(3),
      tan30 = Math.tan(30 * Math.PI / 180),
      gfx = null;

  function context() {
    // TODO: how to check if nodeJS in requireJS?
    return gfx || (gfx = (/*config.isNode
      ? new (require("canvas"))(1,1)
      : */d3.select("body").append("canvas")
          .attr("class", "vega_hidden")
          .attr("width", 1)
          .attr("height", 1)
          .style("display", "none")
          .node())
      .getContext("2d"));
  }

  function pathBounds(o, path, bounds) {
    if (path == null) {
      bounds.set(0, 0, 0, 0);
    } else {
      boundPath(path, bounds);
      if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
        bounds.expand(o.strokeWidth);
      }
    }
    return bounds;
  }

  function path(o, bounds) {
    var p = o.path
      ? o.pathCache || (o.pathCache = parse(o.path))
      : null;
    return pathBounds(o, p, bounds);
  }
  
  function area(o, bounds) {
    var items = o.mark.items, o = items[0];
    var p = o.pathCache || (o.pathCache = parse(areaPath(items)));
    return pathBounds(items[0], p, bounds);
  }

  function line(o, bounds) {
    var items = o.mark.items, o = items[0];
    var p = o.pathCache || (o.pathCache = parse(linePath(items)));
    return pathBounds(items[0], p, bounds);
  }

  function rect(o, bounds) {
    var x = o.x || 0,
        y = o.y || 0,
        w = (x + o.width) || 0,
        h = (y + o.height) || 0;
    bounds.set(x, y, w, h);
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }

  function image(o, bounds) {
    var w = o.width || 0,
        h = o.height || 0,
        x = (o.x||0) - (o.align === "center"
            ? w/2 : (o.align === "right" ? w : 0)),
        y = (o.y||0) - (o.baseline === "middle"
            ? h/2 : (o.baseline === "bottom" ? h : 0));
    return bounds.set(x, y, x+w, y+h);
  }

  function rule(o, bounds) {
    var x1, y1;
    bounds.set(
      x1 = o.x || 0,
      y1 = o.y || 0,
      o.x2 != null ? o.x2 : x1,
      o.y2 != null ? o.y2 : y1
    );
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }
  
  function arc(o, bounds) {
    var cx = o.x || 0,
        cy = o.y || 0,
        ir = o.innerRadius || 0,
        or = o.outerRadius || 0,
        sa = (o.startAngle || 0) - halfpi,
        ea = (o.endAngle || 0) - halfpi,
        xmin = Infinity, xmax = -Infinity,
        ymin = Infinity, ymax = -Infinity,
        a, i, n, x, y, ix, iy, ox, oy;

    var angles = [sa, ea],
        s = sa - (sa%halfpi);
    for (i=0; i<4 && s<ea; ++i, s+=halfpi) {
      angles.push(s);
    }

    for (i=0, n=angles.length; i<n; ++i) {
      a = angles[i];
      x = Math.cos(a); ix = ir*x; ox = or*x;
      y = Math.sin(a); iy = ir*y; oy = or*y;
      xmin = Math.min(xmin, ix, ox);
      xmax = Math.max(xmax, ix, ox);
      ymin = Math.min(ymin, iy, oy);
      ymax = Math.max(ymax, iy, oy);
    }

    bounds.set(cx+xmin, cy+ymin, cx+xmax, cy+ymax);
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }

  function symbol(o, bounds) {
    var size = o.size != null ? o.size : 100,
        x = o.x || 0,
        y = o.y || 0,
        r, t, rx, ry;

    switch (o.shape) {
      case "cross":
        r = Math.sqrt(size / 5) / 2;
        t = 3*r;
        bounds.set(x-t, y-r, x+t, y+r);
        break;

      case "diamond":
        ry = Math.sqrt(size / (2 * tan30));
        rx = ry * tan30;
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      case "square":
        t = Math.sqrt(size);
        r = t / 2;
        bounds.set(x-r, y-r, x+r, y+r);
        break;

      case "triangle-down":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      case "triangle-up":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        bounds.set(x-rx, y-ry, x+rx, y+ry);
        break;

      default:
        r = Math.sqrt(size/Math.PI);
        bounds.set(x-r, y-r, x+r, y+r);
    }
    if (o.stroke && o.opacity !== 0 && o.strokeWidth > 0) {
      bounds.expand(o.strokeWidth);
    }
    return bounds;
  }

  function text(o, bounds, noRotate) {
    var x = (o.x || 0) + (o.dx || 0),
        y = (o.y || 0) + (o.dy || 0),
        h = o.fontSize || config.render.fontSize,
        a = o.align,
        b = o.baseline,
        r = o.radius || 0,
        g = context(), w, t;

    g.font = util.fontString(o);
    g.textAlign = a || "left";
    g.textBaseline = b || "alphabetic";
    w = g.measureText(o.text || "").width;

    if (r) {
      t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    // horizontal
    if (a === "center") {
      x = x - (w / 2);
    } else if (a === "right") {
      x = x - w;
    } else {
      // left by default, do nothing
    }

    /// TODO find a robust solution for heights.
    /// These offsets work for some but not all fonts.

    // vertical
    if (b === "top") {
      y = y + (h/5);
    } else if (b === "bottom") {
      y = y - h;
    } else if (b === "middle") {
      y = y - (h/2) + (h/10);
    } else {
      y = y - 4*h/5; // alphabetic by default
    }
    
    bounds.set(x, y, x+w, y+h);
    if (o.angle && !noRotate) {
      bounds.rotate(o.angle*Math.PI/180, o.x||0, o.y||0);
    }
    return bounds.expand(noRotate ? 0 : 1);
  }

  function group(g, bounds, includeLegends) {
    var axes = g.axisItems || [],
        legends = g.legendItems || [], j, m;

    for (j=0, m=axes.length; j<m; ++j) {
      bounds.union(axes[j].bounds);
    }
    for (j=0, m=g.items.length; j<m; ++j) {
      bounds.union(g.items[j].bounds);
    }
    if (includeLegends) {
      for (j=0, m=legends.length; j<m; ++j) {
        bounds.union(legends[j].bounds);
      }
      if (g.width != null && g.height != null) {
        bounds.add(g.width, g.height);
      }
      if (g.x != null && g.y != null) {
        bounds.add(0, 0);
      }
    }
    bounds.translate(g.x||0, g.y||0);
    return bounds;
  }

  var methods = {
    group:  group,
    symbol: symbol,
    image:  image,
    rect:   rect,
    rule:   rule,
    arc:    arc,
    text:   text,
    path:   path,
    area:   area,
    line:   line
  };

  function itemBounds(item, func, opt) {
    func = func || methods[item.mark.marktype];
    if (!item.bounds_prev) item['bounds:prev'] = new Bounds();
    var b = item.bounds, pb = item['bounds:prev'];
    if (b) pb.clear().union(b);
    item.bounds = func(item, b ? b.clear() : new Bounds(), opt);
    if (!b) pb.clear().union(item.bounds);
    return item.bounds;
  }

  function markBounds(mark, bounds, opt) {
    bounds = bounds || mark.bounds && mark.bounds.clear() || new Bounds();
    var type  = mark.marktype,
        func  = methods[type],
        items = mark.items,
        item, i, len;
        
    if (type==="area" || type==="line") {
      if (items.length) {
        items[0].bounds = func(items[0], bounds);
      }
    } else {
      for (i=0, len=items.length; i<len; ++i) {
        bounds.union(itemBounds(items[i], func, opt));
      }
    }
    mark.bounds = bounds;
  }
  
  return {
    mark:  markBounds,
    item:  itemBounds,
    text:  text,
    group: group
  };
});
define('scene/Bounder',['require','exports','module','../dataflow/Node','../util/bounds','../util/constants','../util/index'],function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      bounds = require('../util/bounds'),
      C = require('../util/constants'),
      util = require('../util/index');

  function Bounder(model, mark) {
    this._mark = mark;
    return Node.prototype.init.call(this, model.graph);
  }

  var proto = (Bounder.prototype = new Node());

  proto.evaluate = function(input) {
    util.debug(input, ["bounds", this._mark.marktype]);

    bounds.mark(this._mark);
    if(this._mark.marktype === C.GROUP) 
      bounds.mark(this._mark, null, false);

    input.reflow = true;
    return input;
  };

  return Bounder;
});
define('scene/Item',['require','exports','module'],function(require, module, exports) {
  function item(mark) {
    this.mark = mark;
  }
  
  var prototype = item.prototype;

  prototype.hasPropertySet = function(name) {
    var props = this.mark.def.properties;
    return props && props[name] != null;
  };

  prototype.cousin = function(offset, index) {
    if (offset === 0) return this;
    offset = offset || -1;
    var mark = this.mark,
        group = mark.group,
        iidx = index==null ? mark.items.indexOf(this) : index,
        midx = group.items.indexOf(mark) + offset;
    return group.items[midx].items[iidx];
  };
  
  prototype.sibling = function(offset) {
    if (offset === 0) return this;
    offset = offset || -1;
    var mark = this.mark,
        iidx = mark.items.indexOf(this) + offset;
    return mark.items[iidx];
  };
  
  prototype.remove = function() {
    var item = this,
        list = item.mark.items,
        i = list.indexOf(item);
    if (i >= 0) (i===list.length-1) ? list.pop() : list.splice(i, 1);
    return item;
  };
  
  prototype.touch = function() {
    if (this.pathCache) this.pathCache = null;
    if (this.mark.pathCache) this.mark.pathCache = null;
  };
  
  return item;
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
      
  function expr(graph, x) {
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
        if(graph.signal((ns = util.field(ns))[0])) {
          sg[ns[0]] = 1;
          v = util.field(tokens[i+2]);
          tokens[i] = "sg['"+tokens[i];
          tokens[i+2] = tokens[i+2].replace(v[0], v[0]+"']");
          i+=2;
        }
      }
      if(graph.signal((v = util.field(t))[0])) {
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

  expr.eval = function(graph, fn, d, e, i, p, sg) {
    sg = graph.signalValues(util.array(sg));
    return fn.call(null, d, e, i, p, sg);
  };

  return expr;
});
define('transforms/Parameter',['require','exports','module','../parse/expr','../util/index','../util/constants'],function(require, exports, module) {
  var expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  var arrayType = /array/i,
      dataType  = /data/i,
      fieldType = /field/i,
      exprType  = /expr/i;

  function Parameter(name, type) {
    this._name = name;
    this._type = type;

    // If parameter is defined w/signals, it must be resolved
    // on every pulse.
    this._value = [];
    this._accessors = [];
    this._resolution = false;
    this._signals = {};
  }

  var proto = Parameter.prototype;

  proto._get = function() {
    var isArray = arrayType.test(this._type),
        isData  = dataType.test(this._type),
        isField = fieldType.test(this._type);

    if(isData) {
      return isArray ? { names: this._value, sources: this._accessors } :
        { name: this._value[0], source: this._accessors[0] };
    } else if(isField) {
      return isArray ? { fields: this._value, accessors: this._accessors } :
        { field: this._value[0], accessor: this._accessors[0] };
    } else {
      return isArray ? this._value : this._value[0];
    }
  };

  proto.get = function(graph) {
    var isData  = dataType.test(this._type),
        isField = fieldType.test(this._type),
        s, idx, val;

    // If we don't require resolution, return the value immediately.
    if(!this._resolution) return this._get();

    if(isData) {
      this._accessors = this._value.map(function(v) { return graph.data(v); });
      return this._get(); // TODO: support signal as dataTypes
    }

    for(s in this._signals) {
      idx  = this._signals[s];
      val  = graph.signalRef(s);

      if(isField) {
        this._accessors[idx] = this._value[idx] != val ? 
          util.accessor(val) : this._accessors[idx];
      }

      this._value[idx] = val;
    }

    return this._get();
  };

  proto.set = function(transform, value) {
    var param = this, 
        isExpr = exprType.test(this._type),
        isData  = dataType.test(this._type),
        isField = fieldType.test(this._type);

    this._value = util.array(value).map(function(v, i) {
      if(util.isString(v)) {
        if(isExpr) {
          var e = expr(transform._graph, v);
          transform.dependency(C.FIELDS,  e.fields);
          transform.dependency(C.SIGNALS, e.signals);
          return e.fn;
        } else if(isField) {  // Backwards compatibility
          param._accessors[i] = util.accessor(v);
          transform.dependency(C.FIELDS, v);
        } else if(isData) {
          param._resolution = true;
          transform.dependency(C.DATA, v);
        }
        return v;
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

      return v;
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
    if(graph) Node.prototype.init.call(this, graph);
    return this;
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

  proto.clone = function() {
    var n = Node.prototype.clone.call(this);
    n.transform = this.transform;
    for(var k in this) { n[k] = this[k]; }
    return n;
  };

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
define('util/bins',['require','exports','module'],function(require, module, exports) {

  function bisect(a, x) {
    var lo = 0, hi = a.length;
    while (lo < hi) {
      var mid = lo + hi >>> 1;
      if (a[mid] < x) { lo = mid + 1; }
      else { hi = mid; }
    }
    return lo;
  }
  
  function bins(opt) {
    opt = opt || {};

    // determine range
    var maxb = opt.maxbins || 1024,
        base = opt.base || 10,
        div = opt.div || [5, 2],
        mins = opt.minstep || 0,
        logb = Math.log(base),
        level = Math.ceil(Math.log(maxb) / logb),
        min = opt.min,
        max = opt.max,
        span = max - min,
        step = Math.max(mins, Math.pow(base, Math.round(Math.log(span) / logb) - level)),
        nbins = Math.ceil(span / step),
        precision, v, i, eps;

    if (opt.step != null) {
      step = opt.step;
    } else if (opt.steps) {
      // if provided, limit choice to acceptable step sizes
      i = bisect(opt.steps, span / maxb);
      if (i === opt.steps.length) --i;
      step = opt.steps[i];
    } else {
      // increase step size if too many bins
      do {
        step *= base;
        nbins = Math.ceil(span / step);
      } while (nbins > maxb);

      // decrease step size if allowed
      for (i = 0; i < div.length; ++i) {
        v = step / div[i];
        if (v >= mins && span / v <= maxb) {
          step = v;
          nbins = Math.ceil(span / step);
        }
      }
    }

    // update precision, min and max
    v = Math.log(step);
    precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
    eps = (min<0 ? -1 : 1) * Math.pow(base, -precision - 1);
    min = Math.min(min, Math.floor(min / step + eps) * step);
    max = Math.ceil(max / step) * step;

    return {
      start: min,
      stop: max,
      step: step,
      unit: precision
    };
  }

  return bins;
});
define('transforms/Bin',['require','exports','module','./Transform','../util/index','../util/bins','../dataflow/tuple'],function(require, exports, module) {
  var Transform = require('./Transform'),
      util = require('../util/index'),
      bins = require('../util/bins'),
      tuple = require('../dataflow/tuple');

  function Bin(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      on: {type: "field"},
      min: {type: "value"},
      max: {type: "value"},
      step: {type: "value"},
      maxbins: {type: "value", default: 20}
    });

    this._output = {"bin": "bin"};
    return this;
  }

  var proto = (Bin.prototype = new Transform());

  proto.transform = function(input) {
    var transform = this,
        output = this._output.bin;
        
    var b = bins({
      min: this.min.get(),
      max: this.max.get(),
      step: this.step.get(),
      maxbins: this.maxbins.get()
    });

    function update(d) {
      var v = transform.on.get().accessor(d);
      v = v == null ? null
        : b.start + b.step * ~~((v - b.start) / b.step);
      tuple.set(d, output, v, input.stamp);
    }
    input.add.forEach(update);
    input.mod.forEach(update);
    input.rem.forEach(update);

    return input;
  };

  return Bin
});
define('transforms/Aggregate',['require','exports','module','./Transform','../dataflow/tuple','../dataflow/changeset','../util/index','../util/constants'],function(require, exports, module) {
  var Transform = require('./Transform'),
      tuple = require('../dataflow/tuple'),
      changeset = require('../dataflow/changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Aggregate(graph) {
    if(graph) this.init(graph);
    return this; 
  }

  var proto = (Aggregate.prototype = new Transform());

  proto.init = function(graph) {
    this._refs  = []; // accessors to groupby fields
    this._cells = {};
    return Transform.prototype.init.call(this, graph)
      .router(true).revises(true);
  };

  proto.data = function() { return this._cells; };

  proto._reset = function(input, output) {
    var k, c;
    for(k in this._cells) {
      if(!(c = this._cells[k])) continue;
      output.rem.push(c.tpl);
    }
    this._cells = {};
  };

  proto._keys = function(x) {
    var keys = this._refs.reduce(function(g, f) {
      return ((v = f(x)) !== undefined) ? (g.push(v), g) : g;
    }, []), k = keys.join("|"), v;
    return keys.length > 0 ? {keys: keys, key: k} : undefined;
  };

  proto._cell = function(x) {
    var k = this._keys(x);
    return this._cells[k.key] || (this._cells[k.key] = this._new_cell(x, k));
  };

  proto._new_cell = function(x, k) {
    return {
      cnt: 0,
      tpl: this._new_tuple(x, k),
      flg: C.ADD_CELL
    };
  };

  proto._new_tuple = function(x, k) {
    return tuple.derive(null, null);
  };

  proto._add = function(x) {
    var cell = this._cell(x);
    cell.cnt += 1;
    cell.flg |= C.MOD_CELL;
    return cell;
  };

  proto._rem = function(x) {
    var cell = this._cell(x);
    cell.cnt -= 1;
    cell.flg |= C.MOD_CELL;
    return cell;
  };

  proto._mod = function(x, reset) {
    if(x._prev && x._prev !== C.SENTINEL && this._keys(x._prev) !== undefined) {
      this._rem(x._prev);
      return this._add(x);
    } else if(reset) { // Signal change triggered reflow
      return this._add(x);
    }
    return this._cell(x);
  };

  proto.transform = function(input, reset) {
    var aggregate = this,
        output = changeset.create(input),
        k, c, f, t;

    if(reset) this._reset(input, output);

    input.add.forEach(function(x) { aggregate._add(x); });
    input.mod.forEach(function(x) { aggregate._mod(x, reset); });
    input.rem.forEach(function(x) {
      if(x._prev && x._prev !== C.SENTINEL && aggregate._keys(x._prev) !== undefined) {
        aggregate._rem(x._prev)
      } else {
        aggregate._rem(x);
      }
    });

    for(k in this._cells) {
      c = this._cells[k];
      if(!c) continue;
      f = c.flg, t = c.tpl;

      if(c.cnt === 0) {
        if(f === C.MOD_CELL) output.rem.push(t);
        this._cells[k] = null;
      } else if(f & C.ADD_CELL) {
        output.add.push(t);
      } else if(f & C.MOD_CELL) {
        output.mod.push(t)
      }
      c.flg = 0;
    }

    return output;
  }

  return Aggregate;
});
define('transforms/Facet',['require','exports','module','./Transform','./Aggregate','../dataflow/tuple','../dataflow/changeset','../util/index','../util/constants'],function(require, exports, module) {
  var Transform = require('./Transform'),
      Aggregate = require('./Aggregate'),
      tuple = require('../dataflow/tuple'), 
      changeset = require('../dataflow/changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Facet(graph) {
    Aggregate.prototype.init.call(this, graph);
    Transform.addParameters(this, {keys: {type: "array<field>"} });

    this._pipeline = [];
    return this;
  }

  var proto = (Facet.prototype = new Aggregate());

  proto.pipeline = function(pipeline) {
    if(!arguments.length) return this._pipeline;
    this._pipeline = pipeline;
    return this;
  };

  proto._reset = function(input, output) {
    var k, c;
    for(k in this._cells) {
      c = this._cells[k];
      if(!c) continue;
      output.rem.push(c.tpl);
      c.delete();
    }
    this._cells = {};
  };

  proto._new_tuple = function(x, k) {
    return tuple.ingest(k, null);
  };

  proto._new_cell = function(x, k) {
    // Rather than sharing the pipeline between all nodes,
    // give each cell its individual pipeline. This allows
    // dynamically added collectors to do the right thing
    // when wiring up the pipelines.
    var cell = Aggregate.prototype._new_cell.call(this, x, k),
        pipeline = this._pipeline.map(function(n) { return n.clone(); }),
        facet = this,
        t = cell.tpl;

    cell.ds = this._graph.data("vg_"+t._id, pipeline, t);
    cell.delete = function() {
      util.debug({}, ["deleting cell", k.key]);
      facet.removeListener(pipeline[0]);
      facet._graph.disconnect(pipeline);
    };

    this.addListener(pipeline[0]);

    return cell;
  };

  proto._add = function(x) {
    var cell = Aggregate.prototype._add.call(this, x);
    cell.ds._input.add.push(x);
    return cell;
  };

  proto._mod = function(x, reset) {
    var cell = Aggregate.prototype._mod.call(this, x, reset);
    if(!(cell.flg & C.ADD_CELL)) cell.ds._input.mod.push(x); // Propagate tuples
    cell.flg |= C.MOD_CELL;
    return cell;
  };

  proto._rem = function(x) {
    var cell = Aggregate.prototype._rem.call(this, x);
    cell.ds._input.rem.push(x);
    return cell;
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["faceting"]);

    this._refs = this.keys.get(this._graph).accessors;

    var output = Aggregate.prototype.transform.call(this, input, reset),
        k, c;

    for(k in this._cells) {
      c = this._cells[k];
      if(c == null) continue;
      if(c.cnt === 0) {
        c.delete();
      } else {
        // propagate sort, signals, fields, etc.
        changeset.copy(input, c.ds._input);
      }
    }

    return output;
  };

  return Facet;
});
define('transforms/Filter',['require','exports','module','./Transform','../dataflow/changeset','../parse/expr','../util/index','../util/constants'],function(require, exports, module) {
  var Transform = require('./Transform'),
      changeset = require('../dataflow/changeset'), 
      expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Filter(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {test: {type: "expr"} });

    this._skip = {};
    return this;
  }

  var proto = (Filter.prototype = new Transform());

  function test(x) {
    return expr.eval(this._graph, this.test.get(this._graph), 
      x, null, null, null, this.dependency(C.SIGNALS));
  };

  proto.transform = function(input) {
    util.debug(input, ["filtering"]);
    var output = changeset.create(input),
        skip = this._skip,
        f = this;

    input.rem.forEach(function(x) {
      if (skip[x._id] !== 1) output.rem.push(x);
      else skip[x._id] = 0;
    });

    input.add.forEach(function(x) {
      if (test.call(f, x)) output.add.push(x);
      else skip[x._id] = 1;
    });

    input.mod.forEach(function(x) {
      var b = test.call(f, x),
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

  return Filter;
});
define('transforms/Fold',['require','exports','module','./Transform','../util/index','../dataflow/tuple','../dataflow/changeset'],function(require, exports, module) {
  var Transform = require('./Transform'),
      util = require('../util/index'), 
      tuple = require('../dataflow/tuple'), 
      changeset = require('../dataflow/changeset');

  function Fold(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      on: {type: "array<field>"} 
    });

    this._output = {key: "key", value: "value"};
    this._cache = {};

    return this.router(true).revises(true);
  }

  var proto = (Fold.prototype = new Transform());

  function rst(input, output) { 
    for(var id in this._cache) output.rem.push.apply(output.rem, this._cache[id]);
    this._cache = {};
  };

  function get_tuple(x, i, len) {
    var list = this._cache[x._id] || (this._cache[x._id] = Array(len));
    return list[i] || (list[i] = tuple.derive(x, x._prev));
  };

  function fn(data, fields, accessors, out, stamp) {
    var i = 0, dlen = data.length,
        j, flen = fields.length,
        d, t;

    for(; i<dlen; ++i) {
      d = data[i];
      for(j=0; j<flen; ++j) {
        t = get_tuple.call(this, d, j, flen);  
        tuple.set(t, this._output.key, fields[j]);
        tuple.set(t, this._output.value, accessors[j](d));
        out.push(t);
      }      
    }
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["folding"]);

    var fold = this,
        on = this.on.get(this._graph),
        fields = on.fields, accessors = on.accessors,
        output = changeset.create(input);

    if(reset) rst.call(this, input, output);

    fn.call(this, input.add, fields, accessors, output.add, input.stamp);
    fn.call(this, input.mod, fields, accessors, output.mod, input.stamp);
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

  return Fold;
});
define('transforms/Formula',['require','exports','module','./Transform','../dataflow/tuple','../parse/expr','../util/index','../util/constants'],function(require, exports, module) {
  var Transform = require('./Transform'),
      tuple = require('../dataflow/tuple'), 
      expr = require('../parse/expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Formula(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      field: {type: "value"},
      expr:  {type: "expr"}
    });

    return this;
  }

  var proto = (Formula.prototype = new Transform());

  function f(x, field, stamp) {
    var val = expr.eval(this._graph, this.expr.get(this._graph), 
      x, null, null, null, this.dependency(C.SIGNALS));

    tuple.set(x, field, val); 
  };

  proto.transform = function(input) {
    util.debug(input, ["formulating"]);
    var t = this, 
        field = this.field.get(this._graph);

    input.add.forEach(function(x) { f.call(t, x, field, input.stamp) });;
    input.mod.forEach(function(x) { f.call(t, x, field, input.stamp) });
    input.fields[field] = 1;
    return input;
  };

  return Formula;
});
define('transforms/Sort',['require','exports','module','./Transform','../parse/expr','../util/index'],function(require, exports, module) {
  var Transform = require('./Transform'),
      expr = require('../parse/expr'),
      util = require('../util/index');

  function Sort(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {by: {type: "array<field>"} });
    return this.router(true);
  }

  var proto = (Sort.prototype = new Transform());

  proto.transform = function(input) {
    util.debug(input, ["sorting"]);

    if(input.add.length || input.mod.length || input.rem.length) {
      input.sort = util.comparator(this.by.get(this._graph).fields);
    }

    return input;
  };

  return Sort;
});
define('util/quickselect',[],function() {
  return function quickselect(k, x) {
    function swap(a, b) {
      var t = x[a];
      x[a] = x[b];
      x[b] = t;
    }
    
    var left = 0,
        right = x.length - 1,
        pos, i, pivot;
    
    while (left < right) {
      pivot = x[k];
      swap(k, right);
      for (i = pos = left; i < right; ++i) {
        if (x[i] < pivot) { swap(i, pos++); }
      }
      swap(right, pos);
      if (pos === k) break;
      if (pos < k) left = pos + 1;
      else right = pos - 1;
    }
    return x[k];
  };
});
define('transforms/measures',['require','exports','module','../dataflow/tuple','../util/quickselect','../util/constants'],function(require, exports, module) {
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
      init: "this.val = [];",
      add:  "this.val.push(v);",
      rem:  "this.val[this.val.indexOf(v)] = this.val[this.val.length-1];" +
            "this.val.length = this.val.length - 1;",
      set:  "this.sel(~~(this.cnt/2), this.val)",
      req: ["count"], idx: 6
    }),
    "min": measure({
      name: "min",
      init: "",
      add: "",
      rem: "",
      set: "this.sel(0, this.val)",
      req: ["median"]
    }),
    "max": measure({
      name: "max",
      init: "",
      add: "",
      rem: "",
      set: "this.sel(this.val.length-1, this.val)",
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
define('transforms/Stats',['require','exports','module','./Transform','./Aggregate','../dataflow/tuple','../dataflow/changeset','./measures','../util/index','../util/constants'],function(require, exports, module) {
  var Transform = require('./Transform'),
      Aggregate = require('./Aggregate'),
      tuple = require('../dataflow/tuple'), 
      changeset = require('../dataflow/changeset'), 
      meas = require('./measures'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Stats(graph) {
    Aggregate.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      group_by: {type: "array<field>"},
      on: {type: "field"} 
    });

    this._output = {
      "count":    "count",
      "avg":      "avg",
      "min":      "min",
      "max":      "max",
      "sum":      "sum",
      "mean":     "mean",
      "var":      "var",
      "stdev":    "stdev",
      "varp":     "varp",
      "stdevp":   "stdevp",
      "median":   "median"
    };

    // Measures parameter handled manually.
    this._Measures = null;

    // The group_by might come via the facet. Store that to 
    // short-circuit usual Aggregate methods.
    this.__facet = null;

    return this;
  }

  var proto = (Stats.prototype = new Aggregate());

  proto.measures = { 
    set: function(transform, aggs) {
      if(aggs.indexOf(C.COUNT) < 0) aggs.push(C.COUNT); // Need count for correct Aggregate propagation.
      transform._Measures = meas.create(aggs.map(function(a) { 
        return meas[a](transform._output[a]); 
      }));
      return transform;
    }
  };

  proto._reset = function(input, output) {
    var k, c
    for(k in this._cells) { 
      if(!(c = this._cells[k])) continue;
      if(!input.facet) output.rem.push(c.set());
    }
    this._cells = {};
  };

  proto._keys = function(x) {
    if(this.__facet) return this.__facet;
    else if(this._refs.length) return Aggregate.prototype._keys.call(this, x);
    return {keys: [], key: ""}; // Stats on a flat datasource
  };

  proto._new_cell = function(x, k) {
    var cell = this.__facet || tuple.derive(x, x._prev);
    return new this._Measures(cell);
  };

  proto._add = function(x) {
    var field = this.on.get(this._graph).accessor;
    this._cell(x).add(field(x));
  };

  proto._rem = function(x) {
    var field = this.on.get(this._graph).accessor;
    this._cell(x).rem(field(x));
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["stats"]);

    if(input.facet) {
      this.__facet = input.facet;
    } else {
      this._refs = this.group_by.get(this._graph).accessors;
    }

    var output = Aggregate.prototype.transform.call(this, input, reset),
        k, c;

    if(input.facet) {
      this._cells[input.facet.key].set();
      return input;
    } else {
      for(k in this._cells) {
        c = this._cells[k];
        if(!c) continue;
        c.set();
      }
      return output;
    }
  };

  return Stats;
});
define('transforms/Unique',['require','exports','module','./Transform','./Aggregate','../dataflow/tuple','../util/index'],function(require, exports, module) {
  var Transform = require('./Transform'),
      Aggregate = require('./Aggregate'),
      tuple = require('../dataflow/tuple'),
      util = require('../util/index');

  function Unique(graph) {
    Aggregate.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      on: {type: "field"},
      as: {type: "value"}
    });

    return this;
  }

  var proto = (Unique.prototype = new Aggregate());

  proto._new_tuple = function(x) {
    var o  = {},
        on = this.on.get(this._graph),
        as = this.as.get(this._graph);

    o[as] = on.accessor(x);
    return tuple.ingest(o, null);
  };

  proto.transform = function(input, reset) {
    util.debug(input, ["uniques"]);
    this._refs = [this.on.get(this._graph).accessor];
    return Aggregate.prototype.transform.call(this, input, reset);
  };

  return Unique;
});
define('transforms/Zip',['require','exports','module','./Transform','../dataflow/Collector','../util/index'],function(require, exports, module) {
  var Transform = require('./Transform'),
      Collector = require('../dataflow/Collector'),
      util = require('../util/index');

  function Zip(graph) {
    Transform.prototype.init.call(this, graph);
    Transform.addParameters(this, {
      with: {type: "data"},
      as:  {type: "value"},
      key: {type: "field", default: "data"},
      withKey: {type: "field", default: null},
      default: {type: "value"}
    });

    this._map = {};
    this._collector = new Collector(graph);
    this._lastJoin = 0;

    return this.revises(true);
  }

  var proto = (Zip.prototype = new Transform());

  function mp(k) {
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
        map = mp.bind(this);

    util.debug(input, ["zipping", w.name]);

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
            var prev;
            if(!x._prev || (prev = withKey.accessor(x._prev)) === undefined) return;
            var prevm = map(prev);
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
          var prev;
          if(!x._prev || (prev = key.accessor(x._prev)) === undefined) return;

          map(prev)[0] = null;
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
define('transforms/index',['require','exports','module','./Bin','./Facet','./Filter','./Fold','./Formula','./Sort','./Stats','./Unique','./Zip'],function(require, exports, module) {
  return {
    bin:        require('./Bin'),
    facet:      require('./Facet'),
    filter:     require('./Filter'),
    fold:       require('./Fold'),
    formula:    require('./Formula'),
    sort:       require('./Sort'),
    stats:      require('./Stats'),
    unique:     require('./Unique'),
    zip:        require('./Zip')
  };
});
define('parse/transforms',['require','exports','module','../util/index','../transforms/index'],function(require, exports, module) {
  var util = require('../util/index'),
      transforms = require('../transforms/index');

  return function parseTransforms(model, def) {
    var tx = new transforms[def.type](model.graph);
    if(def.type == 'facet') {
      var pipeline = (def.transform||[])
        .map(function(t) { return parseTransforms(model, t); });
      tx.pipeline(pipeline);
    }

    // We want to rename output fields before setting any other properties,
    // as subsequent properties may require output to be set (e.g. aggregate).
    if(def.output) tx.output(def.output);

    util.keys(def).forEach(function(k) {
      if(k === 'type' || k === 'output') return;
      if(k === 'transform' && def.type === 'facet') return;
      (tx[k]).set(tx, def[k]);
    });

    return tx;
  }
});
define('parse/modify',['require','exports','module','../dataflow/Node','../dataflow/tuple','../util/index','../util/constants'],function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      tuple = require('../dataflow/tuple'),
      util = require('../util/index'),
      C = require('../util/constants');

  var filter = function(field, value, src, dest) {
    for(var i = src.length-1; i >= 0; --i) {
      if(src[i][field] == value)
        dest.push.apply(dest, src.splice(i, 1));
    }
  };

  return function parseModify(model, def, ds) {
    var graph = model.graph,
        signal = def.signal ? util.field(def.signal) : null, 
        signalName = signal ? signal[0] : null,
        predicate = def.predicate ? model.predicate(def.predicate) : null,
        reeval = (predicate === null),
        node = new Node(graph);

    node.evaluate = function(input) {
      if(predicate !== null) {
        var db = {};
        (predicate.data||[]).forEach(function(d) { db[d] = model.data(d).values(); });

        // TODO: input
        reeval = predicate({}, db, graph.signalValues(predicate.signals||[]), model._predicates);
      }

      util.debug(input, [def.type+"ing", reeval]);
      if(!reeval) return input;

      var datum = {}, 
          value = signal ? graph.signalRef(def.signal) : null,
          d = model.data(ds.name),
          prev = d.revises() ? null : undefined,
          t = null;

      datum[def.field] = value;

      // We have to modify ds._data so that subsequent pulses contain
      // our dynamic data. W/o modifying ds._data, only the output
      // collector will contain dynamic tuples. 
      if(def.type == C.ADD) {
        t = tuple.ingest(datum, prev);
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
        if(add.length == 0 && rem.length == 0) add.push(tuple.ingest(datum));

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
    };

    if(signalName) node.dependency(C.SIGNALS, signalName);
    if(predicate)  node.dependency(C.SIGNALS, predicate.signals);
    
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
define('parse/data',['require','exports','module','./transforms','./modify','../util/index','../util/load','../util/read'],function(require, exports, module) {
  var parseTransforms = require('./transforms'),
      parseModify = require('./modify'),
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

      // The derived datasource will be pulsed by its src rather than the model.
      model.data(d.source).addListener(ds);
      model.removeListener(ds._pipeline[0]); 
    }

    return ds;    
  };

  return parseData;
});
define('scene/Builder',['require','exports','module','../dataflow/Node','./Encoder','./Bounder','./Item','../parse/data','../dataflow/tuple','../dataflow/changeset','../util/index','../util/constants'],function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      Encoder  = require('./Encoder'),
      Bounder  = require('./Bounder'),
      Item  = require('./Item'),
      parseData = require('../parse/data'),
      tuple = require('../dataflow/tuple'),
      changeset = require('../dataflow/changeset'),
      util = require('../util/index'),
      C = require('../util/constants');

  function Builder() {    
    return arguments.length ? this.init.apply(this, arguments) : this;
  }

  var proto = (Builder.prototype = new Node());

  proto.init = function(model, def, mark, parent, parent_id, inheritFrom) {
    Node.prototype.init.call(this, model.graph)
      .router(true)
      .collector(true);

    this._model = model;
    this._def   = def;
    this._mark  = mark;
    this._from  = (def.from ? def.from.data : null) || inheritFrom;
    this._ds    = util.isString(this._from) ? model.data(this._from) : null;
    this._map   = {};
    this._items = [];

    mark.def = def;
    mark.marktype = def.type;
    mark.interactive = !(def.interactive === false);
    mark.items = this._items;

    this._parent = parent;
    this._parent_id = parent_id;

    if(def.from && (def.from.mark || def.from.transform || def.from.modify)) {
      inlineDs.call(this);
    }

    // Non-group mark builders are super nodes. Encoder and Bounder remain 
    // separate operators but are embedded and called by Builder.evaluate.
    this._isSuper = (this._def.type !== C.GROUP); 
    this._encoder = new Encoder(this._model, this._mark);
    this._bounder = new Bounder(this._model, this._mark);

    if(this._ds) { this._encoder.dependency(C.DATA, this._from); }

    // Since Builders are super nodes, copy over encoder dependencies
    // (bounder has no registered dependencies).
    this.dependency(C.DATA, this._encoder.dependency(C.DATA));
    this.dependency(C.SCALES, this._encoder.dependency(C.SCALES));
    this.dependency(C.SIGNALS, this._encoder.dependency(C.SIGNALS));

    return this;
  };

  proto.evaluate = function(input) {
    util.debug(input, ["building", this._from, this._def.type]);

    var fullUpdate = this._encoder.reevaluate(input),
        output, fcs, data;

    if(this._ds) {
      output = changeset.create(input);

      // If a scale or signal in the update propset has been updated, 
      // send forward all items for reencoding if we do an early return.
      if(fullUpdate) output.mod = this._items.slice();

      fcs = this._ds.last();
      if(!fcs) {
        output.reflow = true
      } else if(fcs.stamp > this._stamp) {
        output = joinChangeset.call(this, fcs);
      }
    } else {
      data = util.isFunction(this._def.from) ? this._def.from() : [C.SENTINEL];
      output = joinValues.call(this, input, data);
    }

    output = this._graph.evaluate(this._encoder, output);
    return this._isSuper ? this._graph.evaluate(this._bounder, output) : output;
  };

  // Reactive geometry and mark-level transformations are handled here 
  // because they need their group's data-joined context. 
  function inlineDs() {
    var from = this._def.from,
        name, spec, sibling, output;

    if(from.mark) {
      name = ["vg", this._parent_id, from.mark].join("_");
      spec = {
        name: name,
        transform: from.transform, 
        modify: from.modify
      };
    } else {
      name = ["vg", this._from, this._def.type, Date.now()].join("_");
      spec = {
        name: name,
        source: this._from,
        transform: from.transform,
        modify: from.modify
      };
    }

    this._from = name;
    this._ds = parseData.datasource(this._model, spec);

    if(from.mark) {
      sibling = this.sibling(from.mark);
      if(sibling._isSuper) sibling.addListener(this._ds.listener());
      else sibling._bounder.addListener(this._ds.listener());
    } else {
      // At this point, we have a new datasource but it is empty as
      // the propagation cycle has already crossed the datasources. 
      // So, we repulse just this datasource. This should be safe
      // as the ds isn't connected to the scenegraph yet.
      
      var output = this._ds.source().last();
          input  = changeset.create(output);

      input.add = output.add;
      input.mod = output.mod;
      input.rem = output.rem;
      input.stamp = null;
      this._ds.fire(input);
    }
  }

  proto.pipeline = function() {
    return [this];
  };

  proto.connect = function() {
    var builder = this;

    this._model.graph.connect(this.pipeline());
    this._encoder.dependency(C.SCALES).forEach(function(s) {
      builder._parent.scale(s).addListener(builder);
    });

    if(this._parent) {
      if(this._isSuper) this.addListener(this._parent._collector);
      else this._bounder.addListener(this._parent._collector);
    }

    return this;
  };

  proto.disconnect = function() {
    var builder = this;
    this._model.graph.disconnect(this.pipeline());
    this._encoder.dependency(C.SCALES).forEach(function(s) {
      builder._parent.scale(s).removeListener(builder);
    });
    return this;
  };

  proto.sibling = function(name) {
    return this._parent.child(name, this._parent_id);
  };

  function newItem(d, stamp) {
    var item   = tuple.ingest(new Item(this._mark));
    item.datum = d;

    // For the root node's item
    if(this._def.width)  tuple.set(item, "width",  this._def.width);
    if(this._def.height) tuple.set(item, "height", this._def.height);

    return item;
  };

  function joinChangeset(input) {
    var keyf = keyFunction(this._def.key || "_id"),
        output = changeset.create(input),
        add = input.add, 
        mod = input.mod, 
        rem = input.rem,
        stamp = input.stamp,
        i, key, len, item, datum;

    for(i=0, len=rem.length; i<len; ++i) {
      item = this._map[key = keyf(rem[i])];
      item.status = C.EXIT;
      output.rem.push(item);
      this._map[key] = null;
    }

    for(i=0, len=add.length; i<len; ++i) {
      key = keyf(datum = add[i]);
      item = newItem.call(this, datum, stamp);
      tuple.set(item, "key", key);
      item.status = C.ENTER;
      this._map[key] = item;
      this._items.push(item);
      output.add.push(item);
    }

    for(i=0, len=mod.length; i<len; ++i) {
      item = this._map[key = keyf(datum = mod[i])];
      tuple.set(item, "key", key);
      item.datum  = datum;
      item.status = C.UPDATE;
      output.mod.push(item);
    }

    // Sort items according to how data is sorted, or by _id. The else 
    // condition is important to ensure lines and areas are drawn correctly.
    this._items.sort(function(a, b) { 
      return input.sort ? input.sort(a.datum, b.datum) : (a.datum._id - b.datum._id);
    });

    return output;
  }

  function joinValues(input, data) {
    var keyf = keyFunction(this._def.key),
        prev = this._items.splice(0),
        output = changeset.create(input),
        i, key, len, item, datum, enter;

    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      item.status = C.EXIT;
      if (keyf) this._map[item.key] = item;
    }
    
    for (i=0, len=data.length; i<len; ++i) {
      datum = data[i];
      key = i;
      item = keyf ? this._map[key = keyf(datum)] : prev[i];
      if(!item) {
        this._items.push(item = newItem.call(this, datum, input.stamp));
        output.add.push(item);
        tuple.set(item, "key", key);
        item.status = C.ENTER;
      } else {
        this._items.push(item);
        output.mod.push(item);
        tuple.set(item, "key", key);
        item.datum = datum;
        item.status = C.UPDATE;
      }
    }

    for (i=0, len=prev.length; i<len; ++i) {
      item = prev[i];
      if (item.status === C.EXIT) {
        tuple.set(item, "key", keyf ? item.key : this._items.length);
        this._items.unshift(item);  // Keep item around for "exit" transition.
        output.rem.unshift(item);
      }
    }
    
    return output;
  };

  function keyFunction(key) {
    if (key == null) return null;
    var f = util.array(key).map(util.accessor);
    return function(d) {
      for (var s="", i=0, n=f.length; i<n; ++i) {
        if (i>0) s += "|";
        s += String(f[i](d));
      }
      return s;
    }
  };

  return Builder;
});
define('scene/Scale',['require','exports','module','d3','../dataflow/Node','../transforms/Stats','../dataflow/changeset','../util/index','../util/config','../util/constants'],function(require, exports, module) {
  var d3 = require('d3'),
      Node = require('../dataflow/Node'),
      Stats = require('../transforms/Stats'),
      changeset = require('../dataflow/changeset'),
      util = require('../util/index'),
      config = require('../util/config'),
      C = require('../util/constants');

  var GROUP_PROPERTY = {width: 1, height: 1};

  function Scale(model, def, parent) {
    this._model = model;
    this._def = def;
    this._parent = parent;
    return Node.prototype.init.call(this, model.graph);
  }

  var proto = (Scale.prototype = new Node());

  proto.evaluate = function(input) {
    var self = this,
        fn = function(group) { scale.call(self, group); };

    input.add.forEach(fn);
    input.mod.forEach(fn);

    // Scales are at the end of an encoding pipeline, so they should forward a
    // reflow pulse. Thus, if multiple scales update in the parent group, we don't
    // reevaluate child marks multiple times. 
    return changeset.create(input, true);
  };

  // All of a scale's dependencies are registered during propagation as we parse
  // dataRefs. So a scale must be responsible for connecting itself to dependents.
  proto.dependency = function(type, deps) {
    if(arguments.length == 2) {
      deps = util.array(deps);
      for(var i=0, len=deps.length; i<len; ++i) {
        this._graph[type == C.DATA ? C.DATA : C.SIGNAL](deps[i])
          .addListener(this._parent);
      }
    }

    return Node.prototype.dependency.call(this, type, deps);
  };

  function scale(group) {
    var name = this._def.name,
        prev = name + ":prev",
        s = instance.call(this, group.scale(name)),
        m = s.type===C.ORDINAL ? ordinal : quantitative,
        rng = range.call(this, group);

    m.call(this, s, rng, group);

    group.scale(name, s);
    group.scale(prev, group.scale(prev) || s);

    return s;
  }

  function instance(scale) {
    var type = this._def.type || C.LINEAR;
    if (!scale || type !== scale.type) {
      var ctor = config.scale[type] || d3.scale[type];
      if (!ctor) util.error("Unrecognized scale type: " + type);
      (scale = ctor()).type = scale.type || type;
      scale.scaleName = this._def.name;
    }
    return scale;
  }

  function ordinal(scale, rng, group) {
    var def = this._def,
        domain, sort, str, refs, dataDrivenRange = false;
    
    // range pre-processing for data-driven ranges
    if (util.isObject(def.range) && !util.isArray(def.range)) {
      dataDrivenRange = true;
      rng = dataRef.call(this, C.RANGE, def.range, scale, group);
    }
    
    // domain
    domain = dataRef.call(this, C.DOMAIN, def.domain, scale, group);
    if (domain) scale.domain(domain);

    // range
    str = typeof rng[0] === 'string';
    if (str || rng.length > 2 || rng.length===1 || dataDrivenRange) {
      scale.range(rng); // color or shape values
    } else if (def.points) {
      scale.rangePoints(rng, def.padding||0);
    } else if (def.round || def.round===undefined) {
      scale.rangeRoundBands(rng, def.padding||0);
    } else {
      scale.rangeBands(rng, def.padding||0);
    }
  }

  function quantitative(scale, rng, group) {
    var def = this._def,
        domain, interval;

    // domain
    domain = (def.type === C.QUANTILE)
      ? dataRef.call(this, C.DOMAIN, def.domain, scale, group)
      : domainMinMax.call(this, scale, group);
    scale.domain(domain);

    // range
    // vertical scales should flip by default, so use XOR here
    if (def.range === "height") rng = rng.reverse();
    scale[def.round && scale.rangeRound ? "rangeRound" : "range"](rng);

    if (def.exponent && def.type===C.POWER) scale.exponent(def.exponent);
    if (def.clamp) scale.clamp(true);
    if (def.nice) {
      if (def.type === C.TIME) {
        interval = d3.time[def.nice];
        if (!interval) util.error("Unrecognized interval: " + interval);
        scale.nice(interval);
      } else {
        scale.nice();
      }
    }
  }

  function dataRef(which, def, scale, group) {
    if(util.isArray(def)) return def.map(signal.bind(this));

    var self = this, graph = this._graph,
        refs = def.fields || util.array(def),
        uniques = scale.type === C.ORDINAL || scale.type === C.QUANTILE,
        ck = "_"+which,
        cache = scale[ck],
        sort = def.sort,
        i, rlen, j, flen, r, fields, meas, from, data, keys;

    if(!cache) {
      cache = scale[ck] = new Stats(graph), meas = [];
      if(uniques && sort) meas.push(sort.stat);
      else if(!uniques) meas.push(C.MIN, C.MAX);
      cache.measures.set(cache, meas);
    }

    for(i=0, rlen=refs.length; i<rlen; ++i) {
      r = refs[i];
      from = r.data || "vg_"+group.datum._id;
      data = graph.data(from)
        .revises(true)
        .last();

      if(data.stamp <= this._stamp) continue;

      fields = util.array(r.field).map(function(f) {
        if(f.group) return util.accessor(f.group)(group.datum)
        return f; // String or {"signal"}
      });

      if(uniques) {
        cache.on.set(cache, sort ? sort.field : "_id");
        for(j=0, flen=fields.length; j<flen; ++j) {
          cache.group_by.set(cache, fields[j])
            .evaluate(data);
        }
      } else {
        for(j=0, flen=fields.length; j<flen; ++j) {
          cache.on.set(cache, fields[j])  // Treat as flat datasource
            .evaluate(data);
        }
      }

      this.dependency(C.DATA, from);
      cache.dependency(C.SIGNALS).forEach(function(s) { self.dependency(C.SIGNALS, s) });
    }

    data = cache.data();
    if(uniques) {
      keys = util.keys(data)
        .filter(function(k) { return data[k] != null; })
        .map(function(k) { return { key: k, tpl: data[k].tpl }});

      if(sort) {
        sort = sort.order.signal ? graph.signalRef(sort.order.signal) : sort.order;
        sort = (sort == C.DESC ? "-" : "+") + "tpl." + cache.on.get(graph).field;
        sort = util.comparator(sort);
      } else {  // "First seen" order
        sort = util.comparator("tpl._id");
      }

      return keys.sort(sort).map(function(k) { return k.key });
    } else {
      data = data[""]; // Unpack flat aggregation
      return data == null ? [] : [data.tpl.min, data.tpl.max];
    }
  }

  function signal(v) {
    var s = v.signal, ref;
    if(!s) return v;
    this.dependency(C.SIGNALS, (ref = util.field(s))[0]);
    return this._graph.signalRef(ref);
  }

  function domainMinMax(scale, group) {
    var def = this._def,
        domain = [null, null], refs, z;

    if (def.domain !== undefined) {
      domain = (!util.isObject(def.domain)) ? domain :
        dataRef.call(this, C.DOMAIN, def.domain, scale, group);
    }

    z = domain.length - 1;
    if (def.domainMin !== undefined) {
      if (util.isObject(def.domainMin)) {
        if(def.domainMin.signal) {
          domain[0] = signal.call(this, def.domainMin);
        } else {
          domain[0] = dataRef.call(this, C.DOMAIN+C.MIN, def.domainMin, scale, group)[0];
        }
      } else {
        domain[0] = def.domainMin;
      }
    }
    if (def.domainMax !== undefined) {
      if (util.isObject(def.domainMax)) {
        if(def.domainMax.signal) {
          domain[z] = signal.call(this, def.domainMax);
        } else {
          domain[z] = dataRef.call(this, C.DOMAIN+C.MAX, def.domainMax, scale, group)[1];
        }
      } else {
        domain[z] = def.domainMax;
      }
    }
    if (def.type !== C.LOG && def.type !== C.TIME && (def.zero || def.zero===undefined)) {
      domain[0] = Math.min(0, domain[0]);
      domain[z] = Math.max(0, domain[z]);
    }
    return domain;
  }

  function range(group) {
    var def = this._def,
        rng = [null, null];

    if (def.range !== undefined) {
      if (typeof def.range === 'string') {
        if (GROUP_PROPERTY[def.range]) {
          rng = [0, group[def.range]];
        } else if (config.range[def.range]) {
          rng = config.range[def.range];
        } else {
          util.error("Unrecogized range: "+def.range);
          return rng;
        }
      } else if (util.isArray(def.range)) {
        rng = def.range.map(signal.bind(this));
      } else if (util.isObject(def.range)) {
        return null; // early exit
      } else {
        rng = [0, def.range];
      }
    }
    if (def.rangeMin !== undefined) {
      rng[0] = def.rangeMin.signal ? signal.call(this, def.rangeMin) : def.rangeMin;
    }
    if (def.rangeMax !== undefined) {
      rng[rng.length-1] = def.rangeMax.signal ? signal.call(this, def.rangeMax) : def.rangeMax;
    }
    
    if (def.reverse !== undefined) {
      var rev = def.reverse;
      if (util.isObject(rev)) {
        rev = util.accessor(rev.field)(group.datum);
      }
      if (rev) rng = rng.reverse();
    }
    
    return rng;
  }

  return Scale;
});
define('parse/properties',['require','exports','module','d3','../dataflow/tuple','../util/index','../util/config'],function(require, exports, module) {
  var d3 = require('d3'),
      tuple = require('../dataflow/tuple'),
      util = require('../util/index'),
      config = require('../util/config');

  function compile(model, mark, spec) {
    var code = "",
        names = util.keys(spec),
        i, len, name, ref, vars = {}, 
        deps = {
          signals: {},
          scales: {},
          data: {}
        };
        
    code += "var o = trans ? {} : item;\n"
    
    for (i=0, len=names.length; i<len; ++i) {
      ref = spec[name = names[i]];
      code += (i > 0) ? "\n  " : "  ";
      if(ref.rule) {
        ref = rule(model, name, ref.rule);
        code += "\n  " + ref.code
      } else {
        ref = valueRef(name, ref);
        code += "this.tpl.set(o, "+util.str(name)+", "+ref.val+");";
      }

      vars[name] = true;
      ['signals', 'scales', 'data'].forEach(function(p) {
        if(ref[p] != null) util.array(ref[p]).forEach(function(k) { deps[p][k] = 1 });
      });
    }

    if (vars.x2) {
      if (vars.x) {
        code += "\n  if (o.x > o.x2) { "
              + "var t = o.x;"
              + "this.tpl.set(o, 'x', o.x2);"
              + "this.tpl.set(o, 'x2', t); "
              + "};";
        code += "\n  this.tpl.set(o, 'width', (o.x2 - o.x));";
      } else if (vars.width) {
        code += "\n  this.tpl.set(o, 'x', (o.x2 - o.width));";
      } else {
        code += "\n  this.tpl.set(o, 'x', o.x2);"
      }
    }

    if (vars.y2) {
      if (vars.y) {
        code += "\n  if (o.y > o.y2) { "
              + "var t = o.y;"
              + "this.tpl.set(o, 'y', o.y2);"
              + "this.tpl.set(o, 'y2', t);"
              + "};";
        code += "\n  this.tpl.set(o, 'height', (o.y2 - o.y));";
      } else if (vars.height) {
        code += "\n  this.tpl.set(o, 'y', (o.y2 - o.height));";
      } else {
        code += "\n  this.tpl.set(o, 'y', o.y2);"
      }
    }
    
    if (hasPath(mark, vars)) code += "\n  item.touch();";
    code += "\n  if (trans) trans.interpolate(item, o);";

    try {
      var encoder = Function("item", "group", "trans", "db", 
        "signals", "predicates", code);
      encoder.tpl = tuple;
      encoder.util = util;

      // D3 color spaces
      encoder.hcl = d3.hcl;
      encoder.hsl = d3.hsl;
      encoder.lab = d3.lab;
      encoder.rgb = d3.rgb;
      return {
        encode: encoder,
        signals: util.keys(deps.signals),
        scales: util.keys(deps.scales),
        data: util.keys(deps.data)
      }
    } catch (e) {
      util.error(e);
      util.log(code);
    }
  }

  function hasPath(mark, vars) {
    return vars.path ||
      ((mark==="area" || mark==="line") &&
        (vars.x || vars.x2 || vars.width ||
         vars.y || vars.y2 || vars.height ||
         vars.tension || vars.interpolate));
  }

  var GROUP_VARS = {
    "width": 1,
    "height": 1,
    "mark.group.width": 1,
    "mark.group.height": 1
  };

  function rule(model, name, rules) {
    var signals = [], scales = [], db = [],
        inputs = [], code = "";

    (rules||[]).forEach(function(r, i) {
      var predName = r.predicate,
          pred = model.predicate(predName),
          input = [], args = name+"_arg"+i,
          ref;

      util.keys(r.input).forEach(function(k) {
        var ref = valueRef(i, r.input[k]);
        input.push(util.str(k)+": "+ref.val);
        signals.concat(ref.signals);
        scales.concat(ref.scales);
      });

      ref = valueRef(name, r);
      signals.concat(ref.signals);
      scales.concat(ref.scales);

      if(predName) {
        signals.push.apply(signals, pred.signals);
        db.push.apply(db, pred.data);
        inputs.push(args+" = {"+input.join(', ')+"}");
        code += "if(predicates["+util.str(predName)+"]("+args+", db, signals, predicates)) {\n" +
          "    this.tpl.set(o, "+util.str(name)+", "+ref.val+");\n";
        code += rules[i+1] ? "  } else " : "  }";
      } else {
        code += "{\n" + 
          "    this.tpl.set(o, "+util.str(name)+", "+ref.val+");\n"+
          "  }";
      }
    });

    code = "var " + inputs.join(",\n      ") + ";\n  " + code;
    return {code: code, signals: signals, scales: scales, data: db};
  }

  function valueRef(name, ref) {
    if (ref == null) return null;
    var isColor = name==="fill" || name==="stroke";
    var signals = [];

    if (isColor) {
      if (ref.c) {
        return colorRef("hcl", ref.h, ref.c, ref.l);
      } else if (ref.h || ref.s) {
        return colorRef("hsl", ref.h, ref.s, ref.l);
      } else if (ref.l || ref.a) {
        return colorRef("lab", ref.l, ref.a, ref.b);
      } else if (ref.r || ref.g || ref.b) {
        return colorRef("rgb", ref.r, ref.g, ref.b);
      }
    }

    // initialize value
    var val = null, signalRef = null;
    if (ref.value !== undefined) {
      val = util.str(ref.value);
    }

    if (ref.signal !== undefined) {
      signalRef = util.field(ref.signal);
      val = "signals["+signalRef.map(util.str).join("][")+"]"; 
      signals.push(signalRef.shift());
    }

    // get field reference for enclosing group
    if (ref.group != null) {
      var grp = "group.datum";
      if (util.isString(ref.group)) {
        grp = GROUP_VARS[ref.group]
          ? "group." + ref.group
          : "group.datum["+util.field(ref.group).map(util.str).join("][")+"]";
      }
    }

    // get data field value
    if (ref.field != null) {
      if (util.isString(ref.field)) {
        val = "item.datum["+util.field(ref.field).map(util.str).join("][")+"]";
        if (ref.group != null) { val = "this.util.accessor("+val+")("+grp+")"; }
      } else if(ref.field.signal) {
        signalRef = util.field(ref.field.signal);
        val = "signals["+signalRef.map(util.str).join("][")+"]";
        if (ref.group != null) { val = "this.util.accessor("+val+")("+grp+")"; }
        signals.push(signalRef.shift());
      } else {
        val = "this.util.accessor(group.datum["
            + util.field(ref.field.group).map(util.str).join("][")
            + "])(item.datum.data)";
      }
    } else if (ref.group != null) {
      val = grp;
    }

    if (ref.scale != null) {
      var scale = null;
      if(util.isString(ref.scale)) {
        scale = util.str(ref.scale);
      } else if(ref.scale.signal) {
        signalRef = util.field(ref.scale.signal);
        scale = "signals["+signalRef.map(util.str).join("][")+"]";
        signals.push(signalRef.shift());
      } else {
        scale = (ref.scale.group ? "group" : "item")
          + ".datum[" + util.str(ref.scale.group || ref.scale.field) + "]";
      }

      scale = "group.scale(" + scale + ")";
      if(ref.invert) scale += ".invert";  // TODO: ordinal scales

      // run through scale function if val specified.
      // if no val, scale function is predicate arg.
      if(val !== null || ref.band || ref.mult || ref.offset) {
        val = scale + (ref.band ? ".rangeBand()" : 
          "("+(val !== null ? val : "item.datum.data")+")");
      } else {
        val = scale;
      }
    }
    
    // multiply, offset, return value
    val = "(" + (ref.mult?(util.number(ref.mult)+" * "):"") + val + ")"
      + (ref.offset ? " + " + util.number(ref.offset) : "");
    return {val: val, signals: signals, scales: ref.scale};
  }

  function colorRef(type, x, y, z) {
    var xx = x ? valueRef("", x) : config.color[type][0],
        yy = y ? valueRef("", y) : config.color[type][1],
        zz = z ? valueRef("", z) : config.color[type][2]
        signals = [], scales = [];

    if(xx.signals) signals.push.apply(signals, xx.signals);
    if(yy.signals) signals.push.apply(signals, yy.signals);
    if(zz.signals) signals.push.apply(signals, zz.signals);

    if(xx.scales) scales.push(xx.scales);
    if(yy.scales) scales.push(yy.scales);
    if(zz.scales) scales.push(zz.scales);

    return {
      val: "(this." + type + "(" + [xx.val, yy.val, zz.val].join(",") + ') + "")',
      signals: signals,
      scales: scales
    };
  }

  return compile;
});
define('parse/mark',['require','exports','module','../util/index','./properties'],function(require, exports, module) {
  var util = require('../util/index'),
      parseProperties = require('./properties');

  return function parseMark(model, mark) {
    var props = mark.properties,
        group = mark.marks;

    // parse mark property definitions
    util.keys(props).forEach(function(k) {
      props[k] = parseProperties(model, mark.type, props[k]);
    });

    // parse delay function
    if (mark.delay) {
      mark.delay = parseProperties(model, mark.type, {delay: mark.delay});
    }

    // recurse if group type
    if (group) {
      mark.marks = group.map(function(g) { return parseMark(model, g); });
    }
      
    return mark;
  };
});
define('scene/axis',['require','exports','module','../util/config','../dataflow/tuple','../util/index','../parse/mark'],function(require, module, exports) {
  var config = require('../util/config'),
      tpl = require('../dataflow/tuple'),
      util = require('../util/index'),
      parseMark = require('../parse/mark');

  function axs(model) {
    var scale,
        orient = config.axis.orient,
        offset = 0,
        titleOffset = config.axis.titleOffset,
        axisDef = {},
        layer = "front",
        grid = false,
        title = null,
        tickMajorSize = config.axis.tickSize,
        tickMinorSize = config.axis.tickSize,
        tickEndSize = config.axis.tickSize,
        tickPadding = config.axis.padding,
        tickValues = null,
        tickFormatString = null,
        tickFormat = null,
        tickSubdivide = 0,
        tickArguments = [config.axis.ticks],
        gridLineStyle = {},
        tickLabelStyle = {},
        majorTickStyle = {},
        minorTickStyle = {},
        titleStyle = {},
        domainStyle = {},
        m = { // Axis marks as references for updates
          gridLines: null,
          majorTicks: null,
          minorTicks: null,
          tickLabels: null,
          domain: null,
          title: null
        };

    var axis = {};

    function reset() {
      axisDef.type = null;
    };

    axis.def = function() {
      if(!axisDef.type) axis_def(scale);

      // tick format
      tickFormat = !tickFormatString ? null : ((scale.type === 'time')
        ? d3.time.format(tickFormatString)
        : d3.format(tickFormatString));

      // generate data
      // We don't _really_ need to model these as tuples as no further
      // data transformation is done. So we optimize for a high churn rate. 
      var injest = function(d) { return {data: d}; };
      var major = tickValues == null
        ? (scale.ticks ? scale.ticks.apply(scale, tickArguments) : scale.domain())
        : tickValues;
      var minor = vg_axisSubdivide(scale, major, tickSubdivide).map(injest);
      major = major.map(injest);
      var fmt = tickFormat==null ? (scale.tickFormat ? scale.tickFormat.apply(scale, tickArguments) : String) : tickFormat;
      major.forEach(function(d) { d.label = fmt(d.data); });
      var tdata = title ? [title].map(injest) : [];

      axisDef.marks[0].from = function() { return grid ? major : []; };
      axisDef.marks[1].from = function() { return major; };
      axisDef.marks[2].from = function() { return minor; };
      axisDef.marks[3].from = axisDef.marks[1].from;
      axisDef.marks[4].from = function() { return [1]; };
      axisDef.marks[5].from = function() { return tdata; };
      axisDef.offset = offset;
      axisDef.orient = orient;
      axisDef.layer = layer;
      return axisDef;
    };

    function axis_def(scale) {
      // setup scale mapping
      var newScale, oldScale, range;
      if (scale.type === "ordinal") {
        newScale = {scale: scale.scaleName, offset: 0.5 + scale.rangeBand()/2};
        oldScale = newScale;
      } else {
        newScale = {scale: scale.scaleName, offset: 0.5};
        oldScale = {scale: scale.scaleName+":prev", offset: 0.5};
      }
      range = vg_axisScaleRange(scale);

      // setup axis marks
      if(!m.gridLines)  m.gridLines  = vg_axisTicks();
      if(!m.majorTicks) m.majorTicks = vg_axisTicks();
      if(!m.minorTicks) m.minorTicks = vg_axisTicks();
      if(!m.tickLabels) m.tickLabels = vg_axisTickLabels();
      if(!m.domain) m.domain = vg_axisDomain();
      if(!m.title)  m.title  = vg_axisTitle();
      m.gridLines.properties.enter.stroke = {value: config.axis.gridColor};

      // extend axis marks based on axis orientation
      vg_axisTicksExtend(orient, m.gridLines, oldScale, newScale, Infinity);
      vg_axisTicksExtend(orient, m.majorTicks, oldScale, newScale, tickMajorSize);
      vg_axisTicksExtend(orient, m.minorTicks, oldScale, newScale, tickMinorSize);
      vg_axisLabelExtend(orient, m.tickLabels, oldScale, newScale, tickMajorSize, tickPadding);

      vg_axisDomainExtend(orient, m.domain, range, tickEndSize);
      vg_axisTitleExtend(orient, m.title, range, titleOffset); // TODO get offset
      
      // add / override custom style properties
      util.extend(m.gridLines.properties.update, gridLineStyle);
      util.extend(m.majorTicks.properties.update, majorTickStyle);
      util.extend(m.minorTicks.properties.update, minorTickStyle);
      util.extend(m.tickLabels.properties.update, tickLabelStyle);
      util.extend(m.domain.properties.update, domainStyle);
      util.extend(m.title.properties.update, titleStyle);

      var marks = [m.gridLines, m.majorTicks, m.minorTicks, m.tickLabels, m.domain, m.title];
      util.extend(axisDef, {
        type: "group",
        interactive: false,
        properties: { 
          enter: {
            encode: vg_axisUpdate,
            scales: [scale.scaleName],
            signals: [], data: []
          },
          update: {
            encode: vg_axisUpdate,
            scales: [scale.scaleName],
            signals: [], data: []
          }
        }
      });

      axisDef.marks = marks.map(function(m) { return parseMark(model, m); });
    };

    axis.scale = function(x) {
      if (!arguments.length) return scale;
      if (scale !== x) { scale = x; reset(); }
      return axis;
    };

    axis.orient = function(x) {
      if (!arguments.length) return orient;
      if (orient !== x) {
        orient = x in vg_axisOrients ? x + "" : config.axis.orient;
        reset();
      }
      return axis;
    };

    axis.title = function(x) {
      if (!arguments.length) return title;
      if (title !== x) { title = x; reset(); }
      return axis;
    };

    axis.ticks = function() {
      if (!arguments.length) return tickArguments;
      tickArguments = arguments;
      return axis;
    };

    axis.tickValues = function(x) {
      if (!arguments.length) return tickValues;
      tickValues = x;
      return axis;
    };

    axis.tickFormat = function(x) {
      if (!arguments.length) return tickFormatString;
      if (tickFormatString !== x) {
        tickFormatString = x;
        reset();
      }
      return axis;
    };
    
    axis.tickSize = function(x, y) {
      if (!arguments.length) return tickMajorSize;
      var n = arguments.length - 1,
          major = +x,
          minor = n > 1 ? +y : tickMajorSize,
          end   = n > 0 ? +arguments[n] : tickMajorSize;

      if (tickMajorSize !== major ||
          tickMinorSize !== minor ||
          tickEndSize !== end) {
        reset();
      }

      tickMajorSize = major;
      tickMinorSize = minor;
      tickEndSize = end;
      return axis;
    };

    axis.tickSubdivide = function(x) {
      if (!arguments.length) return tickSubdivide;
      tickSubdivide = +x;
      return axis;
    };
    
    axis.offset = function(x) {
      if (!arguments.length) return offset;
      offset = util.isObject(x) ? x : +x;
      return axis;
    };

    axis.tickPadding = function(x) {
      if (!arguments.length) return tickPadding;
      if (tickPadding !== +x) { tickPadding = +x; reset(); }
      return axis;
    };

    axis.titleOffset = function(x) {
      if (!arguments.length) return titleOffset;
      if (titleOffset !== +x) { titleOffset = +x; reset(); }
      return axis;
    };

    axis.layer = function(x) {
      if (!arguments.length) return layer;
      if (layer !== x) { layer = x; reset(); }
      return axis;
    };

    axis.grid = function(x) {
      if (!arguments.length) return grid;
      if (grid !== x) { grid = x; reset(); }
      return axis;
    };

    axis.gridLineProperties = function(x) {
      if (!arguments.length) return gridLineStyle;
      if (gridLineStyle !== x) { gridLineStyle = x; }
      return axis;
    };

    axis.majorTickProperties = function(x) {
      if (!arguments.length) return majorTickStyle;
      if (majorTickStyle !== x) { majorTickStyle = x; }
      return axis;
    };

    axis.minorTickProperties = function(x) {
      if (!arguments.length) return minorTickStyle;
      if (minorTickStyle !== x) { minorTickStyle = x; }
      return axis;
    };

    axis.tickLabelProperties = function(x) {
      if (!arguments.length) return tickLabelStyle;
      if (tickLabelStyle !== x) { tickLabelStyle = x; }
      return axis;
    };

    axis.titleProperties = function(x) {
      if (!arguments.length) return titleStyle;
      if (titleStyle !== x) { titleStyle = x; }
      return axis;
    };

    axis.domainProperties = function(x) {
      if (!arguments.length) return domainStyle;
      if (domainStyle !== x) { domainStyle = x; }
      return axis;
    };
    
    axis.reset = function() { reset(); };

    return axis;
  };

  var vg_axisOrients = {top: 1, right: 1, bottom: 1, left: 1};

  function vg_axisSubdivide(scale, ticks, m) {
    subticks = [];
    if (m && ticks.length > 1) {
      var extent = vg_axisScaleExtent(scale.domain()),
          subticks,
          i = -1,
          n = ticks.length,
          d = (ticks[1] - ticks[0]) / ++m,
          j,
          v;
      while (++i < n) {
        for (j = m; --j > 0;) {
          if ((v = +ticks[i] - j * d) >= extent[0]) {
            subticks.push(v);
          }
        }
      }
      for (--i, j = 0; ++j < m && (v = +ticks[i] + j * d) < extent[1];) {
        subticks.push(v);
      }
    }
    return subticks;
  }

  function vg_axisScaleExtent(domain) {
    var start = domain[0], stop = domain[domain.length - 1];
    return start < stop ? [start, stop] : [stop, start];
  }

  function vg_axisScaleRange(scale) {
    return scale.rangeExtent
      ? scale.rangeExtent()
      : vg_axisScaleExtent(scale.range());
  }

  var vg_axisAlign = {
    bottom: "center",
    top: "center",
    left: "right",
    right: "left"
  };

  var vg_axisBaseline = {
    bottom: "top",
    top: "bottom",
    left: "middle",
    right: "middle"
  };

  function vg_axisLabelExtend(orient, labels, oldScale, newScale, size, pad) {
    size = Math.max(size, 0) + pad;
    if (orient === "left" || orient === "top") {
      size *= -1;
    }  
    if (orient === "top" || orient === "bottom") {
      util.extend(labels.properties.enter, {
        x: oldScale,
        y: {value: size},
      });
      util.extend(labels.properties.update, {
        x: newScale,
        y: {value: size},
        align: {value: "center"},
        baseline: {value: vg_axisBaseline[orient]}
      });
    } else {
      util.extend(labels.properties.enter, {
        x: {value: size},
        y: oldScale,
      });
      util.extend(labels.properties.update, {
        x: {value: size},
        y: newScale,
        align: {value: vg_axisAlign[orient]},
        baseline: {value: "middle"}
      });
    }
  }

  function vg_axisTicksExtend(orient, ticks, oldScale, newScale, size) {
    var sign = (orient === "left" || orient === "top") ? -1 : 1;
    if (size === Infinity) {
      size = (orient === "top" || orient === "bottom")
        ? {group: "mark.group.height", mult: -sign}
        : {group: "mark.group.width", mult: -sign};
    } else {
      size = {value: sign * size};
    }
    if (orient === "top" || orient === "bottom") {
      util.extend(ticks.properties.enter, {
        x:  oldScale,
        y:  {value: 0},
        y2: size
      });
      util.extend(ticks.properties.update, {
        x:  newScale,
        y:  {value: 0},
        y2: size
      });
      util.extend(ticks.properties.exit, {
        x:  newScale,
      });        
    } else {
      util.extend(ticks.properties.enter, {
        x:  {value: 0},
        x2: size,
        y:  oldScale
      });
      util.extend(ticks.properties.update, {
        x:  {value: 0},
        x2: size,
        y:  newScale
      });
      util.extend(ticks.properties.exit, {
        y:  newScale,
      });
    }
  }

  function vg_axisTitleExtend(orient, title, range, offset) {
    var mid = ~~((range[0] + range[1]) / 2),
        sign = (orient === "top" || orient === "left") ? -1 : 1;
    
    if (orient === "bottom" || orient === "top") {
      util.extend(title.properties.update, {
        x: {value: mid},
        y: {value: sign*offset},
        angle: {value: 0}
      });
    } else {
      util.extend(title.properties.update, {
        x: {value: sign*offset},
        y: {value: mid},
        angle: {value: -90}
      });
    }
  }

  function vg_axisDomainExtend(orient, domain, range, size) {
    var path;
    if (orient === "top" || orient === "left") {
      size = -1 * size;
    }
    if (orient === "bottom" || orient === "top") {
      path = "M" + range[0] + "," + size + "V0H" + range[1] + "V" + size;
    } else {
      path = "M" + size + "," + range[0] + "H0V" + range[1] + "H" + size;
    }
    domain.properties.update.path = {value: path};
  }

  function vg_axisUpdate(item, group, trans, db, signals, predicates) {
    var o = trans ? {} : item,
        offset = item.mark.def.offset,
        orient = item.mark.def.orient,
        width  = group.width,
        height = group.height; // TODO fallback to global w,h?

    if (util.isObject(offset)) {
      offset = -group.scale(offset.scale)(offset.value);
    }

    switch (orient) {
      case "left":   { tpl.set(o, 'x', -offset); tpl.set(o, 'y', 0); break; }
      case "right":  { tpl.set(o, 'x', width + offset); tpl.set(o, 'y', 0); break; }
      case "bottom": { tpl.set(o, 'x', 0); tpl.set(o, 'y', height + offset); break; }
      case "top":    { tpl.set(o, 'x', 0); tpl.set(o, 'y', -offset); break; }
      default:       { tpl.set(o, 'x', 0); tpl.set(o, 'y', 0); }
    }

    if (trans) trans.interpolate(item, o);
  }

  function vg_axisTicks() {
    return {
      type: "rule",
      interactive: false,
      key: "data",
      properties: {
        enter: {
          stroke: {value: config.axis.tickColor},
          strokeWidth: {value: config.axis.tickWidth},
          opacity: {value: 1e-6}
        },
        exit: { opacity: {value: 1e-6} },
        update: { opacity: {value: 1} }
      }
    };
  }

  function vg_axisTickLabels() {
    return {
      type: "text",
      interactive: true,
      key: "data",
      properties: {
        enter: {
          fill: {value: config.axis.tickLabelColor},
          font: {value: config.axis.tickLabelFont},
          fontSize: {value: config.axis.tickLabelFontSize},
          opacity: {value: 1e-6},
          text: {field: "label"}
        },
        exit: { opacity: {value: 1e-6} },
        update: { opacity: {value: 1} }
      }
    };
  }

  function vg_axisTitle() {
    return {
      type: "text",
      interactive: true,
      properties: {
        enter: {
          font: {value: config.axis.titleFont},
          fontSize: {value: config.axis.titleFontSize},
          fontWeight: {value: config.axis.titleFontWeight},
          fill: {value: config.axis.titleColor},
          align: {value: "center"},
          baseline: {value: "middle"},
          text: {field: "data"}
        },
        update: {}
      }
    };
  }

  function vg_axisDomain() {
    return {
      type: "path",
      interactive: false,
      properties: {
        enter: {
          x: {value: 0.5},
          y: {value: 0.5},
          stroke: {value: config.axis.axisColor},
          strokeWidth: {value: config.axis.axisWidth}
        },
        update: {}
      }
    };
  }

  return axs;
});

define('parse/axes',['require','exports','module','../scene/axis','../util/config','../util/index'],function(require, module, exports) {
  var axs = require('../scene/axis'),
      config = require('../util/config'),
      util = require('../util/index');

  var ORIENT = {
    "x":      "bottom",
    "y":      "left",
    "top":    "top",
    "bottom": "bottom",
    "left":   "left",
    "right":  "right"
  };

  function axes(model, spec, axes, group) {
    (spec || []).forEach(function(def, index) {
      axes[index] = axes[index] || axs(model);
      axis(def, index, axes[index], group);
    });
  };

  function axis(def, index, axis, group) {
    // axis scale
    if (def.scale !== undefined) {
      axis.scale(group.scale(def.scale));
    }

    // axis orientation
    axis.orient(def.orient || ORIENT[def.type]);
    // axis offset
    axis.offset(def.offset || 0);
    // axis layer
    axis.layer(def.layer || "front");
    // axis grid lines
    axis.grid(def.grid || false);
    // axis title
    axis.title(def.title || null);
    // axis title offset
    axis.titleOffset(def.titleOffset != null
      ? def.titleOffset : config.axis.titleOffset);
    // axis values
    axis.tickValues(def.values || null);
    // axis label formatting
    axis.tickFormat(def.format || null);
    // axis tick subdivision
    axis.tickSubdivide(def.subdivide || 0);
    // axis tick padding
    axis.tickPadding(def.tickPadding || config.axis.padding);

    // axis tick size(s)
    var size = [];
    if (def.tickSize !== undefined) {
      for (var i=0; i<3; ++i) size.push(def.tickSize);
    } else {
      var ts = config.axis.tickSize;
      size = [ts, ts, ts];
    }
    if (def.tickSizeMajor != null) size[0] = def.tickSizeMajor;
    if (def.tickSizeMinor != null) size[1] = def.tickSizeMinor;
    if (def.tickSizeEnd   != null) size[2] = def.tickSizeEnd;
    if (size.length) {
      axis.tickSize.apply(axis, size);
    }

    // tick arguments
    if (def.ticks != null) {
      var ticks = util.isArray(def.ticks) ? def.ticks : [def.ticks];
      axis.ticks.apply(axis, ticks);
    } else {
      axis.ticks(config.axis.ticks);
    }

    // style properties
    var p = def.properties;
    if (p && p.ticks) {
      axis.majorTickProperties(p.majorTicks
        ? util.extend({}, p.ticks, p.majorTicks) : p.ticks);
      axis.minorTickProperties(p.minorTicks
        ? util.extend({}, p.ticks, p.minorTicks) : p.ticks);
    } else {
      axis.majorTickProperties(p && p.majorTicks || {});
      axis.minorTickProperties(p && p.minorTicks || {});
    }
    axis.tickLabelProperties(p && p.labels || {});
    axis.titleProperties(p && p.title || {});
    axis.gridLineProperties(p && p.grid || {});
    axis.domainProperties(p && p.axis || {});
  }

  return axes;
});

define('scene/GroupBuilder',['require','exports','module','../dataflow/Node','../dataflow/Collector','./Builder','./Scale','../parse/axes','../util/index','../util/constants'],function(require, exports, module) {
  var Node = require('../dataflow/Node'),
      Collector = require('../dataflow/Collector'),
      Builder = require('./Builder'),
      Scale = require('./Scale'),
      parseAxes = require('../parse/axes'),
      util = require('../util/index'),
      C = require('../util/constants');

  function GroupBuilder() {
    this._children = {};
    this._scaler = null;
    this._recursor = null;

    this._scales = {};
    this.scale = scale.bind(this);
    return arguments.length ? this.init.apply(this, arguments) : this;
  }

  var proto = (GroupBuilder.prototype = new Builder());

  proto.init = function(model, def, mark, parent, parent_id, inheritFrom) {
    var builder = this;

    this._scaler = new Node(model.graph);

    (def.scales||[]).forEach(function(s) { 
      s = builder.scale(s.name, new Scale(model, s, builder));
      builder._scaler.addListener(s);  // Scales should be computed after group is encoded
    });

    this._recursor = new Node(model.graph);
    this._recursor.evaluate = recurse.bind(this);

    var scales = (def.axes||[]).reduce(function(acc, x) {
      return (acc[x.scale] = 1, acc);
    }, {});
    this._recursor.dependency(C.SCALES, util.keys(scales));

    // We only need a collector for up-propagation of bounds calculation,
    // so only GroupBuilders, and not regular Builders, have collectors.
    this._collector = new Collector(model.graph);

    return Builder.prototype.init.apply(this, arguments);
  };

  proto.evaluate = function(input) {
    var output = Builder.prototype.evaluate.apply(this, arguments),
        builder = this;

    output.add.forEach(function(group) { buildGroup.call(builder, output, group); });
    return output;
  };

  proto.pipeline = function() {
    return [this, this._scaler, this._recursor, this._collector, this._bounder];
  };

  proto.disconnect = function() {
    var builder = this;
    util.keys(builder._children).forEach(function(group_id) {
      builder._children[group_id].forEach(function(c) {
        builder._recursor.removeListener(c.builder);
        c.builder.disconnect();
      })
    });

    builder._children = {};
    return Builder.prototype.disconnect.call(this);
  };

  proto.child = function(name, group_id) {
    var children = this._children[group_id],
        i = 0, len = children.length,
        child;

    for(; i<len; ++i) {
      child = children[i];
      if(child.type == C.MARK && child.builder._def.name == name) break;
    }

    return child.builder;
  };

  function recurse(input) {
    var builder = this,
        hasMarks = this._def.marks && this._def.marks.length > 0,
        hasAxes = this._def.axes && this._def.axes.length > 0,
        i, len, group, pipeline, def, inline = false;

    for(i=0, len=input.add.length; i<len; ++i) {
      group = input.add[i];
      if(hasMarks) buildMarks.call(this, input, group);
      if(hasAxes)  buildAxes.call(this, input, group);
    }

    // Wire up new children builders in reverse to minimize graph rewrites.
    for (i=input.add.length-1; i>=0; --i) {
      group = input.add[i];
      for (j=this._children[group._id].length-1; j>=0; --j) {
        c = this._children[group._id][j];
        c.builder.connect();
        pipeline = c.builder.pipeline();
        def = c.builder._def;

        // This new child needs to be built during this propagation cycle.
        // We could add its builder as a listener off the _recursor node, 
        // but try to inline it if we can to minimize graph dispatches.
        inline = (def.type !== C.GROUP);
        inline = inline && (this._model.data(c.from) !== undefined); 
        inline = inline && (pipeline[pipeline.length-1].listeners().length == 1); // Reactive geom
        c.inline = inline;

        if(inline) c.builder.evaluate(input);
        else this._recursor.addListener(c.builder);
      }
    }

    for(i=0, len=input.mod.length; i<len; ++i) {
      group = input.mod[i];
      // Remove temporary connection for marks that draw from a source
      if(hasMarks) {
        builder._children[group._id].forEach(function(c) {
          if(c.type == C.MARK && !c.inline && builder._model.data(c.from) !== undefined ) {
            builder._recursor.removeListener(c.builder);
          }
        });
      }

      // Update axes data defs
      if(hasAxes) {
        parseAxes(builder._model, builder._def.axes, group.axes, group);
        group.axes.forEach(function(a, i) { a.def() });
      }      
    }

    for(i=0, len=input.rem.length; i<len; ++i) {
      group = input.rem[i];
      // For deleted groups, disconnect their children
      builder._children[group._id].forEach(function(c) { 
        builder._recursor.removeListener(c.builder);
        c.builder.disconnect(); 
      });
      delete builder._children[group._id];
    }

    return input;
  };

  function scale(name, scale) {
    var group = this;
    if(arguments.length === 2) return (group._scales[name] = scale, scale);
    while(scale == null) {
      scale = group._scales[name];
      group = group.mark ? group.mark.group : group._parent;
      if(!group) break;
    }
    return scale;
  }

  function buildGroup(input, group) {
    util.debug(input, ["building group", group._id]);

    group._scales = group._scales || {};    
    group.scale  = scale.bind(group);

    group.items = group.items || [];
    this._children[group._id] = this._children[group._id] || [];

    group.axes = group.axes || [];
    group.axisItems = group.axisItems || [];
  }

  function buildMarks(input, group) {
    util.debug(input, ["building marks", group._id]);
    var marks = this._def.marks,
        listeners = [],
        mark, from, inherit, i, len, m, b;

    for(i=0, len=marks.length; i<len; ++i) {
      mark = marks[i];
      from = mark.from || {};
      inherit = "vg_"+group.datum._id;
      group.items[i] = {group: group};
      b = (mark.type === C.GROUP) ? new GroupBuilder() : new Builder();
      b.init(this._model, mark, group.items[i], this, group._id, inherit);
      this._children[group._id].push({ 
        builder: b, 
        from: from.data || (from.mark ? ("vg_" + group._id + "_" + from.mark) : inherit), 
        type: C.MARK 
      });
    }
  }

  function buildAxes(input, group) {
    var axes = group.axes,
        axisItems = group.axisItems,
        builder = this;

    parseAxes(this._model, this._def.axes, axes, group);
    axes.forEach(function(a, i) {
      var scale = builder._def.axes[i].scale,
          def = a.def(),
          b = null;

      axisItems[i] = {group: group, axisDef: def};
      b = (def.type === C.GROUP) ? new GroupBuilder() : new Builder();
      b.init(builder._model, def, axisItems[i], builder)
        .dependency(C.SCALES, scale);
      builder._children[group._id].push({ builder: b, type: C.AXIS, scale: scale });
    });
  }

  return GroupBuilder;
});
define('core/Model',['require','exports','module','../dataflow/Graph','../dataflow/Node','../scene/GroupBuilder','../dataflow/changeset','../util/index'],function(require, exports, module) {
  var Graph = require('../dataflow/Graph'), 
      Node  = require('../dataflow/Node'),
      GroupBuilder = require('../scene/GroupBuilder'),
      changeset = require('../dataflow/changeset'), 
      util = require('../util/index');

  function Model() {
    this._defs = {};
    this._predicates = {};
    this._scene = null;

    this.graph = new Graph();

    this._node = new Node(this.graph);
    this._builder = null; // Top-level scenegraph builder
  };

  var proto = Model.prototype;

  proto.defs = function(defs) {
    if (!arguments.length) return this._defs;
    this._defs = defs;
    return this;
  };

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
    return (this._predicates[name] = predicate);
  };

  proto.predicates = function() { return this._predicates; };

  proto.scene = function(renderer) {
    if(!arguments.length) return this._scene;
    if(this._builder) this._node.removeListener(this._builder.disconnect());
    this._builder = new GroupBuilder(this, this._defs.marks, this._scene={});
    this._node.addListener(this._builder.connect());
    var p = this._builder.pipeline();
    p[p.length-1].addListener(renderer);
    return this;
  };

  proto.addListener = function(l) { this._node.addListener(l); };
  proto.removeListener = function(l) { this._node.removeListener(l); };

  proto.fire = function(cs) {
    if(!cs) cs = changeset.create();
    this.graph.propagate(cs, this._node);
  };

  return Model;
});
define('parse/events',[],function() {
  /*
   * Generated by PEG.js 0.8.0.
   *
   * http://pegjs.majda.cz/
   */

  function peg$subclass(child, parent) {
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
  }

  function SyntaxError(message, expected, found, offset, line, column) {
    this.message  = message;
    this.expected = expected;
    this.found    = found;
    this.offset   = offset;
    this.line     = line;
    this.column   = column;

    this.name     = "SyntaxError";
  }

  peg$subclass(SyntaxError, Error);

  function parse(input) {
    var options = arguments.length > 1 ? arguments[1] : {},

        peg$FAILED = {},

        peg$startRuleFunctions = { start: peg$parsestart },
        peg$startRuleFunction  = peg$parsestart,

        peg$c0 = peg$FAILED,
        peg$c1 = ",",
        peg$c2 = { type: "literal", value: ",", description: "\",\"" },
        peg$c3 = function(o, m) { return [o].concat(m) },
        peg$c4 = function(o) { return [o] },
        peg$c5 = "[",
        peg$c6 = { type: "literal", value: "[", description: "\"[\"" },
        peg$c7 = "]",
        peg$c8 = { type: "literal", value: "]", description: "\"]\"" },
        peg$c9 = ">",
        peg$c10 = { type: "literal", value: ">", description: "\">\"" },
        peg$c11 = function(f1, f2, o) { return {start: f1, end: f2, middle: o}},
        peg$c12 = [],
        peg$c13 = function(s, f) { return (s.filters = f), s },
        peg$c14 = function(s) { return s },
        peg$c15 = null,
        peg$c16 = function(t, e) { return { event: e, target: t } },
        peg$c17 = /^[:a-zA-z0-9_\-]/,
        peg$c18 = { type: "class", value: "[:a-zA-z0-9_\\-]", description: "[:a-zA-z0-9_\\-]" },
        peg$c19 = function(s) { return { signal: s.join("") }},
        peg$c20 = "(",
        peg$c21 = { type: "literal", value: "(", description: "\"(\"" },
        peg$c22 = ")",
        peg$c23 = { type: "literal", value: ")", description: "\")\"" },
        peg$c24 = function(m) { return { stream: m }},
        peg$c25 = ".",
        peg$c26 = { type: "literal", value: ".", description: "\".\"" },
        peg$c27 = ":",
        peg$c28 = { type: "literal", value: ":", description: "\":\"" },
        peg$c29 = function(c) { return { type:'class', value: c } },
        peg$c30 = "#",
        peg$c31 = { type: "literal", value: "#", description: "\"#\"" },
        peg$c32 = function(id) { return { type:'id', value: id } },
        peg$c33 = "mousedown",
        peg$c34 = { type: "literal", value: "mousedown", description: "\"mousedown\"" },
        peg$c35 = "mouseup",
        peg$c36 = { type: "literal", value: "mouseup", description: "\"mouseup\"" },
        peg$c37 = "click",
        peg$c38 = { type: "literal", value: "click", description: "\"click\"" },
        peg$c39 = "dblclick",
        peg$c40 = { type: "literal", value: "dblclick", description: "\"dblclick\"" },
        peg$c41 = "wheel",
        peg$c42 = { type: "literal", value: "wheel", description: "\"wheel\"" },
        peg$c43 = "keydown",
        peg$c44 = { type: "literal", value: "keydown", description: "\"keydown\"" },
        peg$c45 = "keypress",
        peg$c46 = { type: "literal", value: "keypress", description: "\"keypress\"" },
        peg$c47 = "keyup",
        peg$c48 = { type: "literal", value: "keyup", description: "\"keyup\"" },
        peg$c49 = "mousewheel",
        peg$c50 = { type: "literal", value: "mousewheel", description: "\"mousewheel\"" },
        peg$c51 = "mousemove",
        peg$c52 = { type: "literal", value: "mousemove", description: "\"mousemove\"" },
        peg$c53 = "mouseout",
        peg$c54 = { type: "literal", value: "mouseout", description: "\"mouseout\"" },
        peg$c55 = "mouseover",
        peg$c56 = { type: "literal", value: "mouseover", description: "\"mouseover\"" },
        peg$c57 = "mouseenter",
        peg$c58 = { type: "literal", value: "mouseenter", description: "\"mouseenter\"" },
        peg$c59 = function(a, field, o, v) { return a + field + o + v },
        peg$c60 = "e.",
        peg$c61 = { type: "literal", value: "e.", description: "\"e.\"" },
        peg$c62 = "i.",
        peg$c63 = { type: "literal", value: "i.", description: "\"i.\"" },
        peg$c64 = "d.",
        peg$c65 = { type: "literal", value: "d.", description: "\"d.\"" },
        peg$c66 = "p.",
        peg$c67 = { type: "literal", value: "p.", description: "\"p.\"" },
        peg$c68 = "==",
        peg$c69 = { type: "literal", value: "==", description: "\"==\"" },
        peg$c70 = "!=",
        peg$c71 = { type: "literal", value: "!=", description: "\"!=\"" },
        peg$c72 = ">=",
        peg$c73 = { type: "literal", value: ">=", description: "\">=\"" },
        peg$c74 = "<",
        peg$c75 = { type: "literal", value: "<", description: "\"<\"" },
        peg$c76 = "<=",
        peg$c77 = { type: "literal", value: "<=", description: "\"<=\"" },
        peg$c78 = /^['"a-zA-Z0-9_\-]/,
        peg$c79 = { type: "class", value: "['\"a-zA-Z0-9_\\-]", description: "['\"a-zA-Z0-9_\\-]" },
        peg$c80 = function(v) { return v.join("") },
        peg$c81 = /^[ \t\r\n]/,
        peg$c82 = { type: "class", value: "[ \\t\\r\\n]", description: "[ \\t\\r\\n]" },

        peg$currPos          = 0,
        peg$reportedPos      = 0,
        peg$cachedPos        = 0,
        peg$cachedPosDetails = { line: 1, column: 1, seenCR: false },
        peg$maxFailPos       = 0,
        peg$maxFailExpected  = [],
        peg$silentFails      = 0,

        peg$result;

    if ("startRule" in options) {
      if (!(options.startRule in peg$startRuleFunctions)) {
        throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
      }

      peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }

    function text() {
      return input.substring(peg$reportedPos, peg$currPos);
    }

    function offset() {
      return peg$reportedPos;
    }

    function line() {
      return peg$computePosDetails(peg$reportedPos).line;
    }

    function column() {
      return peg$computePosDetails(peg$reportedPos).column;
    }

    function expected(description) {
      throw peg$buildException(
        null,
        [{ type: "other", description: description }],
        peg$reportedPos
      );
    }

    function error(message) {
      throw peg$buildException(message, null, peg$reportedPos);
    }

    function peg$computePosDetails(pos) {
      function advance(details, startPos, endPos) {
        var p, ch;

        for (p = startPos; p < endPos; p++) {
          ch = input.charAt(p);
          if (ch === "\n") {
            if (!details.seenCR) { details.line++; }
            details.column = 1;
            details.seenCR = false;
          } else if (ch === "\r" || ch === "\u2028" || ch === "\u2029") {
            details.line++;
            details.column = 1;
            details.seenCR = true;
          } else {
            details.column++;
            details.seenCR = false;
          }
        }
      }

      if (peg$cachedPos !== pos) {
        if (peg$cachedPos > pos) {
          peg$cachedPos = 0;
          peg$cachedPosDetails = { line: 1, column: 1, seenCR: false };
        }
        advance(peg$cachedPosDetails, peg$cachedPos, pos);
        peg$cachedPos = pos;
      }

      return peg$cachedPosDetails;
    }

    function peg$fail(expected) {
      if (peg$currPos < peg$maxFailPos) { return; }

      if (peg$currPos > peg$maxFailPos) {
        peg$maxFailPos = peg$currPos;
        peg$maxFailExpected = [];
      }

      peg$maxFailExpected.push(expected);
    }

    function peg$buildException(message, expected, pos) {
      function cleanupExpected(expected) {
        var i = 1;

        expected.sort(function(a, b) {
          if (a.description < b.description) {
            return -1;
          } else if (a.description > b.description) {
            return 1;
          } else {
            return 0;
          }
        });

        while (i < expected.length) {
          if (expected[i - 1] === expected[i]) {
            expected.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      function buildMessage(expected, found) {
        function stringEscape(s) {
          function hex(ch) { return ch.charCodeAt(0).toString(16).toUpperCase(); }

          return s
            .replace(/\\/g,   '\\\\')
            .replace(/"/g,    '\\"')
            .replace(/\x08/g, '\\b')
            .replace(/\t/g,   '\\t')
            .replace(/\n/g,   '\\n')
            .replace(/\f/g,   '\\f')
            .replace(/\r/g,   '\\r')
            .replace(/[\x00-\x07\x0B\x0E\x0F]/g, function(ch) { return '\\x0' + hex(ch); })
            .replace(/[\x10-\x1F\x80-\xFF]/g,    function(ch) { return '\\x'  + hex(ch); })
            .replace(/[\u0180-\u0FFF]/g,         function(ch) { return '\\u0' + hex(ch); })
            .replace(/[\u1080-\uFFFF]/g,         function(ch) { return '\\u'  + hex(ch); });
        }

        var expectedDescs = new Array(expected.length),
            expectedDesc, foundDesc, i;

        for (i = 0; i < expected.length; i++) {
          expectedDescs[i] = expected[i].description;
        }

        expectedDesc = expected.length > 1
          ? expectedDescs.slice(0, -1).join(", ")
              + " or "
              + expectedDescs[expected.length - 1]
          : expectedDescs[0];

        foundDesc = found ? "\"" + stringEscape(found) + "\"" : "end of input";

        return "Expected " + expectedDesc + " but " + foundDesc + " found.";
      }

      var posDetails = peg$computePosDetails(pos),
          found      = pos < input.length ? input.charAt(pos) : null;

      if (expected !== null) {
        cleanupExpected(expected);
      }

      return new SyntaxError(
        message !== null ? message : buildMessage(expected, found),
        expected,
        found,
        pos,
        posDetails.line,
        posDetails.column
      );
    }

    function peg$parsestart() {
      var s0;

      s0 = peg$parsemerged();

      return s0;
    }

    function peg$parsemerged() {
      var s0, s1, s2, s3, s4, s5;

      s0 = peg$currPos;
      s1 = peg$parseordered();
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesep();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 44) {
            s3 = peg$c1;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c2); }
          }
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesep();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsemerged();
              if (s5 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c3(s1, s5);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parseordered();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c4(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parseordered() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c5;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c6); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesep();
        if (s2 !== peg$FAILED) {
          s3 = peg$parsefiltered();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsesep();
            if (s4 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 44) {
                s5 = peg$c1;
                peg$currPos++;
              } else {
                s5 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c2); }
              }
              if (s5 !== peg$FAILED) {
                s6 = peg$parsesep();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsefiltered();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsesep();
                    if (s8 !== peg$FAILED) {
                      if (input.charCodeAt(peg$currPos) === 93) {
                        s9 = peg$c7;
                        peg$currPos++;
                      } else {
                        s9 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c8); }
                      }
                      if (s9 !== peg$FAILED) {
                        s10 = peg$parsesep();
                        if (s10 !== peg$FAILED) {
                          if (input.charCodeAt(peg$currPos) === 62) {
                            s11 = peg$c9;
                            peg$currPos++;
                          } else {
                            s11 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c10); }
                          }
                          if (s11 !== peg$FAILED) {
                            s12 = peg$parsesep();
                            if (s12 !== peg$FAILED) {
                              s13 = peg$parseordered();
                              if (s13 !== peg$FAILED) {
                                peg$reportedPos = s0;
                                s1 = peg$c11(s3, s7, s13);
                                s0 = s1;
                              } else {
                                peg$currPos = s0;
                                s0 = peg$c0;
                              }
                            } else {
                              peg$currPos = s0;
                              s0 = peg$c0;
                            }
                          } else {
                            peg$currPos = s0;
                            s0 = peg$c0;
                          }
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$parsefiltered();
      }

      return s0;
    }

    function peg$parsefiltered() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parsestream();
      if (s1 !== peg$FAILED) {
        s2 = [];
        s3 = peg$parsefilter();
        if (s3 !== peg$FAILED) {
          while (s3 !== peg$FAILED) {
            s2.push(s3);
            s3 = peg$parsefilter();
          }
        } else {
          s2 = peg$c0;
        }
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c13(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = peg$parsestream();
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c14(s1);
        }
        s0 = s1;
      }

      return s0;
    }

    function peg$parsestream() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      s1 = peg$parseclass();
      if (s1 === peg$FAILED) {
        s1 = peg$parseid();
      }
      if (s1 === peg$FAILED) {
        s1 = peg$c15;
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parseeventType();
        if (s2 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c16(s1, s2);
          s0 = s1;
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }
      if (s0 === peg$FAILED) {
        s0 = peg$currPos;
        s1 = [];
        if (peg$c17.test(input.charAt(peg$currPos))) {
          s2 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s2 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c18); }
        }
        if (s2 !== peg$FAILED) {
          while (s2 !== peg$FAILED) {
            s1.push(s2);
            if (peg$c17.test(input.charAt(peg$currPos))) {
              s2 = input.charAt(peg$currPos);
              peg$currPos++;
            } else {
              s2 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c18); }
            }
          }
        } else {
          s1 = peg$c0;
        }
        if (s1 !== peg$FAILED) {
          peg$reportedPos = s0;
          s1 = peg$c19(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
          s0 = peg$currPos;
          if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c20;
            peg$currPos++;
          } else {
            s1 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c21); }
          }
          if (s1 !== peg$FAILED) {
            s2 = peg$parsemerged();
            if (s2 !== peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 41) {
                s3 = peg$c22;
                peg$currPos++;
              } else {
                s3 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c23); }
              }
              if (s3 !== peg$FAILED) {
                peg$reportedPos = s0;
                s1 = peg$c24(s2);
                s0 = s1;
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        }
      }

      return s0;
    }

    function peg$parseclass() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 46) {
        s1 = peg$c25;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c26); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsevalue();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s3 = peg$c27;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c28); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c29(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseid() {
      var s0, s1, s2, s3;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 35) {
        s1 = peg$c30;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c31); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsevalue();
        if (s2 !== peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 58) {
            s3 = peg$c27;
            peg$currPos++;
          } else {
            s3 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c28); }
          }
          if (s3 !== peg$FAILED) {
            peg$reportedPos = s0;
            s1 = peg$c32(s2);
            s0 = s1;
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseeventType() {
      var s0;

      if (input.substr(peg$currPos, 9) === peg$c33) {
        s0 = peg$c33;
        peg$currPos += 9;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c34); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 7) === peg$c35) {
          s0 = peg$c35;
          peg$currPos += 7;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c36); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 5) === peg$c37) {
            s0 = peg$c37;
            peg$currPos += 5;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c38); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 8) === peg$c39) {
              s0 = peg$c39;
              peg$currPos += 8;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c40); }
            }
            if (s0 === peg$FAILED) {
              if (input.substr(peg$currPos, 5) === peg$c41) {
                s0 = peg$c41;
                peg$currPos += 5;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c42); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 7) === peg$c43) {
                  s0 = peg$c43;
                  peg$currPos += 7;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c44); }
                }
                if (s0 === peg$FAILED) {
                  if (input.substr(peg$currPos, 8) === peg$c45) {
                    s0 = peg$c45;
                    peg$currPos += 8;
                  } else {
                    s0 = peg$FAILED;
                    if (peg$silentFails === 0) { peg$fail(peg$c46); }
                  }
                  if (s0 === peg$FAILED) {
                    if (input.substr(peg$currPos, 5) === peg$c47) {
                      s0 = peg$c47;
                      peg$currPos += 5;
                    } else {
                      s0 = peg$FAILED;
                      if (peg$silentFails === 0) { peg$fail(peg$c48); }
                    }
                    if (s0 === peg$FAILED) {
                      if (input.substr(peg$currPos, 10) === peg$c49) {
                        s0 = peg$c49;
                        peg$currPos += 10;
                      } else {
                        s0 = peg$FAILED;
                        if (peg$silentFails === 0) { peg$fail(peg$c50); }
                      }
                      if (s0 === peg$FAILED) {
                        if (input.substr(peg$currPos, 9) === peg$c51) {
                          s0 = peg$c51;
                          peg$currPos += 9;
                        } else {
                          s0 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c52); }
                        }
                        if (s0 === peg$FAILED) {
                          if (input.substr(peg$currPos, 8) === peg$c53) {
                            s0 = peg$c53;
                            peg$currPos += 8;
                          } else {
                            s0 = peg$FAILED;
                            if (peg$silentFails === 0) { peg$fail(peg$c54); }
                          }
                          if (s0 === peg$FAILED) {
                            if (input.substr(peg$currPos, 9) === peg$c55) {
                              s0 = peg$c55;
                              peg$currPos += 9;
                            } else {
                              s0 = peg$FAILED;
                              if (peg$silentFails === 0) { peg$fail(peg$c56); }
                            }
                            if (s0 === peg$FAILED) {
                              if (input.substr(peg$currPos, 10) === peg$c57) {
                                s0 = peg$c57;
                                peg$currPos += 10;
                              } else {
                                s0 = peg$FAILED;
                                if (peg$silentFails === 0) { peg$fail(peg$c58); }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsefilter() {
      var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10;

      s0 = peg$currPos;
      if (input.charCodeAt(peg$currPos) === 91) {
        s1 = peg$c5;
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c6); }
      }
      if (s1 !== peg$FAILED) {
        s2 = peg$parsesep();
        if (s2 !== peg$FAILED) {
          s3 = peg$parseaccessor();
          if (s3 !== peg$FAILED) {
            s4 = peg$parsevalue();
            if (s4 !== peg$FAILED) {
              s5 = peg$parsesep();
              if (s5 !== peg$FAILED) {
                s6 = peg$parseop();
                if (s6 !== peg$FAILED) {
                  s7 = peg$parsesep();
                  if (s7 !== peg$FAILED) {
                    s8 = peg$parsevalue();
                    if (s8 !== peg$FAILED) {
                      s9 = peg$parsesep();
                      if (s9 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 93) {
                          s10 = peg$c7;
                          peg$currPos++;
                        } else {
                          s10 = peg$FAILED;
                          if (peg$silentFails === 0) { peg$fail(peg$c8); }
                        }
                        if (s10 !== peg$FAILED) {
                          peg$reportedPos = s0;
                          s1 = peg$c59(s3, s4, s6, s8);
                          s0 = s1;
                        } else {
                          peg$currPos = s0;
                          s0 = peg$c0;
                        }
                      } else {
                        peg$currPos = s0;
                        s0 = peg$c0;
                      }
                    } else {
                      peg$currPos = s0;
                      s0 = peg$c0;
                    }
                  } else {
                    peg$currPos = s0;
                    s0 = peg$c0;
                  }
                } else {
                  peg$currPos = s0;
                  s0 = peg$c0;
                }
              } else {
                peg$currPos = s0;
                s0 = peg$c0;
              }
            } else {
              peg$currPos = s0;
              s0 = peg$c0;
            }
          } else {
            peg$currPos = s0;
            s0 = peg$c0;
          }
        } else {
          peg$currPos = s0;
          s0 = peg$c0;
        }
      } else {
        peg$currPos = s0;
        s0 = peg$c0;
      }

      return s0;
    }

    function peg$parseaccessor() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c60) {
        s0 = peg$c60;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c61); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c62) {
          s0 = peg$c62;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c63); }
        }
        if (s0 === peg$FAILED) {
          if (input.substr(peg$currPos, 2) === peg$c64) {
            s0 = peg$c64;
            peg$currPos += 2;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c65); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c66) {
              s0 = peg$c66;
              peg$currPos += 2;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c67); }
            }
          }
        }
      }

      return s0;
    }

    function peg$parseop() {
      var s0;

      if (input.substr(peg$currPos, 2) === peg$c68) {
        s0 = peg$c68;
        peg$currPos += 2;
      } else {
        s0 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c69); }
      }
      if (s0 === peg$FAILED) {
        if (input.substr(peg$currPos, 2) === peg$c70) {
          s0 = peg$c70;
          peg$currPos += 2;
        } else {
          s0 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c71); }
        }
        if (s0 === peg$FAILED) {
          if (input.charCodeAt(peg$currPos) === 62) {
            s0 = peg$c9;
            peg$currPos++;
          } else {
            s0 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c10); }
          }
          if (s0 === peg$FAILED) {
            if (input.substr(peg$currPos, 2) === peg$c72) {
              s0 = peg$c72;
              peg$currPos += 2;
            } else {
              s0 = peg$FAILED;
              if (peg$silentFails === 0) { peg$fail(peg$c73); }
            }
            if (s0 === peg$FAILED) {
              if (input.charCodeAt(peg$currPos) === 60) {
                s0 = peg$c74;
                peg$currPos++;
              } else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) { peg$fail(peg$c75); }
              }
              if (s0 === peg$FAILED) {
                if (input.substr(peg$currPos, 2) === peg$c76) {
                  s0 = peg$c76;
                  peg$currPos += 2;
                } else {
                  s0 = peg$FAILED;
                  if (peg$silentFails === 0) { peg$fail(peg$c77); }
                }
              }
            }
          }
        }
      }

      return s0;
    }

    function peg$parsevalue() {
      var s0, s1, s2;

      s0 = peg$currPos;
      s1 = [];
      if (peg$c78.test(input.charAt(peg$currPos))) {
        s2 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s2 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c79); }
      }
      if (s2 !== peg$FAILED) {
        while (s2 !== peg$FAILED) {
          s1.push(s2);
          if (peg$c78.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
          } else {
            s2 = peg$FAILED;
            if (peg$silentFails === 0) { peg$fail(peg$c79); }
          }
        }
      } else {
        s1 = peg$c0;
      }
      if (s1 !== peg$FAILED) {
        peg$reportedPos = s0;
        s1 = peg$c80(s1);
      }
      s0 = s1;

      return s0;
    }

    function peg$parsesep() {
      var s0, s1;

      s0 = [];
      if (peg$c81.test(input.charAt(peg$currPos))) {
        s1 = input.charAt(peg$currPos);
        peg$currPos++;
      } else {
        s1 = peg$FAILED;
        if (peg$silentFails === 0) { peg$fail(peg$c82); }
      }
      while (s1 !== peg$FAILED) {
        s0.push(s1);
        if (peg$c81.test(input.charAt(peg$currPos))) {
          s1 = input.charAt(peg$currPos);
          peg$currPos++;
        } else {
          s1 = peg$FAILED;
          if (peg$silentFails === 0) { peg$fail(peg$c82); }
        }
      }

      return s0;
    }

    peg$result = peg$startRuleFunction();

    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
      return peg$result;
    } else {
      if (peg$result !== peg$FAILED && peg$currPos < input.length) {
        peg$fail({ type: "end", description: "end of input" });
      }

      throw peg$buildException(null, peg$maxFailExpected, peg$maxFailPos);
    }
  }

  return {
    SyntaxError: SyntaxError,
    parse:       parse
  };
});
define('parse/streams',['require','exports','module','d3','../dataflow/Node','../dataflow/changeset','./events','./expr','../util/index','../util/constants'],function(require, exports, module) {
  var d3 = require('d3'),
      Node = require('../dataflow/Node'),
      changset = require('../dataflow/changeset'),
      selector = require('./events'),
      expr = require('./expr'),
      util = require('../util/index'),
      C = require('../util/constants');

  var START = "start", MIDDLE = "middle", END = "end";

  return function(view) {
    var model = view.model(),
        graph = model.graph,
        spec  = model.defs().signals,
        register = {}, nodes = {};

    function scale(def, value, item) {
      if(!item || !item.scale) {
        item = (item && item.mark) ? item.mark.group : model.scene().items[0];
      }

      var scale = item.scale(def.scale.signal || def.scale);
      if(!scale) return value;
      return def.invert ? scale.invert(value) : scale(value);
    }

    function signal(sig, selector, exp, spec) {
      var n = new Node(graph);
      n.evaluate = function(input) {
        var val = expr.eval(graph, exp.fn, null, null, null, null, exp.signals);
        if(spec.scale) val = scale(spec, val);
        sig.value(val);
        input.signals[sig.name()] = 1;
        input.reflow = true;
        return input;  
      };
      n.dependency(C.SIGNALS, selector.signal);
      n.addListener(sig);
      graph.signal(selector.signal).addListener(n);
    };

    function event(sig, selector, exp, spec) {
      var filters = selector.filters || [],
          target = selector.target;

      if(target) filters.push("i."+target.type+"=="+util.str(target.value));

      register[selector.event] = register[selector.event] || [];
      register[selector.event].push({
        signal: sig,
        exp: exp,
        filters: filters.map(function(f) { return expr(graph, f); }),
        spec: spec
      });

      nodes[selector.event] = nodes[selector.event] || new Node(graph);
      nodes[selector.event].addListener(sig);
    };

    function orderedStream(sig, selector, exp, spec) {
      var name = sig.name(), 
          trueFn = expr(graph, "true"),
          s = {};

      s[START]  = graph.signal(name + START,  false);
      s[MIDDLE] = graph.signal(name + MIDDLE, false);
      s[END]    = graph.signal(name + END,    false);

      var router = new Node(graph);
      router.evaluate = function(input) {
        if(s[START].value() === true && s[END].value() === false) {
          // TODO: Expand selector syntax to allow start/end signals into stream.
          // Until then, prevent old middles entering stream on new start.
          if(input.signals[name+START]) return graph.doNotPropagate;

          sig.value(s[MIDDLE].value());
          input.signals[name] = 1;
          return input;
        }

        if(s[END].value() === true) {
          s[START].value(false);
          s[END].value(false);
        }

        return graph.doNotPropagate;
      };
      router.addListener(sig);

      [START, MIDDLE, END].forEach(function(x) {
        var val = (x == MIDDLE) ? exp : trueFn,
            sp = (x == MIDDLE) ? spec : {};

        if(selector[x].event) event(s[x], selector[x], val, sp);
        else if(selector[x].signal) signal(s[x], selector[x], val, sp);
        else if(selector[x].stream) mergedStream(s[x], selector[x], val, sp);
        s[x].addListener(router);
      });
    };

    function mergedStream(sig, selector, exp, spec) {
      selector.forEach(function(s) {
        if(s.event)       event(sig, s, exp, spec);
        else if(s.signal) signal(sig, s, exp, spec);
        else if(s.start)  orderedStream(sig, s, exp, spec);
        else if(s.stream) mergedStream(sig, s.stream, exp, spec);
      });
    };

    (spec || []).forEach(function(sig) {
      var signal = graph.signal(sig.name);
      if(sig.expr) return;  // Cannot have an expr and stream definition.

      (sig.streams || []).forEach(function(stream) {
        var sel = selector.parse(stream.type),
            exp = expr(graph, stream.expr);
        mergedStream(signal, sel, exp, stream);
      });
    });

    // We register the event listeners all together so that if multiple
    // signals are registered on the same event, they will receive the
    // new value on the same pulse. 

    // TODO: Filters, time intervals, target selectors
    util.keys(register).forEach(function(r) {
      var handlers = register[r], 
          node = nodes[r];

      view.on(r, function(evt, item) {
        var cs = changset.create(null, true),
            pad = view.padding(),
            filtered = false,
            val, h, i, m, d;

        evt.preventDefault(); // Stop text selection
        m = d3.mouse((d3.event=evt, view._el)); // Relative position within container
        item = item||{};
        d = item.datum||{};
        var p = {x: m[0] - pad.left, y: m[1] - pad.top};

        for(i = 0; i < handlers.length; i++) {
          h = handlers[i];
          filtered = h.filters.some(function(f) {
            return !expr.eval(graph, f.fn, d, evt, item, p, f.signals);
          });
          if(filtered) continue;
          
          val = expr.eval(graph, h.exp.fn, d, evt, item, p, h.exp.signals); 
          if(h.spec.scale) val = scale(h.spec, val, item);
          h.signal.value(val);
          cs.signals[h.signal.name()] = 1;
        }

        graph.propagate(cs, node);
      });
    })
  };
});
define('render/canvas/marks',['require','exports','module','../../core/Bounds','../../util/bounds','../../util/index','../../util/config','./path'],function(require, module, exports) {
  var Bounds = require('../../core/Bounds'),
      boundsCalc = require('../../util/bounds'),
      util = require('../../util/index'),
      config = require('../../util/config'),
      path = require('./path');

  var parsePath = path.parse,
      renderPath = path.render,
      halfpi = Math.PI / 2,
      sqrt3 = Math.sqrt(3),
      tan30 = Math.tan(30 * Math.PI / 180),
      tmpBounds = new Bounds();

  // path generators

  function arcPath(g, o) {
    var x = o.x || 0,
        y = o.y || 0,
        ir = o.innerRadius || 0,
        or = o.outerRadius || 0,
        sa = (o.startAngle || 0) - Math.PI/2,
        ea = (o.endAngle || 0) - Math.PI/2;
    g.beginPath();
    if (ir === 0) g.moveTo(x, y);
    else g.arc(x, y, ir, sa, ea, 0);
    g.arc(x, y, or, ea, sa, 1);
    g.closePath();
  }

  function areaPath(g, items) {
    var o = items[0],
        m = o.mark,
        p = m.pathCache || (m.pathCache = parsePath(path.area(items)));
    renderPath(g, p);
  }

  function linePath(g, items) {
    var o = items[0],
        m = o.mark,
        p = m.pathCache || (m.pathCache = parsePath(path.line(items)));
    renderPath(g, p);
  }

  function pathPath(g, o) {
    if (o.path == null) return;
    var p = o.pathCache || (o.pathCache = parsePath(o.path));
    return renderPath(g, p, o.x, o.y);
  }

  function symbolPath(g, o) {
    g.beginPath();
    var size = o.size != null ? o.size : 100,
        x = o.x, y = o.y, r, t, rx, ry;

    if (o.shape == null || o.shape === "circle") {
      r = Math.sqrt(size/Math.PI);
      g.arc(x, y, r, 0, 2*Math.PI, 0);
      g.closePath();
      return;
    }

    switch (o.shape) {
      case "cross":
        r = Math.sqrt(size / 5) / 2;
        t = 3*r;
        g.moveTo(x-t, y-r);
        g.lineTo(x-r, y-r);
        g.lineTo(x-r, y-t);
        g.lineTo(x+r, y-t);
        g.lineTo(x+r, y-r);
        g.lineTo(x+t, y-r);
        g.lineTo(x+t, y+r);
        g.lineTo(x+r, y+r);
        g.lineTo(x+r, y+t);
        g.lineTo(x-r, y+t);
        g.lineTo(x-r, y+r);
        g.lineTo(x-t, y+r);
        break;

      case "diamond":
        ry = Math.sqrt(size / (2 * tan30));
        rx = ry * tan30;
        g.moveTo(x, y-ry);
        g.lineTo(x+rx, y);
        g.lineTo(x, y+ry);
        g.lineTo(x-rx, y);
        break;

      case "square":
        t = Math.sqrt(size);
        r = t / 2;
        g.rect(x-r, y-r, t, t);
        break;

      case "triangle-down":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        g.moveTo(x, y+ry);
        g.lineTo(x+rx, y-ry);
        g.lineTo(x-rx, y-ry);
        break;

      case "triangle-up":
        rx = Math.sqrt(size / sqrt3);
        ry = rx * sqrt3 / 2;
        g.moveTo(x, y-ry);
        g.lineTo(x+rx, y+ry);
        g.lineTo(x-rx, y+ry);
    }
    g.closePath();
  }

  function lineStroke(g, items) {
    var o = items[0],
        lw = o.strokeWidth,
        lc = o.strokeCap;
    g.lineWidth = lw != null ? lw : config.render.lineWidth;
    g.lineCap   = lc != null ? lc : config.render.lineCap;
    linePath(g, items);
  }

  function ruleStroke(g, o) {
    var x1 = o.x || 0,
        y1 = o.y || 0,
        x2 = o.x2 != null ? o.x2 : x1,
        y2 = o.y2 != null ? o.y2 : y1,
        lw = o.strokeWidth,
        lc = o.strokeCap;

    g.lineWidth = lw != null ? lw : config.render.lineWidth;
    g.lineCap   = lc != null ? lc : config.render.lineCap;
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
  }

  // drawing functions

  function drawPathOne(path, g, o, items) {
    var fill = o.fill, stroke = o.stroke, opac, lc, lw;

    path(g, items);

    opac = o.opacity == null ? 1 : o.opacity;
    if (opac == 0 || !fill && !stroke) return;

    if (fill) {
      g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
      g.fillStyle = color(g, o, fill);
      g.fill();
    }

    if (stroke) {
      lw = (lw = o.strokeWidth) != null ? lw : config.render.lineWidth;
      if (lw > 0) {
        g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
        g.strokeStyle = color(g, o, stroke);
        g.lineWidth = lw;
        g.lineCap = (lc = o.strokeCap) != null ? lc : config.render.lineCap;
        g.vgLineDash(o.strokeDash || null);
        g.vgLineDashOffset(o.strokeDashOffset || 0);
        g.stroke();
      }
    }
  }

  function drawPathAll(path, g, scene, bounds) {
    var i, len, item;
    for (i=0, len=scene.items.length; i<len; ++i) {
      item = scene.items[i];
      if (bounds && !bounds.intersects(item.bounds))
        continue; // bounds check
      drawPathOne(path, g, item, item);
    }
  }

  function drawRect(g, scene, bounds) {
    if (!scene.items.length) return;
    var items = scene.items,
        o, fill, stroke, opac, lc, lw, x, y, w, h;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      x = o.x || 0;
      y = o.y || 0;
      w = o.width || 0;
      h = o.height || 0;

      opac = o.opacity == null ? 1 : o.opacity;
      if (opac == 0) continue;

      if (fill = o.fill) {
        g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
        g.fillStyle = color(g, o, fill);
        g.fillRect(x, y, w, h);
      }

      if (stroke = o.stroke) {
        lw = (lw = o.strokeWidth) != null ? lw : config.render.lineWidth;
        if (lw > 0) {
          g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
          g.strokeStyle = color(g, o, stroke);
          g.lineWidth = lw;
          g.lineCap = (lc = o.strokeCap) != null ? lc : config.render.lineCap;
          g.vgLineDash(o.strokeDash || null);
          g.vgLineDashOffset(o.strokeDashOffset || 0);
          g.strokeRect(x, y, w, h);
        }
      }
    }
  }

  function drawRule(g, scene, bounds) {
    if (!scene.items.length) return;
    var items = scene.items,
        o, stroke, opac, lc, lw, x1, y1, x2, y2;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      x1 = o.x || 0;
      y1 = o.y || 0;
      x2 = o.x2 != null ? o.x2 : x1;
      y2 = o.y2 != null ? o.y2 : y1;

      opac = o.opacity == null ? 1 : o.opacity;
      if (opac == 0) continue;
      
      if (stroke = o.stroke) {
        lw = (lw = o.strokeWidth) != null ? lw : config.render.lineWidth;
        if (lw > 0) {
          g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
          g.strokeStyle = color(g, o, stroke);
          g.lineWidth = lw;
          g.lineCap = (lc = o.strokeCap) != null ? lc : config.render.lineCap;
          g.vgLineDash(o.strokeDash || null);
          g.vgLineDashOffset(o.strokeDashOffset || 0);
          g.beginPath();
          g.moveTo(x1, y1);
          g.lineTo(x2, y2);
          g.stroke();
        }
      }
    }
  }

  function drawImage(g, scene, bounds) {
    if (!scene.items.length) return;
    var renderer = this,
        items = scene.items, o;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      if (!(o.image && o.image.url === o.url)) {
        o.image = renderer.loadImage(o.url);
        o.image.url = o.url;
      }

      var x, y, w, h, opac;
      w = o.width || (o.image && o.image.width) || 0;
      h = o.height || (o.image && o.image.height) || 0;
      x = (o.x||0) - (o.align === "center"
        ? w/2 : (o.align === "right" ? w : 0));
      y = (o.y||0) - (o.baseline === "middle"
        ? h/2 : (o.baseline === "bottom" ? h : 0));

      if (o.image.loaded) {
        g.globalAlpha = (opac = o.opacity) != null ? opac : 1;
        g.drawImage(o.image, x, y, w, h);
      }
    }
  }

  function drawText(g, scene, bounds) {
    if (!scene.items.length) return;
    var items = scene.items,
        o, fill, stroke, opac, lw, x, y, r, t;

    for (var i=0, len=items.length; i<len; ++i) {
      o = items[i];
      if (bounds && !bounds.intersects(o.bounds))
        continue; // bounds check

      g.font = util.fontString(o);
      g.textAlign = o.align || "left";
      g.textBaseline = o.baseline || "alphabetic";

      opac = o.opacity == null ? 1 : o.opacity;
      if (opac == 0) continue;

      x = o.x || 0;
      y = o.y || 0;
      if (r = o.radius) {
        t = (o.theta || 0) - Math.PI/2;
        x += r * Math.cos(t);
        y += r * Math.sin(t);
      }

      if (o.angle) {
        g.save();
        g.translate(x, y);
        g.rotate(o.angle * Math.PI/180);
        x = o.dx || 0;
        y = o.dy || 0;
      } else {
        x += (o.dx || 0);
        y += (o.dy || 0);
      }

      if (fill = o.fill) {
        g.globalAlpha = opac * (o.fillOpacity==null ? 1 : o.fillOpacity);
        g.fillStyle = color(g, o, fill);
        g.fillText(o.text, x, y);
      }

      if (stroke = o.stroke) {
        lw = (lw = o.strokeWidth) != null ? lw : 1;
        if (lw > 0) {
          g.globalAlpha = opac * (o.strokeOpacity==null ? 1 : o.strokeOpacity);
          g.strokeStyle = color(o, stroke);
          g.lineWidth = lw;
          g.strokeText(o.text, x, y);
        }
      }

      if (o.angle) g.restore();
    }
  }

  function drawAll(pathFunc) {
    return function(g, scene, bounds) {
      drawPathAll(pathFunc, g, scene, bounds);
    }
  }

  function drawOne(pathFunc) {
    return function(g, scene, bounds) {
      if (!scene.items.length) return;
      if (bounds && !bounds.intersects(scene.items[0].bounds))
        return; // bounds check
      drawPathOne(pathFunc, g, scene.items[0], scene.items);
    }
  }

  function drawGroup(g, scene, bounds) {
    if (!scene.items.length) return;
    var items = scene.items, group, axes, legends,
        renderer = this, gx, gy, gb, i, n, j, m;

    drawRect(g, scene, bounds);

    for (i=0, n=items.length; i<n; ++i) {
      group = items[i];
      axes = group.axisItems || [];
      legends = group.legendItems || [];
      gx = group.x || 0;
      gy = group.y || 0;

      // render group contents
      g.save();
      g.translate(gx, gy);
      if (group.clip) {
        g.beginPath();
        g.rect(0, 0, group.width || 0, group.height || 0);
        g.clip();
      }
      
      if (bounds) bounds.translate(-gx, -gy);
      
      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer === "back") {
          renderer.draw(g, axes[j], bounds);
        }
      }
      for (j=0, m=group.items.length; j<m; ++j) {
        renderer.draw(g, group.items[j], bounds);
      }
      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer !== "back") {
          renderer.draw(g, axes[j], bounds);
        }
      }
      for (j=0, m=legends.length; j<m; ++j) {
        renderer.draw(g, legends[j], bounds);
      }
      
      if (bounds) bounds.translate(gx, gy);
      g.restore();
    }    
  }

  function color(g, o, value) {
    return (value.id)
      ? gradient(g, value, o.bounds)
      : value;
  }

  function gradient(g, p, b) {
    var w = b.width(),
        h = b.height(),
        x1 = b.x1 + p.x1 * w,
        y1 = b.y1 + p.y1 * h,
        x2 = b.x1 + p.x2 * w,
        y2 = b.y1 + p.y2 * h,
        grad = g.createLinearGradient(x1, y1, x2, y2),
        stop = p.stops,
        i, n;

    for (i=0, n=stop.length; i<n; ++i) {
      grad.addColorStop(stop[i].offset, stop[i].color);
    }
    return grad;
  }

  // hit testing

  function pickGroup(g, scene, x, y, gx, gy) {
    if (scene.items.length === 0 ||
        scene.bounds && !scene.bounds.contains(gx, gy)) {
      return false;
    }
    var items = scene.items, subscene, group, hit, dx, dy,
        handler = this, i, j;

    for (i=items.length; --i>=0;) {
      group = items[i];
      dx = group.x || 0;
      dy = group.y || 0;

      g.save();
      g.translate(dx, dy);
      for (j=group.items.length; --j >= 0;) {
        subscene = group.items[j];
        if (subscene.interactive === false) continue;
        hit = handler.pick(subscene, x, y, gx-dx, gy-dy);
        if (hit) {
          g.restore();
          return hit;
        }
      }
      g.restore();
    }

    return scene.interactive
      ? pickAll(hitTests.group, g, scene, x, y, gx, gy)
      : false;
  }

  function pickAll(test, g, scene, x, y, gx, gy) {
    if (!scene.items.length) return false;
    var o, b, i;

    if (g._ratio !== 1) {
      x *= g._ratio;
      y *= g._ratio;
    }

    for (i=scene.items.length; --i >= 0;) {
      o = scene.items[i]; b = o.bounds;
      // first hit test against bounding box
      if ((b && !b.contains(gx, gy)) || !b) continue;
      // if in bounding box, perform more careful test
      if (test(g, o, x, y, gx, gy)) return o;
    }
    return false;
  }

  function pickArea(g, scene, x, y, gx, gy) {
    if (!scene.items.length) return false;
    var items = scene.items,
        o, b, i, di, dd, od, dx, dy;

    b = items[0].bounds;
    if (b && !b.contains(gx, gy)) return false;
    if (g._ratio !== 1) {
      x *= g._ratio;
      y *= g._ratio;
    }
    if (!hitTests.area(g, items, x, y)) return false;
    return items[0];
  }

  function pickLine(g, scene, x, y, gx, gy) {
    if (!scene.items.length) return false;
    var items = scene.items,
        o, b, i, di, dd, od, dx, dy;

    b = items[0].bounds;
    if (b && !b.contains(gx, gy)) return false;
    if (g._ratio !== 1) {
      x *= g._ratio;
      y *= g._ratio;
    }
    if (!hitTests.line(g, items, x, y)) return false;
    return items[0];
  }

  function pick(test) {
    return function (g, scene, x, y, gx, gy) {
      return pickAll(test, g, scene, x, y, gx, gy);
    };
  }

  function textHit(g, o, x, y, gx, gy) {
    if (!o.fontSize) return false;
    if (!o.angle) return true; // bounds sufficient if no rotation

    var b = boundsCalc.text(o, tmpBounds, true),
        a = -o.angle * Math.PI / 180,
        cos = Math.cos(a),
        sin = Math.sin(a),
        x = o.x,
        y = o.y,
        px = cos*gx - sin*gy + (x - x*cos + y*sin),
        py = sin*gx + cos*gy + (y - x*sin - y*cos);

    return b.contains(px, py);
  }

  var hitTests = {
    text:   textHit,
    rect:   function(g,o,x,y) { return true; }, // bounds test is sufficient
    image:  function(g,o,x,y) { return true; }, // bounds test is sufficient
    group:  function(g,o,x,y) { return o.fill || o.stroke; },
    rule:   function(g,o,x,y) {
              if (!g.isPointInStroke) return false;
              ruleStroke(g,o); return g.isPointInStroke(x,y);
            },
    line:   function(g,s,x,y) {
              if (!g.isPointInStroke) return false;
              lineStroke(g,s); return g.isPointInStroke(x,y);
            },
    arc:    function(g,o,x,y) { arcPath(g,o);  return g.isPointInPath(x,y); },
    area:   function(g,s,x,y) { areaPath(g,s); return g.isPointInPath(x,y); },
    path:   function(g,o,x,y) { pathPath(g,o); return g.isPointInPath(x,y); },
    symbol: function(g,o,x,y) { symbolPath(g,o); return g.isPointInPath(x,y); }
  };

  return {
    draw: {
      group:   drawGroup,
      area:    drawOne(areaPath),
      line:    drawOne(linePath),
      arc:     drawAll(arcPath),
      path:    drawAll(pathPath),
      symbol:  drawAll(symbolPath),
      rect:    drawRect,
      rule:    drawRule,
      text:    drawText,
      image:   drawImage,
      drawOne: drawOne, // expose for extensibility
      drawAll: drawAll  // expose for extensibility
    },
    pick: {
      group:   pickGroup,
      area:    pickArea,
      line:    pickLine,
      arc:     pick(hitTests.arc),
      path:    pick(hitTests.path),
      symbol:  pick(hitTests.symbol),
      rect:    pick(hitTests.rect),
      rule:    pick(hitTests.rule),
      text:    pick(hitTests.text),
      image:   pick(hitTests.image),
      pickAll: pickAll  // expose for extensibility
    }
  };

});
define('render/canvas/Handler',['require','exports','module','d3','../../util/index','./marks'],function(require, exports, module) {
  var d3 = require('d3'),
      util = require('../../util/index'),
      marks = require('./marks');

  var handler = function(el, model) {
    this._active = null;
    this._handlers = {};
    if (el) this.initialize(el);
    if (model) this.model(model);
  };
  
  var prototype = handler.prototype;

  prototype.initialize = function(el, pad, obj) {
    this._el = d3.select(el).node();
    this._canvas = d3.select(el).select("canvas.marks").node();
    this._padding = pad;
    this._obj = obj || null;
    
    // add event listeners
    var canvas = this._canvas, that = this;
    events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        prototype[type].call(that, evt);
      });
    });
    
    return this;
  };
  
  prototype.padding = function(pad) {
    this._padding = pad;
    return this;
  };
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
    return this;
  };

  prototype.handlers = function() {
    var h = this._handlers;
    return util.keys(h).reduce(function(a, k) {
      return h[k].reduce(function(a, x) { return (a.push(x), a); }, a);
    }, []);
  };

  // setup events
  var events = [
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "wheel",
    "keydown",
    "keypress",
    "keyup",
    "mousewheel"
  ];
  events.forEach(function(type) {
    prototype[type] = function(evt) {
      this.fire(type, evt);
    };
  });
  events.push("mousemove");
  events.push("mouseout");

  function eventName(name) {
    var i = name.indexOf(".");
    return i < 0 ? name : name.slice(0,i);
  }

  prototype.mousemove = function(evt) {
    var pad = this._padding,
        b = evt.target.getBoundingClientRect(),
        x = evt.clientX - b.left,
        y = evt.clientY - b.top,
        a = this._active,
        p = this.pick(this._model.scene(), x, y, x-pad.left, y-pad.top);

    if (p === a) {
      this.fire("mousemove", evt);
      return;
    } else if (a) {
      this.fire("mouseout", evt);
    }
    this._active = p;
    if (p) {
      this.fire("mouseover", evt);
    }
  };
  
  prototype.mouseout = function(evt) {
    if (this._active) {
      this.fire("mouseout", evt);
    }
    this._active = null;
  };

  // to keep firefox happy
  prototype.DOMMouseScroll = function(evt) {
    this.fire("mousewheel", evt);
  };

  // fire an event
  prototype.fire = function(type, evt) {
    var a = this._active,
        h = this._handlers[type];
    if (h) {
      for (var i=0, len=h.length; i<len; ++i) {
        h[i].handler.call(this._obj, evt, a);
      }
    }
  };

  // add an event handler
  prototype.on = function(type, handler) {
    var name = eventName(type),
        h = this._handlers;
    h = h[name] || (h[name] = []);
    h.push({
      type: type,
      handler: handler
    });
    return this;
  };

  // remove an event handler
  prototype.off = function(type, handler) {
    var name = eventName(type),
        h = this._handlers[name];
    if (!h) return;
    for (var i=h.length; --i>=0;) {
      if (h[i].type !== type) continue;
      if (!handler || h[i].handler === handler) h.splice(i, 1);
    }
    return this;
  };
  
  // retrieve the current canvas context
  prototype.context = function() {
    return this._canvas.getContext("2d");
  };
  
  // find the scenegraph item at the current mouse position
  // x, y -- the absolute x, y mouse coordinates on the canvas element
  // gx, gy -- the relative coordinates within the current group
  prototype.pick = function(scene, x, y, gx, gy) {
    var g = this.context(),
        marktype = scene.marktype,
        picker = marks.pick[marktype];
    return picker.call(this, g, scene, x, y, gx, gy);
  };

  return handler;
});
define('render/canvas/Renderer',['require','exports','module','d3','../../core/Bounds','../../util/load','../../util/config','./marks'],function(require, exports, module) {  
  var d3 = require('d3'),
      Bounds = require('../../core/Bounds'),
      load = require('../../util/load'),
      config = require('../../util/config'),
      marks = require('./marks');

  var renderer = function() {
    this._ctx = null;
    this._el = null;
    this._imgload = 0;
  };
  
  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, width, height, pad) {
    this._el = el;
    
    if (!el) return this; // early exit if no DOM element

    // select canvas element
    var canvas = d3.select(el)
      .selectAll("canvas.marks")
      .data([1]);
    
    // create new canvas element if needed
    canvas.enter()
      .append("canvas")
      .attr("class", "marks");
    
    // remove extraneous canvas if needed
    canvas.exit().remove();
    
    return this.resize(width, height, pad);
  };
  
  prototype.resize = function(width, height, pad) {
    this._width = width;
    this._height = height;
    this._padding = pad;
    
    if (this._el) {
      var canvas = d3.select(this._el).select("canvas.marks");

      // initialize canvas attributes
      canvas
        .attr("width", width + pad.left + pad.right)
        .attr("height", height + pad.top + pad.bottom);

      // get the canvas graphics context
      var s;
      this._ctx = canvas.node().getContext("2d");
      this._ctx._ratio = (s = scaleCanvas(canvas.node(), this._ctx) || 1);
      this._ctx.setTransform(s, 0, 0, s, s*pad.left, s*pad.top);
    }
    
    initializeLineDash(this._ctx);
    return this;
  };
  
  function scaleCanvas(canvas, ctx) {
    // get canvas pixel data
    var devicePixelRatio = window.devicePixelRatio || 1,
        backingStoreRatio = (
          ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio) || 1,
        ratio = devicePixelRatio / backingStoreRatio;

    if (devicePixelRatio !== backingStoreRatio) {
      var w = canvas.width, h = canvas.height;
      // set actual and visible canvas size
      canvas.setAttribute("width", w * ratio);
      canvas.setAttribute("height", h * ratio);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }
    return ratio;
  }

  function initializeLineDash(ctx) {
    if (ctx.vgLineDash) return; // already set

    var NODASH = [];
    if (ctx.setLineDash) {
      ctx.vgLineDash = function(dash) { this.setLineDash(dash || NODASH); };
      ctx.vgLineDashOffset = function(off) { this.lineDashOffset = off; };
    } else if (ctx.webkitLineDash !== undefined) {
    	ctx.vgLineDash = function(dash) { this.webkitLineDash = dash || NODASH; };
      ctx.vgLineDashOffset = function(off) { this.webkitLineDashOffset = off; };
    } else if (ctx.mozDash !== undefined) {
      ctx.vgLineDash = function(dash) { this.mozDash = dash; };
      ctx.vgLineDashOffset = function(off) { /* unsupported */ };
    } else {
      ctx.vgLineDash = function(dash) { /* unsupported */ };
      ctx.vgLineDashOffset = function(off) { /* unsupported */ };
    }
  }
  
  prototype.context = function(ctx) {
    if (ctx) { this._ctx = ctx; return this; }
    else return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };
  
  prototype.pendingImages = function() {
    return this._imgload;
  };

  function translatedBounds(item, bounds) {
    var b = new Bounds(bounds);
    while ((item = item.mark.group) != null) {
      b.translate(item.x || 0, item.y || 0);
    }
    return b;
  }
    
  function getBounds(items) {
    return !items ? null :
      util.array(items).reduce(function(b, item) {
        return b.union(translatedBounds(item, item.bounds))
                .union(translatedBounds(item, item['bounds:prev']));
      }, new Bounds());  
  }
  
  function setBounds(g, bounds) {
    var bbox = null;
    if (bounds) {
      bbox = (new Bounds(bounds)).round();
      g.beginPath();
      g.rect(bbox.x1, bbox.y1, bbox.width(), bbox.height());
      g.clip();
    }
    return bbox;
  }
  
  prototype.render = function(scene, items) {
    var g = this._ctx,
        pad = this._padding,
        w = this._width + pad.left + pad.right,
        h = this._height + pad.top + pad.bottom,
        bb = null, bb2;

    // setup
    this._scene = scene;
    g.save();
    bb = setBounds(g, getBounds(items));
    g.clearRect(-pad.left, -pad.top, w, h);

    // render
    this.draw(g, scene, bb);

    // render again to handle possible bounds change
    if (items) {
      g.restore();
      g.save();
      bb2 = setBounds(g, getBounds(items));
      if (!bb.encloses(bb2)) {
        g.clearRect(-pad.left, -pad.top, w, h);
        this.draw(g, scene, bb2);
      }
    }
    
    // takedown
    g.restore();
    this._scene = null;
  };
  
  prototype.draw = function(ctx, scene, bounds) {
    var marktype = scene.marktype,
        renderer = marks.draw[marktype];
    renderer.call(this, ctx, scene, bounds);
  };
  
  prototype.renderAsync = function(scene) {
    // TODO make safe for multiple scene rendering?
    var renderer = this;
    if (renderer._async_id) {
      clearTimeout(renderer._async_id);
    }
    renderer._async_id = setTimeout(function() {
      renderer.render(scene);
      delete renderer._async_id;
    }, 50);
  };
  
  prototype.loadImage = function(uri) {
    var renderer = this,
        scene = renderer._scene,
        image = null, url;

    renderer._imgload += 1;
    if (config.isNode) {
      // TODO: how to check if nodeJS in requireJS?
      // image = new (require('canvas').Image)();
      // load(uri, function(err, data) {
      //   if (err) { util.error(err); return; }
      //   image.src = data;
      //   image.loaded = true;
      //   renderer._imgload -= 1;
      // });
    } else {
      image = new Image();
      url = config.baseURL + uri;
      image.onload = function() {
        util.log("LOAD IMAGE: "+url);
        image.loaded = true;
        renderer._imgload -= 1;
        renderer.renderAsync(scene);
      };
      image.src = url;
    }

    return image;
  };
  
  return renderer;
});
define('render/canvas/index',['require','exports','module','./Handler','./Renderer'],function(require, exports, module) {
  return {
    Handler:  require('./Handler'),
    Renderer: require('./Renderer')
  };
});
define('render/svg/Handler',['require','exports','module','../../util/index'],function(require, module, exports) {
  var util = require('../../util/index');

  var handler = function(el, model) {
    this._active = null;
    this._handlers = {};
    if (el) this.initialize(el);
    if (model) this.model(model);
  };
  
  function svgHandler(handler) {
    var that = this;
    return function(evt) {
      var target = evt.target,
          item = target.__data__;

      if (item) item = item.mark ? item : item[0];
      handler.call(that._obj, evt, item);
    };
  }
  
  function eventName(name) {
    var i = name.indexOf(".");
    return i < 0 ? name : name.slice(0,i);
  }
  
  var prototype = handler.prototype;

  prototype.initialize = function(el, pad, obj) {
    this._el = d3.select(el).node();
    this._svg = d3.select(el).select("svg.marks").node();
    this._padding = pad;
    this._obj = obj || null;
    return this;
  };
  
  prototype.padding = function(pad) {
    this._padding = pad;
    return this;
  };
  
  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    this._model = model;
    return this;
  };
  
  prototype.handlers = function() {
    var h = this._handlers;
    return util.keys(h).reduce(function(a, k) {
      return h[k].reduce(function(a, x) { return (a.push(x), a); }, a);
    }, []);
  };

  // add an event handler
  prototype.on = function(type, handler) {
    var name = eventName(type),
        h = this._handlers,
        dom = d3.select(this._svg).node();
        
    var x = {
      type: type,
      handler: handler,
      svg: svgHandler.call(this, handler)
    };
    h = h[name] || (h[name] = []);
    h.push(x);

    dom.addEventListener(name, x.svg);
    return this;
  };

  // remove an event handler
  prototype.off = function(type, handler) {
    var name = eventName(type),
        h = this._handlers[name],
        dom = d3.select(this._svg).node();
    if (!h) return;
    for (var i=h.length; --i>=0;) {
      if (h[i].type !== type) continue;
      if (!handler || h[i].handler === handler) {
        dom.removeEventListener(name, h[i].svg);
        h.splice(i, 1);
      }
    }
    return this;
  };

  return handler;
});
define('render/svg/marks',['require','exports','module','d3','../../util/index','../../util/config'],function(require, module, exports) {
  var d3 = require('d3'),
      util = require('../../util/index'),
      config = require('../../util/config');

  function x(o)     { return o.x || 0; }
  function y(o)     { return o.y || 0; }
  function yh(o)    { return o.y + o.height || 0; }
  function key(o)   { return o.key; }
  function size(o)  { return o.size==null ? 100 : o.size; }
  function shape(o) { return o.shape || "circle"; }
      
  var arc_path    = d3.svg.arc(),
      area_path   = d3.svg.area().x(x).y1(y).y0(yh),
      line_path   = d3.svg.line().x(x).y(y),
      symbol_path = d3.svg.symbol().type(shape).size(size);
  
  var mark_id = 0,
      clip_id = 0;
  
  var textAlign = {
    "left":   "start",
    "center": "middle",
    "right":  "end"
  };
  
  var styles = {
    "fill":             "fill",
    "fillOpacity":      "fill-opacity",
    "stroke":           "stroke",
    "strokeWidth":      "stroke-width",
    "strokeOpacity":    "stroke-opacity",
    "strokeCap":        "stroke-linecap",
    "strokeDash":       "stroke-dasharray",
    "strokeDashOffset": "stroke-dashoffset",
    "opacity":          "opacity"
  };
  var styleProps = util.keys(styles);

  function style(d) {
    var i, n, prop, name, value,
        o = d.mark ? d : d.length ? d[0] : null;
    if (o === null) return;

    for (i=0, n=styleProps.length; i<n; ++i) {
      prop = styleProps[i];
      name = styles[prop];
      value = o[prop];

      if (value == null) {
        if (name === "fill") this.style.setProperty(name, "none", null);
        else this.style.removeProperty(name);
      } else {
        if (value.id) {
          // ensure definition is included
          marks.current._defs.gradient[value.id] = value;
          value = "url(#" + value.id + ")";
        }
        this.style.setProperty(name, value+"", null);
      }
    }
  }
  
  function arc(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", arc_path(o));
  }
  
  function area(items) {
    if (!items.length) return;
    var o = items[0];
    area_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == null ? 0.7 : o.tension);
    this.setAttribute("d", area_path(items));
  }
  
  function line(items) {
    if (!items.length) return;
    var o = items[0];
    line_path
      .interpolate(o.interpolate || "linear")
      .tension(o.tension == null ? 0.7 : o.tension);
    this.setAttribute("d", line_path(items));
  }
  
  function path(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    if (o.path != null) this.setAttribute("d", o.path);
  }

  function rect(o) {
    this.setAttribute("x", o.x || 0);
    this.setAttribute("y", o.y || 0);
    this.setAttribute("width", o.width || 0);
    this.setAttribute("height", o.height || 0);
  }

  function rule(o) {
    var x1 = o.x || 0,
        y1 = o.y || 0;
    this.setAttribute("x1", x1);
    this.setAttribute("y1", y1);
    this.setAttribute("x2", o.x2 != null ? o.x2 : x1);
    this.setAttribute("y2", o.y2 != null ? o.y2 : y1);
  }
  
  function symbol(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");
    this.setAttribute("d", symbol_path(o));
  }
  
  function image(o) {
    var w = o.width || (o.image && o.image.width) || 0,
        h = o.height || (o.image && o.image.height) || 0,
        x = o.x - (o.align === "center"
          ? w/2 : (o.align === "right" ? w : 0)),
        y = o.y - (o.baseline === "middle"
          ? h/2 : (o.baseline === "bottom" ? h : 0)),
        url = config.baseURL + o.url;
    
    this.setAttributeNS("http://www.w3.org/1999/xlink", "href", url);
    this.setAttribute("x", x);
    this.setAttribute("y", y);
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }
    
  function fontString(o) {
    return (o.fontStyle ? o.fontStyle + " " : "")
      + (o.fontVariant ? o.fontVariant + " " : "")
      + (o.fontWeight ? o.fontWeight + " " : "")
      + (o.fontSize != null ? o.fontSize : config.render.fontSize) + "px "
      + (o.font || config.render.font);
  }
  
  function text(o) {
    var x = o.x || 0,
        y = o.y || 0,
        dx = o.dx || 0,
        dy = o.dy || 0,
        a = o.angle || 0,
        r = o.radius || 0,
        align = textAlign[o.align || "left"],
        base = o.baseline==="top" ? ".9em"
             : o.baseline==="middle" ? ".35em" : 0;

    if (r) {
      var t = (o.theta || 0) - Math.PI/2;
      x += r * Math.cos(t);
      y += r * Math.sin(t);
    }

    this.setAttribute("x", x + dx);
    this.setAttribute("y", y + dy);
    this.setAttribute("text-anchor", align);
    
    if (a) this.setAttribute("transform", "rotate("+a+" "+x+","+y+")");
    else this.removeAttribute("transform");
    
    if (base) this.setAttribute("dy", base);
    else this.removeAttribute("dy");
    
    this.textContent = o.text;
    this.style.setProperty("font", fontString(o), null);
  }
  
  function group(o) {
    var x = o.x || 0,
        y = o.y || 0;
    this.setAttribute("transform", "translate("+x+","+y+")");

    if (o.clip) {
      var c = {width: o.width || 0, height: o.height || 0},
          id = o.clip_id || (o.clip_id = "clip" + clip_id++);
      marks.current._defs.clipping[id] = c;
      this.setAttribute("clip-path", "url(#"+id+")");
    }
  }

  function group_bg(o) {
    var w = o.width || 0,
        h = o.height || 0;
    this.setAttribute("width", w);
    this.setAttribute("height", h);
  }

  function cssClass(def) {
    var cls = "type-" + def.type;
    if (def.name) cls += " " + def.name;
    return cls;
  }

  function draw(tag, attr, nest) {
    return function(g, scene, index) {
      drawMark(g, scene, index, "mark_", tag, attr, nest);
    };
  }
  
  function drawMark(g, scene, index, prefix, tag, attr, nest) {
    var data = nest ? [scene.items] : scene.items,
        evts = scene.interactive===false ? "none" : null,
        grps = g.node().childNodes,
        notG = (tag !== "g"),
        p = (p = grps[index+1]) // +1 to skip group background rect
          ? d3.select(p)
          : g.append("g")
             .attr("id", "g"+(++mark_id))
             .attr("class", cssClass(scene.def));

    var id = p.attr("id"),
        s = "#" + id + " > " + tag,
        m = p.selectAll(s).data(data),
        e = m.enter().append(tag);

    if (notG) {
      p.style("pointer-events", evts);
      e.each(function(d) {
        if (d.mark) d._svg = this;
        else if (d.length) d[0]._svg = this;
      });
    } else {
      e.append("rect").attr("class","background").style("pointer-events",evts);
    }
    
    m.exit().remove();
    m.each(attr);
    if (notG) m.each(style);
    else p.selectAll(s+" > rect.background").each(group_bg).each(style);
    
    return p;
  }

  function drawGroup(g, scene, index, prefix) {    
    var p = drawMark(g, scene, index, prefix || "group_", "g", group),
        c = p.node().childNodes, n = c.length, i, j, m;
    
    for (i=0; i<n; ++i) {
      var items = c[i].__data__.items,
          legends = c[i].__data__.legendItems || [],
          axes = c[i].__data__.axisItems || [],
          sel = d3.select(c[i]),
          idx = 0;

      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer === "back") {
          drawGroup.call(this, sel, axes[j], idx++, "axis_");
        }
      }
      for (j=0, m=items.length; j<m; ++j) {
        this.draw(sel, items[j], idx++);
      }
      for (j=0, m=axes.length; j<m; ++j) {
        if (axes[j].def.layer !== "back") {
          drawGroup.call(this, sel, axes[j], idx++, "axis_");
        }
      }
      for (j=0, m=legends.length; j<m; ++j) {
        drawGroup.call(this, sel, legends[j], idx++, "legend_");
      }
    }
  }

  var marks = {
    update: {
      group:   rect,
      area:    area,
      line:    line,
      arc:     arc,
      path:    path,
      symbol:  symbol,
      rect:    rect,
      rule:    rule,
      text:    text,
      image:   image
    },
    nested: {
      "area": true,
      "line": true
    },
    style: style,
    draw: {
      group:   drawGroup,
      area:    draw("path", area, true),
      line:    draw("path", line, true),
      arc:     draw("path", arc),
      path:    draw("path", path),
      symbol:  draw("path", symbol),
      rect:    draw("rect", rect),
      rule:    draw("line", rule),
      text:    draw("text", text),
      image:   draw("image", image),
      draw:    draw // expose for extensibility
    },
    current: null
  };
  
  return marks;
});
define('render/svg/Renderer',['require','exports','module','../../util/index','./marks'],function(require, module, exports) {
  var util = require('../../util/index'),
      marks = require('./marks');

  var renderer = function() {
    this._svg = null;
    this._ctx = null;
    this._el = null;
    this._defs = {
      gradient: {},
      clipping: {}
    };
  };
  
  var prototype = renderer.prototype;
  
  prototype.initialize = function(el, width, height, pad) {
    this._el = el;

    // remove any existing svg element
    d3.select(el).select("svg.marks").remove();

    // create svg element and initialize attributes
    this._svg = d3.select(el)
      .append("svg")
      .attr("class", "marks");
    
    // set the svg root group
    this._ctx = this._svg.append("g");
    
    return this.resize(width, height, pad);
  };
  
  prototype.resize = function(width, height, pad) {
    this._width = width;
    this._height = height;
    this._padding = pad;
    
    this._svg
      .attr("width", width + pad.left + pad.right)
      .attr("height", height + pad.top + pad.bottom);
      
    this._ctx
      .attr("transform", "translate("+pad.left+","+pad.top+")");

    return this;
  };
  
  prototype.context = function() {
    return this._ctx;
  };
  
  prototype.element = function() {
    return this._el;
  };

  prototype.updateDefs = function() {
    var svg = this._svg,
        all = this._defs,
        dgrad = util.keys(all.gradient),
        dclip = util.keys(all.clipping),
        defs = svg.select("defs"), grad, clip;
  
    // get or create svg defs block
    if (dgrad.length===0 && dclip.length==0) { defs.remove(); return; }
    if (defs.empty()) defs = svg.insert("defs", ":first-child");
    
    grad = defs.selectAll("linearGradient").data(dgrad, util.identity);
    grad.enter().append("linearGradient").attr("id", util.identity);
    grad.exit().remove();
    grad.each(function(id) {
      var def = all.gradient[id],
          grd = d3.select(this);
  
      // set gradient coordinates
      grd.attr({x1: def.x1, x2: def.x2, y1: def.y1, y2: def.y2});
  
      // set gradient stops
      stop = grd.selectAll("stop").data(def.stops);
      stop.enter().append("stop");
      stop.exit().remove();
      stop.attr("offset", function(d) { return d.offset; })
          .attr("stop-color", function(d) { return d.color; });
    });
    
    clip = defs.selectAll("clipPath").data(dclip, util.identity);
    clip.enter().append("clipPath").attr("id", util.identity);
    clip.exit().remove();
    clip.each(function(id) {
      var def = all.clipping[id],
          cr = d3.select(this).selectAll("rect").data([1]);
      cr.enter().append("rect");
      cr.attr("x", 0)
        .attr("y", 0)
        .attr("width", def.width)
        .attr("height", def.height);
    });
  };
  
  prototype.render = function(scene, items) {
    marks.current = this;

    if (items) {
      this.renderItems(util.array(items));
    } else {
      this.draw(this._ctx, scene, -1);
    }
    this.updateDefs();

   delete marks.current;
  };
  
  prototype.renderItems = function(items) {
    var item, node, type, nest, i, n;

    for (i=0, n=items.length; i<n; ++i) {
      item = items[i];
      node = item._svg;
      type = item.mark.marktype;

      item = marks.nested[type] ? item.mark.items : item;
      marks.update[type].call(node, item);
      marks.style.call(node, item);
    }
  }
  
  prototype.draw = function(ctx, scene, index) {
    var marktype = scene.marktype,
        renderer = marks.draw[marktype];
    renderer.call(this, ctx, scene, index);
  };
  
  return renderer;
});
define('render/svg/index',['require','exports','module','./Handler','./Renderer'],function(require, exports, module) {
  return {
    Handler:  require('./Handler'),
    Renderer: require('./Renderer')
  };
});
define('scene/Transition',['require','exports','module','../dataflow/tuple','../util/bounds','../util/constants'],function(require, exports, module) {
  var tuple = require('../dataflow/tuple'),
      calcBounds = require('../util/bounds'),
      C = require('../util/constants');

  function Transition(duration, ease) {
    this.duration = duration || 500;
    this.ease = ease && d3.ease(ease) || d3.ease("cubic-in-out");
    this.updates = {next: null};
  }
  
  var prototype = Transition.prototype;
  
  var skip = {
    "text": 1,
    "url":  1
  };
  
  prototype.interpolate = function(item, values, stamp) {
    var key, curr, next, interp, list = null;

    for (key in values) {
      curr = item[key];
      next = values[key];      
      if (curr !== next) {
        if (skip[key] || curr === undefined) {
          // skip interpolation for specific keys or undefined start values
          tuple.set(item, key, next);
        } else if (typeof curr === "number" && !isFinite(curr)) {
          // for NaN or infinite numeric values, skip to final value
          tuple.set(item, key, next);
        } else {
          // otherwise lookup interpolator
          interp = d3.interpolate(curr, next);
          interp.property = key;
          (list || (list=[])).push(interp);
        }
      }
    }

    if (list === null && item.status === C.EXIT) {
      list = []; // ensure exiting items are included
    }

    if (list != null) {
      list.item = item;
      list.ease = item.mark.ease || this.ease;
      list.next = this.updates.next;
      this.updates.next = list;
    }
    return this;
  };
  
  prototype.start = function(callback) {
    var t = this, prev = t.updates, curr = prev.next;
    for (; curr!=null; prev=curr, curr=prev.next) {
      if (curr.item.status === C.EXIT) curr.remove = true;
    }
    t.callback = callback;
    d3.timer(function(elapsed) { return step.call(t, elapsed); });
  };

  function step(elapsed) {
    var list = this.updates, prev = list, curr = prev.next,
        duration = this.duration,
        item, delay, f, e, i, n, stop = true;

    for (; curr!=null; prev=curr, curr=prev.next) {
      item = curr.item;
      delay = item.delay || 0;

      f = (elapsed - delay) / duration;
      if (f < 0) { stop = false; continue; }
      if (f > 1) f = 1;
      e = curr.ease(f);

      for (i=0, n=curr.length; i<n; ++i) {
        item[curr[i].property] = curr[i](e);
      }
      item.touch();
      calcBounds.item(item);

      if (f === 1) {
        if (curr.remove) item.remove();
        prev.next = curr.next;
        curr = prev;
      } else {
        stop = false;
      }
    }

    this.callback();
    return stop;
  };
  
  return Transition;
});
define('core/View',['require','exports','module','d3','../dataflow/Node','../parse/streams','../render/canvas/index','../render/svg/index','../scene/Transition','../util/config','../util/index','../dataflow/changeset'],function(require, exports, module) {
  var d3 = require('d3'),
      Node = require('../dataflow/Node'),
      parseStreams = require('../parse/streams'),
      canvas = require('../render/canvas/index'),
      svg = require('../render/svg/index'),
      Transition = require('../scene/Transition'),
      config = require('../util/config'),
      util = require('../util/index'),
      changeset = require('../dataflow/changeset');

  var View = function(el, width, height, model) {
    this._el    = null;
    this._model = null;
    this._width = this.__width = width || 500;
    this._height = this.__height = height || 300;
    this._autopad = 1;
    this._padding = {top:0, left:0, bottom:0, right:0};
    this._viewport = null;
    this._renderer = null;
    this._handler = null;
    this._io = canvas;
    if (el) this.initialize(el);
  };

  var prototype = View.prototype;

  prototype.model = function(model) {
    if (!arguments.length) return this._model;
    if (this._model !== model) {
      this._model = model;
      if (this._handler) this._handler.model(model);
    }
    return this;
  };

  prototype.data = function(data) {
    var m = this.model();
    if (!arguments.length) return m.data();
    util.keys(data).forEach(function(d) { m.data(d).add(util.duplicate(data[d])); });
    return this;
  };

  prototype.width = function(width) {
    if (!arguments.length) return this.__width;
    if (this.__width !== width) {
      this._width = this.__width = width;
      if (this._el) this.initialize(this._el.parentNode);
      if (this._strict) this._autopad = 1;
    }
    return this;
  };

  prototype.height = function(height) {
    if (!arguments.length) return this.__height;
    if (this.__height !== height) {
      this._height = this.__height = height;
      if (this._el) this.initialize(this._el.parentNode);
      if (this._strict) this._autopad = 1;
    }
    return this;
  };

  prototype.padding = function(pad) {
    if (!arguments.length) return this._padding;
    if (this._padding !== pad) {
      if (util.isString(pad)) {
        this._autopad = 1;
        this._padding = {top:0, left:0, bottom:0, right:0};
        this._strict = (pad === "strict");
      } else {
        this._autopad = 0;
        this._padding = pad;
        this._strict = false;
      }
      if (this._el) {
        this._renderer.resize(this._width, this._height, pad);
        this._handler.padding(pad);
      }
    }
    return this;
  };
  
  prototype.autopad = function(opt) {
    if (this._autopad < 1) return this;
    else this._autopad = 0;

    var pad = this._padding,
        b = this.model().scene().bounds,
        inset = config.autopadInset,
        l = b.x1 < 0 ? Math.ceil(-b.x1) + inset : 0,
        t = b.y1 < 0 ? Math.ceil(-b.y1) + inset : 0,
        r = b.x2 > this._width  ? Math.ceil(+b.x2 - this._width) + inset : 0,
        b = b.y2 > this._height ? Math.ceil(+b.y2 - this._height) + inset : 0;
    pad = {left:l, top:t, right:r, bottom:b};

    if (this._strict) {
      this._autopad = 0;
      this._padding = pad;
      this._width = Math.max(0, this.__width - (l+r));
      this._height = Math.max(0, this.__height - (t+b));
      this._model.width(this._width);
      this._model.height(this._height);
      if (this._el) this.initialize(this._el.parentNode);
      this.update();
    } else {
      this.padding(pad).update(opt);
    }
    return this;
  };

  prototype.viewport = function(size) {
    if (!arguments.length) return this._viewport;
    if (this._viewport !== size) {
      this._viewport = size;
      if (this._el) this.initialize(this._el.parentNode);
    }
    return this;
  };

  prototype.renderer = function(type) {
    if (!arguments.length) return this._io;
    if (type === "canvas") type = canvas;
    if (type === "svg") type = svg;
    if (this._io !== type) {
      this._io = type;
      this._renderer = null;
      if (this._el) this.initialize(this._el.parentNode);
      if (this._build) this.render();
    }
    return this;
  };
  
  prototype.initialize = function(el) {
    var v = this, prevHandler,
        w = v._width, h = v._height, pad = v._padding;
    
    // clear pre-existing container
    d3.select(el).select("div.vega").remove();
    
    // add div container
    this._el = el = d3.select(el)
      .append("div")
      .attr("class", "vega")
      .style("position", "relative")
      .node();
    if (v._viewport) {
      d3.select(el)
        .style("width",  (v._viewport[0] || w)+"px")
        .style("height", (v._viewport[1] || h)+"px")
        .style("overflow", "auto");
    }
    
    // renderer
    v._renderer = (v._renderer || new this._io.Renderer())
      .initialize(el, w, h, pad);
    
    // input handler
    prevHandler = v._handler;
    v._handler = new this._io.Handler()
      .initialize(el, pad, v)
      .model(v._model);

    if (prevHandler) {
      prevHandler.handlers().forEach(function(h) {
        v._handler.on(h.type, h.handler);
      });
    } else {
      // Register event listeners for signal stream definitions.
      parseStreams(this);
    }
    
    return this;
  };

  prototype.update = function(opt) {    
    opt = opt || {};
    var v = this,
        trans = opt.duration
          ? new Transition(opt.duration, opt.ease)
          : null;

    // TODO: with streaming data API, adds should util.duplicate just parseSpec
    // to prevent Vega from polluting the environment.

    var cs = changeset.create();
    if(trans) cs.trans = trans;
    if(opt.reflow !== undefined) cs.reflow = opt.reflow

    if(!v._build) {
      v._renderNode = new Node(v._model.graph)
        .router(true);

      v._renderNode.evaluate = function(input) {
        util.debug(input, ["rendering"]);

        var s = v._model.scene();
        if(input.trans) {
          input.trans.start(function(items) { v._renderer.render(s, items); });
        } else {
          v._renderer.render(s);
        }

        // For all updated datasources, finalize their changesets.
        var d, ds;
        for(d in input.data) {
          ds = v._model.data(d);
          if(!ds.revises()) continue;
          changeset.finalize(ds.last());
        }

        return input;
      };

      v._model.scene(v._renderNode);
      v._build = true;
    }

    // Pulse the entire model (Datasources + scene).
    v._model.fire(cs);

    return v.autopad(opt);
  };

  prototype.on = function() {
    this._handler.on.apply(this._handler, arguments);
    return this;
  };
  
  prototype.off = function() {
    this._handler.off.apply(this._handler, arguments);
    return this;
  };

  View.factory = function(model) {
    return function(opt) {
      opt = opt || {};
      var defs = model.defs();
      var v = new View()
        .model(model)
        .width(defs.width)
        .height(defs.height)
        .padding(defs.padding)
        .renderer(opt.renderer || "canvas");

      if (opt.el) v.initialize(opt.el);
      if (opt.data) v.data(opt.data);
    
      return v;
    };    
  };

  return View;
});
define('parse/padding',['require','exports','module','../util/index'],function(require, module, exports) {
  var util = require('../util/index');

  return function parsePadding(pad) {
    if (pad == null) return "auto";
    else if (util.isString(pad)) return pad==="strict" ? "strict" : "auto";
    else if (util.isObject(pad)) return pad;
    var p = util.isNumber(pad) ? pad : 20;
    return {top:p, left:p, right:p, bottom:p};
  }
});
define('parse/marks',['require','exports','module','./mark'],function(require, exports, module) {
  var parseMark = require('./mark');

  return function(model, spec, width, height) {
    return {
      type: "group",
      width: width,
      height: height,
      scales: spec.scales || [],
      axes: spec.axes || [],
      // legends: spec.legends || [],
      marks: (spec.marks || []).map(function(m) { return parseMark(model, m); })
    };
  };
}) ;
define('parse/signals',['require','exports','module','./expr','../util/constants'],function(require, exports, module) {
  var expr = require('./expr'),
      C = require('../util/constants');

  return function parseSignals(model, spec) {
    var graph = model.graph;

    // process each signal definition
    (spec || []).forEach(function(s) {
      var signal = graph.signal(s.name, s.init),
          exp;

      if(s.expr) {
        exp = expr(graph, s.expr);
        signal.evaluate = function(input) {
          var value = expr.eval(graph, exp.fn, null, null, null, null, exp.signals);
          if(spec.scale) value = model.scale(spec, value);
          signal.value(value);
          input.signals[s.name] = 1;
          return input;
        };
        signal.dependency(C.SIGNALS, exp.signals);
        exp.signals.forEach(function(dep) { graph.signal(dep).addListener(signal); });
      }
    });

    return spec;
  };
});
define('parse/predicates',['require','exports','module','../util/index'],function(require, exports, module) {
  var util = require('../util/index');

  return function parsePredicate(model, spec) {
    var types = {
      '=':  parseComparator,
      '==': parseComparator,
      '!=': parseComparator,
      '>':  parseComparator,
      '>=': parseComparator,
      '<':  parseComparator,
      '<=': parseComparator,
      'and': parseLogical,
      '&&':  parseLogical,
      'or':  parseLogical,
      '||':  parseLogical,
      'in': parseIn
    };

    function parseSignal(signal, signals) {
      var s = util.field(signal),
          code = "signals["+s.map(util.str).join("][")+"]";
      signals[s.shift()] = 1;
      return code;
    };

    function parseOperands(operands) {
      var decl = [], defs = [],
          signals = {}, db = {};

      util.array(operands).forEach(function(o, i) {
        var signal, name = "o"+i, def = "";
        
        if(o.value !== undefined) def = util.str(o.value);
        else if(o.arg)    def = "args["+util.str(o.arg)+"]";
        else if(o.signal) def = parseSignal(o.signal, signals);
        else if(o.predicate) {
          var pred = model.predicate(o.predicate);
          pred.signals.forEach(function(s) { signals[s] = 1; });
          pred.data.forEach(function(d) { db[d] = 1 });

          util.keys(o.input).forEach(function(k) {
            var i = o.input[k], signal;
            def += "args["+util.str(k)+"] = ";
            if(i.signal)   def += parseSignal(i.signal, signals);
            else if(i.arg) def += "args["+util.str(i.arg)+"]";
            def+=", ";
          });

          def+= "predicates["+util.str(o.predicate)+"](args, db, signals, predicates)";
        }

        decl.push(name);
        defs.push(name+"=("+def+")");
      });

      return {
        code: "var " + decl.join(", ") + ";\n" + defs.join(";\n") + ";\n",
        signals: util.keys(signals),
        data: util.keys(db)
      }
    };

    function parseComparator(spec) {
      var ops = parseOperands(spec.operands);
      if(spec.type == '=') spec.type = '==';

      return {
        code: ops.code + "return " + ["o0", "o1"].join(spec.type) + ";",
        signals: ops.signals,
        data: ops.data
      };
    };

    function parseLogical(spec) {
      var ops = parseOperands(spec.operands),
          o = [], i = 0, len = spec.operands.length;

      while(o.push("o"+i++)<len);
      if(spec.type == 'and') spec.type = '&&';
      else if(spec.type == 'or') spec.type = '||';

      return {
        code: ops.code + "return " + o.join(spec.type) + ";",
        signals: ops.signals,
        data: ops.data
      };
    };

    function parseIn(spec) {
      var o = [spec.item];
      if(spec.range) o.push.apply(o, spec.range);
      if(spec.scale) o.push(spec.scale);

      var ops = parseOperands(o),
          code = ops.code;

      if(spec.data) {
        var field = util.field(spec.field).map(util.str);
        code += "var where = function(d) { return d["+field.join("][")+"] == o0 };\n";
        code += "return db["+util.str(spec.data)+"].filter(where).length > 0;";
      } else if(spec.range) {
        // TODO: inclusive/exclusive range?
        // TODO: inverting ordinal scales
        if(spec.scale) code += "o1 = o3(o1);\no2 = o3(o2);\n";
        code += "return o1 < o2 ? o1 <= o0 && o0 <= o2 : o2 <= o0 && o0 <= o1";
      }

      return {
        code: code, 
        signals: ops.signals, 
        data: ops.data.concat(spec.data ? [spec.data] : [])
      };
    };

    (spec || []).forEach(function(s) {
      var parse = types[s.type](s);
      var pred = Function("args", "db", "signals", "predicates", parse.code);
      pred.signals = parse.signals;
      pred.data = parse.data;
      model.predicate(s.name, pred);
    });

    return spec;
  }
});
define('parse/interactors',['require','exports','module','../util/load','../util/index','../util/constants'],function(require, exports, module) {
  var load = require('../util/load'),
      util = require('../util/index'),
      C = require('../util/constants');

  return function parseInteractors(model, spec, defFactory) {
    var count = 0,
        sg = {}, pd = {}, mk = {};

    function loaded(i) {
      return function(error, data) {
        if(error) {
          util.error("LOADING FAILED: " + i.url);
        } else {
          var def = util.isObject(data) ? data : JSON.parse(data);
          interactor(i.name, def);
        }
        if(--count == 0) inject();
      }
    }

    function interactor(name, def) {
      sg = {}, pd = {};
      spec.signals = util.array(spec.signals);
      spec.predicates = util.array(spec.predicates);
      spec.signals.push.apply(spec.signals, nsSignals(name, def.signals));
      spec.predicates.push.apply(spec.predicates, nsPredicates(name, def.predicates));
      nsMarks(name, def.marks);
    }

    function inject() {
      if(util.keys(mk).length > 0) injectMarks(spec.marks);
      defFactory();
    }

    function injectMarks(marks) {
      var m, r, i, len;
      marks = util.array(marks);

      for(i = 0, len = marks.length; i < len; i++) {
        m = marks[i];
        if(r = mk[m.type]) {
          marks[i] = util.duplicate(r);
          if(m.from) marks[i].from = m.from;
          if(m.properties) {
            [C.ENTER, C.UPDATE, C.EXIT].forEach(function(p) {
              marks[i].properties[p] = util.extend(r.properties[p], m.properties[p]);
            });
          }
        } else if(m.marks) {  // TODO how to override properties of nested marks?
          injectMarks(m.marks);
        }
      }    
    }

    function ns(n, s) { 
      if(util.isString(s)) return s+":"+n;
      else {
        util.keys(s).forEach(function(x) { n = n.replace(x, s[x]) });
        return n;
      }
    }

    function nsSignals(name, signals) {
      signals = util.array(signals);
      signals.forEach(function(s) {
        s.name = sg[s.name] = ns(s.name, name);
        (s.streams || []).forEach(function(t) {
          t.type = ns(t.type, sg);
          t.expr = ns(t.expr, sg);
        });
      });
      return signals;
    }

    function nsPredicates(name, predicates) {
      predicates = util.array(predicates);
      predicates.forEach(function(p) {
        p.name = pd[p.name] = ns(p.name, name);

        [p.operands, p.range].forEach(function(x) {
          (x || []).forEach(function(o) {
            if(o.signal) o.signal = ns(o.signal, sg);
            else if(o.predicate) nsOperand(o);
          })
        });

      });  
      return predicates; 
    }

    function nsOperand(o) {
      o.predicate = pd[o.predicate];
      util.keys(o.input).forEach(function(k) {
        var i = o.input[k];
        if(i.signal) i.signal = ns(i.signal, sg);
      });
    }

    function nsMarks(name, marks) {
      (marks||[]).forEach(function(m) { 
        nsProperties(m.properties.enter);
        nsProperties(m.properties.update);
        nsProperties(m.properties.exit);

        mk[ns(m.name, name)] = m; 
      });
    }

    function nsProperties(propset) {
      util.keys(propset).forEach(function(k) {
        var p = propset[k];
        if(p.signal) p.signal = ns(p.signal, sg);
        else if(p.rule) {
          p.rule.forEach(function(r) { 
            if(r.signal) r.signal = ns(r.signal, sg);
            if(r.predicate) nsOperand(r); 
          });
        }
      });
    }

    (spec.interactors || []).forEach(function(i) {
      if(i.url) {
        count += 1;
        load(i.url, loaded(i));
      }
    });

    if (count === 0) setTimeout(inject, 1);
    return spec;
  }
});
define('parse/spec',['require','exports','module','../core/Model','../core/View','../parse/padding','../parse/marks','../parse/signals','../parse/predicates','../parse/data','../parse/interactors','../util/index'],function(require, exports, module) {
  var Model = require('../core/Model'), 
      View = require('../core/View'), 
      parsePadding = require('../parse/padding'),
      parseMarks = require('../parse/marks'),
      parseSignals = require('../parse/signals'),
      parsePredicates = require('../parse/predicates'),
      parseData = require('../parse/data'),
      parseInteractors = require('../parse/interactors'),
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
      model.defs({
        width: width,
        height: height,
        viewport: viewport,
        padding: parsePadding(spec.padding),
        signals: parseSignals(model, spec.signals),
        predicates: parsePredicates(model, spec.predicates),
        marks: parseMarks(model, spec, width, height),
        data: parseData(model, spec.data, function() { callback(viewFactory(model)); })
      });
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
      dataflow: {
        Node: require('dataflow/Node')
      },
      parse: {
        spec: require('parse/spec')
      },
      scene: {
        Builder: require('scene/Builder'),
        GroupBuilder: require('scene/GroupBuilder')
      },
      util: require('util/index'),
      config: require('util/config')
    }
}));