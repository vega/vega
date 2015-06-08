var bound = require('../util/bound');
var sets = ["items", "axisItems", "legendItems"];

function initialize(scene) {
  var type = scene.marktype,
      i, n, s, m, items;

  for (s=0, m=sets.length; s<m; ++s) {
    if ((items = scene[sets[s]])) {
      for (i=0, n=items.length; i<n; ++i) {
        items[i][type ? 'mark' : 'group'] = scene;
        if (!type || type === 'group') {
          initialize(items[i]);
        }
      }
    }
  }

  if (type) bound.mark(scene);
  return scene;
}

module.exports = initialize;