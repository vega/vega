import {data} from './data';

var EMPTY = {};

function datum(d) { return d.data; }

function treeNodes(name, context) {
  var tree = data.call(context, name);
  return tree.root && tree.root.lookup || EMPTY;
}

export function treePath(name, source, target) {
  var nodes = treeNodes(name, this),
      s = nodes[source],
      t = nodes[target];
  return s && t ? s.path(t).map(datum) : undefined;
}

export function treeAncestors(name, node) {
  var n = treeNodes(name, this)[node];
  return n ? n.ancestors().map(datum) : undefined;
}
