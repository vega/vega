// Build lookup table mapping tuple keys to tree node instances
export default function(tree, key, filter) {
  const map = {};
  tree.each(node => {
    const t = node.data;
    if (filter(t)) map[key(t)] = node;
  });
  tree.lookup = map;
  return tree;
}
