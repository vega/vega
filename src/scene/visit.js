module.exports = function visit(node, func) {
  var i, n, s, m, items;
  if (func(node)) return true;

  var sets = ['items', 'axisItems', 'legendItems'];
  for (s=0, m=sets.length; s<m; ++s) {
    if ((items = node[sets[s]])) {
      for (i=0, n=items.length; i<n; ++i) {
        if (visit(items[i], func)) return true;
      }
    }
  }
};
