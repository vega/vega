vg.scene.visit = function(node, func) {
  var i, n, items;
  if (func(node)) return true;
  if (items = node.items) {
    for (i=0, n=items.length; i<n; ++i) {
      if (vg.scene.visit(items[i], func)) return true;
    }
  }
};