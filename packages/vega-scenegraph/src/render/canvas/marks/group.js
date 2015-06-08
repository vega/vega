var util = require('./util'),
    rect = require('./rect');

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var groups = scene.items,
      renderer = this,
      group, items, axes, legends, gx, gy, i, n, j, m;

  rect.draw.call(renderer, g, scene, bounds);

  for (i=0, n=groups.length; i<n; ++i) {
    group = groups[i];
    axes = group.axisItems || [];
    items = group.items || [];
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
      if (axes[j].layer === 'back') {
        renderer.draw(g, axes[j], bounds);
      }
    }
    for (j=0, m=items.length; j<m; ++j) {
      renderer.draw(g, items[j], bounds);
    }
    for (j=0, m=axes.length; j<m; ++j) {
      if (axes[j].layer !== 'back') {
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

function hit(g, o) {
  return o.fill || o.stroke;
}

function pick(g, scene, x, y, gx, gy) {
  if (!scene.items || !scene.items.length ||
      scene.bounds && !scene.bounds.contains(gx, gy)) {
    return false;
  }
  var items = scene.items,
      handler = this,
      subscene, group, hits, dx, dy, i, j;

  for (i=items.length; --i>=0;) {
    group = items[i];
    dx = group.x || 0;
    dy = group.y || 0;

    g.save();
    g.translate(dx, dy);
    for (j=group.items.length; --j >= 0;) {
      subscene = group.items[j];
      if (subscene.interactive === false) continue;
      hits = handler.pick(subscene, x, y, gx-dx, gy-dy);
      if (hits) {
        g.restore();
        return hits;
      }
    }
    g.restore();
  }

  return scene.interactive ? pickSelf(g, scene, x, y, gx, gy) : false;
}

var pickSelf = util.pick(hit);

module.exports = {
  draw: draw,
  pick: pick
};
