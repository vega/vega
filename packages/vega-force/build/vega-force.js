(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('vega-dataflow'), require('vega-util')) :
  typeof define === 'function' && define.amd ? define(['exports', 'vega-dataflow', 'vega-util'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory((global.vega = global.vega || {}, global.vega.transforms = {}), global.vega, global.vega));
})(this, (function (exports, vegaDataflow, vegaUtil) { 'use strict';

  function forceCenter (x, y) {
    var nodes,
      strength = 1;
    if (x == null) x = 0;
    if (y == null) y = 0;
    function force() {
      var i,
        n = nodes.length,
        node,
        sx = 0,
        sy = 0;
      for (i = 0; i < n; ++i) {
        node = nodes[i], sx += node.x, sy += node.y;
      }
      for (sx = (sx / n - x) * strength, sy = (sy / n - y) * strength, i = 0; i < n; ++i) {
        node = nodes[i], node.x -= sx, node.y -= sy;
      }
    }
    force.initialize = function (_) {
      nodes = _;
    };
    force.x = function (_) {
      return arguments.length ? (x = +_, force) : x;
    };
    force.y = function (_) {
      return arguments.length ? (y = +_, force) : y;
    };
    force.strength = function (_) {
      return arguments.length ? (strength = +_, force) : strength;
    };
    return force;
  }

  function tree_add (d) {
    const x = +this._x.call(null, d),
      y = +this._y.call(null, d);
    return add(this.cover(x, y), x, y, d);
  }
  function add(tree, x, y, d) {
    if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

    var parent,
      node = tree._root,
      leaf = {
        data: d
      },
      x0 = tree._x0,
      y0 = tree._y0,
      x1 = tree._x1,
      y1 = tree._y1,
      xm,
      ym,
      xp,
      yp,
      right,
      bottom,
      i,
      j;

    // If the tree is empty, initialize the root as a leaf.
    if (!node) return tree._root = leaf, tree;

    // Find the existing leaf for the new point, or add it.
    while (node.length) {
      if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
      if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
    }

    // Is the new point is exactly coincident with the existing point?
    xp = +tree._x.call(null, node.data);
    yp = +tree._y.call(null, node.data);
    if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

    // Otherwise, split the leaf node until the old and new point are separated.
    do {
      parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
      if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
    } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | xp >= xm));
    return parent[j] = node, parent[i] = leaf, tree;
  }
  function addAll(data) {
    var d,
      i,
      n = data.length,
      x,
      y,
      xz = new Array(n),
      yz = new Array(n),
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

    // Compute the points and their extent.
    for (i = 0; i < n; ++i) {
      if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
      xz[i] = x;
      yz[i] = y;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }

    // If there were no (valid) points, abort.
    if (x0 > x1 || y0 > y1) return this;

    // Expand the tree to cover the new points.
    this.cover(x0, y0).cover(x1, y1);

    // Add the new points.
    for (i = 0; i < n; ++i) {
      add(this, xz[i], yz[i], data[i]);
    }
    return this;
  }

  function tree_cover (x, y) {
    if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

    var x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1;

    // If the quadtree has no extent, initialize them.
    // Integer extent are necessary so that if we later double the extent,
    // the existing quadrant boundaries don’t change due to floating point error!
    if (isNaN(x0)) {
      x1 = (x0 = Math.floor(x)) + 1;
      y1 = (y0 = Math.floor(y)) + 1;
    }

    // Otherwise, double repeatedly to cover.
    else {
      var z = x1 - x0 || 1,
        node = this._root,
        parent,
        i;
      while (x0 > x || x >= x1 || y0 > y || y >= y1) {
        i = (y < y0) << 1 | x < x0;
        parent = new Array(4), parent[i] = node, node = parent, z *= 2;
        switch (i) {
          case 0:
            x1 = x0 + z, y1 = y0 + z;
            break;
          case 1:
            x0 = x1 - z, y1 = y0 + z;
            break;
          case 2:
            x1 = x0 + z, y0 = y1 - z;
            break;
          case 3:
            x0 = x1 - z, y0 = y1 - z;
            break;
        }
      }
      if (this._root && this._root.length) this._root = node;
    }
    this._x0 = x0;
    this._y0 = y0;
    this._x1 = x1;
    this._y1 = y1;
    return this;
  }

  function tree_data () {
    var data = [];
    this.visit(function (node) {
      if (!node.length) do data.push(node.data); while (node = node.next);
    });
    return data;
  }

  function tree_extent (_) {
    return arguments.length ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1]) : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
  }

  function Quad (node, x0, y0, x1, y1) {
    this.node = node;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  }

  function tree_find (x, y, radius) {
    var data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i;
    if (node) quads.push(new Quad(node, x0, y0, x3, y3));
    if (radius == null) radius = Infinity;else {
      x0 = x - radius, y0 = y - radius;
      x3 = x + radius, y3 = y + radius;
      radius *= radius;
    }
    while (q = quads.pop()) {
      // Stop searching if this quadrant can’t contain a closer node.
      if (!(node = q.node) || (x1 = q.x0) > x3 || (y1 = q.y0) > y3 || (x2 = q.x1) < x0 || (y2 = q.y1) < y0) continue;

      // Bisect the current quadrant.
      if (node.length) {
        var xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2;
        quads.push(new Quad(node[3], xm, ym, x2, y2), new Quad(node[2], x1, ym, xm, y2), new Quad(node[1], xm, y1, x2, ym), new Quad(node[0], x1, y1, xm, ym));

        // Visit the closest quadrant first.
        if (i = (y >= ym) << 1 | x >= xm) {
          q = quads[quads.length - 1];
          quads[quads.length - 1] = quads[quads.length - 1 - i];
          quads[quads.length - 1 - i] = q;
        }
      }

      // Visit this point. (Visiting coincident points isn’t necessary!)
      else {
        var dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy;
        if (d2 < radius) {
          var d = Math.sqrt(radius = d2);
          x0 = x - d, y0 = y - d;
          x3 = x + d, y3 = y + d;
          data = node.data;
        }
      }
    }
    return data;
  }

  function tree_remove (d) {
    if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

    var parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j;

    // If the tree is empty, initialize the root as a leaf.
    if (!node) return this;

    // Find the leaf node for the point.
    // While descending, also retain the deepest parent with a non-removed sibling.
    if (node.length) while (true) {
      if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm;else x1 = xm;
      if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym;else y1 = ym;
      if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
      if (!node.length) break;
      if (parent[i + 1 & 3] || parent[i + 2 & 3] || parent[i + 3 & 3]) retainer = parent, j = i;
    }

    // Find the point to remove.
    while (node.data !== d) if (!(previous = node, node = node.next)) return this;
    if (next = node.next) delete node.next;

    // If there are multiple coincident points, remove just the point.
    if (previous) return next ? previous.next = next : delete previous.next, this;

    // If this is the root point, remove it.
    if (!parent) return this._root = next, this;

    // Remove this leaf.
    next ? parent[i] = next : delete parent[i];

    // If the parent now contains exactly one leaf, collapse superfluous parents.
    if ((node = parent[0] || parent[1] || parent[2] || parent[3]) && node === (parent[3] || parent[2] || parent[1] || parent[0]) && !node.length) {
      if (retainer) retainer[j] = node;else this._root = node;
    }
    return this;
  }
  function removeAll(data) {
    for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
    return this;
  }

  function tree_root () {
    return this._root;
  }

  function tree_size () {
    var size = 0;
    this.visit(function (node) {
      if (!node.length) do ++size; while (node = node.next);
    });
    return size;
  }

  function tree_visit (callback) {
    var quads = [],
      q,
      node = this._root,
      child,
      x0,
      y0,
      x1,
      y1;
    if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
    while (q = quads.pop()) {
      if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
        var xm = (x0 + x1) / 2,
          ym = (y0 + y1) / 2;
        if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
        if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
        if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
        if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      }
    }
    return this;
  }

  function tree_visitAfter (callback) {
    var quads = [],
      next = [],
      q;
    if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
    while (q = quads.pop()) {
      var node = q.node;
      if (node.length) {
        var child,
          x0 = q.x0,
          y0 = q.y0,
          x1 = q.x1,
          y1 = q.y1,
          xm = (x0 + x1) / 2,
          ym = (y0 + y1) / 2;
        if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
        if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
        if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
        if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      }
      next.push(q);
    }
    while (q = next.pop()) {
      callback(q.node, q.x0, q.y0, q.x1, q.y1);
    }
    return this;
  }

  function defaultX(d) {
    return d[0];
  }
  function tree_x (_) {
    return arguments.length ? (this._x = _, this) : this._x;
  }

  function defaultY(d) {
    return d[1];
  }
  function tree_y (_) {
    return arguments.length ? (this._y = _, this) : this._y;
  }

  function quadtree(nodes, x, y) {
    var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
    return nodes == null ? tree : tree.addAll(nodes);
  }
  function Quadtree(x, y, x0, y0, x1, y1) {
    this._x = x;
    this._y = y;
    this._x0 = x0;
    this._y0 = y0;
    this._x1 = x1;
    this._y1 = y1;
    this._root = undefined;
  }
  function leaf_copy(leaf) {
    var copy = {
        data: leaf.data
      },
      next = copy;
    while (leaf = leaf.next) next = next.next = {
      data: leaf.data
    };
    return copy;
  }
  var treeProto = quadtree.prototype = Quadtree.prototype;
  treeProto.copy = function () {
    var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child;
    if (!node) return copy;
    if (!node.length) return copy._root = leaf_copy(node), copy;
    nodes = [{
      source: node,
      target: copy._root = new Array(4)
    }];
    while (node = nodes.pop()) {
      for (var i = 0; i < 4; ++i) {
        if (child = node.source[i]) {
          if (child.length) nodes.push({
            source: child,
            target: node.target[i] = new Array(4)
          });else node.target[i] = leaf_copy(child);
        }
      }
    }
    return copy;
  };
  treeProto.add = tree_add;
  treeProto.addAll = addAll;
  treeProto.cover = tree_cover;
  treeProto.data = tree_data;
  treeProto.extent = tree_extent;
  treeProto.find = tree_find;
  treeProto.remove = tree_remove;
  treeProto.removeAll = removeAll;
  treeProto.root = tree_root;
  treeProto.size = tree_size;
  treeProto.visit = tree_visit;
  treeProto.visitAfter = tree_visitAfter;
  treeProto.x = tree_x;
  treeProto.y = tree_y;

  function constant (x) {
    return function () {
      return x;
    };
  }

  function jiggle (random) {
    return (random() - 0.5) * 1e-6;
  }

  function x$1(d) {
    return d.x + d.vx;
  }
  function y$1(d) {
    return d.y + d.vy;
  }
  function forceCollide (radius) {
    var nodes,
      radii,
      random,
      strength = 1,
      iterations = 1;
    if (typeof radius !== "function") radius = constant(radius == null ? 1 : +radius);
    function force() {
      var i,
        n = nodes.length,
        tree,
        node,
        xi,
        yi,
        ri,
        ri2;
      for (var k = 0; k < iterations; ++k) {
        tree = quadtree(nodes, x$1, y$1).visitAfter(prepare);
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          ri = radii[node.index], ri2 = ri * ri;
          xi = node.x + node.vx;
          yi = node.y + node.vy;
          tree.visit(apply);
        }
      }
      function apply(quad, x0, y0, x1, y1) {
        var data = quad.data,
          rj = quad.r,
          r = ri + rj;
        if (data) {
          if (data.index > node.index) {
            var x = xi - data.x - data.vx,
              y = yi - data.y - data.vy,
              l = x * x + y * y;
            if (l < r * r) {
              if (x === 0) x = jiggle(random), l += x * x;
              if (y === 0) y = jiggle(random), l += y * y;
              l = (r - (l = Math.sqrt(l))) / l * strength;
              node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
              node.vy += (y *= l) * r;
              data.vx -= x * (r = 1 - r);
              data.vy -= y * r;
            }
          }
          return;
        }
        return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
      }
    }
    function prepare(quad) {
      if (quad.data) return quad.r = radii[quad.data.index];
      for (var i = quad.r = 0; i < 4; ++i) {
        if (quad[i] && quad[i].r > quad.r) {
          quad.r = quad[i].r;
        }
      }
    }
    function initialize() {
      if (!nodes) return;
      var i,
        n = nodes.length,
        node;
      radii = new Array(n);
      for (i = 0; i < n; ++i) node = nodes[i], radii[node.index] = +radius(node, i, nodes);
    }
    force.initialize = function (_nodes, _random) {
      nodes = _nodes;
      random = _random;
      initialize();
    };
    force.iterations = function (_) {
      return arguments.length ? (iterations = +_, force) : iterations;
    };
    force.strength = function (_) {
      return arguments.length ? (strength = +_, force) : strength;
    };
    force.radius = function (_) {
      return arguments.length ? (radius = typeof _ === "function" ? _ : constant(+_), initialize(), force) : radius;
    };
    return force;
  }

  function index(d) {
    return d.index;
  }
  function find(nodeById, nodeId) {
    var node = nodeById.get(nodeId);
    if (!node) throw new Error("node not found: " + nodeId);
    return node;
  }
  function forceLink (links) {
    var id = index,
      strength = defaultStrength,
      strengths,
      distance = constant(30),
      distances,
      nodes,
      count,
      bias,
      random,
      iterations = 1;
    if (links == null) links = [];
    function defaultStrength(link) {
      return 1 / Math.min(count[link.source.index], count[link.target.index]);
    }
    function force(alpha) {
      for (var k = 0, n = links.length; k < iterations; ++k) {
        for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
          link = links[i], source = link.source, target = link.target;
          x = target.x + target.vx - source.x - source.vx || jiggle(random);
          y = target.y + target.vy - source.y - source.vy || jiggle(random);
          l = Math.sqrt(x * x + y * y);
          l = (l - distances[i]) / l * alpha * strengths[i];
          x *= l, y *= l;
          target.vx -= x * (b = bias[i]);
          target.vy -= y * b;
          source.vx += x * (b = 1 - b);
          source.vy += y * b;
        }
      }
    }
    function initialize() {
      if (!nodes) return;
      var i,
        n = nodes.length,
        m = links.length,
        nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
        link;
      for (i = 0, count = new Array(n); i < m; ++i) {
        link = links[i], link.index = i;
        if (typeof link.source !== "object") link.source = find(nodeById, link.source);
        if (typeof link.target !== "object") link.target = find(nodeById, link.target);
        count[link.source.index] = (count[link.source.index] || 0) + 1;
        count[link.target.index] = (count[link.target.index] || 0) + 1;
      }
      for (i = 0, bias = new Array(m); i < m; ++i) {
        link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
      }
      strengths = new Array(m), initializeStrength();
      distances = new Array(m), initializeDistance();
    }
    function initializeStrength() {
      if (!nodes) return;
      for (var i = 0, n = links.length; i < n; ++i) {
        strengths[i] = +strength(links[i], i, links);
      }
    }
    function initializeDistance() {
      if (!nodes) return;
      for (var i = 0, n = links.length; i < n; ++i) {
        distances[i] = +distance(links[i], i, links);
      }
    }
    force.initialize = function (_nodes, _random) {
      nodes = _nodes;
      random = _random;
      initialize();
    };
    force.links = function (_) {
      return arguments.length ? (links = _, initialize(), force) : links;
    };
    force.id = function (_) {
      return arguments.length ? (id = _, force) : id;
    };
    force.iterations = function (_) {
      return arguments.length ? (iterations = +_, force) : iterations;
    };
    force.strength = function (_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
    };
    force.distance = function (_) {
      return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
    };
    return force;
  }

  var noop = {
    value: () => {}
  };
  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || t in _ || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }
  function Dispatch(_) {
    this._ = _;
  }
  function parseTypenames(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function (t) {
      var name = "",
        i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {
        type: t,
        name: name
      };
    });
  }
  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function (typename, callback) {
      var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set(_[t], typename.name, callback);else if (callback == null) for (t in _) _[t] = set(_[t], typename.name, null);
      }
      return this;
    },
    copy: function () {
      var copy = {},
        _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function (type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function (type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };
  function get(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }
  function set(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({
      name: name,
      value: callback
    });
    return type;
  }

  var frame = 0,
    // is an animation frame pending?
    timeout = 0,
    // is a timeout pending?
    interval = 0,
    // are any timers active?
    pokeDelay = 1000,
    // how frequently we check for clock skew
    taskHead,
    taskTail,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0,
    clock = typeof performance === "object" && performance.now ? performance : Date,
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function (f) {
      setTimeout(f, 17);
    };
  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }
  function clearNow() {
    clockNow = 0;
  }
  function Timer() {
    this._call = this._time = this._next = null;
  }
  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function (callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function () {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };
  function timer(callback, delay, time) {
    var t = new Timer();
    t.restart(callback, delay, time);
    return t;
  }
  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead,
      e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
      t = t._next;
    }
    --frame;
  }
  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }
  function poke() {
    var now = clock.now(),
      delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }
  function nap() {
    var t0,
      t1 = taskHead,
      t2,
      time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }
  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout) timeout = clearTimeout(timeout);
    var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
    if (delay > 24) {
      if (time < Infinity) timeout = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  // https://en.wikipedia.org/wiki/Linear_congruential_generator#Parameters_in_common_use
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296; // 2^32

  function lcg () {
    let s = 1;
    return () => (s = (a * s + c) % m) / m;
  }

  function x(d) {
    return d.x;
  }
  function y(d) {
    return d.y;
  }
  var initialRadius = 10,
    initialAngle = Math.PI * (3 - Math.sqrt(5));
  function forceSimulation (nodes) {
    var simulation,
      alpha = 1,
      alphaMin = 0.001,
      alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
      alphaTarget = 0,
      velocityDecay = 0.6,
      forces = new Map(),
      stepper = timer(step),
      event = dispatch("tick", "end"),
      random = lcg();
    if (nodes == null) nodes = [];
    function step() {
      tick();
      event.call("tick", simulation);
      if (alpha < alphaMin) {
        stepper.stop();
        event.call("end", simulation);
      }
    }
    function tick(iterations) {
      var i,
        n = nodes.length,
        node;
      if (iterations === undefined) iterations = 1;
      for (var k = 0; k < iterations; ++k) {
        alpha += (alphaTarget - alpha) * alphaDecay;
        forces.forEach(function (force) {
          force(alpha);
        });
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          if (node.fx == null) node.x += node.vx *= velocityDecay;else node.x = node.fx, node.vx = 0;
          if (node.fy == null) node.y += node.vy *= velocityDecay;else node.y = node.fy, node.vy = 0;
        }
      }
      return simulation;
    }
    function initializeNodes() {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.index = i;
        if (node.fx != null) node.x = node.fx;
        if (node.fy != null) node.y = node.fy;
        if (isNaN(node.x) || isNaN(node.y)) {
          var radius = initialRadius * Math.sqrt(0.5 + i),
            angle = i * initialAngle;
          node.x = radius * Math.cos(angle);
          node.y = radius * Math.sin(angle);
        }
        if (isNaN(node.vx) || isNaN(node.vy)) {
          node.vx = node.vy = 0;
        }
      }
    }
    function initializeForce(force) {
      if (force.initialize) force.initialize(nodes, random);
      return force;
    }
    initializeNodes();
    return simulation = {
      tick: tick,
      restart: function () {
        return stepper.restart(step), simulation;
      },
      stop: function () {
        return stepper.stop(), simulation;
      },
      nodes: function (_) {
        return arguments.length ? (nodes = _, initializeNodes(), forces.forEach(initializeForce), simulation) : nodes;
      },
      alpha: function (_) {
        return arguments.length ? (alpha = +_, simulation) : alpha;
      },
      alphaMin: function (_) {
        return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
      },
      alphaDecay: function (_) {
        return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
      },
      alphaTarget: function (_) {
        return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
      },
      velocityDecay: function (_) {
        return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
      },
      randomSource: function (_) {
        return arguments.length ? (random = _, forces.forEach(initializeForce), simulation) : random;
      },
      force: function (name, _) {
        return arguments.length > 1 ? (_ == null ? forces.delete(name) : forces.set(name, initializeForce(_)), simulation) : forces.get(name);
      },
      find: function (x, y, radius) {
        var i = 0,
          n = nodes.length,
          dx,
          dy,
          d2,
          node,
          closest;
        if (radius == null) radius = Infinity;else radius *= radius;
        for (i = 0; i < n; ++i) {
          node = nodes[i];
          dx = x - node.x;
          dy = y - node.y;
          d2 = dx * dx + dy * dy;
          if (d2 < radius) closest = node, radius = d2;
        }
        return closest;
      },
      on: function (name, _) {
        return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
      }
    };
  }

  function forceManyBody () {
    var nodes,
      node,
      random,
      alpha,
      strength = constant(-30),
      strengths,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      theta2 = 0.81;
    function force(_) {
      var i,
        n = nodes.length,
        tree = quadtree(nodes, x, y).visitAfter(accumulate);
      for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
    }
    function initialize() {
      if (!nodes) return;
      var i,
        n = nodes.length,
        node;
      strengths = new Array(n);
      for (i = 0; i < n; ++i) node = nodes[i], strengths[node.index] = +strength(node, i, nodes);
    }
    function accumulate(quad) {
      var strength = 0,
        q,
        c,
        weight = 0,
        x,
        y,
        i;

      // For internal nodes, accumulate forces from child quadrants.
      if (quad.length) {
        for (x = y = i = 0; i < 4; ++i) {
          if ((q = quad[i]) && (c = Math.abs(q.value))) {
            strength += q.value, weight += c, x += c * q.x, y += c * q.y;
          }
        }
        quad.x = x / weight;
        quad.y = y / weight;
      }

      // For leaf nodes, accumulate forces from coincident quadrants.
      else {
        q = quad;
        q.x = q.data.x;
        q.y = q.data.y;
        do strength += strengths[q.data.index]; while (q = q.next);
      }
      quad.value = strength;
    }
    function apply(quad, x1, _, x2) {
      if (!quad.value) return true;
      var x = quad.x - node.x,
        y = quad.y - node.y,
        w = x2 - x1,
        l = x * x + y * y;

      // Apply the Barnes-Hut approximation if possible.
      // Limit forces for very close nodes; randomize direction if coincident.
      if (w * w / theta2 < l) {
        if (l < distanceMax2) {
          if (x === 0) x = jiggle(random), l += x * x;
          if (y === 0) y = jiggle(random), l += y * y;
          if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
          node.vx += x * quad.value * alpha / l;
          node.vy += y * quad.value * alpha / l;
        }
        return true;
      }

      // Otherwise, process points directly.
      else if (quad.length || l >= distanceMax2) return;

      // Limit forces for very close nodes; randomize direction if coincident.
      if (quad.data !== node || quad.next) {
        if (x === 0) x = jiggle(random), l += x * x;
        if (y === 0) y = jiggle(random), l += y * y;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
      }
      do if (quad.data !== node) {
        w = strengths[quad.data.index] * alpha / l;
        node.vx += x * w;
        node.vy += y * w;
      } while (quad = quad.next);
    }
    force.initialize = function (_nodes, _random) {
      nodes = _nodes;
      random = _random;
      initialize();
    };
    force.strength = function (_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
    };
    force.distanceMin = function (_) {
      return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
    };
    force.distanceMax = function (_) {
      return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
    };
    force.theta = function (_) {
      return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
    };
    return force;
  }

  function forceX (x) {
    var strength = constant(0.1),
      nodes,
      strengths,
      xz;
    if (typeof x !== "function") x = constant(x == null ? 0 : +x);
    function force(alpha) {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
      }
    }
    function initialize() {
      if (!nodes) return;
      var i,
        n = nodes.length;
      strengths = new Array(n);
      xz = new Array(n);
      for (i = 0; i < n; ++i) {
        strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
      }
    }
    force.initialize = function (_) {
      nodes = _;
      initialize();
    };
    force.strength = function (_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
    };
    force.x = function (_) {
      return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), initialize(), force) : x;
    };
    return force;
  }

  function forceY (y) {
    var strength = constant(0.1),
      nodes,
      strengths,
      yz;
    if (typeof y !== "function") y = constant(y == null ? 0 : +y);
    function force(alpha) {
      for (var i = 0, n = nodes.length, node; i < n; ++i) {
        node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
      }
    }
    function initialize() {
      if (!nodes) return;
      var i,
        n = nodes.length;
      strengths = new Array(n);
      yz = new Array(n);
      for (i = 0; i < n; ++i) {
        strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
      }
    }
    force.initialize = function (_) {
      nodes = _;
      initialize();
    };
    force.strength = function (_) {
      return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initialize(), force) : strength;
    };
    force.y = function (_) {
      return arguments.length ? (y = typeof _ === "function" ? _ : constant(+_), initialize(), force) : y;
    };
    return force;
  }

  const ForceMap = {
    center: forceCenter,
    collide: forceCollide,
    nbody: forceManyBody,
    link: forceLink,
    x: forceX,
    y: forceY
  };
  const Forces = 'forces',
    ForceParams = ['alpha', 'alphaMin', 'alphaTarget', 'velocityDecay', 'forces'],
    ForceConfig = ['static', 'iterations'],
    ForceOutput = ['x', 'y', 'vx', 'vy'];

  /**
   * Force simulation layout.
   * @constructor
   * @param {object} params - The parameters for this operator.
   * @param {Array<object>} params.forces - The forces to apply.
   */
  function Force(params) {
    vegaDataflow.Transform.call(this, null, params);
  }
  Force.Definition = {
    'type': 'Force',
    'metadata': {
      'modifies': true
    },
    'params': [{
      'name': 'static',
      'type': 'boolean',
      'default': false
    }, {
      'name': 'restart',
      'type': 'boolean',
      'default': false
    }, {
      'name': 'iterations',
      'type': 'number',
      'default': 300
    }, {
      'name': 'alpha',
      'type': 'number',
      'default': 1
    }, {
      'name': 'alphaMin',
      'type': 'number',
      'default': 0.001
    }, {
      'name': 'alphaTarget',
      'type': 'number',
      'default': 0
    }, {
      'name': 'velocityDecay',
      'type': 'number',
      'default': 0.4
    }, {
      'name': 'forces',
      'type': 'param',
      'array': true,
      'params': [{
        'key': {
          'force': 'center'
        },
        'params': [{
          'name': 'x',
          'type': 'number',
          'default': 0
        }, {
          'name': 'y',
          'type': 'number',
          'default': 0
        }]
      }, {
        'key': {
          'force': 'collide'
        },
        'params': [{
          'name': 'radius',
          'type': 'number',
          'expr': true
        }, {
          'name': 'strength',
          'type': 'number',
          'default': 0.7
        }, {
          'name': 'iterations',
          'type': 'number',
          'default': 1
        }]
      }, {
        'key': {
          'force': 'nbody'
        },
        'params': [{
          'name': 'strength',
          'type': 'number',
          'default': -30,
          'expr': true
        }, {
          'name': 'theta',
          'type': 'number',
          'default': 0.9
        }, {
          'name': 'distanceMin',
          'type': 'number',
          'default': 1
        }, {
          'name': 'distanceMax',
          'type': 'number'
        }]
      }, {
        'key': {
          'force': 'link'
        },
        'params': [{
          'name': 'links',
          'type': 'data'
        }, {
          'name': 'id',
          'type': 'field'
        }, {
          'name': 'distance',
          'type': 'number',
          'default': 30,
          'expr': true
        }, {
          'name': 'strength',
          'type': 'number',
          'expr': true
        }, {
          'name': 'iterations',
          'type': 'number',
          'default': 1
        }]
      }, {
        'key': {
          'force': 'x'
        },
        'params': [{
          'name': 'strength',
          'type': 'number',
          'default': 0.1
        }, {
          'name': 'x',
          'type': 'field'
        }]
      }, {
        'key': {
          'force': 'y'
        },
        'params': [{
          'name': 'strength',
          'type': 'number',
          'default': 0.1
        }, {
          'name': 'y',
          'type': 'field'
        }]
      }]
    }, {
      'name': 'as',
      'type': 'string',
      'array': true,
      'modify': false,
      'default': ForceOutput
    }]
  };
  vegaUtil.inherits(Force, vegaDataflow.Transform, {
    transform(_, pulse) {
      var sim = this.value,
        change = pulse.changed(pulse.ADD_REM),
        params = _.modified(ForceParams),
        iters = _.iterations || 300;

      // configure simulation
      if (!sim) {
        this.value = sim = simulation(pulse.source, _);
        sim.on('tick', rerun(pulse.dataflow, this));
        if (!_.static) {
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
          setup(sim, _, 0, pulse);
        }
      }

      // run simulation
      if (params || change || _.modified(ForceConfig) || pulse.changed() && _.restart) {
        sim.alpha(Math.max(sim.alpha(), _.alpha || 1)).alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));
        if (_.static) {
          for (sim.stop(); --iters >= 0;) sim.tick();
        } else {
          if (sim.stopped()) sim.restart();
          if (!change) return pulse.StopPropagation; // defer to sim ticks
        }
      }

      return this.finish(_, pulse);
    },
    finish(_, pulse) {
      const dataflow = pulse.dataflow;

      // inspect dependencies, touch link source data
      for (let args = this._argops, j = 0, m = args.length, arg; j < m; ++j) {
        arg = args[j];
        if (arg.name !== Forces || arg.op._argval.force !== 'link') {
          continue;
        }
        for (var ops = arg.op._argops, i = 0, n = ops.length, op; i < n; ++i) {
          if (ops[i].name === 'links' && (op = ops[i].op.source)) {
            dataflow.pulse(op, dataflow.changeset().reflow());
            break;
          }
        }
      }

      // reflow all nodes
      return pulse.reflow(_.modified()).modifies(ForceOutput);
    }
  });
  function rerun(df, op) {
    return () => df.touch(op).run();
  }
  function simulation(nodes, _) {
    const sim = forceSimulation(nodes),
      stop = sim.stop,
      restart = sim.restart;
    let stopped = false;
    sim.stopped = () => stopped;
    sim.restart = () => (stopped = false, restart());
    sim.stop = () => (stopped = true, stop());
    return setup(sim, _, true).on('end', () => stopped = true);
  }
  function setup(sim, _, init, pulse) {
    var f = vegaUtil.array(_.forces),
      i,
      n,
      p,
      name;
    for (i = 0, n = ForceParams.length; i < n; ++i) {
      p = ForceParams[i];
      if (p !== Forces && _.modified(p)) sim[p](_[p]);
    }
    for (i = 0, n = f.length; i < n; ++i) {
      name = Forces + i;
      p = init || _.modified(Forces, i) ? getForce(f[i]) : pulse && modified(f[i], pulse) ? sim.force(name) : null;
      if (p) sim.force(name, p);
    }
    for (n = sim.numForces || 0; i < n; ++i) {
      sim.force(Forces + i, null); // remove
    }

    sim.numForces = f.length;
    return sim;
  }
  function modified(f, pulse) {
    var k, v;
    for (k in f) {
      if (vegaUtil.isFunction(v = f[k]) && pulse.modified(vegaUtil.accessorFields(v))) return 1;
    }
    return 0;
  }
  function getForce(_) {
    var f, p;
    if (!vegaUtil.hasOwnProperty(ForceMap, _.force)) {
      vegaUtil.error('Unrecognized force: ' + _.force);
    }
    f = ForceMap[_.force]();
    for (p in _) {
      if (vegaUtil.isFunction(f[p])) setForceParam(f[p], _[p], _);
    }
    return f;
  }
  function setForceParam(f, v, _) {
    f(vegaUtil.isFunction(v) ? d => v(d, _) : v);
  }

  exports.force = Force;

}));
