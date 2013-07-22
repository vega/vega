vg.data = {};

vg.data.ingestAll = function(data) {
  if (vg.isTree(data)) {
    var t = vg.data.ingestTree(data[0], data.children);
    t.__vgtree__ = true;
    t.nodes = function() { return vg_tree_nodes(this, []); }
    return t;
  } else {
    return data.map(vg.data.ingest);
  }
};

vg.data.ingest = function(datum, index) {
  return {
    data: datum,
    index: index
  };
};

vg.data.ingestTree = function(node, children) {
  var d = vg.data.ingest(node),
      c = node[children], n, i;
  if (c && (n = c.length)) {
    d.values = Array(n);
    for (i=0; i<n; ++i) {
      d.values[i] = vg.data.ingestTree(c[i], children);
    }
  }
  return d;
};

function vg_tree_nodes(root, nodes) {
  var c = root.values,
      n = c ? c.length : 0, i;
  nodes.push(root);
  for (i=0; i<n; ++i) { vg_tree_nodes(c[i], nodes); }
  return nodes;
};

vg.data.mapper = function(func) {
  return function(data) {
    data.forEach(func);
    return data;
  }
};

vg.data.size = function(size, group) {
  size = vg.isArray(size) ? size : [0, size];
  size = size.map(function(d) {
    return (typeof d === 'string') ? group[d] : d;
  });
  return size;
};