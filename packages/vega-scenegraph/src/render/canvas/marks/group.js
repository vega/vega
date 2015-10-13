var util = require('./util'),
    EMPTY = [];

function draw(g, scene, bounds) {
  if (!scene.items || !scene.items.length) return;

  var groups = scene.items,
      renderer = this,
      group, items, axes, legends, gx, gy, w, h, opac, i, n, j, m;

  for (i=0, n=groups.length; i<n; ++i) {
    group = groups[i];
    axes = group.axisItems || EMPTY;
    items = group.items || EMPTY;
    legends = group.legendItems || EMPTY;
    gx = group.x || 0;
    gy = group.y || 0;
    w = group.width || 0;
    h = group.height || 0;

    // draw group background
    if (group.stroke || group.fill) {
      opac = group.opacity == null ? 1 : group.opacity;
      if (opac > 0) {
        if (group.fill && util.fill(g, group, opac)) {
          g.fillRect(gx, gy, w, h);
        }
        if (group.stroke && util.stroke(g, group, opac)) {
          g.strokeRect(gx, gy, w, h);
        }
      }
    }

    // setup graphics context
    g.save();
    g.translate(gx, gy);
    if (group.clip) {
      g.beginPath();
      g.rect(0, 0, w, h);
      g.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
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

    // restore graphics context
    if (bounds) bounds.translate(gx, gy);
    g.restore();
  }    
}

function pick(g, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy)) {
    return null;
  }

  var groups = scene.items || EMPTY, subscene,
      group, axes, items, legends, hits, dx, dy, i, j, b;

  for (i=groups.length; --i>=0;) {
    group = groups[i];

    // first hit test against bounding box
    // if a group is clipped, that should be handled by the bounds check.
    b = group.bounds;
    if (b && !b.contains(gx, gy)) continue;

    // passed bounds check, so test sub-groups
    axes = group.axisItems || EMPTY;
    items = group.items || EMPTY;
    legends = group.legendItems || EMPTY;
    dx = (group.x || 0);
    dy = (group.y || 0);

    g.save();
    g.translate(dx, dy);
    dx = gx - dx;
    dy = gy - dy;
    for (j=legends.length; --j>=0;) {
      subscene = legends[j];
      if (subscene.interactive !== false) {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    for (j=axes.length; --j>=0;) {
      subscene = axes[j];
      if (subscene.interactive !== false && subscene.layer !== 'back') {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    for (j=items.length; --j>=0;) {
      subscene = items[j];
      if (subscene.interactive !== false) {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    for (j=axes.length; --j>=0;) {
      subscene = axes[j];
      if (subscene.interative !== false && subscene.layer === 'back') {
        hits = this.pick(subscene, x, y, dx, dy);
        if (hits) { g.restore(); return hits; }
      }
    }
    g.restore();

    if (scene.interactive !== false && (group.fill || group.stroke) &&
        dx >= 0 && dx <= group.width && dy >= 0 && dy <= group.height) {
      return group;
    }
  }

  return null;
}

module.exports = {
  draw: draw,
  pick: pick
};
