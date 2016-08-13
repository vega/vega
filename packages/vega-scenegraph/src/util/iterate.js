var compare = function(a, b) { return a.zindex - b.zindex; },
    layers = [];

export function forward(items, visit) {
  var item, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    if (item.zindex) layers.push(item);
    else visit(item);
  }

  if (layers.length) {
    layers.sort(compare).forEach(visit);
    layers = [];
  }
}

export function reverse(items, visit) {
  var layers = [],
      i = 0,
      n = items.length,
      item;

  for (; i<n; ++i) {
    item = items[i];
    if (item.zindex) layers.push(item);
  }

  if (layers.length) {
    layers.sort(compare);
    for (i=layers.length; --i >= 0;) {
      if (visit(layers[i])) return;
    }
    layers = [];
  }

  while (--n >= 0) {
    item = items[n];
    if (!item.zindex) if (visit(item)) return;
  }
}
