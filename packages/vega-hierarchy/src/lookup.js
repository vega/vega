import {replace} from 'vega-dataflow';

// Build lookup table mapping tuple keys to tree node instances
// Also copy tupleid to tree node, to enable stable sorting
export default function(tree, key, filter) {
  var map = {};
  tree.each(function(node) {
    var t = node.data;
    if (filter(t)) {
      map[key(t)] = node;
      replace(t, node);
    }
  });
  tree.lookup = map;
  return tree;
}
